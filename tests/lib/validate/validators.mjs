'use strict';

import { assert, test } from 'st';

import {
  is_log_level,
  is_optional_log_level,
  is_optional_end_time,
  is_optional_start_time,
  is_optional_attribute_query,
  is_time,
  validate
} from '../../../lib/validate/index.mjs';

test('level is validated correctly', () => {
  let checks = validate([{ value: { level: 23 }, constraint: is_log_level }]);
  assert.eq(
    checks.length,
    1,
    'if the level is a number there are failures returned'
  );

  assert.eq(
    checks[0]['level'][0],
    '23 is not a valid log level',
    'the response is correct'
  );

  checks = validate([{ value: {}, constraint: is_log_level }]);

  assert.eq(
    checks.length,
    1,
    'if the level does not exist there are failures returned'
  );

  assert.eq(
    checks[0]['level'][0],
    "Level can't be blank",
    'if the level is blank the correct failure is returned'
  );

  checks = validate([{ value: { level: 'INFO' }, constraint: is_log_level }]);
  assert.eq(checks.length, 0, 'level is correctly validated if it is correct');
});

test('time is correctly validated', () => {
  let checks = validate([
    { value: { time: '2012-00-xxy' }, constraint: is_time }
  ]);

  assert.eq(
    checks.length,
    1,
    'if the time is not correct there are failures returned'
  );

  checks = validate([{ constraint: is_time }]);

  assert.eq(
    checks[0].time[0],
    "Time can't be blank",
    'if the time does not exist there are failures returned'
  );

  checks = validate([{ value: { time: '2020-12-01 12:16:44' } }]);
  assert.eq(checks.length, 0, 'a normal time parses');
});

test('optional start time is correctly validated', () => {
  let checks = validate([
    { value: { start: '2012-00-xxy' }, constraint: is_optional_start_time }
  ]);

  assert.eq(
    checks.length,
    1,
    'if the time is not correct there are failures returned'
  );

  checks = validate([{ constraint: is_optional_start_time }]);

  assert.eq(
    checks.length,
    0,
    'if the time does not exist there are no failures returned'
  );

  checks = validate(
    [{ value: { start: '2020-12-01 12:16:44' } }],
    is_optional_start_time
  );
  assert.eq(checks.length, 0, 'a normal time parses');
});

test('optional end time is correctly validated', () => {
  let checks = validate([
    { value: { end: '2012-00-xxy' }, constraint: is_optional_end_time }
  ]);

  assert.eq(
    checks.length,
    1,
    'if the time is not correct there are failures returned'
  );

  checks = validate([{ constraint: is_optional_end_time }]);

  assert.eq(
    checks.length,
    0,
    'if the time does not exist there are no failures returned'
  );

  checks = validate(
    [{ value: { start: '2020-12-01 12:16:44' } }],
    is_optional_end_time
  );
  assert.eq(checks.length, 0, 'a normal time parses');
});

test('optional level is validated correctly', () => {
  let checks = validate([{ value: {}, constraint: is_optional_log_level }]);

  assert.eq(checks.length, 0, 'if the level is blank there is no failure');

  checks = validate([
    { value: { level: 'INFO' }, constraint: is_optional_log_level }
  ]);
  assert.eq(checks.length, 0, 'level is correctly validated if it is correct');

  checks = validate([
    { value: { level: 'FOO' }, constraint: is_optional_log_level }
  ]);

  assert.eq(
    checks.length,
    1,
    'a failure is returned if the log level is invalid'
  );
});

test('optional attribute query validates a correct query', () => {
  let checks = validate([
    {
      value: { attribute_query: 'foo == bar' },
      constraint: is_optional_attribute_query
    }
  ]);

  assert.eq(checks.length, 0, 'if it parses there is no failure');

  checks = validate([
    {
      constraint: is_optional_attribute_query
    }
  ]);

  assert.eq(
    checks.length,
    0,
    'and does not error if the attribute query does not exist'
  );
});

test('optional attribute query fails on a bad query', () => {
  let checks = validate([
    {
      value: { attribute_query: 'foo = bar' },
      constraint: is_optional_attribute_query
    }
  ]);

  assert.eq(checks.length, 1, 'there is one failure');
});
