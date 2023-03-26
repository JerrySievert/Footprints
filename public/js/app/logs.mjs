'use strict';

import { attribute_error } from '../util/errors/attribute.mjs';
import { createApp, nextTick } from '/vendor/vuejs/vue.esm-browser.prod.js';
import { colors, level_colors } from '../constants/colors.mjs';
import { created_at_filter, level_filter } from '../util/filters/index.mjs';
import { date_ranges } from '../constants/datetime.mjs';
import { format } from '../util/format.mjs';
import { levels } from '../constants/levels.mjs';
import { minutes_for_range, times_for_params } from '../util/time.mjs';
import { params } from '../util/params.mjs';
import { parse } from '/vendor/celcius-labs/js/parser.mjs';
import { process_errors } from '../util/errors/index.mjs';
import { FilteredDataset } from '../util/filter.mjs';

const app = createApp({
  data() {
    return {
      model_attribute_query: '',
      model_service_name: 'Any',
      model_level: 'Any',
      model_attribute_query: '',
      query_error: false,
      by_id: {},
      colors,
      entry: {},
      logs: [],
      minutes: [],
      params,
      service_names: [
        {
          text: 'Any',
          value: '',
          selected: params['service_name'] ? false : true
        }
      ],
      levels: [
        {
          text: 'Any',
          value: '',
          selected: params['level'] ? false : true
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

      if (this.model_level !== 'Any') {
        params['level'] = this.model_level;
        query_params.push(`level=${params['level']}`);
      } else {
        delete params['level'];
      }

      params['daterange'] = this.model_daterange;
      query_params.push(`daterange=${params['daterange']}`);

      params['attribute_query'] = this.model_attribute_query
        ? encodeURIComponent(this.model_attribute_query)
        : undefined;

      if (params['attribute_query']) {
        query_params.push(`attribute_query=${params['attribute_query']}`);

        try {
          console.log(decodeURIComponent(params['attribute_query']));
          const tree = parse(decodeURIComponent(params['attribute_query']));
          console.log('tree', tree);
        } catch (err) {
          console.log(err, err.expected);
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

      document.getElementById('logs-by-minute-chart').innerHTML = '';
      document.getElementById('log-data-body').innerHTML = '';

      try {
        await this.retrieve_data();
      } catch (err) {
        console.log(err);
      }
      this.render_logs_graphs();
      this.render_logs_list();
    },

    async retrieve_data() {
      const { start, end } = times_for_params(params);

      this.minutes = minutes_for_range(start, end);

      const query_params = [];
      query_params.push(`start=${start}`);
      query_params.push(`end=${end}`);

      if (params['service_name']) {
        query_params.push(`service_name=${params['service_name']}`);
      }

      if (params['level']) {
        query_params.push(`level=${params['level']}`);
      }

      if (params['attribute_query']) {
        query_params.push(`attribute_query=${params['attribute_query']}`);
      }
      console.log(`v1/logs/search?${query_params.join('&')}`);
      const logs = await fetch(`v1/logs/search?${query_params.join('&')}`, {
        method: 'GET'
      });

      const content = await logs.json();
      console.log('content', content);

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

      content.data.forEach((log) => {
        this.by_id[log.id] = log;

        if (log.service_name == null) {
          log.service_name = '(null)';
        }

        const time = new Date(Date.parse(log.created_at));
        time.setSeconds(0);
        time.setMilliseconds(0);

        if (this.minutes[+time]) {
          if (this.minutes[+time][log.level]) {
            this.minutes[+time][log.level] += 1;
          } else {
            this.minutes[+time][log.level] = 1;
          }
        } else {
          this.minutes[+time] = {};
          this.minutes[+time][log.level] = 1;
        }
      });

      this.logs = new FilteredDataset(content.data, {
        filters: [created_at_filter, level_filter],
        state: {
          'level:INFO': true,
          'level:WARN': true,
          'level:DEBUG': true,
          'level:ERROR': true,
          'level:FATAL': true,
          'level:CRITICAL': true
        }
      });
    },

    render_logs_graphs() {
      const series_data = {
        CRITICAL: [],
        DEBUG: [],
        ERROR: [],
        FATAL: [],
        INFO: [],
        WARN: []
      };
      const minutes = [];

      const seconds = Object.keys(this.minutes).sort((a, b) => a - b);

      for (const minute of seconds) {
        minutes.push(new Date(Number(minute)).toISOString());
        for (const level of this.levels) {
          series_data[level.value].push(
            this.minutes[minute][level.value]
              ? this.minutes[minute][level.value]
              : 0
          );
        }
      }

      const data = [];
      for (const level of this.levels) {
        data.push({ name: level.value, data: series_data[level.value] });
      }

      const chart = new ApexCharts(
        document.getElementById('logs-by-minute-chart'),
        {
          chart: {
            type: 'line',
            fontFamily: 'inherit',
            height: 388,
            parentHeightOffset: 0,
            toolbar: {
              show: true
            },
            animations: {
              enabled: false
            },
            events: {
              legendClick: (chartContext, seriesIndex, config) => {
                const keys = Object.keys(levels);
                const current = this.logs.get(`level:${keys[seriesIndex]}`);
                this.logs.set(`level:${keys[seriesIndex]}`, !current);

                this.render_logs_list();
              },
              zoomed: (chartContext, { xaxis, yaxis }) => {
                if (xaxis) {
                  this.logs.set('created_at:min', xaxis?.min);
                  this.logs.set('created_at:max', xaxis?.max);

                  this.render_logs_list();
                }
              }
            }
          },
          fill: {
            opacity: 1
          },
          stroke: {
            width: 2,
            lineCap: 'round',
            curve: 'smooth'
          },
          dataLabels: {
            enabled: false
          },
          fill: {
            opacity: 1
          },
          series: data,
          tooltip: {
            theme: 'dark'
          },
          grid: {
            padding: {
              top: -20,
              right: 0,
              left: -4,
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
            tooltip: {
              enabled: false
            },
            axisBorder: {
              show: false
            },
            type: 'datetime'
          },
          yaxis: {
            labels: {
              formatter: function (value) {
                return Number(value).toLocaleString(1);
              },
              padding: 4
            }
          },
          labels: minutes,
          colors: Object.values(level_colors),
          legend: {
            show: true
          }
        }
      ).render();
    },

    log_facts(log) {
      const facts = {};
      facts.log_id = log.id;
      facts.level = `<span class="badge" style="margin-left: 0.4em; background-color: ${
        level_colors[log.level]
      }">${log.level}</span>`;
      facts.service_name = log.service_name;
      facts.created_at = new Date(Date.parse(log.created_at)).toLocaleString();
      facts.id_link = `/logs.html?id=${log.id}`;
      facts.id_click = `update_modal('${log.id}')`;

      return facts;
    },

    render_logs_list() {
      const options = {
        valueNames: [
          'log_id',
          'level',
          'service_name',
          'created_at',
          { attr: 'onclick', name: 'id_click' }
        ],
        item: `<tr>
        <td class="string"><a class="id_click" data-bs-toggle="modal" data-bs-target="#modal-full-width"><span class="log_id"></span></a></td>
        <td class="string"><span class="level"></span></td>
        <td class="string"><span class="service_name"></span></td>
        <td class="date"><span class="created_at"></span></td>
        </tr>`,
        sortClass: 'table-sort',
        listClass: 'table-tbody'
      };

      const logs = [];

      if (this.logs && this.logs.filter) {
        const data = this.logs.filter();
        for (const log of data) {
          logs.push(this.log_facts(log));
        }

        const element = document.getElementById('log-data-body');
        element.innerHTML = '';

        const displayList = new List('log-data', options, logs);
      }
    },

    update_modal(id) {
      const entry = this.by_id[id];

      entry.date = new Date(Date.parse(entry.created_at)).toLocaleString();
      entry.formatted = format(entry.data);

      this.entry = entry;
    }
  },

  async mounted() {
    const log_levels = Object.keys(levels).map((l) => {
      if (params['level'] === l) {
        this.model_level = l;
      }

      return { text: l, value: l, selected: params['level'] === l };
    });

    this.levels = log_levels;

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

    const services = await fetch(`/v1/logs/service_names`, {
      method: 'GET'
    });

    const service_names = await services.json();

    this.service_names = service_names.data.map((s) => {
      if (params['service_name'] == s) {
        this.model_service_name = s;
      }

      return {
        text: s,
        value: s,
        selected: params['service_name'] === s
      };
    });

    await nextTick();

    await this.retrieve_data();
    this.render_logs_graphs();
    this.render_logs_list();
  }
});

const vm = app.mount('#app');

window.update_modal = (id) => {
  console.log(app);
  try {
    vm.update_modal(id);
  } catch (err) {
    console.log('error', err);
  }
};

window.find_logs = () => {
  vm.query();
};
