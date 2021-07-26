const settings = require('electron-settings');
const {contextBridge, remote} = require('electron');
const log = require("electron-log");

const win = remote.getCurrentWindow();
const appVersion = remote.app.getVersion();
const isDev = process.env?.NODE_ENV?.trim() === 'dev';

contextBridge.exposeInMainWorld('myAPI', {
    settings: () => settings,
    log: () => log,

    win: win,
    appVersion: appVersion,
    isDev: isDev,
})