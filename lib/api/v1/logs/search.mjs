'use strict';

import { search } from '../../../model/log.mjs';
import { log } from '../../../logging/index.mjs';
import {
  is_optional_log_level,
  is_optional_end_time,
  is_optional_start_time,
  validate,
  is_optional_attribute_query
} from '../../../validate/index.mjs';

const get_v1_logs_search = {
  method: 'GET',
  path: '/v1/logs/search',
  handler: async (request) => {
    const { start, end, level, attribute_query, service_name } = request.query;

    const checks = validate([
      { value: { level }, constraint: is_optional_log_level },
      { value: { start }, constraint: is_optional_start_time },
      { value: { end }, constraint: is_optional_end_time },
      { value: { attribute_query }, constraint: is_optional_attribute_query }
    ]);

    if (checks.length) {
      log.info({ checks: checks, message: 'failed validation' });
      return { status: 'error', error: checks };
    }

    let min_created_at;
    if (start) {
      min_created_at = new Date(Date.parse(start));
    }

    if (!min_created_at || min_created_at.toString() == 'Invalid Date') {
      min_created_at = new Date(new Date() - 1000 * 60 * 60);
    }

    let max_created_at;
    if (end) {
      max_created_at = new Date(Date.parse(end));
      if (end.toString == 'Invalid Date') {
        max_created_at = undefined;
      }
    }
    try {
      return {
        status: 'ok',
        data: await search({
          min_created_at,
          max_created_at,
          level,
          attribute_query,
          service_name
        })
      };
    } catch (err) {
      log.error({ err, req: request });
      return { status: 'error', error: err };
    }
  }
};

export { get_v1_logs_search };
