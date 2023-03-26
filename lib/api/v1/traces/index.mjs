'use strict';

import { insert_or_update } from '../../../model/trace.mjs';
import { log } from '../../../logging/index.mjs';
import { parse_resources } from '../../../trace/parser.mjs';

const process_trace = async (trace) => {
  if (trace.start_ns != null) {
    trace.trace_start = new Date(trace.start_ns / 1000000);
    if (trace.end_ns != null) {
      trace.trace_end = new Date(trace.end_ns / 1000000);
      trace.duration_ns = trace.end_ns - trace.start_ns;
    }
  }

  await insert_or_update(trace);
};

const post_v1_traces = {
  method: 'POST',
  path: '/v1/traces',
  handler: async (request) => {
    try {
      if (!request.payload) {
        return 'ok';
      }

      const traces = parse_resources(request.payload);

      for (const trace in traces) {
        await process_trace(traces[trace]);
      }

      return { status: 'ok' };
    } catch (err) {
      log.error({ err, request });
      return { status: 'error' };
    }
  }
};

export { post_v1_traces };
