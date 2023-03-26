'use strict';

import config from 'config';
import { createLogger, format, transports } from 'winston';
import { writableStream } from 'winston-kafka';
import { logLevel } from 'kafkajs';
import { trace_log } from '../tracing/index.mjs';
import app from '../../package.json' assert { type: 'json' };
import os, { hostname } from 'node:os';

// Clean up the request object.
const clean_request = format((info, opts) => {
  // Take one or the other, but not both.
  if (info.req) {
    info.request = {
      headers: info.req.headers,
      method: info.req.method,
      url: info.req.url
    };

    delete info.req;
  }

  if (info.message.req) {
    info.message.request = {
      headers: info.message.req.headers,
      method: info.message.req.method,
      url: info.message.req.url
    };

    delete info.message.req;
  }

  if (info.request) {
    const request = {
      headers: info.request.headers,
      method: info.request.method,
      url: info.request.url
    };

    delete info.message.request;
    info.message.request = request;
  }

  if (info.message.request) {
    const request = {
      headers: info.message.request.headers,
      method: info.message.request.method,
      url: info.message.request.url
    };

    delete info.message.request;
    info.message.request = request;
  }

  return info;
});

// Clean up the error object.
const clean_error = format((info, opts) => {
  if (info.err) {
    info.error = {
      name: info.err.name,
      message: info.err.message,
      stack: info.err.stack
    };

    delete info.err;
  } else if (info.error) {
    info.error = {
      name: info.error.name,
      message: info.error.message,
      stack: info.error.stack
    };
  }

  return info;
});

// Add a timestamp.
const add_timestamp = format((info, opts) => {
  info.time = new Date();

  return info;
});

// The main logger, with the cleaning and a JSON log type.
const logger = createLogger({
  level: config.get('logger.level'),
  format: format.combine(
    clean_request(),
    clean_error(),
    add_timestamp(),
    format.json()
  ),
  // Add some default metadata.
  // TODO: Find more metadata to include.
  defaultMeta: {
    name: app.name,
    pid: process.pid,
    hostname: os.hostname(),
    arch: os.arch()
  },
  transports: []
});

// Enable the console logger if configured.
if (config.get('logger.console.enabled')) {
  logger.add(new transports.Console({}));
}

// TODO: Move to the kafka winston logger.
// Translate from kafkajs logging to winston.
const toWinstonLogLevel = (level) => {
  switch (level) {
    case logLevel.ERROR:
    case logLevel.NOTHING:
      return 'error';
    case logLevel.WARN:
      return 'warn';
    case logLevel.INFO:
      return 'info';
    case logLevel.DEBUG:
      return 'debug';
  }
};

// Log creator for kafkajs for winston.
const WinstonLogCreator = (logLevel) => {
  return ({ namespace, level, label, log }) => {
    const { message, ...extra } = log;
    logger.log({
      level: toWinstonLogLevel(level),
      message,
      extra
    });
  };
};

// Enable the kafka logger if configured.
if (config.get('logger.kafka.enabled')) {
  // Avoid the stupid change warning.
  process.env['KAFKAJS_NO_PARTITIONER_WARNING'] = 1;

  const stream = await writableStream({
    topic: config.get('logger.kafka.topic'),
    brokers: config.get('logger.kafka.brokers'),
    logCreator: WinstonLogCreator
  });

  logger.add(new transports.Stream({ stream }));
}

const log = {
  info: (...args) => {
    trace_log.info(...args);
    logger.info(...args);
  },
  warn: (...args) => {
    trace_log.warn(...args);
    logger.warn(...args);
  },
  debug: (...args) => {
    trace_log.debug(...args);
    logger.debug(...args);
  },
  error: (...args) => {
    trace_log.error(...args);
    logger.error(...args);
  },
  fatal: (...args) => {
    trace_log.fatal(...args);
    logger.fatal(...args);
  }
};

export { log };
