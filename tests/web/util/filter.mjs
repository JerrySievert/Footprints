'use strict';

import { assert, test } from 'st';
import {
  created_at_filter,
  level_filter
} from '../../../public/js/util/filters/index.mjs';
import { FilteredDataset } from '../../../public/js/util/filter.mjs';

const data = [
  {
    level: 'INFO',
    created_at: new Date(Date.parse('2022-01-01 12:00:00')).toISOString(),
    name: 'test 1'
  },
  {
    level: 'WARN',
    created_at: new Date(Date.parse('2022-01-01 13:00:00')).toISOString(),
    name: 'test 2'
  },
  {
    level: 'INFO',
    created_at: new Date(Date.parse('2022-01-01 14:00:00')).toISOString(),
    name: 'test 3'
  }
];

test('a dataset with no filters is not filtered', () => {
  const dataset = new FilteredDataset(data, {});

  const filtered = dataset.filter();

  assert.eq(filtered.length, 3, 'all rows are returned');
  assert.eq(filtered[0].name, 'test 1', 'the first row is correct');
  assert.eq(filtered[1].name, 'test 2', 'the second row is correct');
  assert.eq(filtered[2].name, 'test 3', 'the third row is correct');
});

test('a dataset with a clean state and filters is not filtered', () => {
  const dataset = new FilteredDataset(data, {
    state: { 'level:INFO': true, 'level:WARN': true },
    filters: [
      (row, state) => {
        return state[`level:${row.level}`] ? row : null;
      }
    ]
  });

  const filtered = dataset.filter();

  assert.eq(filtered.length, 3, 'all rows are returned');
  assert.eq(filtered[0].name, 'test 1', 'the first row is correct');
  assert.eq(filtered[1].name, 'test 2', 'the second row is correct');
  assert.eq(filtered[2].name, 'test 3', 'the third row is correct');
});

test('a dataset with a clean state and a change is filtered', () => {
  const dataset = new FilteredDataset(data, {
    state: { 'level:INFO': true, 'level:WARN': true },
    filters: [
      (row, state) => {
        return state[`level:${row.level}`] ? row : null;
      }
    ]
  });

  dataset.set('level:WARN', false);

  const filtered = dataset.filter();

  assert.eq(filtered.length, 2, 'only INFO rows are returned');
  assert.eq(filtered[0].name, 'test 1', 'the first row is correct');
  assert.eq(filtered[1].name, 'test 3', 'the second row is correct');
});

test('the level_filter works as expected', () => {
  const dataset = new FilteredDataset(data, {
    state: { 'level:INFO': true, 'level:WARN': true },
    filters: [level_filter]
  });

  dataset.set('level:WARN', false);

  const filtered = dataset.filter();

  assert.eq(filtered.length, 2, 'only INFO rows are returned');
  assert.eq(filtered[0].name, 'test 1', 'the first row is correct');
  assert.eq(filtered[1].name, 'test 3', 'the second row is correct');
});

test('the created_at_filter works with a start but no end', () => {
  const dataset = new FilteredDataset(data, {
    state: {
      'created_at:min': +new Date(Date.parse('2022-01-01 13:00:00'))
    },
    filters: [created_at_filter]
  });

  const filtered = dataset.filter();

  assert.eq(filtered.length, 2, 'only rows >= created_at are found');
  assert.eq(filtered[0].name, 'test 2', 'the first row is correct');
  assert.eq(filtered[1].name, 'test 3', 'the second row is correct');
});

test('the created_at_filter works with an end but no start', () => {
  const dataset = new FilteredDataset(data, {
    state: {
      'created_at:max': +new Date(Date.parse('2022-01-01 13:00:00'))
    },
    filters: [created_at_filter]
  });

  const filtered = dataset.filter();

  assert.eq(filtered.length, 1, 'only rows < created_at are found');
  assert.eq(filtered[0].name, 'test 1', 'the first row is correct');
});

test('the created_at_filter works with an end and a start', () => {
  const dataset = new FilteredDataset(data, {
    state: {
      'created_at:min': +new Date(Date.parse('2022-01-01 12:00:00')),
      'created_at:max': +new Date(Date.parse('2022-01-01 13:00:01'))
    },
    filters: [created_at_filter]
  });

  const filtered = dataset.filter();

  assert.eq(filtered.length, 2, '2 rows are found');
  assert.eq(filtered[0].name, 'test 1', 'the first row is correct');
  assert.eq(filtered[1].name, 'test 2', 'the second row is correct');
});
