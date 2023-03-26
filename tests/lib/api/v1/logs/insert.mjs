'use strict';

import { assert, test } from 'st';
import { post_v1_logs_insert } from '../../../../../lib/api/v1/logs/insert.mjs';
import { write as query } from '../../../../../lib/db.mjs';

await test('logs insert fails with an error when no arguments are sent', async () => {
  const results = await post_v1_logs_insert.handler({ payload: {} });

  assert.eq(results.status, 'error', 'the error status should be returned');
  assert.eq(results.error.length, 3, 'there should be 3 errors returned');
  assert.eq(
    results.error[0].level,
    "Level can't be blank",
    'the level error message should be correct'
  );

  assert.eq(
    results.error[1].time,
    "Time can't be blank",
    'the time error message should be correct'
  );

  assert.eq(
    results.error[2].name,
    "Name can't be blank",
    'the name error message should be correct'
  );
});

await test('logs are correctly inserted', async () => {
  await query('BEGIN');
  const results = await post_v1_logs_insert.handler({
    payload: {
      level: 'INFO',
      name: 'test name',
      time: new Date().toISOString(),
      foo: 'bar'
    }
  });

  assert.eq(results.status, 'ok', 'no error is returned');

  const db_results = await query(
    `SELECT * FROM logs WHERE level = 'INFO' AND service_name = 'test name'`
  );

  assert.eq(db_results.rows.length, 1, 'the record is found');
  assert.eq(db_results.rows[0].level, 'INFO', 'the level is set correctly');
  assert.eq(
    db_results.rows[0].service_name,
    'test name',
    'the name is set correctly'
  );
  assert.eq(db_results.rows[0].data.foo, 'bar', 'the data is copied correctly');

  await query(`ROLLBACK`);
});
