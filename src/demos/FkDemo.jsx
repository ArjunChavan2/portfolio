import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import urdfText from './assets/dual_arm_robot.urdf?raw';
import orangeJusticeTable from './assets/choreo-orange-justice.json';
import scubaTable from './assets/choreo-scuba.json';
import swingTable from './assets/choreo-swing.json';
import {
  identityPose, jointEdges, linkTransforms, quinticCoefficients, quinticEvaluate, translationOf,
} from './fkMath';
import { movableJoints, parseUrdf } from './fkUrdf';
import { drawRobot } from './fkRender';
import { OUTFITS } from './fkOutfits';
import ReferenceVideo from './ReferenceVideo';

const CHOREOS = {
  orangeJustice: {
    label: 'Orange Justice',
    table: orangeJusticeTable,
    outfit: 'tee',
    // The robot at 3x keeps time with the clip at its own 1x, so that is the default.
    speed: 3,
    reference: { id: '-3NOJklp56U', title: 'Orange Justice', credit: 'Gamerish', rate: 1 / 3 },
  },
  scuba: {
    label: 'Scuba',
    table: scubaTable,
    outfit: 'tank',
    reference: { id: 'ED9J92dsPCU', title: 'Scuba', credit: 'Champ Media' },
  },
  swing: { label: 'Swing', table: swingTable },
};

// Matching the demo robot's own joint_state_publisher: every joint runs a quintic to the
// next pose, so they start and finish together, and the base glides over a longer move.
const MOVE_S = 0.5;
const MOVE_S_BY_JOINT = { drive_x: 1.2, drive_y: 1.2, drive_yaw: 1.2 };
const STATE_TIMEOUT_S = 5;

const GROUPS = [
  { label: 'Base', match: (n) => n.startsWith('drive') || n === 'ankle_roll' },
  { label: 'Torso and head', match: (n) => n.startsWith('torso') || n.startsWith('waist') || n === 'neck' },
  { label: 'Left arm', match: (n) => n.startsWith('left') },
  { label: 'Right arm', match: (n) => n.startsWith('right') },
];

const label = (name) => name.replace(/_/g, ' ');

export default function FkDemo() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const { robot, error } = useMemo(() => {
    try {
      return { robot: parseUrdf(urdfText), error: null };
    } catch (e) {
      return { robot: null, error: e.message };
    }
  }, []);

  const joints = useMemo(() => (robot ? movableJoints(robot) : []), [robot]);
  const groups = useMemo(() => GROUPS
    .map((g) => ({ ...g, joints: joints.filter((j) => g.match(j.name)) }))
    .filter((g) => g.joints.length), [joints]);

  const [choreo, setChoreo] = useState('orangeJustice');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(CHOREOS.orangeJustice.speed ?? 1);
  const [distance, setDistance] = useState(2.8);
  const [showFrames, setShowFrames] = useState(false);
  const [groupIndex, setGroupIndex] = useState(0);
  const [readout, setReadout] = useState({ links: 0, hand: [0, 0, 0], pose: 'home' });

  // Everything the animation loop owns, kept out of React state so a frame costs nothing.
  const sim = useRef({
    positions: {}, velocities: {}, accels: {}, segments: new Map(),
    state: null, elapsed: 0, playing: false, speed: 1, manual: false, visible: true,
  });
  // The project viewer's camera: in front of the robot (it faces +x), slightly to its left.
  const camera = useRef({ azimuth: 0.263, elevation: 0.306, distance: 2.8, target: [0, 0, 0.45] });
  const dirty = useRef(true);
  const frame = useRef(0);
  const uiClock = useRef(0);

  useEffect(() => { sim.current.playing = playing; }, [playing]);
  useEffect(() => { sim.current.speed = speed; }, [speed]);
  useEffect(() => { camera.current.distance = distance; dirty.current = true; }, [distance]);
  useEffect(() => { dirty.current = true; }, [showFrames]);

  const table = CHOREOS[choreo].table;
  const reference = CHOREOS[choreo].reference;
  const [resetKey, setResetKey] = useState(0);
  const stateByName = useMemo(() => {
    const map = new Map();
    for (const s of table.states) map.set(s.name, s);
    return map;
  }, [table]);

  const enterState = useCallback((name) => {
    const s = sim.current;
    const state = stateByName.get(name);
    if (!state) return;
    s.state = name;
    s.manual = false;
    s.elapsed = 0;
    s.segments = new Map();
    const { joint_names: names, positions } = state.target;
    names.forEach((joint, i) => {
      const q0 = s.positions[joint] ?? 0;
      const goal = positions[i];
      const T = MOVE_S_BY_JOINT[joint] ?? MOVE_S;
      s.segments.set(joint, {
        c: quinticCoefficients(q0, s.velocities[joint] ?? 0, s.accels[joint] ?? 0, goal, 0, 0, T),
        t: 0, T, goal,
      });
    });
  }, [stateByName]);

  const reset = useCallback(() => {
    const s = sim.current;
    s.positions = {};
    s.velocities = {};
    s.accels = {};
    s.segments = new Map();
    s.state = table.initial_state;
    s.manual = false;
    s.elapsed = 0;
    setPlaying(false);
    setResetKey((k) => k + 1);
    dirty.current = true;
  }, [table]);

  useEffect(() => { reset(); }, [reset]);

  // Advance the quintics, then follow the choreography's on_arrival transition once every
  // joint the state names is within its epsilon.
  const step = useCallback((dt) => {
    const s = sim.current;
    if (!s.state) s.state = table.initial_state;
    if (!s.segments.size) enterState(s.state);
    for (const [joint, seg] of s.segments) {
      seg.t = Math.min(seg.t + dt, seg.T);
      const [q, v, a] = quinticEvaluate(seg.c, seg.t);
      s.positions[joint] = seg.t >= seg.T ? seg.goal : q;
      s.velocities[joint] = seg.t >= seg.T ? 0 : v;
      s.accels[joint] = seg.t >= seg.T ? 0 : a;
    }
    s.elapsed += dt;
    const state = stateByName.get(s.state);
    if (!state) return;
    const { joint_names: names, positions } = state.target;
    const epsilon = state.epsilon ?? 0;
    const arrived = names.every((joint, i) => Math.abs((s.positions[joint] ?? 0) - positions[i]) <= epsilon);
    if ((arrived || s.elapsed > STATE_TIMEOUT_S) && state.on_arrival) {
      const next = (state.transitions || []).find((t) => t.name === state.on_arrival)?.next_state;
      if (next && stateByName.has(next)) enterState(next);
    }
  }, [enterState, stateByName, table]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !robot) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const world = linkTransforms(robot.root, jointEdges(robot, sim.current.positions), identityPose());
    drawRobot(ctx, {
      robot, world, camera: camera.current, width, height, showFrames,
      extras: OUTFITS[CHOREOS[choreo].outfit] || [],
    });
    return world;
  }, [robot, showFrames, choreo]);

  useEffect(() => {
    if (!robot) return undefined;
    let last = performance.now();
    const loop = (now) => {
      frame.current = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const s = sim.current;
      if (s.playing) {
        step(dt * s.speed);
        dirty.current = true;
      }
      // Off screen the choreography keeps time with the clip, but nothing is drawn until it is back.
      if (!dirty.current || !s.visible) return;
      dirty.current = false;
      const world = render();
      // Mirror the state React shows at about the rate the real robot publishes /tf.
      if (world && now - uiClock.current > 100) {
        uiClock.current = now;
        setReadout({
          links: Object.keys(world).length,
          hand: world.left_hand ? translationOf(world.left_hand) : [0, 0, 0],
          pose: s.manual ? 'posed by hand' : (s.state || table.initial_state),
        });
      }
    };
    frame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame.current);
  }, [robot, render, step, table]);

  // Size the canvas to its container, and redraw when the colour scheme flips. Beside a
  // reference clip the canvas fills the panel's height; on its own it sets its own height.
  const hasRef = Boolean(reference);
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(240, Math.floor(wrap.clientWidth));
      const height = hasRef
        ? Math.max(260, Math.floor(wrap.clientHeight))
        : Math.round(Math.min(560, Math.max(320, width * 0.6)));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      dirty.current = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const repaint = () => { dirty.current = true; };
    mq.addEventListener('change', repaint);
    const io = new IntersectionObserver(([entry]) => { sim.current.visible = entry.isIntersecting; });
    // The whole demo, not just the canvas: the sliders below it read the same flag.
    io.observe(wrap.closest('.demo'));
    return () => { ro.disconnect(); io.disconnect(); mq.removeEventListener('change', repaint); };
  }, [hasRef]);

  const drag = useRef(null);
  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const cam = camera.current;
    cam.azimuth -= (e.clientX - drag.current.x) * 0.008;
    cam.elevation = Math.max(-0.25, Math.min(1.25, cam.elevation + (e.clientY - drag.current.y) * 0.006));
    drag.current = { x: e.clientX, y: e.clientY };
    dirty.current = true;
  };
  const onPointerUp = () => { drag.current = null; };

  const setJoint = (name, value) => {
    const s = sim.current;
    s.positions[name] = value;
    s.velocities[name] = 0;
    s.accels[name] = 0;
    s.segments.delete(name);
    s.manual = true;
    setPlaying(false);
    dirty.current = true;
  };

  if (error) {
    return (
      <div className="demo">
        <p className="demo-hint">This robot description was rejected: {error}</p>
      </div>
    );
  }

  return (
    <div className="demo">
      <div className="demo-toolbar">
        <div className="demo-controls" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-primary" onClick={() => setPlaying((p) => !p)}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <label>
            Choreography
            <select
              value={choreo}
              onChange={(e) => { setChoreo(e.target.value); setSpeed(CHOREOS[e.target.value].speed ?? 1); setPlaying(false); }}
            >
              {Object.entries(CHOREOS).map(([key, c]) => <option key={key} value={key}>{c.label}</option>)}
            </select>
          </label>
          <label>
            Speed
            <input
              type="range" min="0.25" max="3" step="0.25" value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span className="demo-value">{speed}×</span>
          </label>
        </div>
        <div className="demo-controls" style={{ marginTop: 0 }}>
          <label>
            Zoom
            <input
              type="range" min="1.3" max="4" step="0.1" value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
            />
          </label>
          <label>
            <input type="checkbox" checked={showFrames} onChange={(e) => setShowFrames(e.target.checked)} />
            Link frames
          </label>
          <button type="button" className="btn" onClick={reset}>Reset</button>
        </div>
      </div>

      <div className={reference ? 'fk-stage has-ref' : 'fk-stage'}>
        <div className="demo-canvas" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="fk"
            aria-label={`${robot.name}, posed by forward kinematics`}
            role="img"
          />
          <dl className="fk-stats">
            <div>
              <dt>Links posed</dt>
              <dd>{readout.links} <span className="muted">of {robot.links.length}</span></dd>
            </div>
            <div>
              <dt>Joints driven</dt>
              <dd>{joints.length}</dd>
            </div>
            <div>
              <dt>Left hand, world</dt>
              <dd>{readout.hand.map((v) => v.toFixed(2)).join(', ')} <span className="muted">m</span></dd>
            </div>
            <div>
              <dt>Pose</dt>
              <dd className="muted">{readout.pose}</dd>
            </div>
          </dl>
        </div>
        {reference && (
          <ReferenceVideo
            videoId={reference.id}
            title={reference.title}
            credit={reference.credit}
            playing={playing}
            speed={speed}
            resetKey={resetKey}
            rate={reference.rate}
            onPlayingChange={setPlaying}
          />
        )}
      </div>
      <p className="demo-hint">
        Drag the robot to orbit it. Move any slider to take over and pose it by hand; the sliders are the
        robot&apos;s own joints, read from its URDF with their real limits.
      </p>


      <div className="fk-joints">
        <div className="segmented" role="group" aria-label="Joint group">
          {groups.map((group, n) => (
            <button
              key={group.label}
              type="button"
              className={n === groupIndex ? 'active' : undefined}
              aria-pressed={n === groupIndex}
              onClick={() => setGroupIndex(n)}
            >
              {group.label} <span className="demo-value">{group.joints.length}</span>
            </button>
          ))}
        </div>
        <div className="fk-joint-grid">
          {groups[groupIndex]?.joints.map((joint) => (
            <JointSlider key={joint.name} joint={joint} sim={sim} onChange={setJoint} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JointSlider({ joint, sim, onChange }) {
  const [, force] = useState(0);
  const value = sim.current.positions[joint.name] ?? 0;
  // Follow the choreography while it plays, without re-rendering the whole panel.
  useEffect(() => {
    const id = setInterval(() => { if (sim.current.playing && sim.current.visible) force((n) => n + 1); }, 100);
    return () => clearInterval(id);
  }, [sim]);
  return (
    <label className="fk-joint">
      <span>{label(joint.name)}</span>
      <input
        type="range"
        min={joint.lower}
        max={joint.upper}
        step="0.01"
        value={value}
        onChange={(e) => onChange(joint.name, Number(e.target.value))}
      />
      <output>{value.toFixed(2)}{joint.type === 'prismatic' ? ' m' : ' rad'}</output>
    </label>
  );
}
