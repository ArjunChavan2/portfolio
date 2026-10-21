// Draws a posed robot on a 2D canvas, matching the project's own three.js viewer
// (tools/live_viewer.html): the same 45° lens, the charcoal scene with fog and a floor
// grid, hemisphere plus sun lighting, and the sun's shadow on the floor. No WebGL and no
// dependencies. Every link pose comes from the forward-kinematics port in fkMath.js;
// this file turns those poses and the URDF's visual primitives into shaded polygons.
import { makeTransform, matmul, rpyToMatrix } from './fkMath';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (v) => {
  const m = Math.hypot(...v) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const hex = (h) => [(h >> 16) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const toLinear = (c) => c.map((v) => v ** 2.2);
const toSrgb = (c) => c.map((v) => clamp01(v) ** (1 / 2.2));
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c) => `rgb(${c.map((v) => Math.round(clamp01(v) * 255)).join(',')})`;

// The viewer's scene, converted from three.js (y up) to the robot's world (z up).
export const SCENE = {
  background: hex(0x15171b),
  fogNear: 6,
  fogFar: 14,
  floor: hex(0x23262c),
  floorHalf: 15,
  gridStep: 0.5,
  gridCenter: hex(0x3a3f47),
  gridLine: hex(0x2b2f36),
  sky: toLinear(hex(0xdfe8ff)),
  ground: toLinear(hex(0x30281f)),
  hemisphere: 0.75,
  sun: unit([2.5, -1.5, 4]),
  sunIntensity: 0.9,
  fov: (45 * Math.PI) / 180,
};

const SHELL = { color: hex(0xdfe3e8), metal: 0.45 };
const HUB = { color: hex(0xff8a3d), metal: 0.1 };
const SLIDE = { color: hex(0x3b4049), metal: 0.6 };
const PAINT_METAL = 0.5;
const AXIS_COLORS = [[0.9, 0.3, 0.3], [0.35, 0.78, 0.4], [0.35, 0.6, 0.95]];
const SIDES = 16;
const NEAR = 0.05;
const GROUND_Z = 0.012;
const SHADOW_Z = 0.006;

// Lit colour of a surface, in the spirit of three.js's standard material: the albedo in
// linear light under the hemisphere light plus the sun, metals taking less diffuse light.
function shade(albedo, normal, metal) {
  const a = toLinear(albedo);
  const up = (normal[2] + 1) / 2;
  const sun = Math.max(0, dot(normal, SCENE.sun)) * SCENE.sunIntensity;
  const k = 1 - 0.5 * metal;
  return toSrgb(a.map((v, i) => v * k * ((SCENE.sky[i] * up + SCENE.ground[i] * (1 - up)) * SCENE.hemisphere + sun)));
}

const fogAt = (distance) => clamp01((distance - SCENE.fogNear) / (SCENE.fogFar - SCENE.fogNear));

// A camera orbiting `target`, in the robot's z-up world.
export function cameraFrom({ azimuth, elevation, distance, target }) {
  const ce = Math.cos(elevation);
  const eye = [
    target[0] + distance * ce * Math.cos(azimuth),
    target[1] + distance * ce * Math.sin(azimuth),
    target[2] + distance * Math.sin(elevation),
  ];
  const forward = unit(sub(target, eye));
  const right = unit(cross(forward, [0, 0, 1]));
  return { eye, forward, right, up: cross(right, forward) };
}

// Local vertices for one URDF primitive, as faces of a closed solid.
function faces(kind, size) {
  if (kind === 'box') {
    const [x, y, z] = size.map((s) => s / 2);
    const c = [
      [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
      [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
    ];
    return [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]
      .map((idx) => idx.map((i) => c[i]));
  }
  if (kind === 'cylinder') {
    const [r, len] = size;
    const h = len / 2;
    const ring = (z) => Array.from({ length: SIDES }, (_, i) => {
      const a = (i / SIDES) * Math.PI * 2;
      return [r * Math.cos(a), r * Math.sin(a), z];
    });
    const lo = ring(-h);
    const hi = ring(h);
    const out = [[...lo].reverse(), hi];
    for (let i = 0; i < SIDES; i++) {
      const j = (i + 1) % SIDES;
      out.push([lo[i], lo[j], hi[j], hi[i]]);
    }
    return out;
  }
  return []; // spheres are drawn as shaded screen-space discs
}

function transformPoint(T, [x, y, z]) {
  return [
    T[0][0] * x + T[0][1] * y + T[0][2] * z + T[0][3],
    T[1][0] * x + T[1][1] * y + T[1][2] * z + T[1][3],
    T[2][0] * x + T[2][1] * y + T[2][2] * z + T[2][3],
  ];
}

// A cylinder spanning two world points, used for the parts the URDF does not draw:
// the stroke of a prismatic joint, and a link that carries a joint but no shape of its own.
function segment(a, b, radius) {
  const along = sub(b, a);
  const length = Math.hypot(...along);
  if (length < 1e-4) return [];
  const z = unit(along);
  const seed = Math.abs(z[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  const x = unit(cross(seed, z));
  const y = cross(z, x);
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const T = [
    [x[0], y[0], z[0], mid[0]],
    [x[1], y[1], z[1], mid[1]],
    [x[2], y[2], z[2], mid[2]],
    [0, 0, 0, 1],
  ];
  return faces('cylinder', [radius, length]).map((face) => face.map((p) => transformPoint(T, p)));
}

// A shirt hides what it covers. The viewer gets that from its depth buffer; a painter's
// sort cannot, so each axis-aligned box on the shirt's link is cut down to the part the
// shirt leaves showing: dropped if fully covered, trimmed if it sticks out along one axis.
const isAxisBox = (v) => v.kind === 'box' && v.rpy.every((r) => Math.abs(r) < 1e-9);
const boundsOf = (v) => [0, 1, 2].map((i) => [v.xyz[i] - v.size[i] / 2, v.xyz[i] + v.size[i] / 2]);
const fromBounds = (v, b) => ({ ...v, xyz: b.map(([lo, hi]) => (lo + hi) / 2), size: b.map(([lo, hi]) => hi - lo) });
function uncovered(v, cover) {
  const a = boundsOf(v);
  const c = boundsOf(cover);
  if (!a.every(([lo, hi], i) => hi > c[i][0] && lo < c[i][1])) return [v];
  const inside = a.map(([lo, hi], i) => lo >= c[i][0] - 1e-9 && hi <= c[i][1] + 1e-9);
  if (inside.every(Boolean)) return [];
  const open = [0, 1, 2].filter((i) => !inside[i]);
  if (open.length !== 1) return [v];
  const k = open[0];
  const out = [];
  if (a[k][0] < c[k][0]) out.push(a.map((r, i) => (i === k ? [r[0], c[k][0]] : r)));
  if (a[k][1] > c[k][1]) out.push(a.map((r, i) => (i === k ? [c[k][1], r[1]] : r)));
  return out.filter((b) => b.every(([lo, hi]) => hi - lo > 1e-4)).map((b) => fromBounds(v, b));
}

const centroidOf = (pts) => pts.reduce(
  (acc, p) => [acc[0] + p[0] / pts.length, acc[1] + p[1] / pts.length, acc[2] + p[2] / pts.length],
  [0, 0, 0],
);

/**
 * Draw the scene. `world` is {link: 4x4 world pose} from linkTransforms(); `extras` are
 * [link, visual] pairs drawn like URDF visuals (the choreography's shirt). The caller's
 * canvas transform is kept, since it carries the device pixel ratio.
 */
const backdropCache = { key: null, canvas: null };

export function drawRobot(ctx, { robot, world, camera, width, height, showFrames, extras = [] }) {
  const cam = cameraFrom(camera);
  const f = height / 2 / Math.tan(SCENE.fov / 2);
  const toCam = (p) => {
    const d = sub(p, cam.eye);
    return [dot(d, cam.right), dot(d, cam.up), dot(d, cam.forward)];
  };
  const toScreen = ([x, y, z]) => [width / 2 + (f * x) / z, height / 2 - (f * y) / z];
  const distance = (p) => Math.hypot(...sub(p, cam.eye));

  // Clip a camera-space polygon to the near plane, so faces that reach behind the
  // camera (the floor, mostly) are cut rather than dropped.
  const clipNear = (poly) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const aIn = a[2] >= NEAR;
      const bIn = b[2] >= NEAR;
      if (aIn) out.push(a);
      if (aIn !== bIn) {
        const t = (NEAR - a[2]) / (b[2] - a[2]);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
      }
    }
    return out;
  };
  const screenPoly = (pts) => {
    const clipped = clipNear(pts.map(toCam));
    return clipped.length >= 3 ? clipped.map(toScreen) : null;
  };
  const fillPoly = (screen, color, stroke = true) => {
    ctx.beginPath();
    ctx.moveTo(screen[0][0], screen[0][1]);
    for (let i = 1; i < screen.length; i++) ctx.lineTo(screen[i][0], screen[i][1]);
    ctx.closePath();
    ctx.fillStyle = css(color);
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = css(color);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  };

  // The backdrop (background, floor, grid) only changes with the camera or the canvas size,
  // so it is painted once into an offscreen canvas and reused every frame after that.
  const key = [width, height, ctx.canvas.width, camera.azimuth, camera.elevation, camera.distance, ...camera.target].join();
  if (backdropCache.key !== key) {
    const off = backdropCache.canvas || (backdropCache.canvas = document.createElement('canvas'));
    off.width = ctx.canvas.width;
    off.height = ctx.canvas.height;
    const outer = ctx;
    ctx = off.getContext('2d');
    ctx.setTransform(outer.getTransform());
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    ctx.fillStyle = css(SCENE.background);
    ctx.fillRect(0, 0, width, height);

    // 1. The floor plane, in 2 m tiles so the fog can fade it into the background.
    const floorLit = shade(SCENE.floor, [0, 0, 1], 0);
    const TILE = 2;
    for (let x = -SCENE.floorHalf; x < SCENE.floorHalf; x += TILE) {
      for (let y = -SCENE.floorHalf; y < SCENE.floorHalf; y += TILE) {
        const center = [x + TILE / 2, y + TILE / 2, 0];
        const fog = fogAt(distance(center) - TILE * 0.7);
        if (fog >= 1) continue;
        const screen = screenPoly([[x, y, 0], [x + TILE, y, 0], [x + TILE, y + TILE, 0], [x, y + TILE, 0]]);
        if (screen) fillPoly(screen, mix(floorLit, SCENE.background, fogAt(distance(center))));
      }
    }

    // 2. The grid, in 1 m pieces so each fades with distance; batched by fog level.
    const buckets = new Map();
    const addGridLine = (a, b, center) => {
      const ca = toCam(a);
      const cb = toCam(b);
      if (ca[2] < NEAR && cb[2] < NEAR) return;
      const fog = fogAt(distance([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]));
      if (fog >= 1) return;
      let p = ca;
      let q = cb;
      if (p[2] < NEAR || q[2] < NEAR) {
        const t = (NEAR - p[2]) / (q[2] - p[2]);
        const cut = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, NEAR];
        if (p[2] < NEAR) p = cut; else q = cut;
      }
      const key = `${center ? 'c' : 'l'}${Math.round(fog * 8)}`;
      if (!buckets.has(key)) buckets.set(key, { center, fog: Math.round(fog * 8) / 8, lines: [] });
      buckets.get(key).lines.push([toScreen(p), toScreen(q)]);
    };
    const H = SCENE.floorHalf;
    for (let k = -H; k <= H + 1e-9; k += SCENE.gridStep) {
      const center = Math.abs(k) < 1e-9;
      for (let s = -H; s < H; s += 1) {
        addGridLine([k, s, 0.001], [k, s + 1, 0.001], center);
        addGridLine([s, k, 0.001], [s + 1, k, 0.001], center);
      }
    }
    ctx.lineWidth = 1;
    for (const { center, fog, lines } of buckets.values()) {
      ctx.beginPath();
      for (const [a, b] of lines) {
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.strokeStyle = css(mix(center ? SCENE.gridCenter : SCENE.gridLine, SCENE.background, fog));
      ctx.stroke();
    }
    ctx = outer;
    backdropCache.key = key;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(backdropCache.canvas, 0, 0);
  ctx.restore();

  // 3. Collect the robot's faces: URDF visuals, the shirt, and the shapes the URDF implies.
  const solids = [];
  const addSolid = (pts, material) => solids.push({ pts, ...material });
  const visualFaces = (pose, v) => {
    const T = matmul(pose, makeTransform(rpyToMatrix(...v.rpy), v.xyz));
    return { T, faces: faces(v.kind, v.size).map((face) => face.map((p) => transformPoint(T, p))) };
  };
  const discs = [];
  const addVisual = (link, v, fallback) => {
    const pose = world[link];
    if (!pose) return;
    const material = v.color
      ? { color: v.color, metal: v.metal ?? PAINT_METAL }
      : fallback;
    const { T, faces: list } = visualFaces(pose, v);
    if (v.kind === 'sphere') {
      discs.push({ at: transformPoint(T, [0, 0, 0]), radius: v.size[0], ...material });
      return;
    }
    for (const pts of list) addSolid(pts, material);
  };
  const covers = new Map();
  for (const [link, v] of extras) {
    if (isAxisBox(v)) covers.set(link, [...(covers.get(link) || []), v]);
  }
  for (const [link, visuals] of Object.entries(robot.visuals)) {
    const over = covers.get(link) || [];
    for (const v of visuals) {
      const pieces = isAxisBox(v) ? over.reduce((list, c) => list.flatMap((piece) => uncovered(piece, c)), [v]) : [v];
      for (const piece of pieces) addVisual(link, piece, SHELL);
    }
  }
  for (const [link, v] of extras) addVisual(link, v, SHELL);

  const shaped = (link) => Boolean(robot.visuals[link]);
  const anyShapes = Object.keys(robot.visuals).length > 0;
  for (const joint of robot.joints) {
    const parentPose = world[joint.parent];
    const childPose = world[joint.child];
    const reach = Math.hypot(...joint.originXyz);
    if (parentPose && !shaped(joint.parent) && reach > 0.02) {
      const r = Math.min(0.06, Math.max(0.022, 0.16 * reach));
      for (const pts of segment(transformPoint(parentPose, [0, 0, 0]), transformPoint(parentPose, joint.originXyz), r)) {
        addSolid(pts, SHELL);
      }
    }
    const virtual = !shaped(joint.child) && anyShapes;
    if (childPose && joint.type === 'prismatic' && joint.upper > 0.02 && !virtual) {
      const axis = unit(joint.axis);
      for (const pts of segment(transformPoint(childPose, [0, 0, 0]), transformPoint(childPose, axis.map((v) => -v * joint.upper)), 0.07)) {
        addSolid(pts, SHELL);
      }
    }
    if (childPose && joint.type !== 'fixed' && !virtual) {
      const slide = joint.type === 'prismatic';
      discs.push({ at: transformPoint(childPose, [0, 0, 0]), radius: slide ? 0.03 : 0.042, ...(slide ? SLIDE : HUB) });
    }
  }

  const onGround = (s) => s.pts.every((p) => p[2] <= GROUND_Z);
  const ground = solids.filter(onGround);
  const body = solids.filter((s) => !onGround(s));

  // 4. Ground-level visuals (the dance floor), before anything stands on them.
  const drawSolid = (s) => {
    const normal = unit(cross(sub(s.pts[1], s.pts[0]), sub(s.pts[2], s.pts[0])));
    const centroid = centroidOf(s.pts);
    if (dot(normal, sub(cam.eye, centroid)) <= 0) return; // back face of a closed solid
    const screen = screenPoly(s.pts);
    if (!screen) return;
    fillPoly(screen, mix(shade(s.color, normal, s.metal), SCENE.background, fogAt(distance(centroid))));
  };
  for (const s of ground) drawSolid(s);

  // 5. The sun's shadow: every body face projected onto the floor along the sun, filled
  // as one shape (all wound the same way, so overlaps don't cancel) and softened.
  const shadow = new Path2D();
  const project = (p) => {
    const t = (p[2] - SHADOW_Z) / SCENE.sun[2];
    return [p[0] - SCENE.sun[0] * t, p[1] - SCENE.sun[1] * t, SHADOW_Z];
  };
  for (const s of body) {
    const screen = screenPoly(s.pts.map(project));
    if (!screen) continue;
    let area = 0;
    for (let i = 0; i < screen.length; i++) {
      const [x1, y1] = screen[i];
      const [x2, y2] = screen[(i + 1) % screen.length];
      area += x1 * y2 - x2 * y1;
    }
    const ring = area < 0 ? [...screen].reverse() : screen;
    shadow.moveTo(ring[0][0], ring[0][1]);
    for (let i = 1; i < ring.length; i++) shadow.lineTo(ring[i][0], ring[i][1]);
    shadow.closePath();
  }
  ctx.save();
  ctx.filter = 'blur(2px)';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill(shadow, 'nonzero');
  ctx.restore();

  // 6. The robot, far to near, with the joint hubs as shaded discs.
  const depth = (p) => dot(sub(p, cam.eye), cam.forward);
  const items = [
    ...body.map((s) => ({ s, z: depth(centroidOf(s.pts)) })),
    ...discs.map((d) => ({ d, z: depth(d.at) })),
  ].sort((a, b) => b.z - a.z);
  for (const item of items) {
    if (item.s) {
      drawSolid(item.s);
      continue;
    }
    const { at, radius, color, metal } = item.d;
    const c = toCam(at);
    if (c[2] < NEAR) continue;
    const [x, y] = toScreen(c);
    const r = Math.max(1.2, (radius * f) / c[2]);
    const fog = fogAt(distance(at));
    const lit = mix(shade(color, SCENE.sun, metal), SCENE.background, fog);
    const dark = mix(shade(color, [0, 0, -1], metal), SCENE.background, fog);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, css(lit));
    g.addColorStop(1, css(dark));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // 7. Every link's own frame, which is what forward kinematics actually produces. Drawn
  // over the body rather than sorted into it, or most of them would be buried.
  if (showFrames) {
    ctx.lineWidth = 1.5;
    for (const pose of Object.values(world)) {
      const at = toCam(transformPoint(pose, [0, 0, 0]));
      if (at[2] < NEAR) continue;
      for (let axis = 0; axis < 3; axis++) {
        const tip = [0, 0, 0];
        tip[axis] = 0.11;
        const end = toCam(transformPoint(pose, tip));
        if (end[2] < NEAR) continue;
        const [ax, ay] = toScreen(at);
        const [bx, by] = toScreen(end);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = css(AXIS_COLORS[axis]);
        ctx.stroke();
      }
    }
  }
  return solids.length + discs.length;
}
