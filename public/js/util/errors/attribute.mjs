'use strict';

const attribute_error = (messages) => {
  console.log(messages);

  let message = `
    <div class="datagrid-item">
      <div class="datagrid-title">Attributes</div>
      <div class="datagrid-content">
        ${messages.join('<br>')}
        <br>For attribute query help, see <a target="_blank" href="/help.html">here</a>.
      </div>
    </div>
  `;

  return message;
};

export { attribute_error };
