'use strict';

import { attribute_error } from './attribute.mjs';
import { daterange_error } from './daterange.mjs';

const process_errors = (errors) => {
  const error_reports = [];

  for (const error of errors) {
    if (error.attribute_query) {
      error_reports.push(attribute_error(error.attribute_query));
    } else if (error.start || error.end) {
      error_reports.push(daterange_error(error.start, error.end));
    }
  }

  if (error_reports.length) {
    return `
      <div class="datagrid">
        ${error_reports.join('\n')}
      </div>
    `;
  }
};

export { process_errors };
