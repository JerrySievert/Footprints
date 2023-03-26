'use strict';

import { migrate } from '../lib/db.mjs';

const up = async () => {
  await migrate(`
    CREATE UNIQUE INDEX IF NOT EXISTS traces_trace_id_unique ON traces (trace_id)
  `);
};

const down = async () => {
  await migrate(`
   DROP INDEX IF EXISTS traces_trace_id_unique
  `);
};

export { down, up };
