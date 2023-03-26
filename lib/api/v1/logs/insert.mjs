'use strict';

import { add } from '../../../model/log.mjs';
import {
  is_log_level,
  is_name,
  is_time,
  validate
} from '../../../validate/index.mjs';
import { log } from '../../../logging/index.mjs';

const post_v1_logs_insert = {
  method: 'POST',
  path: '/v1/logs/insert',
  handler: async (request) => {
    const { name, level, time } = request.payload;
    const checks = validate([
      { value: { level }, constraint: is_log_level },
      { value: { time }, constraint: is_time },
      { value: { name }, constraint: is_name }
    ]);

    if (checks.length) {
      log.info({
        req: request,
        checks,
        msg: 'failed to validate log insert request'
      });

      return { status: 'error', error: checks };
    }

    try {
      await add({
        created_at: new Date(Date.parse(time)),
        data: request.payload,
        level,
        service_name: name
      });

      return { status: 'ok' };
    } catch (err) {
      if (err) {
        log.error({ req: request, err, msg: 'insert error' });

        return { status: 'error', error: 'insert error' };
      }
    }
  }
};

export { post_v1_logs_insert };
