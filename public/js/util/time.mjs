'use strict';

const HOUR = 1000 * 60 * 60;

const minutes_for_range = (start_date, end_date) => {
  const minutes = {};

  start_date.setMilliseconds(0);
  start_date.setSeconds(0);

  for (let minute = +start_date; minute < +end_date; minute += 60000) {
    minutes[minute] = {};
  }

  return minutes;
};

const hours_for_range = (start_date, end_date) => {
  const hours = [];

  start_date.setMilliseconds(0);
  start_date.setSeconds(0);
  start_date.setMinutes(0);

  for (let hour = +start_date; hour < +end_date; hour += 3600000) {
    hours.push(hour);
  }

  return hours;
};

const times_for_params = (params) => {
  const { daterange, end_time, start_time } = params;

  let start, end;

  if (daterange) {
    end = new Date();

    switch (daterange) {
      case '1-hour':
        start = new Date(+end - HOUR);
        return { end, start };

      case '2-hour':
        start = new Date(+end - HOUR * 2);
        return { end, start };

      case '4-hour':
        start = new Date(+end - HOUR * 4);
        return { end, start };

      case '6-hour':
        start = new Date(+end - HOUR * 6);
        return { end, start };

      case '12-hour':
        start = new Date(+end - HOUR * 12);
        return { end, start };

      case '24-hour':
        start = new Date(+end - HOUR * 24);
        return { end, start };

      case '48-hour':
        start = new Date(+end - HOUR * 48);
        return { end, start };

      case '7-day':
        start = new Date(+end - HOUR * 24 * 7);
        return { end, start };

      default:
        console.log('unknown daterange', daterange);
    }
  }

  if (start_time) {
    start = new Date(Date.parse(start_time));
  }

  if (end_time) {
    end = new Date(Date.parse(end_time));
  }

  if (!end || Number.isNaN(+end)) {
    end = new Date();
  }

  if (!start || Number.isNaN(+start)) {
    start = new Date(+end - HOUR * 1);
  }

  return { end, start };
};

export { hours_for_range, minutes_for_range, times_for_params };
