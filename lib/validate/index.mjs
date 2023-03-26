'use strict';

import { validate } from 'validate.js';
import { parse } from 'query-parser';

validate.extend(validate.validators.datetime, {
  // The value is guaranteed not to be null or undefined but otherwise it
  // could be anything.
  parse: function (value, options) {
    return +new Date(Date.parse(value));
  },
  // Input is a unix timestamp.
  format: function (value, options) {
    return value.toISOString();
  }
});

validate.validators.attribute_query = function (
  value,
  options,
  key,
  attributes
) {
  if (!value) {
    return null;
  }

  try {
    parse(value);

    return null;
  } catch (err) {
    return `is unable to be parsed: ${err}`;
  }
};

const is_log_level = {
  level: {
    presence: true,
    inclusion: {
      within: {
        DEBUG: 'DEBUG',
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
        CRITICAL: 'CRITICAL',
        FATAL: 'FATAL'
      },
      message: '^%{value} is not a valid log level'
    },
    type: 'string'
  }
};

const is_optional_log_level = {
  level: {
    presence: false,
    inclusion: {
      within: {
        DEBUG: 'DEBUG',
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
        CRITICAL: 'CRITICAL',
        FATAL: 'FATAL'
      },
      message: '^%{value} is not a valid log level'
    },
    type: 'string'
  }
};

const is_time = {
  time: {
    presence: true,
    datetime: true
  }
};

const is_optional_end_time = {
  end: {
    presence: false,
    datetime: true
  }
};

const is_optional_start_time = {
  start: {
    presence: false,
    datetime: true
  }
};

const is_name = {
  name: {
    presence: true,
    type: 'string'
  }
};

const is_optional_attribute_query = {
  attribute_query: {
    presence: false,
    attribute_query: {}
  }
};

const validator = (validations) => {
  const results = [];

  for (const check of validations) {
    const result = validate(check.value, check.constraint);
    if (result) {
      results.push(result);
    }
  }

  return results;
};

export {
  is_log_level,
  is_name,
  is_optional_log_level,
  is_optional_start_time,
  is_optional_end_time,
  is_optional_attribute_query,
  is_time,
  validator as validate
};
