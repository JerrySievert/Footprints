'use strict';

import { log } from '../../../logging/index.mjs';
import { summary_logs_by_hour_service_name_level } from '../../../model/log.mjs';
import {
  summary_spans_by_hour_service_name,
  summary_traces_by_hour_service_name
} from '../../../model/trace.mjs';

const get_v1_summary_all = {
  method: 'GET',
  path: '/v1/summary/all',
  handler: async (request) => {
    try {
      const logs = await summary_logs_by_hour_service_name_level(1);
      const traces = await summary_traces_by_hour_service_name(1);
      const spans = await summary_spans_by_hour_service_name(1);

      return {
        status: 'ok',
        data: { logs, spans, traces }
      };
    } catch (err) {
      log.error({ err, req: request });
      return { status: 'error', error: err };
    }
  }
};

export { get_v1_summary_all };
