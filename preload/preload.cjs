const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('smtpApi', {
  list: () => ipcRenderer.invoke('smtp:list'),
  getDefault: () => ipcRenderer.invoke('smtp:default'),
  save: (list, defId) => ipcRenderer.invoke('smtp:save', list, defId),
  test: (account) => ipcRenderer.invoke('smtp:test', account),
  send: (payload) => ipcRenderer.invoke('smtp:send', payload),
});

contextBridge.exposeInMainWorld('fileApi', {
  pick: (options) => ipcRenderer.invoke('file:pick', options),
});

for (const name of ['drafts', 'templates', 'sent']) {
  const bridgeName = `${name}Api`;
  contextBridge.exposeInMainWorld(bridgeName, {
    list: () => ipcRenderer.invoke(`${name}:list`),
    save: (list) => ipcRenderer.invoke(`${name}:save`, list),
  });
}

contextBridge.exposeInMainWorld('storeEvents', {
  onUpdate: (cb) => ipcRenderer.on('store:updated', (event, name) => cb(name)),
});
