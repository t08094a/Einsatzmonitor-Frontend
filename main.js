const {app, BrowserWindow} = require('electron');
const AutoLaunch = require('auto-launch');
const config = require('./config.js');

const ElectronSampleAppLauncher = new AutoLaunch({
    name: 'Electron-sample-app',
    path: '/opt/einsatzmonitor/node_modules/electron/dist/electron /opt/einsatzmonitor'
});

ElectronSampleAppLauncher.enable();

ElectronSampleAppLauncher.isEnabled()
    .then(function (isEnabled) {
        if (isEnabled) {
            return;
        }
        ElectronSampleAppLauncher.enable();
    })
    .catch(function (err) {
        // handle error
    });

function createWindow() {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true
        },
        fullscreen: !config.debug,
        autoHideMenuBar: !config.debug
    });

    // and load the index.html of the app.
    win.loadFile('src/einsatzmonitor.html')
}

app.on('ready', createWindow);