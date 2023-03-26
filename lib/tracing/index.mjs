'use strict';

import * as opentelemetry from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BunyanInstrumentation } from '@opentelemetry/instrumentation-bunyan';
import { HapiInstrumentation } from '@opentelemetry/instrumentation-hapi';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import config from 'config';

import app from '../../package.json' assert { type: 'json' };

if (config.get('tracing.enabled')) {
  const traceExporter = new OTLPTraceExporter({
    url: config.get('tracing.endpoint')
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: app.name,
      [SemanticResourceAttributes.SERVICE_VERSION]: app.version,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env[
        'NODE_ENV'
      ]
        ? process.env[NODE_ENV]
        : 'production'
    }),
    traceExporter,
    instrumentations: [
      new HapiInstrumentation(),
      new HttpInstrumentation(),
      new BunyanInstrumentation(),
      getNodeAutoInstrumentations()
    ]
  });

  await sdk.start();

  // Gracefully shut down the SDK on process exit.
  process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0));
  });
}

// Add an event to the activr span.
const add_trace_event = (level, ...args) => {
  // Only log it if tracing is enabled.
  if (config.get('tracing.enabled')) {
    let span = opentelemetry.trace.getActiveSpan();

    if (span) {
      if (level !== 'error') {
        span.addEvent(level, args[0]);
      } else {
        span.recordException(args);
        span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR });
      }
    }
  }
};

const trace_log = {
  info: (...args) => {
    add_trace_event('info', ...args);
  },
  warn: (...args) => {
    add_trace_event('warn', ...args);
  },
  debug: (...args) => {
    add_trace_event('debug', ...args);
  },
  error: (...args) => {
    add_trace_event('error', ...args);
  },
  fatal: (...args) => {
    add_trace_event('fatal', ...args);
  }
};

export { trace_log };
