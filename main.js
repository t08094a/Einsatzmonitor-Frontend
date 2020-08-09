const {app, BrowserWindow, Menu} = require('electron');
const AutoLaunch = require('auto-launch');
const config = require('./config.js');
const settings = require('electron-settings');
const {autoUpdater} = require("electron-updater");
const log = require('electron-log');

if (config.sentry.enabled)
    require('./sentry');

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
            nodeIntegration: true
        },
        fullscreen: !settings.get("debug"),
        autoHideMenuBar: !settings.get("debug")
    });

    if (settings.get("debug"))
        win.webContents.openDevTools();

    // and load the index.html of the app.
    //win.loadFile('src/einsatzmonitor.html');
    win.loadURL(`file://${__dirname}/src/einsatzmonitor.html`)

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

    setDefaultConfigValue("info.news.show", true);
    setDefaultConfigValue("info.news.url", "http://127.0.0.1:8000/api/info/news/?auth_token={api_key}&limit=2");

    setDefaultConfigValue("info.einsaetze.show", true);
    setDefaultConfigValue("info.einsaetze.url", "http://127.0.0.1:8000/api/info/einsaetze/?auth_token={api_key}&limit=9");

    setDefaultConfigValue("info.dienste.show", true);
    setDefaultConfigValue("info.dienste.url", "http://127.0.0.1:8000/api/info/dienste/?auth_token={api_key}&limit=10");


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
}

function setDefaultConfigValue(key, value) {
    if (settings.has(key))
        return;

    settings.set(key, value);
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
    log.info('Update downloaded');
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    app.quit();
});