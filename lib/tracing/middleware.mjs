'use strict';

import app from '../../package.json' assert { type: 'json' };

import { trace } from '@opentelemetry/api';

const tracing_middleware = (request, h) => {
  let current_span = trace.getActiveSpan();

  if (!current_span) {
    const tracer = trace.getTracer(app.name);
    current_span = tracer.startSpan();
  }

  if (current_span) {
    for (const header in request.headers) {
      current_span.setAttribute(
        `http.headers['${header}']`,
        request.headers[header]
      );
    }
  }

  request.traceId = current_span?._spanContext?.traceId;

  return h.continue;
};

export { tracing_middleware };
