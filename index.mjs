'use strict';

import './lib/tracing/index.mjs';

import Hapi from '@hapi/hapi';
import config from 'config';
import inert from '@hapi/inert';
import { log } from './lib/logging/index.mjs';
import { tracing_middleware } from './lib/tracing/middleware.mjs';

import {
  get_v1_logs_search,
  get_v1_logs_service_names,
  post_v1_logs_insert,
  get_v1_summary_all,
  post_v1_traces,
  get_v1_traces_distincts,
  get_v1_traces_id,
  get_v1_traces_search
} from './lib/api/index.mjs';

const init = async () => {
  const server = Hapi.server({
    port: config.get('http.port'),
    host: config.get('http.host')
  });

  // API Routes - Logs.
  server.route(get_v1_logs_search);
  server.route(post_v1_logs_insert);
  server.route(get_v1_logs_service_names);

  // API Routes - Traces.
  server.route(get_v1_traces_distincts);
  server.route(get_v1_traces_search);
  server.route(post_v1_traces);
  server.route(get_v1_traces_id);

  // API Routes - Summaries.
  server.route(get_v1_summary_all);

  // File serving.
  await server.register(inert);

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: './public'
      }
    }
  });

  // Middleware for tracing.
  server.ext('onPreHandler', tracing_middleware);

  await server.start();
  log.info(`Server running on ${server.info.uri}`);
};

// Log any unhandled rejections and exit.
process.on('unhandledRejection', (err) => {
  log.error(err);
  process.exit(1);
});

// Log any unhandled exceptions.
process.on('unhandledException', (err, origin) => {
  log.error({ err, origin });
});

init();
