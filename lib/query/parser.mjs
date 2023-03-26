'use strict';

import { parse } from 'query-parser';

const branch_to_sql = (tree, options) => {
  let {
    current = 1,
    field = 'data',
    usable_columns = {},
    usable_fields = {}
  } = options;
  const binds = [];
  let left;

  // remap the equality operator to sql.
  if (tree.operator === '==') {
    tree.operator = '=';
  }

  if (typeof tree.left === 'object') {
    const {
      sql: part,
      current: last_current,
      binds: left_binds
    } = branch_to_sql(tree.left, options);

    left = part;
    current = last_current;
    if (left_binds) {
      binds.push(...left_binds);
    }
  } else {
    if (usable_columns[tree.left]) {
      left = tree.left;
    } else {
      const parts = tree.left.split('.');
      const leftmost = parts[0];

      if (usable_fields[leftmost]) {
        if (parts.length === 1) {
          left = `${leftmost}`;
        } else {
          left = `${leftmost}#>>$${current++}`;
          parts.shift();
          binds.push(`{${parts.join(',')}}`);
        }
      } else {
        left = `${field}#>>$${current++}`;
        binds.push(`{${parts.join(',')}}`);
      }
    }
  }

  let right;

  if (typeof tree.right === 'object') {
    const {
      sql: part,
      current: last_current,
      binds: right_binds
    } = branch_to_sql(tree.right, options);

    right = part;
    current = last_current;
    if (right_binds) {
      binds.push(...right_binds);
    }
  } else {
    right = `$${current++}`;
    binds.push(tree.right);
  }

  return { sql: `(${left} ${tree.operator} ${right})`, binds, current };
};

const ast_to_sql = (attribute_query, options = {}) => {
  const tree = parse(attribute_query);

  return branch_to_sql(tree, options);
};

export { ast_to_sql };
