// Draws a posed robot on a 2D canvas: no WebGL and no dependencies. Every link pose
// comes from the forward-kinematics port in fkMath.js; this file only turns those
// poses plus the URDF's visual primitives into sorted, shaded polygons.
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

const LIGHT = unit([-0.35, -0.6, 0.9]);
const SHELL = [0.86, 0.88, 0.91];
const HUB = [1, 0.54, 0.24];
const SLIDE = [0.24, 0.26, 0.3];
const AXIS_COLORS = [[0.9, 0.3, 0.3], [0.35, 0.78, 0.4], [0.35, 0.6, 0.95]];
const SIDES = 16;

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

function projector(cam, width, height, fov = 0.82) {
  const f = height / 2 / Math.tan(fov / 2);
  return (p) => {
    const d = sub(p, cam.eye);
    const z = dot(d, cam.forward);
    if (z <= 0.05) return null;
    return [width / 2 + (f * dot(d, cam.right)) / z, height / 2 - (f * dot(d, cam.up)) / z, z, f / z];
  };
}

const rgb = (c, k = 1) => `rgb(${c.map((v) => Math.round(Math.min(1, Math.max(0, v * k)) * 255)).join(',')})`;

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
  return []; // spheres are drawn as screen-space circles
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

function transformPoint(T, [x, y, z]) {
  return [
    T[0][0] * x + T[0][1] * y + T[0][2] * z + T[0][3],
    T[1][0] * x + T[1][1] * y + T[1][2] * z + T[1][3],
    T[2][0] * x + T[2][1] * y + T[2][2] * z + T[2][3],
  ];
}

/**
 * Draw the robot. `world` is {link: 4x4 world pose} from linkTransforms().
 * Returns the number of primitives drawn, which the demo shows as a readout.
 */
export function drawRobot(ctx, { robot, world, camera, width, height, background, showFrames }) {
  const cam = cameraFrom(camera);
  const project = projector(cam, width, height);
  const items = [];

  for (const [link, visuals] of Object.entries(robot.visuals)) {
    const pose = world[link];
    if (!pose) continue;
    for (const v of visuals) {
      const T = matmul(pose, makeTransform(rpyToMatrix(...v.rpy), v.xyz));
      const color = v.color || SHELL;
      if (v.kind === 'sphere') {
        items.push({ kind: 'circle', at: transformPoint(T, [0, 0, 0]), radius: v.size[0], color });
        continue;
      }
      for (const face of faces(v.kind, v.size)) {
        const pts = face.map((p) => transformPoint(T, p));
        const normal = unit(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
        const centroid = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length, a[2] + p[2] / pts.length], [0, 0, 0]);
        if (dot(normal, sub(cam.eye, centroid)) <= 0) continue; // back face of a closed solid
        items.push({ kind: 'poly', pts, centroid, color, shade: 0.45 + 0.55 * Math.max(0, dot(normal, LIGHT)) });
      }
    }
  }

  // Shapes the URDF implies but never draws, matching the project's own viewer.
  const shaped = (link) => Boolean(robot.visuals[link]);
  const anyShapes = Object.keys(robot.visuals).length > 0;
  const implied = [];
  for (const joint of robot.joints) {
    const parentPose = world[joint.parent];
    const childPose = world[joint.child];
    const reach = Math.hypot(...joint.originXyz);
    if (parentPose && !shaped(joint.parent) && reach > 0.02) {
      implied.push([
        transformPoint(parentPose, [0, 0, 0]),
        transformPoint(parentPose, joint.originXyz),
        Math.min(0.06, Math.max(0.022, 0.16 * reach)),
      ]);
    }
    const virtual = !shaped(joint.child) && anyShapes;
    if (childPose && joint.type === 'prismatic' && joint.upper > 0.02 && !virtual) {
      const axis = unit(joint.axis);
      implied.push([
        transformPoint(childPose, [0, 0, 0]),
        transformPoint(childPose, axis.map((v) => -v * joint.upper)),
        0.07,
      ]);
    }
  }
  for (const [a, b, radius] of implied) {
    for (const pts of segment(a, b, radius)) {
      const normal = unit(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
      const centroid = pts.reduce((acc, p) => [acc[0] + p[0] / pts.length, acc[1] + p[1] / pts.length, acc[2] + p[2] / pts.length], [0, 0, 0]);
      if (dot(normal, sub(cam.eye, centroid)) <= 0) continue;
      items.push({ kind: 'poly', pts, centroid, color: SHELL, shade: 0.45 + 0.55 * Math.max(0, dot(normal, LIGHT)) });
    }
  }

  // A hub on every movable joint, placed by the child link's own frame.
  for (const joint of robot.joints) {
    if (joint.type === 'fixed' || !world[joint.child]) continue;
    const slide = joint.type === 'prismatic';
    items.push({
      kind: 'circle',
      at: transformPoint(world[joint.child], [0, 0, 0]),
      radius: slide ? 0.03 : 0.042,
      color: slide ? SLIDE : HUB,
    });
  }

  // Every link's own frame: this is what forward kinematics actually produces. Drawn
  // over the body rather than depth-sorted into it, or most of them would be buried.
  const frames = [];
  if (showFrames) {
    for (const pose of Object.values(world)) {
      const at = transformPoint(pose, [0, 0, 0]);
      for (let axis = 0; axis < 3; axis++) {
        const tip = [0, 0, 0];
        tip[axis] = 0.11;
        frames.push({ from: at, to: transformPoint(pose, tip), color: AXIS_COLORS[axis] });
      }
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const depth = (item) => -dot(sub(item.centroid || item.at || item.from, cam.eye), cam.forward);
  for (const item of items.sort((a, b) => depth(a) - depth(b))) {
    if (item.kind === 'poly') {
      const screen = item.pts.map(project);
      if (screen.some((p) => !p)) continue;
      ctx.beginPath();
      ctx.moveTo(screen[0][0], screen[0][1]);
      for (const p of screen.slice(1)) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
      ctx.fillStyle = rgb(item.color, item.shade);
      ctx.fill();
      ctx.strokeStyle = rgb(item.color, item.shade * 0.82);
      ctx.lineWidth = 0.7;
      ctx.stroke();
      continue;
    }
    if (item.kind === 'circle') {
      const p = project(item.at);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p[0], p[1], Math.max(1.2, item.radius * p[3]), 0, Math.PI * 2);
      ctx.fillStyle = rgb(item.color, 0.92);
      ctx.fill();
      continue;
    }
  }

  ctx.lineWidth = 1.5;
  for (const axis of frames) {
    const a = project(axis.from);
    const b = project(axis.to);
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = rgb(axis.color);
    ctx.stroke();
  }
  return items.length + frames.length;
}
