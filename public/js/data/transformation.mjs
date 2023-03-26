'use strict';

import { levels } from '../constants/levels.mjs';

const logs_by_times = ({ times, logs, service_names }) => {
  const processed_logs = {};
  const counts = {};
  const log_levels = {};

  Object.values(levels).forEach((e) => (log_levels[e] = 0));

  for (const time of times) {
    const log = { time };

    for (const service_name of service_names) {
      if (!processed_logs[time]) {
        processed_logs[time] = {};
      }

      processed_logs[time][service_name] = { ...log_levels };
    }
  }

  for (const log of logs) {
    const time = +new Date(Date.parse(log.time));
    const service_name = log.service_name;
    const count = log.count;
    const level = log.level;

    if (processed_logs[time] && processed_logs[time][service_name]) {
      processed_logs[time][service_name][level] = count;

      if (!counts[service_name]) {
        counts[service_name] = 1;
      } else {
        counts[service_name]++;
      }
    }
  }

  return { counts, logs: processed_logs };
};

const traces_by_times = ({ times, traces, service_names }) => {
  const processed_traces = {};
  const counts = {};

  for (const time of times) {
    for (const service_name of service_names) {
      if (!processed_traces[time]) {
        processed_traces[time] = {};
      }

      processed_traces[time][service_name] = 0;
    }

    for (const trace of traces) {
      const time = trace.time;
      const service_name = trace.service_name;
      const count = Number(trace.count);

      if (processed_traces[time]) {
        processed_traces[time][service_name] = count;

        if (!counts[service_name]) {
          counts[service_name] = 1;
        } else {
          counts[service_name]++;
        }
      }
    }
  }

  return { counts, traces: processed_traces };
};

const logs_as_series = (logs) => {
  const series = {};
  const counts = {};
  const hours = {};

  for (const log of logs) {
    const service_name = log.service_name ? log.service_name : '(null)';

    if (!series[service_name]) {
      series[service_name] = {};
      for (const level of Object.keys(levels)) {
        series[service_name][level] = [];
      }

      counts[service_name] = 0;
    }

    const level = log.level;

    series[service_name][level].push(log.count);
    counts[service_name] += Number(log.count);

    hours[log.time] = true;
  }

  return { counts, hours: Object.keys(hours), logs: series };
};

export { logs_as_series, logs_by_times, traces_by_times };
