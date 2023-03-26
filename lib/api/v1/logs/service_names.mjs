'use strict';

import { service_names } from '../../../model/log.mjs';
import { log } from '../../../logging/index.mjs';

const get_v1_logs_service_names = {
  method: 'GET',
  path: '/v1/logs/service_names',
  handler: async (request) => {
    try {
      return {
        status: 'ok',
        data: await service_names()
      };
    } catch (err) {
      log.error({ err, req: request });
      return { status: 'error', error: err };
    }
  }
};

export { get_v1_logs_service_names };
