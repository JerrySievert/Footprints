'use strict';

const level_filter = (row, state) => {
  return state[`level:${row.level}`] ? row : null;
};

const created_at_filter = (row, state) => {
  let pass = true;

  const created_at = new Date(Date.parse(row.created_at));
  if (!Number.isNaN(+created_at)) {
    if (state[`created_at:min`]) {
      if (+created_at < state[`created_at:min`]) {
        pass = false;
      }
    }

    if (state[`created_at:max`]) {
      if (+created_at >= state[`created_at:max`]) {
        pass = false;
      }
    }
  }

  return pass ? row : null;
};

const duration_filter = (row, state) => {
  let pass = true;

  if (state[`start_ns:min`] !== undefined) {
    if (row.start_ns < state[`start_ns:min`]) {
      pass = false;
    }
  }

  if (state[`end_ns:max`] !== undefined) {
    if (row.start_ns >= state[`end_ns:max`]) {
      pass = false;
    }
  }

  return pass ? row : null;
};

export { created_at_filter, duration_filter, level_filter };
