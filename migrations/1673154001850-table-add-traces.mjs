'use strict';

import { migrate } from '../lib/db.mjs';

const up = async () => {
  await migrate(`
    CREATE TABLE IF NOT EXISTS traces (
      id UUID NOT NULL DEFAULT uuid_generate_v7(),
      trace_id TEXT,
      service_name TEXT[],
      deployment_environment TEXT,
      attributes JSONB,
      spans JSONB,
      duration_ns NUMERIC,
      start_ns NUMERIC,
      end_ns NUMERIC,
      trace_start TIMESTAMP WITH TIME ZONE,
      trace_end TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    ) PARTITION BY HASH (trace_id)
  `);
};

const down = async () => {
  await migrate(`
   DROP TABLE IF EXISTS traces CASCADE
  `);
};

export { down, up };
