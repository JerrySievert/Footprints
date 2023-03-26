'use strict';

import { createApp, nextTick } from '/vendor/vuejs/vue.esm-browser.prod.js';
import { duration_filter } from '../util/filters/index.mjs';
import { get_color } from '../util/color.mjs';
import { FilteredDataset } from '../util/filter.mjs';
import { format } from '../util/format.mjs';
import { params } from '../util/params.mjs';
import { process_errors } from '../util/errors/index.mjs';
import { spans_in_order } from '../trace/spans.mjs';

const app = createApp({
  data() {
    return {
      trace_id: '',
      trace: null,
      spans: [],
      span_counts: {},
      color_map: {},
      params
    };
  },

  methods: {
    async retrieve_data() {
      this.trace_id = params['trace_id'];

      const request = await fetch(`/v1/traces/${this.trace_id}`);
      const content = await request.json();

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

      this.trace = content.data;

      this.trace.trace_start = new Date(Date.parse(this.trace.trace_start));
      this.trace.trace_end = new Date(Date.parse(this.trace.trace_end));

      // get the sort of spans correct.
      const spans = [];
      for (const span of spans_in_order(this.trace)) {
        spans.push(span);
      }

      this.trace._spans = new FilteredDataset(spans, {
        filters: [duration_filter],
        state: { 'start_ns:min': null, 'start_ns:max': null }
      });
      this.trace.spans = this.trace._spans.filter();

      // get the first ns of the trace.
      const first_ns = this.trace.spans[0].startTimeUnixNano;

      const data = [];
      const span_counts = {};
      let count = 0;

      for (const span of this.trace.spans) {
        if (span.attributes['service.name']) {
          span.service_name = span.attributes['service.name'].stringValue;
        }

        if (!span.service_name) {
          span.service_name = this.trace.service_name;
        }

        if (span_counts[span.service_name]) {
          span_counts[span.service_name]++;
        } else {
          span_counts[span.service_name] = 1;
        }

        span.start_ns = span.startTimeUnixNano - first_ns;
        span.end_ns = span.endTimeUnixNano - first_ns;

        data.push({
          x: span.name,
          y: [
            Math.floor((span.startTimeUnixNano - first_ns) / 1000),
            Math.ceil((span.endTimeUnixNano - first_ns) / 1000)
              ? Math.ceil((span.endTimeUnixNano - first_ns) / 1000)
              : 1
          ],
          id: count,
          span: span,
          fillColor: get_color(span.service_name)
        });
      }

      this.chart_data = data;
      this.span_counts = span_counts;

      count++;
    },

    render_spans_chart() {
      var options = {
        series: [
          {
            data: this.chart_data
          }
        ],
        chart: {
          height: 206,
          type: 'rangeBar',
          events: {
            click: (event, chartContext, config) => {
              // The last parameter config contains additional information like `seriesIndex` and `dataPointIndex` for cartesian charts
              console.log(event, chartContext, config);
              const idx = config.dataPointIndex;
              const [selected] = config.globals.selectedDataPoints;
              this.accordian_selected(selected);
            },
            zoomed: (chartContext, { xaxis, yaxis }) => {
              if (xaxis) {
                this.trace._spans.set('start_ns:min', xaxis?.min);
                this.trace._spans.set('start_ns:max', xaxis?.max);

                this.trace.spans = this.trace._spans.filter();
                this.render_spans_accordian();
              }
            }
          }
        },
        plotOptions: {
          bar: {
            horizontal: true,
            distributed: true,
            dataLabels: {
              hideOverflowingLabels: false
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: (val, opts) => {
            //console.log(val, opts);
            var label = opts.w.globals.labels[opts.dataPointIndex];
            //        var a = moment(val[0]);
            //        var b = moment(val[1]);
            //        var diff = b.diff(a, 'days');
            return label;
          },
          style: {
            colors: ['#f3f4f5', '#fff']
          }
        },
        xaxis: {
          //      type: 'datetime'
        },
        yaxis: {
          show: true
        },
        tooltip: {
          custom: ({ seriesIndex, dataPointIndex, w }) => {
            const entry = w.config.series[seriesIndex].data[dataPointIndex];

            const facts = this.span_facts(entry.span);

            return `
            <div class="arrow_box card-body">
              <div class="card-header">
                <div class="card-title">${facts.span_name}</div>
              </div>
              <div class="card-body">
                <span>Duration: ${facts.duration}μs</span>
              </div>
            </div>
            `;
          }
        },
        grid: {
          row: {
            colors: ['#f3f4f5', '#fff'],
            opacity: 1
          }
        }
      };

      const chart = new ApexCharts(
        document.getElementById('trace-chart'),
        options
      );
      chart.render();
    },

    display_facts(id, facts, use_pre = false) {
      const fact_element = document.getElementById(id);

      if (fact_element) {
        const parts = [];

        for (const fact of facts) {
          if (use_pre) {
            parts.push(`
            <div class="datagrid-item">
              <div class="datagrid-title">${fact.key}</div>
              <div class="datagrid-item"><pre><code>${fact.value}</code></pre></div>
            </div>
          `);
          } else {
            parts.push(`
            <div class="datagrid-item">
              <div class="datagrid-title">${fact.key}</div>
              <div class="datagrid-item">${fact.value}</div>
            </div>
          `);
          }
        }

        fact_element.innerHTML = parts.join('\n');
      }
    },

    span_facts(span) {
      let first = null;
      const display_duration = (
        (span.endTimeUnixNano - span.startTimeUnixNano) /
        1000
      ).toLocaleString();

      const service_name = span?.attributes['service.name']?.stringValue;

      return {
        duration: display_duration,
        service_name,
        span_name: span.name,
        span
      };
    },

    render_trace_facts() {
      const buttons = [];
      for (const key in this.span_counts) {
        buttons.push(
          `<button class="btn">${key}<span class="badge" style="margin-left: 0.4em; background-color: ${get_color(
            key
          )}" ms-2">${this.span_counts[key]}</span></button>`
        );
      }

      const e2 = document.getElementById('spans-title');
      if (e2) {
        e2.innerHTML = `<span>Spans:</span> ${buttons.join('\n')}`;
      }

      const trace_facts = [
        { key: 'Environment', value: this.trace.deployment_environment },
        { key: 'Start', value: this.trace.trace_start.toLocaleString() },
        { key: 'End', value: this.trace.trace_end.toLocaleString() },
        {
          key: 'Duration',
          value: Number(this.trace.duration_ns).toLocaleString() + ' ns'
        }
      ];

      this.display_facts('trace-facts', trace_facts, false);

      const attributes = [];

      for (const attribute of Object.keys(this.trace.attributes).sort()) {
        attributes.push({
          key: attribute,
          value: this.trace.attributes[attribute].stringValue
            ? this.trace.attributes[attribute].stringValue
            : this.trace.attributes[attribute].intValue
        });
      }

      this.display_facts('trace-attributes', attributes, true);
    },

    render_spans_accordian() {
      const parts = [];

      let count = 1;

      for (const span of this.trace.spans) {
        const attributes = [];

        for (const attribute in span.attributes) {
          if (!this.trace.attributes[attribute]) {
            // only use the attributes that are not part of the trace.

            attributes.push(`
              <div class="datagrid-item">
                <div class="datagrid-title">${attribute}</div>
                <div class="datagrid-item"><pre><code>${
                  span.attributes[attribute].stringValue
                    ? span.attributes[attribute].stringValue
                    : span.attributes[attribute].intValue
                }</code></pre></div>
              </div>
            `);
          }
        }

        attributes.push(`
        <div class="datagrid-item">
          <div class="datagrid-title">span</div>
          <div class="datagrid-item"><pre><code>${format(
            span
          )}</code></pre></div>
        </div>
      `);

        const html = `
          <div class="accordion-item">
            <h2 class="accordion-header" id="accordian-span-${count}">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                data-bs-target="#collapse-${count}" aria-expanded="false">
                <span class="badge" style="margin-right: 0.4em; background-color: ${get_color(
                  span.service_name
                )}" ms-2">&nbsp;</span>
                ${span.name} - ${Number(
          span.endTimeUnixNano - span.startTimeUnixNano
        ).toLocaleString()} ns (${Number(
          (span.endTimeUnixNano - span.startTimeUnixNano) / 1000000000
        ).toLocaleString()} s)
              </button>
            </h2>
            <div id="collapse-${count}" class="accordion-collapse collapse" data-bs-parent="#spans-accordion"
              style="">
              <div class="accordion-body pt-0">
                <div class="datagrid">
                ${attributes.join('\n')}
                </div>
              </div>
            </div>
          </div>
        `;

        count++;
        parts.push(html);
      }

      const e = document.getElementById('spans-accordion');
      if (e) {
        e.innerHTML = parts.join('\n');
      }
    },

    accordian_selected(selected) {
      for (let i = 0; i < this.trace.spans.length; i++) {
        const id = `collapse-${i + 1}`;
        const e = new bootstrap.Collapse(document.getElementById(id), {});

        if (selected.indexOf(i) === -1) {
          if (e._isShown()) {
            e.toggle();
          }
        } else {
          if (!e._isShown()) {
            e.toggle();
          }
        }
      }
    }
  },

  async mounted() {
    await this.retrieve_data();
    this.render_spans_chart();
    this.render_trace_facts();
    this.render_spans_accordian();
  }
});

const vm = app.mount('#app');

window.find_traces = () => {
  console.log('query');
  vm.query();
};
