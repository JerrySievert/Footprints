'use strict';

import { migrate } from '../lib/db.mjs';

// Execute the migration.
const up = async () => {
  await migrate(`
    CREATE INDEX IF NOT EXISTS logs_created_at_service_name_level ON logs (created_at, service_name, level)
  `);
};

// Revert the migration.
const down = async () => {
  await migrate(`
    DROP INDEX IF EXISTS logs_created_at_service_name_level
  `);
};

export { down, up };
