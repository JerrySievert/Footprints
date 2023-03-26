'use strict';

class FilteredDataset {
  constructor(data, options = {}) {
    const default_options = { filters: [], state: {} };
    const { filters, state } = { ...default_options, ...options };
    this.data = data;
    this.filters = filters;
    this.state = state;
  }

  filter() {
    if (this.filters.length) {
      const filtered = [];

      for (const row of this.data) {
        let current_row;
        for (const filter of this.filters) {
          current_row = filter(row, this.state);

          if (!current_row) {
            break;
          }
        }

        if (current_row) {
          filtered.push(current_row);
        }
      }

      return filtered;
    } else {
      return this.data;
    }
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
  }
}

export { FilteredDataset };
