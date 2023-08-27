'use strict';

import { attribute_error } from '../util/errors/attribute.mjs';
import { createApp, nextTick } from '/vendor/vuejs/vue.esm-browser.prod.js';
import { colors } from '../constants/colors.mjs';
import { date_ranges } from '../constants/datetime.mjs';
import { get_color } from '../util/color.mjs';
import { minutes_for_range, times_for_params } from '../util/time.mjs';
import { params } from '../util/params.mjs';
import { parse } from '/vendor/celcius-labs/js/parser.mjs';
import { process_errors } from '../util/errors/index.mjs';

const app = createApp({
  data() {
    return {
      traces: [],
      by_id: {},
      chart_data: [],
      params,
      model_attribute_query: '',
      model_service_name: 'Any',
      model_deployment_environment: 'Any',
      query_error: false,
      entry: {},
      minutes: [],
      service_names: [
        {
          text: 'Any',
          value: '',
          selected: params['service_name'] ? false : true
        }
      ],
      deployment_environments: [
        {
          text: 'Any',
          value: '',
          selected: params['deployment_environment'] ? false : true
        }
      ],
      dateranges: date_ranges
    };
  },

  methods: {
    async query() {
      const query_params = [];

      this.query_error = false;

      if (this.model_service_name !== 'Any') {
        params['service_name'] = this.model_service_name;
        query_params.push(`service_name=${params['service_name']}`);
      } else {
        delete params['service_name'];
      }

      if (this.model_deployment_environment !== 'Any') {
        params['deployment_environment'] = this.model_deployment_environment;
        query_params.push(
          `deployment_environment=${params['deployment_environment']}`
        );
      } else {
        delete params['deployment_environment'];
      }

      params['daterange'] = this.model_daterange;
      query_params.push(`daterange=${params['daterange']}`);

      params['attribute_query'] = this.model_attribute_query
        ? encodeURIComponent(this.model_attribute_query)
        : undefined;

      if (params['attribute_query']) {
        query_params.push(`attribute_query=${params['attribute_query']}`);

        try {
          const tree = parse(decodeURIComponent(params['attribute_query']));
        } catch (err) {
          this.query_error = attribute_error([err]);
          const modal = new bootstrap.Offcanvas(
            document.getElementById('query-error'),
            {}
          );
          modal.show();
          return;
        }
      }

      window.history.replaceState(
        {},
        '',
        `${location.pathname}?${query_params.join('&')}`
      );

      document.getElementById('trace-chart').innerHTML = '';
      document.getElementById('trace-data-body').innerHTML = '';

      try {
        await this.retrieve_data();
      } catch (err) {
        console.log(err);
      }
      this.render_trace_graphs();
      this.render_trace_list();
    },

    async retrieve_data() {
      const { start, end } = times_for_params(params);

      // Retrieve the service names and environments.
      const distincts = await fetch(`/v1/traces/distincts?from=${start}`);
      const data = await distincts.json();

      this.service_names = [];

      for (const service_name of data.data?.service_names) {
        if (params['service_name'] == service_name) {
          this.model_service_name = service_name;
        }

        this.service_names.push({
          text: service_name,
          value: service_name,
          selected: params['service_name'] === service_name
        });
      }

      this.deployment_environments = data.data.deployment_environments.map(
        (s) => {
          if (params['deployment_environment'] == s) {
            this.model_deployment_environment = s;
          }

          return {
            text: s,
            value: s,
            selected: params['deployment_environment'] === s
          };
        }
      );

      this.minutes = minutes_for_range(start, end);

      const query_params = [];
      query_params.push(`start=${start}`);
      query_params.push(`end=${end}`);

      if (params['service_name']) {
        query_params.push(`service_name=${params['service_name']}`);
      }

      if (params['deployment_environment']) {
        query_params.push(
          `deployment_environment=${params['deployment_environment']}`
        );
      }

      if (params['attribute_query']) {
        query_params.push(`attribute_query=${params['attribute_query']}`);
      }

      const traces = await fetch(
        `/v1/traces/search?${query_params.join('&')}`,
        {
          method: 'GET'
        }
      );

      const content = await traces.json();
      this.traces = content.data;
      this.chart_data = [];
      this.by_id = {};

      let errors = [];
      if (content.error) {
        if (Array.isArray(content.error)) {
          errors = process_errors(content.error);
        }
      }

      if (errors.length) {
        this.query_error = errors;
        const modal = new bootstrap.Offcanvas(
          document.getElementById('query-error'),
          {}
        );
        modal.show();
        return;
      }

      const names = {};

      content.data.forEach((trace) => {
        if (trace.service_name == null) {
          trace.service_name = '(null)';
        }

        if (!names[trace.service_name]) {
          names[trace.service_name] = 1;
        } else {
          names[trace.service_name]++;
        }

        if (trace.deployment_environment == null) {
          trace.deployment_environment = '(null)';
        }

        trace.trace_start = new Date(Date.parse(trace.trace_start));
        trace.trace_end = new Date(Date.parse(trace.trace_end));

        this.by_id[trace.trace_id] = trace;
      });

      const sorted = Object.keys(names).sort((a, b) => {
        return names[a] > names[b] ? -1 : names[a] < names[b] ? 1 : 0;
      });

      for (const color of sorted) {
        get_color(color);
      }

      content.data.forEach((trace) => {
        this.chart_data.push({
          x: +trace.trace_start,
          y: trace.duration_ns * 1000,
          id: trace.trace_id,
          fillColor: get_color(trace.service_name[0])
        });
      });
    },

    render_trace_graphs() {
      const chart = new ApexCharts(document.getElementById('trace-chart'), {
        chart: {
          type: 'scatter',
          fontFamily: 'inherit',
          height: 389,
          parentHeightOffset: 0,
          toolbar: {
            show: false
          },
          animations: {
            enabled: false
          },
          events: {
            click: function (event, chartContext, config) {
              const point =
                config.config.series[config.seriesIndex].data[
                  config.dataPointIndex
                ];

              window.open(`/trace.html?trace_id=${point.id}`, '_blank');
            }
          }
        },
        series: [
          {
            name: 'Traces',
            data: this.chart_data
          }
        ],
        grid: {
          padding: {
            top: -20,
            right: 6,
            left: 0,
            bottom: -4
          },
          strokeDashArray: 4
        },
        xaxis: {
          labels: {
            formatter: function (value) {
              return new Date(value).toLocaleTimeString();
            },
            padding: 0
          },
          type: 'datetime'
        },
        yaxis: {
          labels: {
            formatter: function (value) {
              return Number(value / 1000).toPrecision(1) + ' ms';
            },
            padding: 4
          }
        },
        tooltip: {
          custom: ({ seriesIndex, dataPointIndex, w }) => {
            const trace = w.config.series[seriesIndex].data[dataPointIndex];
            const facts = this.trace_facts(this.by_id[trace.id]);

            return `
            <div class="arrow_box card-body">
              <div class="card-header">
                <div class="card-title">${facts.first_span_name}</div>
              </div>
              <div class="card-body">
                <span>${facts.trace_start.toLocaleString()}</span>
                <br>
                <span>Duration: ${facts.duration}μs</span>
                <br>
                <span>Spans: ${facts.spans}</span>
                <br>
                <span>Trace ID: <a href="/trace.html?trace_id=${trace.id}">${
              trace.id
            }</a></span>
              </div>
            </div>
            `;
          }
        },
        colors: ['#206bc4'],
        legend: {
          show: false
        }
      });

      chart.render();
    },

    trace_facts(trace) {
      const spans = {};
      let first = null;
      const display_duration = (trace.duration_ns / 1000).toLocaleString();

      for (const span of trace.spans) {
        if (first === null) {
          first = span;
        } else {
          if (span.startTimeUnixNano < first.startTimeUnixNano) {
            first = span;
          }
        }

        const service_name = span.attributes['service.name']
          ? span.attributes['service.name'].stringValue
          : '(null)';

        if (spans[service_name]) {
          spans[service_name]++;
        } else {
          spans[service_name] = 1;
        }
      }

      return {
        duration: display_duration,
        first_span_name: first.name,
        trace_start: trace.trace_start.toLocaleString(),
        spans: Object.keys(spans)
          .map(
            (elem) =>
              `<span class="badge" style="margin-left: 0.4em; background-color: ${get_color(
                elem
              )}">${elem} ${spans[elem].toLocaleString()}</span>`
          )
          .join(', '),
        trace_id: trace.trace_id,
        trace_id_link: `/trace.html?trace_id=${trace.trace_id}`
      };
    },

    render_trace_list() {
      const options = {
        valueNames: [
          'trace_id',
          'first_span_name',
          'spans',
          'duration',
          'trace_start',
          { attr: 'href', name: 'trace_id_link' }
        ],
        item: `<tr>
        <td class="string"><a class="trace_id_link"><span class="trace_id"></span></a></td>
        <td class="string"><span class="first_span_name"></span></td>
        <td class="string"><span class="spans"></span></td>
        <td class="number"><span class="duration"></span>μs</td>
        <td class="date"><span class="trace_start"></span></td>
        </tr>`,
        sortClass: 'table-sort',
        listClass: 'table-tbody'
      };

      const traces = [];
      for (const trace of this.traces) {
        traces.push(this.trace_facts(trace));
      }

      const displayList = new List('trace-data', options, traces);
    }
  },

  async mounted() {
    for (const d of this.dateranges) {
      if (params['daterange'] === d.value) {
        this.model_daterange = d.value;
        d.selected = true;
      } else {
        d.selected = false;
      }
    }

    this.model_attribute_query = params['attribute_query'];

    await nextTick();

    await this.retrieve_data();

    await nextTick();

    this.render_trace_graphs();
    this.render_trace_list();
  }
});

const vm = app.mount('#app');

window.find_traces = () => {
  vm.query();
};
