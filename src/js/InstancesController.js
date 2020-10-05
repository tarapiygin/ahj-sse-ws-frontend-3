import API from './API';

const domen = 'ahj-sse-ws-backend-3.herokuapp.com';

export default class InstancesController {
  constructor() {
    this.api = new API(`https://${domen}/instances`);
    this.url = `wss://${domen}/ws`;
  }

  init() {
    this.ws = new WebSocket(this.url);
    this.instancesList = document.querySelector('.instances_list');
    this.workLog = document.querySelector('.worklog_list');

    this.ws.addEventListener('message', (event) => {
      this.drawLog(event);
    });

    this.clearInstanceList();
    this.createNewInstance();

    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('create_link')) {
        event.preventDefault();
        this.api.add();
        while (this.instancesList.firstChild) {
          this.instancesList.removeChild(this.instancesList.firstChild);
        }
        this.clearInstanceList();
        this.createNewInstance();
      }

      if (event.target.classList.contains('actions_btn')) {
        const elementId = event.target.closest('.instance').dataset.id;
        if (event.target.classList.contains('delete')) {
          this.api.delete(elementId);
        } else {
          this.api.patch(elementId);
        }
      }
    });
  }

  clearInstanceList() {
    while (this.instancesList.firstChild) {
      this.instancesList.removeChild(this.instancesList.firstChild);
    }
  }

  async createNewInstance() {
    const serverResponse = await this.api.load();
    const instancesList = await serverResponse.json();
    for (const item of instancesList) {
      let statusText = null;
      let actionBtn = null;
      if (item.state === 'stopped') {
        statusText = 'Stopped';
        actionBtn = 'start';
      } else {
        statusText = 'Running';
        actionBtn = 'pause';
      }
      const instance = document.createElement('div');
      instance.classList.add('instance');
      instance.dataset.id = item.id;
      instance.innerHTML = `
      <span class="id">${item.id}</span>
      <div class="status_wrapper">
        <span class="instance_header">Status:</span> 
        <span class="status_indicator ${item.state}"></span>
        <span class="status">${statusText}</span>
      </div>
      <div class="actions">
        <span class="instance_header">Actions:</span> 
        <span class="actions_btn ${actionBtn}"></span>
        <span class="actions_btn delete"></span>
      </div>
      `;
      this.instancesList.appendChild(instance);
      this.instancesList.scrollTo(0, instance.offsetTop);
    }
  }

  drawLog(data) {
    const { type } = JSON.parse(data.data);

    if (type === 'server log') {
      const {
        id,
        msg,
        date,
      } = JSON.parse(data.data);

      const newMessage = document.createElement('div');
      newMessage.classList.add('log_item');
      const dateLog = new Date(date);
      const day = dateLog.getDate();
      const month = dateLog.getMonth() + 1;
      const year = dateLog.getFullYear();
      const hour = dateLog.getHours();
      const minute = dateLog.getMinutes();
      const second = dateLog.getSeconds();
      newMessage.innerHTML = `
        <span class="log_data">${hour}:${minute}:${second} ${day}.${month}.${year}</span>
        <span class="log_data">Server: ${id}</span>
        <span class="log_data">INFO: ${msg}</span>
      `;

      if (msg === 'Created') {
        this.clearInstanceList();
        this.createNewInstance();
      }

      if (msg === 'Deleted') {
        this.clearInstanceList();
        this.createNewInstance();
      }

      if (msg === 'started' || msg === 'stopped') {
        this.clearInstanceList();
        this.createNewInstance();
      }

      this.workLog.appendChild(newMessage);
      this.workLog.scrollTo(0, newMessage.offsetTop);
    }
  }
}
