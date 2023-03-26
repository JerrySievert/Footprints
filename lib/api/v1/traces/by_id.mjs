'use strict';

import { by_id } from '../../../model/trace.mjs';
import { log } from '../../../logging/index.mjs';

const get_v1_traces_id = {
  method: 'GET',
  path: '/v1/traces/{id}',
  handler: async (request) => {
    const trace_id = request.params.id;

    if (!trace_id) {
      return {
        status: 'error',
        error: 'you must provide a trace_id'
      };
    }

    try {
      const trace = await by_id(trace_id);

      if (trace.rows.length) {
        return {
          status: 'ok',
          data: trace.rows[0]
        };
      }

      return { status: 'error', error: 'not found' };
    } catch (err) {
      log.error({ err, request });
      return { status: 'error' };
    }
  }
};

export { get_v1_traces_id };
