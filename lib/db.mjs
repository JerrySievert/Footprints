'use strict';

import config from 'config';
import Pool from 'pg-pool';

const migrator_pool = config.get('database.migrator.enabled')
  ? new Pool({
      user: config.get('database.migrator.username'),
      host: config.get('database.migrator.hostname'),
      port: config.get('database.migrator.port'),
      password: config.get('database.migrator.password'),
      database: config.get('database.migrator.database'),
      max: config.get('database.migrator.pool.max'),
      idleTimeoutMillis: config.get('database.migrator.pool.idleTimeoutMillis'),
      connectionTimeoutMillis: config.get(
        'database.migrator.pool.connectionTimeoutMillis'
      ),
      maxUses: config.get('database.migrator.pool.maxUses')
    })
  : null;

const migrate = async (sql, params) => {
  if (!migrator_pool) {
    throw new Error('no migrator pool available');
  }

  return await migrator_pool.query(sql, params);
};

const write_pool = config.get('database.primary.enabled')
  ? new Pool({
      user: config.get('database.primary.username'),
      host: config.get('database.primary.hostname'),
      port: config.get('database.primary.port'),
      password: config.get('database.primary.password'),
      database: config.get('database.primary.database'),
      max: config.get('database.primary.pool.max'),
      idleTimeoutMillis: config.get('database.primary.pool.idleTimeoutMillis'),
      connectionTimeoutMillis: config.get(
        'database.primary.pool.connectionTimeoutMillis'
      ),
      maxUses: config.get('database.primary.pool.maxUses')
    })
  : null;

const write = async (sql, params) => {
  if (!write_pool) {
    throw new Error('no write pool available');
  }

  return await write_pool.query(sql, params);
};

const read_pool = config.get('database.reader.enabled')
  ? new Pool({
      user: config.get('database.reader.username'),
      host: config.get('database.reader.hostname'),
      port: config.get('database.reader.port'),
      password: config.get('database.reader.password'),
      database: config.get('database.reader.database'),
      max: config.get('database.reader.pool.max'),
      idleTimeoutMillis: config.get('database.reader.pool.idleTimeoutMillis'),
      connectionTimeoutMillis: config.get(
        'database.reader.pool.connectionTimeoutMillis'
      ),
      maxUses: config.get('database.reader.pool.maxUses')
    })
  : write_pool;

const read = async (sql, params) => {
  if (!read_pool) {
    throw new Error('no read pool available');
  }

  return await read_pool.query(sql, params);
};

export { migrate, read, write };
