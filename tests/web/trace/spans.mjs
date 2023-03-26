'use strict';

import { assert, test } from 'st';

import { spans_in_order } from '../../../public/js/trace/spans.mjs';

const trace = {
  spans: [
    {
      spanId: 'abc',
      startTimeUnixNano: 2
    },
    { spanId: 'abc1', parentSpanId: 'abc', startTimeUnixNano: 3 },
    { spanId: 'abc2', parentSpanId: 'abc', startTimeUnixNano: 4 },
    { spanId: 'abc11', parentSpanId: 'abc1', startTimeUnixNano: 5 },
    { spanId: 'abc21', parentSpanId: 'abc2', startTimeUnixNano: 2 },
    { spanId: 'abc12', parentSpanId: 'abc1', startTimeUnixNano: 6 },
    { spanId: 'bcd', startTimeUnixNano: 0 }
  ]
};

const unordered_trace = {
  spans: [
    { spanId: 'abc11', parentSpanId: 'abc1', startTimeUnixNano: 5 },
    { spanId: 'abc21', parentSpanId: 'abc2', startTimeUnixNano: 2 },
    { spanId: 'abc12', parentSpanId: 'abc1', startTimeUnixNano: 6 },
    {
      spanId: 'abc',
      startTimeUnixNano: 2
    },
    { spanId: 'abc1', parentSpanId: 'abc', startTimeUnixNano: 3 },
    { spanId: 'abc2', parentSpanId: 'abc', startTimeUnixNano: 4 },
    { spanId: 'bcd', startTimeUnixNano: 0 }
  ]
};

test('a tree is created', () => {
  const tree = spans_in_order(trace);

  assert.ne(tree, undefined, 'a tree has been created');
});

test('a tree is in the right order', () => {
  const tree = spans_in_order(trace);

  const spans = [];
  let span;
  while ((span = tree.next())) {
    spans.push(span);
  }

  assert.eq(spans.length, 7, 'there are the correct number of spans');
  assert.eq(spans[0].spanId, 'bcd', 'the first span is correct');
  assert.eq(spans[1].spanId, 'abc', 'the second span is correct');
  assert.eq(spans[2].spanId, 'abc1', 'the third span is correct');
  assert.eq(spans[3].spanId, 'abc11', 'the fourth span is correct');
  assert.eq(spans[4].spanId, 'abc12', 'the fifth span is correct');
  assert.eq(spans[5].spanId, 'abc2', 'the sixth span is correct');
  assert.eq(spans[6].spanId, 'abc21', 'the seventh span is correct');
});

test('a badly ordered tree is in the right order', () => {
  const tree = spans_in_order(unordered_trace);

  const spans = [];
  let span;
  while ((span = tree.next())) {
    spans.push(span);
  }

  assert.eq(spans.length, 7, 'there are the correct number of spans');
  assert.eq(spans[0].spanId, 'bcd', 'the first span is correct');
  assert.eq(spans[1].spanId, 'abc', 'the second span is correct');
  assert.eq(spans[2].spanId, 'abc1', 'the third span is correct');
  assert.eq(spans[3].spanId, 'abc11', 'the fourth span is correct');
  assert.eq(spans[4].spanId, 'abc12', 'the fifth span is correct');
  assert.eq(spans[5].spanId, 'abc2', 'the sixth span is correct');
  assert.eq(spans[6].spanId, 'abc21', 'the seventh span is correct');
});

test('a tree is in the right order as an iterable', () => {
  const tree = spans_in_order(trace);

  const spans = [];
  for (const span of tree) {
    spans.push(span);
  }

  assert.eq(spans.length, 7, 'there are the correct number of spans');
  assert.eq(spans[0].spanId, 'bcd', 'the first span is correct');
  assert.eq(spans[1].spanId, 'abc', 'the second span is correct');
  assert.eq(spans[2].spanId, 'abc1', 'the third span is correct');
  assert.eq(spans[3].spanId, 'abc11', 'the fourth span is correct');
  assert.eq(spans[4].spanId, 'abc12', 'the fifth span is correct');
  assert.eq(spans[5].spanId, 'abc2', 'the sixth span is correct');
  assert.eq(spans[6].spanId, 'abc21', 'the seventh span is correct');
});

test('a big tree with more spans is in the right order as an iterable', () => {
  const data = {
    id: '018516ab-5511-7920-9fe5-66358e7f10ac',
    trace_id: '988334b5c93ee50ddd730b1932c7544d',
    service_name: ['snmp-agent'],
    deployment_environment: 'production',
    attributes: {
      'process.pid': { intValue: 1 },
      'service.name': { stringValue: 'snmp-agent' },
      'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
      'telemetry.sdk.name': { stringValue: 'opentelemetry' },
      'process.command_line': {
        stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
      },
      'process.runtime.name': { stringValue: 'nodejs' },
      'telemetry.sdk.version': { stringValue: '1.8.0' },
      'deployment.environment': { stringValue: 'production' },
      'telemetry.sdk.language': { stringValue: 'nodejs' },
      'process.executable.name': { stringValue: 'node' },
      'process.runtime.version': { stringValue: '18.12.1' },
      'process.runtime.description': { stringValue: 'Node.js' }
    },
    spans: [
      {
        kind: 1,
        name: 'tcp.connect',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-net',
          version: '0.31.0'
        },
        events: [],
        spanId: '3fd65ce62fbcd9e3',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'net.host.ip': { stringValue: '172.21.0.2' },
          'net.peer.ip': { stringValue: '10.0.1.7' },
          'process.pid': { intValue: 1 },
          'service.name': { stringValue: 'snmp-agent' },
          'net.host.port': { intValue: 40540 },
          'net.peer.name': { stringValue: '10.0.1.7' },
          'net.peer.port': { intValue: 6379 },
          'net.transport': { stringValue: 'ip_tcp' },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: 'ad3c6085e1bf48fc',
        endTimeUnixNano: 1671122580041613000,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580032654300,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 1,
        name: 'tcp.connect',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-net',
          version: '0.31.0'
        },
        events: [],
        spanId: '9b68c0aa10714f01',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'net.host.ip': { stringValue: '172.21.0.2' },
          'net.peer.ip': { stringValue: '10.0.1.6' },
          'process.pid': { intValue: 1 },
          'service.name': { stringValue: 'snmp-agent' },
          'net.host.port': { intValue: 41626 },
          'net.peer.name': { stringValue: '10.0.1.6' },
          'net.peer.port': { intValue: 5432 },
          'net.transport': { stringValue: 'ip_tcp' },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: 'c5cfe82a0ba34a82',
        endTimeUnixNano: 1671122580067141400,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580061095000,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'pg.connect',
        links: [],
        scope: { name: '@opentelemetry/instrumentation-pg', version: '0.33.0' },
        events: [],
        spanId: 'c5cfe82a0ba34a82',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'db.name': { stringValue: 'jerrysv_xyz' },
          'db.user': { stringValue: 'jerrysv' },
          'db.system': { stringValue: 'postgresql' },
          'process.pid': { intValue: 1 },
          'service.name': { stringValue: 'snmp-agent' },
          'net.peer.name': { stringValue: '10.0.1.6' },
          'net.peer.port': { intValue: 5432 },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'db.connection_string': {
            stringValue: 'postgresql://10.0.1.6:5432/jerrysv_xyz'
          },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: '5faa0ce28f0ecd4d',
        endTimeUnixNano: 1671122580081885000,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580060895000,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'pg-pool.connect',
        links: [],
        scope: { name: '@opentelemetry/instrumentation-pg', version: '0.33.0' },
        events: [],
        spanId: '5faa0ce28f0ecd4d',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'db.name': { stringValue: 'jerrysv_xyz' },
          'db.user': { stringValue: 'jerrysv' },
          'db.system': { stringValue: 'postgresql' },
          'process.pid': { intValue: 1 },
          'service.name': { stringValue: 'snmp-agent' },
          'net.peer.name': { stringValue: '10.0.1.6' },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'db.connection_string': {
            stringValue: 'postgresql://10.0.1.6:5432/jerrysv_xyz'
          },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' },
          'db.postgresql.idle.timeout.millis': { intValue: 10000 }
        },
        parentSpanId: '1558d800d732546b',
        endTimeUnixNano: 1671122580081931500,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580059088400,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'pg.query:\n',
        links: [],
        scope: { name: '@opentelemetry/instrumentation-pg', version: '0.33.0' },
        events: [],
        spanId: 'ccd619563185d022',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'db.name': { stringValue: 'jerrysv_xyz' },
          'db.user': { stringValue: 'jerrysv' },
          'db.system': { stringValue: 'postgresql' },
          'process.pid': { intValue: 1 },
          'db.statement': {
            stringValue:
              "\n    INSERT INTO data_entry (\n      hour,\n      data_entity_id,\n      data_group_id,\n      data\n    ) VALUES (\n      DATE_TRUNC('hour', now()),\n      $1,\n      $2,\n      update_data('{}', $3)\n    ) ON CONFLICT (\n      hour,\n      data_entity_id\n    )\n    DO UPDATE SET\n      data = update_data(data_entry.data, $3)\n    WHERE data_entry.hour = DATE_TRUNC('hour', now())\n      AND data_entry.data_entity_id = $1\n      AND data_entry.data_group_id = $2\n  "
          },
          'service.name': { stringValue: 'snmp-agent' },
          'net.peer.name': { stringValue: '10.0.1.6' },
          'net.peer.port': { intValue: 5432 },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'db.connection_string': {
            stringValue: 'postgresql://10.0.1.6:5432/jerrysv_xyz'
          },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: '1558d800d732546b',
        endTimeUnixNano: 1671122580154184400,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580082016000,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'redis-connect',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-redis-4',
          version: '0.34.0'
        },
        events: [],
        spanId: 'ad3c6085e1bf48fc',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'db.system': { stringValue: 'redis' },
          'process.pid': { intValue: 1 },
          'service.name': { stringValue: 'snmp-agent' },
          'net.peer.name': { stringValue: '10.0.1.7' },
          'net.peer.port': { intValue: 6379 },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'db.connection_string': { stringValue: 'redis://10.0.1.7:6379' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: '1558d800d732546b',
        endTimeUnixNano: 1671122580041823500,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580032543700,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'redis-PUBLISH',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-redis-4',
          version: '0.34.0'
        },
        events: [],
        spanId: '757b1de5c2b2e659',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'db.system': { stringValue: 'redis' },
          'process.pid': { intValue: 1 },
          'db.statement': { stringValue: 'PUBLISH' },
          'service.name': { stringValue: 'snmp-agent' },
          'net.peer.name': { stringValue: '10.0.1.7' },
          'net.peer.port': { intValue: 6379 },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'db.connection_string': { stringValue: 'redis://10.0.1.7:6379' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: '1558d800d732546b',
        endTimeUnixNano: 1671122580066288600,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580058566400,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'redis-PUBLISH',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-redis-4',
          version: '0.34.0'
        },
        events: [],
        spanId: '3c7ca51727e575b2',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'db.system': { stringValue: 'redis' },
          'process.pid': { intValue: 1 },
          'db.statement': { stringValue: 'PUBLISH' },
          'service.name': { stringValue: 'snmp-agent' },
          'net.peer.name': { stringValue: '10.0.1.7' },
          'net.peer.port': { intValue: 6379 },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'db.connection_string': { stringValue: 'redis://10.0.1.7:6379' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: '1558d800d732546b',
        endTimeUnixNano: 1671122580066303000,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580058714600,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'redis-PUBLISH',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-redis-4',
          version: '0.34.0'
        },
        events: [],
        spanId: '802e27378372e649',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'db.system': { stringValue: 'redis' },
          'process.pid': { intValue: 1 },
          'db.statement': { stringValue: 'PUBLISH' },
          'service.name': { stringValue: 'snmp-agent' },
          'net.peer.name': { stringValue: '10.0.1.7' },
          'net.peer.port': { intValue: 6379 },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'db.connection_string': { stringValue: 'redis://10.0.1.7:6379' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: '1558d800d732546b',
        endTimeUnixNano: 1671122580066310400,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580058805500,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'redis-PUBLISH',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-redis-4',
          version: '0.34.0'
        },
        events: [],
        spanId: 'a4c67d4f77225312',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'db.system': { stringValue: 'redis' },
          'process.pid': { intValue: 1 },
          'db.statement': { stringValue: 'PUBLISH' },
          'service.name': { stringValue: 'snmp-agent' },
          'net.peer.name': { stringValue: '10.0.1.7' },
          'net.peer.port': { intValue: 6379 },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'db.connection_string': { stringValue: 'redis://10.0.1.7:6379' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: '1558d800d732546b',
        endTimeUnixNano: 1671122580066320600,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580058883000,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'redis-PUBLISH',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-redis-4',
          version: '0.34.0'
        },
        events: [],
        spanId: '5891a12d760eaeb3',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'db.system': { stringValue: 'redis' },
          'process.pid': { intValue: 1 },
          'db.statement': { stringValue: 'PUBLISH' },
          'service.name': { stringValue: 'snmp-agent' },
          'net.peer.name': { stringValue: '10.0.1.7' },
          'net.peer.port': { intValue: 6379 },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'db.connection_string': { stringValue: 'redis://10.0.1.7:6379' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: '1558d800d732546b',
        endTimeUnixNano: 1671122580066327800,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580058959600,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'dns.lookup',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-dns',
          version: '0.31.0'
        },
        events: [],
        spanId: 'd72fcd55ef0e8a1e',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'peer.ipv4': { stringValue: '0.0.0.0' },
          'process.pid': { intValue: 1 },
          'service.name': { stringValue: 'snmp-agent' },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: 'da815eb84af7a5dc',
        endTimeUnixNano: 1671122580042357800,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580042262500,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 3,
        name: 'dns.lookup',
        links: [],
        scope: {
          name: '@opentelemetry/instrumentation-dns',
          version: '0.31.0'
        },
        events: [],
        spanId: 'b16b3312040144b4',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'peer.ipv4': { stringValue: '10.0.1.30' },
          'process.pid': { intValue: 1 },
          'service.name': { stringValue: 'snmp-agent' },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: 'da815eb84af7a5dc',
        endTimeUnixNano: 1671122580044121000,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580043999500,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      },
      {
        kind: 1,
        name: 'get(10.0.1.30)',
        links: [],
        scope: { name: 'snmp-agent' },
        events: [],
        spanId: 'da815eb84af7a5dc',
        status: { code: 0 },
        traceId: '988334b5c93ee50ddd730b1932c7544d',
        attributes: {
          'process.pid': { intValue: 1 },
          'service.name': { stringValue: 'snmp-agent' },
          'process.command': { stringValue: '/server/app/bin/runner-snmp.js' },
          'telemetry.sdk.name': { stringValue: 'opentelemetry' },
          'process.command_line': {
            stringValue: '/usr/local/bin/node /server/app/bin/runner-snmp.js'
          },
          'process.runtime.name': { stringValue: 'nodejs' },
          'telemetry.sdk.version': { stringValue: '1.8.0' },
          'deployment.environment': { stringValue: 'production' },
          'telemetry.sdk.language': { stringValue: 'nodejs' },
          'process.executable.name': { stringValue: 'node' },
          'process.runtime.version': { stringValue: '18.12.1' },
          'process.runtime.description': { stringValue: 'Node.js' }
        },
        parentSpanId: '1558d800d732546b',
        endTimeUnixNano: 1671122580058446800,
        droppedLinksCount: 0,
        startTimeUnixNano: 1671122580041905700,
        droppedEventsCount: 0,
        droppedAttributesCount: 0
      }
    ],
    duration_ns: '121640704',
    start_ns: '1671122580032543700',
    end_ns: '1671122580154184400',
    trace_start: '2022-12-15T16:43:00.032Z',
    trace_end: '2022-12-15T16:43:00.154Z',
    created_at: '2022-12-15T16:43:25.328Z'
  };

  const tree = spans_in_order(data);

  const spans = [];
  for (const span of tree) {
    spans.push(span);
  }

  assert.eq(spans.length, 14, 'there are 14 spans');
});
