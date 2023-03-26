# Footprints

OpenTelemetry Trace and Logging Facilities.

![Main Page](images/footprints-main.png 'Footprints')

## Current Status

Running and useful.

- Ingestion of logs
- Ingestion of traces
- Display of logs and details
- Display of traces and span across services
- Searching of log and trace metadata
- Docker image available
- Docker-Compose

### Logging

Logging is currently a simple `JSON` format with a `time`, `level`, and `name`.

Future plans include OpenTelemetry log intakes, as well as connection of logs and traces.

![Logs](images/footprints-logs.png 'Logs')

### Traces

OpenTelemetry traces are supported across multiple services.

![Traces](images/footprints-traces.png 'Traces')

## What's Missing

There is still a lot of work to be done on this project:

- Connection of logs and traces automatically
- Facet creation
- Dashboards
  - Key indicators
  - Count
  - Distribution and statistics
- Metrics
- Real-time updates
- Data pruning
- Easy upgrades
- Custom reporting

## Running Locally

You can use `docker-compose` to run Footprints locally:

```bash
docker-compose up -d footprints
```

This will start a local Postgresql database instance along with an instance of Footprints.

Unfortunately, at the current time, a migration must be run separately.

You are required to `docker exec` `bash` in the main footprints container and run `yarn migrate`.

## Logging

Logging is available through the `/v1/logs/insert` endpoint.

|---------|----------|--------|
|parameter|type |required|
|---------|----------|--------|
|`time` |`datetime`|yes |
|`level` |`string` |yes |
|`name` |`string` |yes |
|`data` |`json` |yes |

### Log Levels

Log levels must be one of the following:

- `DEBUG`
- `INFO`
- `NOTICE`
- `WARN`
- `ERROR`
- `CRITICAL`
- `FATAL`

### Example

```javascript
const post_data = {
  time: new Date(),
  level: `ERROR`,
  name: 'my application',
  data: {
    message: 'Application Error',
    error: 'Unable to connect to the database'
  }
};

const response = await fetch('http://footprints:4318/v1/logs/insert', {
  method: 'POST',
  body: JSON.stringify(post_data),
  headers: { 'Content-Type': 'application/json' }
});
```

## Tracing

Tracing is supported via OpenTelemetry through the `/v1/traces` endpoint.

### Example

```javascript
const exporterUrl = 'http://footprints:4318/v1/traces';
const spanProcessor = new BatchSpanProcessor(
  new OTLPTraceExporter({ url: exporterUrl })
);

const sdk = new NodeSDK({
  resource: new Resource({
    [SERVICE_NAME]: 'jerrysv.xyz'
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  spanProcessor
});

sdk.start();
```
