'use strict';

const daterange_error = (start_messages, end_messages) => {
  let message = `
    <div class="datagrid-item">
      <div class="datagrid-title">Daterange</div>
      <div class="datagrid-content">
        ${start_messages ? start_messages.join('<br>') : ''}
        ${end_messages ? end_messages.join('<br>') : ''}
      </div>
    </div>
  `;

  return message;
};

export { daterange_error };
