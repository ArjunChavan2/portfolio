// The demos' math and the resume dates, checked against hand-worked cases so a broken port fails CI, not the page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  axisAngleToQuat, jointEdges, linkTransforms, quatToMatrix, quinticCoefficients,
  quinticEvaluate, rpyToMatrix, translationOf,
} from '../src/demos/fkMath.js';
import { mazeGrid, search, WALL } from '../src/demos/astar.js';

const close = (actual, expected) => actual.flat().forEach((v, i) => {
  assert.ok(Math.abs(v - expected.flat()[i]) < 1e-9, `${actual} vs ${expected}`);
});

test('a 90 degree yaw turns x into y, and the quaternion agrees with rpy', () => {
  const R = rpyToMatrix(0, 0, Math.PI / 2);
  close(R.map((row) => row[0]), [0, 1, 0]);
  close(quatToMatrix(axisAngleToQuat([0, 0, 1], Math.PI / 2)), R);
});

test('links compose parent first through a revolute joint', () => {
  const robot = {
    joints: [
      { name: 'j1', type: 'revolute', parent: 'base', child: 'a', axis: [0, 0, 1], originXyz: [1, 0, 0], originRpy: [0, 0, 0] },
      { name: 'j2', type: 'fixed', parent: 'a', child: 'b', axis: [1, 0, 0], originXyz: [1, 0, 0], originRpy: [0, 0, 0] },
    ],
  };
  const world = linkTransforms('base', jointEdges(robot, { j1: Math.PI / 2 }));
  close(translationOf(world.b), [1, 1, 0]);
});

test('a quintic ends on its goal at rest', () => {
  const c = quinticCoefficients(0, 0.5, 0, 1, 0, 0, 2);
  close(quinticEvaluate(c, 0), [0, 0.5, 0]);
  close(quinticEvaluate(c, 2), [1, 0, 0]);
});

test('A* finds a path as short as Dijkstra while expanding no more cells', () => {
  const [w, h] = [41, 25];
  const grid = mazeGrid(w, h, 11);
  const [start, goal] = [w + 1, (h - 2) * w + (w - 2)];
  const astar = search(grid, w, h, start, goal, 'astar');
  const dijkstra = search(grid, w, h, start, goal, 'dijkstra');
  assert.ok(astar.path.length > 1);
  assert.equal(astar.path.length, dijkstra.path.length);
  assert.ok(astar.expanded <= dijkstra.expanded);
  astar.path.slice(1).forEach((c, i) => {
    assert.notEqual(grid[c], WALL);
    const p = astar.path[i];
    assert.equal(Math.abs((c % w) - (p % w)) + Math.abs(((c / w) | 0) - ((p / w) | 0)), 1);
  });
});

test('a walled-off goal returns no path', () => {
  const [w, h] = [5, 3];
  const grid = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) grid[y * w + 2] = WALL;
  assert.deepEqual(search(grid, w, h, 0, w - 1).path, []);
});

test('date ranges end where the resume says, and Present only matches the word', async () => {
  const { endMonth, isCurrent } = await import('../src/dates.js');
  assert.equal(endMonth('Jan 2025 – Apr 2025'), 2025 * 12 + 3);
  assert.equal(endMonth('Sept 2026'), 2026 * 12 + 8);
  assert.equal(endMonth('2025'), 2025 * 12 + 11);
  assert.equal(endMonth('Feb 2026 – Present'), Infinity);
  assert.equal(isCurrent('Mar 2025 (Presentation)'), false);
});
