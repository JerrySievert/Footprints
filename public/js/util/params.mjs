'use strict';

const params = {};

location.search
  .substring(1)
  .split('&')
  .forEach((pair) => {
    if (pair === '') {
      return;
    }

    const parts = pair.split('=');

    if (params[parts[0]]) {
      if (!Array.isArray(params[parts[0]])) {
        params[parts[0]] = [params[parts[0]]];
      }

      params[parts[0]].push(
        parts[1] && decodeURIComponent(parts[1].replace(/\+/g, ' '))
      );
    } else {
      params[parts[0]] =
        parts[1] && decodeURIComponent(parts[1].replace(/\+/g, ' '));
    }
  });

// Defaults.
if (!params['daterange']) {
  params['daterange'] = '1-hour';
}

export { params };
