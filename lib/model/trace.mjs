'use strict';

import { read, write } from '../db.mjs';
import { log } from '../logging/index.mjs';

const insert_or_update = async (values) => {
  const {
    trace_id,
    service_name,
    attributes,
    deployment_environment,
    spans,
    start_ns,
    end_ns,
    duration_ns,
    trace_start,
    trace_end
  } = values;

  const binds = [
    trace_id,
    [service_name],
    deployment_environment,
    attributes,
    JSON.stringify(spans),
    start_ns,
    end_ns,
    duration_ns,
    trace_start,
    trace_end
  ];
  const sql = `
    INSERT INTO traces (
      trace_id,
      service_name,
      deployment_environment,
      attributes,
      spans,
      start_ns,
      end_ns,
      duration_ns,
      trace_start,
      trace_end
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10
    ) ON CONFLICT (trace_id) DO UPDATE SET
      attributes = COALESCE(traces.attributes::JSONB || $4::JSONB, traces.attributes::JSONB, $4::JSONB),
      service_name = ARRAY(SELECT DISTINCT e FROM UNNEST(traces.service_name || $2) AS a(e)),
      spans = COALESCE(traces.spans::JSONB || $5::JSONB, traces.spans::JSONB, $5::JSONB),
      start_ns = CASE WHEN COALESCE(traces.start_ns, 0) > COALESCE($6, 0) THEN COALESCE($6, 0) ELSE COALESCE(traces.start_ns, 0) END,
      end_ns = CASE WHEN COALESCE(traces.end_ns, 0) < COALESCE($7, 0) THEN COALESCE($7, 0) ELSE COALESCE(traces.end_ns, 0) END,
      duration_ns = CASE WHEN COALESCE(traces.end_ns, 0) < COALESCE($7, 0) THEN COALESCE($7, 0) ELSE COALESCE(traces.end_ns, 0) END - CASE WHEN COALESCE(traces.start_ns, 0) > COALESCE($6, 0) THEN COALESCE($6, 0) ELSE COALESCE(traces.start_ns, 0) END,
      trace_start = TO_TIMESTAMP(CASE WHEN COALESCE(traces.start_ns, 0) > COALESCE($6, 0) THEN COALESCE($6, 0) ELSE COALESCE(traces.start_ns, 0) END / 1000000000),
      trace_end = TO_TIMESTAMP(CASE WHEN COALESCE(traces.end_ns, 0) < COALESCE($7, 0) THEN COALESCE($7, 0) ELSE COALESCE(traces.end_ns, 0) END / 1000000000)
  `;

  try {
    const results = await write(sql, binds);
  } catch (err) {
    log.error(err);
  }
};

const latest = async (from) => {
  return await read(
    `
	  SELECT trace_id,
		       service_name,
		       deployment_environment,
					 attributes,
					 spans,
					 duration_ns,
					 trace_start,
					 trace_end
			FROM traces
		 WHERE trace_start >= $1
		 ORDER BY trace_start DESC
	`,
    [from]
  );
};

const by_id = async (trace_id) => {
  return await read(
    `
	  SELECT *
		  FROM traces
		 WHERE trace_id = $1;
	`,
    [trace_id]
  );
};

const service_names_and_envs = async (from) => {
  const service_names = await read(
    `
      SELECT DISTINCT unnest(service_name) AS service_name
        FROM traces
       WHERE trace_start >= $1
	`,
    [from]
  );

  const deployment_environments = await read(
    `
      SELECT DISTINCT deployment_environment
        FROM traces
       WHERE trace_start >= $1
  	`,
    [from]
  );

  return {
    deployment_environments: deployment_environments.rows.length
      ? deployment_environments.rows.map((e) => e.deployment_environment)
      : [],
    service_names: service_names.rows.length
      ? service_names.rows.map((e) => e.service_name)
      : []
  };
};

const search = async ({
  service_name,
  deployment_environment,
  min_created_at,
  max_created_at,
  attribute_query
}) => {
  const clauses = ['1 = 1'];
  const binds = [];
  let current = 1;

  if (deployment_environment) {
    clauses.push(`deployment_environment = $${current++}`);
    binds.push(deployment_environment);
  }
  if (min_created_at && max_created_at) {
    clauses.push(`trace_start BETWEEN $${current++} AND $${current++}`);
    binds.push(min_created_at);
    binds.push(max_created_at);
  } else if (min_created_at) {
    clauses.push(`trace_start >= $${current++}`);
    binds.push(min_created_at);
  } else if (max_created_at) {
    clauses.push(`trace_start <= $${current++}`);
    binds.push(min_created_at);
  }

  if (service_name) {
    clauses.push(`service_name = $${current++}`);
    binds.push([service_name]);
  }

  if (attribute_query) {
    const {
      binds: attribute_binds,
      sql: attribute_clauses,
      current_bind_count
    } = ast_to_sql(attribute_query, {
      current,
      field: 'attributes',
      usable_columns: { duration_ns, start_ns, end_ns, trace_start, trace_end }
    });

    clauses.push(attribute_clauses);
    binds.push(...attribute_binds);
    current = current_bind_count;
  }

  const sql = `
    SELECT trace_id,
           service_name,
           deployment_environment,
           attributes,
           spans,
           duration_ns,
           trace_start,
           trace_end
      FROM traces
     WHERE ${clauses.join(' AND ')}
     ORDER BY trace_start DESC
  `;

  const results = await read(sql, binds);

  return results.rows;
};

const summary_traces_by_hour_service_name = async (days = 7) => {
  const date = new Date(+new Date() - days * 24 * 60 * 60 * 1000);

  const results = await read(
    `
    SELECT COUNT(*) AS count,
           DATE_TRUNC('hour', trace_start) AS time,
           service_name,
           deployment_environment
      FROM traces
     WHERE DATE_TRUNC('day', trace_start) >= DATE_TRUNC('day', $1::TIMESTAMP)
     GROUP BY 2, 3, 4
     ORDER BY 2 DESC, 3, 4
  `,
    [date]
  );

  return results.rows;
};

const summary_spans_by_hour_service_name = async (days = 7) => {
  const date = new Date(+new Date() - days * 24 * 60 * 60 * 1000);

  const results = await read(
    `
    SELECT service_name,
           DATE_TRUNC('hour', date) AS time,
           COUNT(service_name) AS count
     FROM (
            SELECT jsonb_array_elements_text(jsonb_path_query_array(spans, '$[*].attributes[*]."service.name".stringValue')) AS service_name,
                   TO_TIMESTAMP(jsonb_array_elements(jsonb_path_query_array(spans, '$[*].startTimeUnixNano'))::NUMERIC / 1000000000) AS date,
                   jsonb_array_length(spans) AS count
              FROM traces
             WHERE DATE_TRUNC('hour', trace_start) > $1
             GROUP BY traces.spans
          ) AS spans
    GROUP BY 1, 2
    ORDER BY 1, 2
    `,
    [date]
  );

  return results.rows;
};

export {
  by_id,
  insert_or_update,
  latest,
  search,
  service_names_and_envs,
  summary_traces_by_hour_service_name,
  summary_spans_by_hour_service_name
};
