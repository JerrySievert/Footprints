'use strict';

import { migrate } from '../lib/db.mjs';

const up = async () => {
  await migrate(`
    CREATE INDEX IF NOT EXISTS traces_created_at_gist ON traces USING GIST (created_at)
  `);
};

const down = async () => {
  await migrate(`
   DROP INDEX IF EXISTS traces_created_at_gist
  `);
};

export { down, up };
