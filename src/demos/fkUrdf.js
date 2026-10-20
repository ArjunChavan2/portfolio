// A URDF reader for the browser: the same fields the project's Python parser reads
// (links, joints, origins, axes, limits) plus the <visual> primitives the Python
// deliberately ignores, which this demo needs in order to draw the robot.
// A malformed description throws instead of producing a wrong robot.

const MOVABLE = new Set(['revolute', 'continuous', 'prismatic']);
const TYPES = new Set([...MOVABLE, 'fixed']);

function numbers(text, count, where) {
  const parts = (text || '').trim().split(/\s+/).filter(Boolean).map(Number);
  if (parts.length !== count || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`${where}: expected ${count} numbers, got "${text}"`);
  }
  return parts;
}

function origin(elem, where) {
  const o = elem?.querySelector(':scope > origin');
  return {
    xyz: o?.getAttribute('xyz') ? numbers(o.getAttribute('xyz'), 3, `${where} origin xyz`) : [0, 0, 0],
    rpy: o?.getAttribute('rpy') ? numbers(o.getAttribute('rpy'), 3, `${where} origin rpy`) : [0, 0, 0],
  };
}

function visual(elem, materials, where) {
  const shape = elem.querySelector(':scope > geometry > *');
  if (!shape) throw new Error(`${where}: a visual needs a geometry`);
  const { xyz, rpy } = origin(elem, where);
  const named = elem.querySelector(':scope > material')?.getAttribute('name');
  const own = elem.querySelector(':scope > material > color')?.getAttribute('rgba');
  const color = own ? numbers(own, 4, `${where} color`).slice(0, 3) : materials[named] || null;
  const kind = shape.tagName;
  let size;
  if (kind === 'box') size = numbers(shape.getAttribute('size'), 3, `${where} box size`);
  else if (kind === 'cylinder') {
    size = [Number(shape.getAttribute('radius')), Number(shape.getAttribute('length'))];
  } else if (kind === 'sphere') size = [Number(shape.getAttribute('radius'))];
  else throw new Error(`${where}: unsupported geometry <${kind}> (expected box, cylinder, or sphere)`);
  if (size.some((n) => !Number.isFinite(n) || n <= 0)) throw new Error(`${where}: ${kind} needs positive dimensions`);
  return { kind, size, xyz, rpy, color };
}

export function parseUrdf(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('the robot description is not valid XML');
  const root = doc.documentElement;
  if (root.tagName !== 'robot') throw new Error(`expected a <robot> element, found <${root.tagName}>`);

  const materials = {};
  for (const m of root.querySelectorAll(':scope > material')) {
    const rgba = m.querySelector(':scope > color')?.getAttribute('rgba');
    if (m.getAttribute('name') && rgba) {
      materials[m.getAttribute('name')] = numbers(rgba, 4, `material ${m.getAttribute('name')}`).slice(0, 3);
    }
  }

  const links = [];
  const visuals = {};
  for (const l of root.querySelectorAll(':scope > link')) {
    const name = l.getAttribute('name');
    if (!name) throw new Error('every link needs a name');
    if (links.includes(name)) throw new Error(`two links are named ${name}`);
    links.push(name);
    const list = [...l.querySelectorAll(':scope > visual')].map((v) => visual(v, materials, `link ${name}`));
    if (list.length) visuals[name] = list;
  }

  const joints = [];
  for (const j of root.querySelectorAll(':scope > joint')) {
    const name = j.getAttribute('name');
    const type = j.getAttribute('type');
    const where = `joint ${name}`;
    if (!name) throw new Error('every joint needs a name');
    if (joints.some((other) => other.name === name)) throw new Error(`two joints are named ${name}`);
    if (!TYPES.has(type)) throw new Error(`${where}: unknown type ${type}`);
    const parent = j.querySelector(':scope > parent')?.getAttribute('link');
    const child = j.querySelector(':scope > child')?.getAttribute('link');
    if (!parent || !child) throw new Error(`${where}: needs a parent and a child link`);
    for (const link of [parent, child]) {
      if (!links.includes(link)) throw new Error(`${where}: names a link that does not exist (${link})`);
    }
    if (parent === child) throw new Error(`${where}: parent and child are the same link`);
    const axisText = j.querySelector(':scope > axis')?.getAttribute('xyz');
    const axis = axisText ? numbers(axisText, 3, `${where} axis`) : [1, 0, 0];
    if (MOVABLE.has(type) && !Math.hypot(...axis)) throw new Error(`${where}: a movable joint needs a non-zero axis`);
    const limit = j.querySelector(':scope > limit');
    const span = type === 'prismatic' ? 1 : Math.PI;
    const { xyz, rpy } = origin(j, where);
    joints.push({
      name, type, parent, child, axis, originXyz: xyz, originRpy: rpy,
      lower: Number(limit?.getAttribute('lower') ?? -span),
      upper: Number(limit?.getAttribute('upper') ?? span),
    });
  }
  if (!joints.length) throw new Error('a robot with no joints has nothing to pose');

  const children = new Set(joints.map((j) => j.child));
  const roots = [...new Set(joints.map((j) => j.parent))].filter((p) => !children.has(p));
  if (roots.length !== 1) {
    throw new Error(roots.length
      ? `expected one root link (a parent that is no joint's child), found ${roots.length}: ${roots.join(', ')}`
      : 'no root link: every parent is also a child, so the links form a loop');
  }

  return { name: root.getAttribute('name') || 'robot', root: roots[0], links, visuals, joints };
}

// The joints a person can drive, in the robot's own order.
export const movableJoints = (robot) => robot.joints.filter((j) => MOVABLE.has(j.type));
