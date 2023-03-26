'use strict';

const colors = [
  '#4299e1',
  '#206bc4',
  '#f59f00',
  '#f76707',
  '#d83f27',
  '#d63939'
];

const level_colors = {
  DEBUG: colors[0],
  INFO: colors[1],
  WARN: colors[2],
  ERROR: colors[3],
  CRITIAL: colors[4],
  FATAL: colors[5]
};

const {
  FATAL: COLOR_FATAL,
  CRITICAL: COLOR_CRITICAL,
  ERROR: COLOR_ERROR,
  WARN: COLOR_WARN,
  DEBUG: COLOR_DEBUG,
  INFO: COLOR_INFO
} = level_colors;

export {
  COLOR_FATAL,
  COLOR_CRITICAL,
  COLOR_ERROR,
  COLOR_WARN,
  COLOR_DEBUG,
  COLOR_INFO,
  colors,
  level_colors
};
