'use strict';

import { assert, test } from 'st';
import { ast_to_sql } from '../../../lib/query/parser.mjs';

test('a query is converted to sql with defaults', () => {
  const converted = ast_to_sql(`foo == bar`);

  assert.eq(converted.sql, `(data#>>$1 = $2)`, 'the sql clause is correct');
  assert.eq(
    converted.binds.length,
    2,
    'the correct number of bind variables are created'
  );
  assert.eq(converted.binds[0], '{foo}', 'the first bind value is correct');
  assert.eq(converted.binds[1], 'bar', 'the second bind value is correct');
  assert.eq(converted.current, 3, 'the current bind value counter is correct');
});

test('a query with a specified field is converted', () => {
  const converted = ast_to_sql(`foo == bar`, { field: 'baz' });

  assert.eq(converted.sql, `(baz#>>$1 = $2)`, 'the sql clause is correct');
  assert.eq(
    converted.binds.length,
    2,
    'the correct number of bind variables are created'
  );
  assert.eq(converted.binds[0], '{foo}', 'the first bind value is correct');
  assert.eq(converted.binds[1], 'bar', 'the second bind value is correct');
  assert.eq(converted.current, 3, 'the current bind value counter is correct');
});

test('a query with a specified columns is converted', () => {
  const converted = ast_to_sql(`baz == bar`, { usable_columns: { baz: true } });

  assert.eq(converted.sql, `(baz = $1)`, 'the sql clause is correct');
  assert.eq(
    converted.binds.length,
    1,
    'the correct number of bind variables are created'
  );
  assert.eq(converted.binds[0], 'bar', 'the first bind value is correct');
  assert.eq(converted.current, 2, 'the current bind value counter is correct');
});

test('a query with a specified fields is converted', () => {
  const converted = ast_to_sql(`baz.foo == bar`, {
    usable_fields: { baz: true }
  });

  assert.eq(converted.sql, `(baz#>>$1 = $2)`, 'the sql clause is correct');
  assert.eq(
    converted.binds.length,
    2,
    'the correct number of bind variables are created'
  );
  assert.eq(converted.binds[0], '{foo}', 'the first bind value is correct');
  assert.eq(converted.binds[1], 'bar', 'the second bind value is correct');
  assert.eq(converted.current, 3, 'the current bind value counter is correct');
});
