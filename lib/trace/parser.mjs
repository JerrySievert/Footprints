'use strict';

const { max, min } = Math;

const parse_resources = (resources) => {
  const traces = {};

  const resourceSpans = resources.resourceSpans
    ? resources.resourceSpans
    : resources.resource_spans;

  for (const resourceSpan of resourceSpans) {
    // grap a copy of the attributes themselves.
    const attributes = {};
    let deployment_environment;
    let service_name;

    // convert array of attributes into key/value.
    if (resourceSpan.resource?.attributes) {
      resourceSpan.resource?.attributes.forEach((attribute) => {
        // convert any string_value to stringValue.
        if (attribute.value.string_value) {
          attribute.value.stringValue = attribute.value.string_value;
          delete attribute.value.string_value;
        }

        // convert any int_value to intValue
        if (attribute.value.int_value) {
          attribute.value.intValue = attribute.value.int_value;
          delete attribute.value.int_value;
        }

        attributes[attribute.key] = attribute.value;

        // TODO: use constants from opentelemetry.
        if (attribute.key === 'service.name') {
          service_name = attribute.value.stringValue;
        }

        // TODO: use constants from opentelemetry.
        if (attribute.key === 'deployment.environment') {
          deployment_environment = attribute.value.stringValue;
        }
      });
    }

    const scopeSpans = resourceSpan.scopeSpans
      ? resourceSpan.scopeSpans
      : resourceSpan.scope_spans;

    if (resources.scope_spans) {
      resources.scopeSpans = resources.scope_spans;
      delete resources.scope_spans;
    }

    for (const scopeSpan of scopeSpans) {
      // make a copy of the scope to inject into every span.
      const scope = scopeSpan.scope;

      for (const span of scopeSpan.spans) {
        // grab the traceId for the future.
        const trace_id = span.traceId ? span.traceId : span.trace_id;

        // create the trace if it does not exist.
        if (traces[trace_id] === undefined) {
          traces[trace_id] = {
            spans: [],
            trace_id,
            attributes,
            service_name,
            deployment_environment
          };
        }

        // convert start_time_unix_nano to startTimeUnixNano.
        if (span.start_time_unix_nano) {
          span.startTimeUnixNano = span.start_time_unix_nano;
          delete span.start_time_unix_nano;
        }

        // convert end_time_unix_nano to endTimeUnixNano.
        if (span.end_time_unix_nano) {
          span.endTimeUnixNano = span.end_time_unix_nano;
          delete span.end_time_unix_nano;
        }

        // if there is not a start time, set it.
        if (traces[trace_id].start_ns === undefined) {
          traces[trace_id].start_ns = span.startTimeUnixNano;
        } else {
          traces[trace_id].start_ns = min(
            span.startTimeUnixNano,
            traces[trace_id].start_ns
          );
        }

        // if there is not an end time, set it.
        if (traces[trace_id].end_ns === undefined) {
          traces[trace_id].end_ns = span.endTimeUnixNano;
        } else {
          traces[trace_id].end_ns = max(
            span.endTimeUnixNano,
            traces[trace_id].end_ns
          );
        }

        if (!traces[trace_id].trace_start) {
          traces[trace_id].trace_start = new Date(
            traces[trace_id].start_ns / 1000000
          );
        }

        if (!traces[trace_id].trace_end) {
          traces[trace_id].trace_end = new Date(
            traces[trace_id].end_ns / 1000000
          );
        }

        // add the scope to the span.
        span.scope = scope;

        // convert the array of attributes into key/value.
        const span_attributes = {};

        if (Array.isArray(span.attributes)) {
          for (const attribute of span.attributes) {
            if (attribute.value.string_value) {
              attribute.value.stringValue = attribute.value.string_value;
              delete attribute.value.string_value;
            }

            if (attribute.value.int_value) {
              attribute.value.intValue = attribute.value.int_value;
              delete attribute.value.int_value;
            }

            span_attributes[attribute.key] = attribute.value;
          }

          span.attributes = { ...span_attributes, ...attributes };
        }

        traces[trace_id].spans.push(span);
      }
    }
  }

  return traces;
};

export { parse_resources };
