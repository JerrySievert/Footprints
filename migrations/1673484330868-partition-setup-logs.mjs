'use strict';

import { migrate } from '../lib/db.mjs';

// Execute the migration.
const up = async () => {
  await migrate(`
    BEGIN;
    SELECT create_parent('public.logs', 'created_at', 'native', 'weekly');
    COMMIT;
  `);
};

// Revert the migration.
const down = async () => {
  await migrate(`
    DROP TABLE IF EXISTS logs_drop;
  `);

  await migrate(`
    CREATE TABLE logs_drop AS TABLE logs
  `);

  await migrate(`
    SELECT undo_partition('public.logs', p_target_table := 'public.logs_drop', p_drop_cascade := 't', p_keep_table := 'f')
  `);

  await migrate(`
    DROP TABLE logs_drop CASCADE;
  `);
};

export { down, up };
