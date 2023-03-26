'use strict';

import { colors } from '../constants/colors.mjs';

let current_color = 0;
const color_match = {};

const get_color = (which) => {
  if (!color_match[which]) {
    color_match[which] = colors[current_color];

    current_color++;

    if (current_color == colors.length) {
      current_color = 0;
    }
  }

  return color_match[which];
};

export { get_color };
