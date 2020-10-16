import {app, BrowserWindow} from 'electron';
import log from 'electron-log';
import AutoLaunch from 'auto-launch';
import settings from 'electron-settings';
import {autoUpdater} from 'electron-updater';
import * as path from "path";


// if (config.sentry.enabled)
//     require('./sentry');

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
    // Create default config
    createDefaultConfig();

    // Create the browser window.
    let win = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        fullscreen: !settings.getSync("debug"),
        autoHideMenuBar: !settings.getSync("debug")
    });

    if (settings.get("debug"))
        win.webContents.openDevTools();

    win.loadURL(`file://${path.join(__dirname, "../../renderer/index.html")}`)

    // autoUpdater.checkForUpdates();
}

function createDefaultConfig() {
    setDefaultConfigValue("debug", true);

    setDefaultConfigValue("einsatz.fetch", "websocket");
    setDefaultConfigValue("einsatz.url", "ws://127.0.0.1:8000/ws/einsatzmonitor/?token={api_key}&active_minutes={activeMinutes}");
    setDefaultConfigValue("einsatz.httpFetchInterval", 1);
    setDefaultConfigValue("einsatz.displayTime", 30);

    setDefaultConfigValue("einsatz.showEinheitenLimit", 14);
    setDefaultConfigValue("einsatz.einheitenAlwaysTop", "Ashausen, ELW2, ELW 2");


    setDefaultConfigValue("info.httpFetchInterval", 30);


    setDefaultConfigValue("sentry.enabled", false);
    setDefaultConfigValue("sentry.dsn", "https://dsn@sentry.io/123456");


    setDefaultConfigValue("googleMapsKey", "123456abc");
    setDefaultConfigValue("feuerwehrLat", "53.365934");
    setDefaultConfigValue("feuerwehrLng", "10.137550");


    setDefaultConfigValue("motionDetector.enabled", false);
    setDefaultConfigValue("motionDetector.filePath", "/opt/einsatzmonitor/motion/motion");


    setDefaultConfigValue("displayAlwaysOn", false);

    setDefaultConfigValue("alamos.alarmInput.enabled", false);
    setDefaultConfigValue("alamos.alarmInput.password", "");

    setDefaultConfigValue("background.image", "");
    setDefaultConfigValue("background.color", "rgb(15 15 15)");
}

function setDefaultConfigValue(key, value) {
    if (settings.hasSync(key))
        return;

    settings.setSync(key, value);
    log.info(`Saved new config value ${key} => ${value}`);
}

autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    log.info('Update available.', info);
});

autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.', info);
});

autoUpdater.on('error', (err) => {
    log.info('Error in auto-updater. ', err);
});

autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`);
});

autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded', info);
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    app.quit();
});