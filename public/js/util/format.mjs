'use strict';

const render = (key, value, options, indent = 0) => {
  let text = '';

  if (Array.isArray(value)) {
    for (let i = 0; i < indent; i++) {
      text += options.indent;
    }

    if (key !== null) {
      text += '"' + key + '": ';
    }

    text += '[\n';

    for (let i = 0; i < value.length; i++) {
      text += render(null, value[i], options, indent + 1);
      if (i < value.length - 1) {
        text += ',';
      }
      text += '\n';
    }

    for (let i = 0; i < indent; i++) {
      text += options.indent;
    }
    text += ']';
  } else if (
    value !== null &&
    typeof value === 'object' &&
    value.toString() === '[object Object]'
  ) {
    for (let i = 0; i < indent; i++) {
      text += options.indent;
    }

    if (key !== null) {
      text += '"' + key + '": ';
    }

    text += '{\n';

    var keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      text += render(keys[i], value[keys[i]], options, indent + 1);
      if (i < keys.length - 1) {
        text += ',';
      }
      text += '\n';
    }

    for (let i = 0; i < indent; i++) {
      text += options.indent;
    }
    text += '}';
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    for (let i = 0; i < indent; i++) {
      text += options.indent;
    }
    if (key !== null) {
      text += '"' + key + '": ';
    }

    if (typeof value === 'number') {
      text += Number(value);
    } else {
      text += value ? 'true' : 'false';
    }

    text += '';
  } else {
    for (let i = 0; i < indent; i++) {
      text += options.indent;
    }
    if (key !== null) {
      key = key.replace(/\"/g, '\\"');
      text += '"' + key + '": ';
    }

    if (value === null) {
      text += 'null';
    } else if (value === undefined) {
      text += 'undefined';
    } else {
      value = value.replace(/\"/g, '\\"');
      text += '"' + value + '"';
    }

    text += '';
  }

  return text;
};

const format = (obj, opt = {}) => {
  let options = { indent: '  ', ...opt };
  return render(null, obj, options);
};

export { format };
