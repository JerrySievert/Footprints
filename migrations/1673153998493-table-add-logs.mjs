'use strict';

import { migrate } from '../lib/db.mjs';

// Execute the migration.
const up = async () => {
  await migrate(`
    CREATE TABLE IF NOT EXISTS logs (
      id UUID DEFAULT uuid_generate_v7(),
      service_name TEXT,
      level TEXT CONSTRAINT level_constraint CHECK (level = ANY('{"INFO", "DEBUG", "WARN", "ERROR", "FATAL"}')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      data JSONB
    ) PARTITION BY RANGE (created_at)
  `);
};

// Revert the migration.
const down = async () => {
  await migrate(`
    DROP TABLE IF EXISTS logs CASCADE
  `);
};

export { down, up };
