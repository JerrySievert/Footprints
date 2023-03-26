'use strict';

import { assert, test } from 'st';
import { post_v1_traces } from '../../../../../lib/api/index.mjs';
import { write as query } from '../../../../../lib/db.mjs';

import trace from '../../../../setup/fixtures/traces/trace-1.json' assert { type: 'json' };

await test('a trace can be added through the api', async () => {
  await query(`BEGIN;`);

  const request = {
    payload: trace
  };

  try {
    const results = await post_v1_traces.handler(request);

    assert.eq(results.status, 'ok', 'there is no error');
  } catch (err) {
    console.log(err);
    assert.eq(0, 1, 'this should not fail');
  }

  try {
    const results = await query(`SELECT * FROM traces`);

    assert.eq(results.rows.length, 1, 'there should be one entry in the table');
  } catch (err) {
    assert.eq(0, 1, 'this should not fail');
  }

  await query(`ROLLBACK;`);
});

await test('a synthetic trace can be added and updated', async () => {
  await query(`BEGIN`);

  const start_ns = 1000000;
  const end_ns = 2000000;

  const trace_1 = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            {
              key: 'service.name',
              value: {
                stringValue: 'service 1'
              }
            }
          ]
        },
        scopeSpans: [
          {
            scope: {
              name: 'foo',
              version: '1.0'
            },
            spans: [
              {
                traceId: 'abc123',
                spanId: 'span123',
                startTimeUnixNano: start_ns,
                endTimeUnixNano: end_ns,
                attributes: []
              }
            ]
          }
        ]
      }
    ]
  };

  const trace_2 = {
    resourceSpans: [
      {
        resource: {
          attributes: [
            {
              key: 'service.name',
              value: {
                stringValue: 'service 2'
              }
            }
          ]
        },
        scopeSpans: [
          {
            scope: {
              name: 'bar',
              version: '1.0'
            },
            spans: [
              {
                traceId: 'abc123',
                spanId: 'span456',
                startTimeUnixNano: 0,
                endTimeUnixNano: end_ns + 1000000,
                attributes: []
              }
            ]
          }
        ]
      }
    ]
  };

  const request = {
    payload: trace_1
  };

  try {
    const results = await post_v1_traces.handler(request);

    assert.eq(results.status, 'ok', 'there is no error');
  } catch (err) {
    console.log(err);
    assert.eq(0, 1, 'this should not fail');
  }

  request.payload = trace_2;

  try {
    const results = await post_v1_traces.handler(request);

    assert.eq(results.status, 'ok', 'there is no error on the second insert');
  } catch (err) {
    console.log(err);
    assert.eq(0, 1, 'this should not fail');
  }

  const data = await query(`SELECT * FROM traces`);

  assert.eq(data.rows.length, 1, 'there should be one row returned');
  assert.eq(
    data.rows[0].service_name.length,
    2,
    'there should be two service names'
  );
  assert.eq(data.rows[0].start_ns, 0, 'the start_ns should be correct');
  assert.eq(
    data.rows[0].end_ns,
    end_ns + 1000000,
    'the end_ns should be correct'
  );
  assert.eq(data.rows[0].spans.length, 2, 'there should be 2 spans recorded');

  await query(`ROLLBACK`);
});
