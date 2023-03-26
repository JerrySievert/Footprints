'use strict';

import { migrate } from '../lib/db.mjs';

const up = async () => {
  await migrate(`
    GRANT SELECT, INSERT ON logs TO footprints
  `);

  await migrate(`
    GRANT SELECT ON logs TO footprints_reader
  `);

  await migrate(`
    GRANT SELECT, INSERT, UPDATE ON traces TO footprints
  `);

  await migrate(`
    GRANT SELECT ON traces TO footprints_reader
  `);
};

const down = async () => {};

export { down, up };
