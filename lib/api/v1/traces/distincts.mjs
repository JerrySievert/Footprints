'use strict';

import { log } from '../../../logging/index.mjs';
import { service_names_and_envs } from '../../../model/trace.mjs';

const get_v1_traces_distincts = {
  method: 'GET',
  path: '/v1/traces/distincts',
  handler: async (request) => {
    const from = request.query.from
      ? new Date(Date.parse(request.query.from))
      : new Date(+new Date() - 7 * 24 * 60 * 1000);

    try {
      const data = await service_names_and_envs(from);

      return { status: 'ok', data };
    } catch (err) {
      log.error({ err, request });
      return { status: 'error' };
    }
  }
};

export { get_v1_traces_distincts };
