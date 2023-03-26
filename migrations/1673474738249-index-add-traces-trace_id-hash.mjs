'use strict';

import { migrate } from '../lib/db.mjs';

const up = async () => {
  await migrate(`
    CREATE INDEX IF NOT EXISTS traces_trace_id_hash ON traces USING HASH (trace_id)
  `);
};

const down = async () => {
  await migrate(`
   DROP INDEX IF EXISTS traces_trace_id_hash
  `);
};

export { down, up };
