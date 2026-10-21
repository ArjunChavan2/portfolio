// Shirts the demo robot wears per choreography, ported from the project's viewer
// (tools/live_viewer.html). Each part is a box on a link, sized just over the torso
// box (0.22 x 0.34 x 0.34, z 0.10 to 0.44) so its faces never coincide with the body.
const ORANGE = [1, 0.478, 0]; // #ff7a00
const NAVY = [0, 0.153, 0.298]; // #00274c
const MAIZE = [1, 0.796, 0.02]; // #ffcb05

const part = (link, size, xyz, color) => [link, { kind: 'box', size, xyz, rpy: [0, 0, 0], color, metal: 0 }];

export const OUTFITS = {
  // A plain tee with short sleeves over the tops of the upper arms.
  tee: [
    part('torso', [0.252, 0.356, 0.32], [0, 0, 0.28], ORANGE),
    part('left_upper_arm', [0.09, 0.09, 0.1], [0, 0, -0.07], ORANGE),
    part('right_upper_arm', [0.09, 0.09, 0.1], [0, 0, -0.07], ORANGE),
  ],
  // A tank: body below the shoulders, a strap over each, trimmed at the neck and armholes.
  tank: [
    part('torso', [0.252, 0.356, 0.25], [0, 0, 0.235], NAVY),
    part('torso', [0.254, 0.356, 0.014], [0, 0, 0.353], MAIZE),
    ...[-0.115, 0.115].flatMap((y) => [
      part('torso', [0.254, 0.091, 0.092], [0, y, 0.399], MAIZE),
      part('torso', [0.258, 0.075, 0.094], [0, y, 0.4], NAVY),
    ]),
  ],
};
