'use strict';

import { migrate } from '../lib/db.mjs';

const NUM_PARTITIONS = 32;

const up = async () => {
  for (let i = 0; i < NUM_PARTITIONS; i++) {
    await migrate(`
      BEGIN;
      CREATE TABLE IF NOT EXISTS traces_${String(i).padStart(
        2,
        '0'
      )} PARTITION OF traces FOR VALUES WITH (MODULUS ${NUM_PARTITIONS}, REMAINDER ${i});
      COMMIT;
    `);
  }
};

const down = async () => {};

export { down, up };
