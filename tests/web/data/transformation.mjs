'use strict';

import { assert, test } from 'st';
import { logs_by_times } from '../../../public/js/data/transformation.mjs';

const hours = [
  +new Date(Date.parse('2023-01-01 12:00:00')),
  +new Date(Date.parse('2023-01-01 13:00:00')),
  +new Date(Date.parse('2023-01-01 14:00:00')),
  +new Date(Date.parse('2023-01-01 15:00:00')),
  +new Date(Date.parse('2023-01-01 16:00:00'))
];

test('logs are sorted correctly into their hours', () => {
  const input = [
    {
      count: 1,
      time: '2023-01-01 13:00:00',
      level: 'INFO',
      service_name: 'foo'
    },
    {
      count: 4,
      time: '2023-01-01 14:00:00',
      level: 'INFO',
      service_name: 'foo'
    },
    {
      count: 2,
      time: '2023-01-01 13:00:00',
      level: 'DEBUG',
      service_name: 'bar'
    }
  ];

  const { counts, logs } = logs_by_times({
    logs: input,
    times: hours,
    service_names: ['foo', 'bar']
  });

  console.log(logs);
  assert.eq(
    logs[hours[0]]['foo']['INFO'],
    0,
    'there should be no results where there are none'
  );
  assert.eq(
    logs[hours[1]]['foo']['INFO'],
    1,
    'there should be results where there are some'
  );
  assert.eq(
    logs[hours[2]]['foo']['INFO'],
    4,
    'there should be results where there are some'
  );
  assert.eq(
    logs[hours[1]]['bar']['DEBUG'],
    2,
    'there should be results where there are some'
  );
  assert.eq(
    logs[hours[4]]['foo']['INFO'],
    0,
    'there should be no results where there are none'
  );

  assert.eq(counts.foo, 2, 'the count for foo is correct');
  assert.eq(counts.bar, 1, 'the count for bar is correct');
});

test('logs with incorrect hours are ignored', () => {
  const input = [
    {
      count: 1,
      hour: '2023-01-01 12:00:01',
      level: 'INFO',
      service_name: 'foo'
    }
  ];

  const { counts, logs } = logs_by_times({
    logs: input,
    times: hours,
    service_names: ['foo']
  });

  assert.eq(
    logs[hours[0]]['foo']['INFO'],
    0,
    'there should be no results where there are none'
  );
  assert.eq(
    logs[hours[1]]['foo']['INFO'],
    0,
    'there should be no results where there are none'
  );

  assert.eq(counts.foo, undefined, 'there is no count for foo');
});
