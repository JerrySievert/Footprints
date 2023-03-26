'use strict';

import { createApp, nextTick } from '/vendor/vuejs/vue.esm-browser.prod.js';
import { get_color } from '../util/color.mjs';
import { level_colors } from '../constants/colors.mjs';
import { levels } from '../constants/levels.mjs';
import { logs_as_series, traces_by_times } from '../data/transformation.mjs';

const app = createApp({
  data() {
    return {
      logs_counts: null,
      traces_by_hour: {},
      logs_by_hour: {},
      traces: null,
      logs: null,
      hours: [],
      traces_service_names: [],
      traces_deployment_environments: [],
      logs_service_names: [],
      sorted_traces: {}
    };
  },

  methods: {
    async retrieve_data() {
      const log_service_names_json = await fetch(`/v1/logs/service_names`);
      const log_service_names = await log_service_names_json.json();

      if (log_service_names.status === 'error') {
        const element = document.getElementById('traces-chart');

        element.innerHTML = `
          <div>
            <h3>Unable to retrieve data</h3>
            <p>${log_service_names.error}</p>
          </div>
        `;

        return;
      }

      if (log_service_names.data.length === 0) {
        const element = document.getElementById('traces-chart');

        element.innerHTML = `
          <div>
            <h3>Unable to retrieve data</h3>
            <p>No data found</p>
          </div>
        `;

        return;
      }

      this.logs_service_names = log_service_names.data.map((e) =>
        e ? e : '(null)'
      );

      const trace_distinct_json = await fetch(
        `/v1/traces/distincts?from=${new Date(
          +new Date() - 30 * 24 * 60 * 60 * 1000
        )}`
      );
      const trace_distinct = await trace_distinct_json.json();

      this.traces_service_names = trace_distinct.data.service_names.map((e) =>
        e ? e : '(null)'
      );
      this.traces_deployment_environments =
        trace_distinct.data.deployment_environments.map((e) =>
          e ? e : '(null)'
        );

      const summary = await fetch(`/v1/summary/all`);
      const data = await summary.json();

      this.traces = data.data.traces;
      this.logs = data.data.logs;
    },

    render_log_detail({ hours, id, levels }) {
      const element = document.querySelector(id);

      for (const level in levels) {
        const div = `
        <div class="datagrid-item">
          <div class="datagrid-title">${level}</div>
          <div class="datagrid-content">${levels[level]}</div>
        </div>
  
        `;

        element.innerHTML += div;
      }
    },

    render_log_graph({ id, series, hours }) {
      const options = {
        series,
        chart: {
          type: 'bar',
          height: 350,
          stacked: true,
          toolbar: {
            show: true
          },
          zoom: {
            enabled: true
          }
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              legend: {
                position: 'bottom',
                offsetX: -10,
                offsetY: 0
              }
            }
          }
        ],
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 10,
            dataLabels: {
              total: {
                enabled: true,
                style: {
                  fontSize: '13px',
                  fontWeight: 900
                }
              }
            }
          }
        },
        xaxis: {
          type: 'datetime',
          categories: hours
        },
        legend: {
          position: 'right',
          offsetY: 40
        },
        fill: {
          opacity: 1
        },
        colors: Object.values(level_colors)
      };

      var chart = new ApexCharts(document.querySelector(id), options);
      chart.render();
    },

    async render_logs() {
      // Sort the service names by count, descending, for display.
      const service_names = Object.keys(this.logs_counts).sort((a, b) => {
        return this.logs_counts[a] < this.logs_counts[b]
          ? 1
          : this.logs_counts[a] == this.logs_counts[b]
          ? 0
          : -1;
      });

      const chart_element = document.getElementById('logs-by-service-charts');
      const detail_element = document.getElementById('logs-by-service-details');

      const series = [];

      for (let i in service_names) {
        const service_name = service_names[i];

        if (this.logs_by_hour[service_name]) {
          const chart_name = `logs_chart_${i}`;

          const chart_div = `
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">${service_name}</h3>
              </div>
              <div class="card-body">
                <div id="${chart_name}" style="min-height: 480px;">
                </div>
              </div>
            </div>`;

          chart_element.innerHTML += chart_div;

          const detail_name = `logs_detail_${i}`;

          const detail_div = `
            <div class="card">
              <div class="card-body">
                <div class="datagrid" id=${detail_name} style="min-height: 420px;">
                </div>
              </div>
            </div>`;

          detail_element.innerHTML += detail_div;
        }
      }

      for (let i in service_names) {
        const service_name = service_names[i];

        const chart_name = `logs_chart_${i}`;

        if (this.logs_by_hour[service_name]) {
          const series = [];
          const levels = {};

          const data = Object.values(this.logs_by_hour[service_name]);

          for (const level of Object.keys(this.logs_by_hour[service_name])) {
            series.push({
              name: level,
              data: this.logs_by_hour[service_name][level]
            });

            const initialValue = 0;
            const sum = this.logs_by_hour[service_name][level].reduce(
              (accumulator, currentValue) => accumulator + Number(currentValue),
              initialValue
            );

            if (levels[level]) {
              levels[level] += sum;
            } else {
              levels[level] = sum;
            }
          }

          this.render_log_graph({
            hours: this.hours,
            id: `#${chart_name}`,
            series
          });

          const detail_name = `logs_detail_${i}`;
          this.render_log_detail({
            hours: this.hours,
            id: `#${detail_name}`,
            levels
          });
        }
      }
    },

    render_trace_graph() {
      const services = {};
      const times = [];

      for (const key of Object.keys(this.sorted_traces).sort()) {
        const data = this.sorted_traces[key];

        for (const service_name of this.traces_service_names) {
          if (!services[service_name]) {
            services[service_name] = [data[service_name]];
          } else {
            services[service_name].push(data[service_name]);
          }
        }

        times.push(new Date(Date.parse(key)).toLocaleTimeString());
      }

      const series = [];
      for (const service_name of this.traces_service_names) {
        const data = { name: service_name, data: services[service_name] };
        series.push(data);
      }

      const options = {
        series,
        chart: {
          type: 'bar',
          height: 350
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: times
        },
        yaxis: {
          title: {
            text: 'Traces'
          }
        },
        fill: {
          opacity: 1
        }
      };

      const chart = new ApexCharts(
        document.querySelector('#traces-chart'),
        options
      );
      chart.render();
    }
  },

  async mounted() {
    await this.retrieve_data();
    const { counts, logs, hours } = logs_as_series(this.logs);

    const { traces } = traces_by_times({
      times: hours,
      traces: this.traces,
      service_names: this.traces_service_names
    });

    this.sorted_traces = traces;

    this.logs_by_hour = logs;
    this.logs_counts = counts;
    this.hours = hours;

    this.render_logs();
    this.render_trace_graph();
  }
});

const vm = app.mount('#app');
