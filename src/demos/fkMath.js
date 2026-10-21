// Forward kinematics, ported from this project's own Python (src/transform.py, src/fk.py)
// with the same conventions: quaternions are [w, x, y, z], matrices are row-major arrays
// of arrays, angles are radians, and each joint contributes T_origin * T_motion(q)
// composed parent first.

export function normalizeAxis([x, y, z]) {
  const mag = Math.sqrt(x * x + y * y + z * z);
  if (!mag) throw new Error('a movable joint needs an axis with a direction, not 0 0 0');
  return [x / mag, y / mag, z / mag];
}

export function axisAngleToQuat(axis, angle) {
  const s = Math.sin(angle / 2);
  return [Math.cos(angle / 2), s * axis[0], s * axis[1], s * axis[2]];
}

export function quatToMatrix([w, x, y, z]) {
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + w * y)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
    [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
  ];
}

// R = Rz(yaw) · Ry(pitch) · Rx(roll), about the fixed parent axes, roll applied first.
export function rpyToMatrix(roll, pitch, yaw) {
  const [cr, sr] = [Math.cos(roll), Math.sin(roll)];
  const [cp, sp] = [Math.cos(pitch), Math.sin(pitch)];
  const [cy, sy] = [Math.cos(yaw), Math.sin(yaw)];
  const mRoll = [[1, 0, 0], [0, cr, -sr], [0, sr, cr]];
  const mPitch = [[cp, 0, sp], [0, 1, 0], [-sp, 0, cp]];
  const mYaw = [[cy, -sy, 0], [sy, cy, 0], [0, 0, 1]];
  return matmul(matmul(mYaw, mPitch), mRoll);
}

export function matmul(a, b) {
  const rows = a.length, inner = b.length, cols = b[0].length;
  const out = [];
  for (let i = 0; i < rows; i++) {
    const row = Array.from({ length: cols }, () => 0);
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < inner; k++) sum += a[i][k] * b[k][j];
      row[j] = sum;
    }
    out.push(row);
  }
  return out;
}

export function makeTransform(rotation, translation) {
  return [
    [rotation[0][0], rotation[0][1], rotation[0][2], translation[0]],
    [rotation[1][0], rotation[1][1], rotation[1][2], translation[1]],
    [rotation[2][0], rotation[2][1], rotation[2][2], translation[2]],
    [0, 0, 0, 1],
  ];
}

export const identityPose = () => [
  [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1],
];

const IDENTITY_3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

// revolute and continuous rotate q radians about the unit axis; prismatic slides q along
// the axis as written; fixed is the identity.
export function jointMotion(type, axis, q) {
  if (type === 'revolute' || type === 'continuous') {
    return makeTransform(quatToMatrix(axisAngleToQuat(normalizeAxis(axis), q)), [0, 0, 0]);
  }
  if (type === 'prismatic') {
    return makeTransform(IDENTITY_3, [q * axis[0], q * axis[1], q * axis[2]]);
  }
  if (type === 'fixed') return identityPose();
  throw new Error(`unknown joint type ${type} (expected revolute, continuous, prismatic, or fixed)`);
}

// One [parent, child, T_joint] edge per joint, in the robot's joint order. A joint absent
// from positions sits at 0.
export function jointEdges(robot, positions) {
  return robot.joints.map((joint) => {
    const q = Object.hasOwn(positions, joint.name) ? positions[joint.name] : 0;
    const origin = makeTransform(rpyToMatrix(...joint.originRpy), joint.originXyz);
    return [joint.parent, joint.child, matmul(origin, jointMotion(joint.type, joint.axis, q))];
  });
}

// {link: worldPose} for every link reachable from root, composing parent first.
export function linkTransforms(root, edges, rootPose = identityPose()) {
  const family = new Map();
  for (const [parent, child, T] of edges) {
    if (!family.has(parent)) family.set(parent, []);
    family.get(parent).push([child, T]);
  }
  const world = { [root]: rootPose };
  const stack = [root];
  while (stack.length) {
    const link = stack.pop();
    for (const [child, T] of family.get(link) || []) {
      if (Object.hasOwn(world, child)) continue; // a loop would never terminate
      world[child] = matmul(world[link], T);
      stack.push(child);
    }
  }
  return world;
}

export const translationOf = (T) => [T[0][3], T[1][3], T[2][3]];

// Quintic trajectory for one joint, ported from src/quintic.py: six boundary conditions
// (position, velocity, acceleration at each end), six coefficients.
export function quinticCoefficients(q0, v0, a0, q1, v1, a1, T) {
  const c0 = q0, c1 = v0, c2 = a0 / 2;
  const R0 = q1 - (c0 + c1 * T + c2 * T * T);
  const R1 = v1 - (c1 + 2 * c2 * T);
  const R2 = a1 - 2 * c2;
  return [
    c0, c1, c2,
    (10 * R0 - 4 * (R1 * T) + 0.5 * (R2 * T * T)) / T ** 3,
    (-15 * R0 + 7 * (R1 * T) - R2 * T * T) / T ** 4,
    (6 * R0 - 3 * (R1 * T) + 0.5 * (R2 * T * T)) / T ** 5,
  ];
}

export function quinticEvaluate([c0, c1, c2, c3, c4, c5], t) {
  return [
    c0 + c1 * t + c2 * t ** 2 + c3 * t ** 3 + c4 * t ** 4 + c5 * t ** 5,
    c1 + 2 * c2 * t + 3 * c3 * t ** 2 + 4 * c4 * t ** 3 + 5 * c5 * t ** 4,
    2 * c2 + 6 * c3 * t + 12 * c4 * t ** 2 + 20 * c5 * t ** 3,
  ];
}
