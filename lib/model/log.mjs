'use strict';

import { ast_to_sql } from '../query/parser.mjs';
import { read, write } from '../db.mjs';

const add = async ({ service_name, level, created_at, data }) => {
  return await write(
    `
    INSERT INTO logs (
      service_name,
      level,
      created_at,
      data
    ) VALUES (
      $1,
      $2,
      $3,
      $4
    )
  `,
    [service_name, level, created_at, data]
  );
};

const search = async ({
  service_name,
  level,
  min_created_at,
  max_created_at,
  attribute_query
}) => {
  const clauses = ['1 = 1'];
  const binds = [];
  let current = 1;

  if (level) {
    if (!Array.isArray(level)) {
      level = [level];
    }

    clauses.push(`level = ANY($${current++})`);
    binds.push(level);
  }

  if (min_created_at && max_created_at) {
    clauses.push(`created_at BETWEEN $${current++} AND $${current++}`);
    binds.push(min_created_at);
    binds.push(max_created_at);
  } else if (min_created_at) {
    clauses.push(`created_at >= $${current++}`);
    binds.push(min_created_at);
  } else if (max_created_at) {
    clauses.push(`created_at <= $${current++}`);
    binds.push(min_created_at);
  }

  if (service_name) {
    clauses.push(`service_name = $${current++}`);
    binds.push(service_name);
  }

  if (attribute_query) {
    const {
      binds: attribute_binds,
      sql: attribute_clauses,
      current_bind_count
    } = ast_to_sql(attribute_query, { current });

    clauses.push(attribute_clauses);
    binds.push(...attribute_binds);
    current = current_bind_count;
  }

  const sql = `
    SELECT id,
           service_name,
           level,
           created_at,
           data
      FROM logs
     WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC
  `;

  const results = await read(sql, binds);

  return results.rows;
};

const service_names = async () => {
  const results = await read(`
    SELECT distinct service_name
      FROM logs
     ORDER BY service_name ASC
  `);

  return results.rows.map((e) => e.service_name);
};

const summary_logs_by_hour_service_name_level = async (days = 7) => {
  const date = new Date(+new Date() - days * 24 * 60 * 60 * 1000);

  const results = await read(
    `
    SELECT levels.level,
           series.time,
           service_names.service_name,
           COUNT(logs.id) AS count
      FROM (SELECT UNNEST(ARRAY['INFO', 'DEBUG', 'WARN', 'ERROR', 'CRITICAL', 'FATAL']) AS level) AS levels
     CROSS JOIN (SELECT DISTINCT service_name FROM logs WHERE created_at BETWEEN DATE_TRUNC('hour', $1::TIMESTAMP)::TIMESTAMP AND NOW()) AS service_names
     CROSS JOIN (SELECT generate_series(DATE_TRUNC('hour', $1::TIMESTAMP)::TIMESTAMP, DATE_TRUNC('hour', NOW())::TIMESTAMP, interval '1 hour') AS time) AS series
      LEFT OUTER JOIN logs ON (service_names.service_name = logs.service_name AND levels.level = logs.level AND series.time = DATE_TRUNC('hour', logs.created_at))
     WHERE series.time BETWEEN DATE_TRUNC('hour', $1::TIMESTAMP)::TIMESTAMP AND NOW()
     GROUP BY 1, 2, 3
     ORDER BY series.time, service_names.service_name, levels.level
  `,
    [date]
  );

  return results.rows;
};

export { add, search, service_names, summary_logs_by_hour_service_name_level };
