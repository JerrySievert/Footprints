'use strict';

import {
  get_migrations,
  merge_migrations,
  read_migration_status,
  setup_migrations_folder,
  up_command
} from 'birds';

import { unlink } from 'node:fs/promises';

const TEST_MIGRATION_FILE = './migrations_test.json';

// Unlink the old.
try {
  await unlink(TEST_MIGRATION_FILE);
} catch (err) {}

// Verify the configuration.
const migration_status = await read_migration_status(TEST_MIGRATION_FILE);
console.log(migration_status);
// Check the migrations, warn if anything is out of place.
await setup_migrations_folder();

// Get the current list of migrations and merge it.
const migrations = await get_migrations();

// Merge the current list of migrations with what existed before.
merge_migrations(migration_status, migrations);

await up_command({ migration_status });
