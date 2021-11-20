import {app, BrowserWindow} from 'electron';
import log from 'electron-log';
import AutoLaunch from 'auto-launch';
import {autoUpdater} from 'electron-updater';
import * as path from "path";
import * as Sentry from "@sentry/electron";
import Store from 'electron-store';
import * as electron from "electron";

const remoteMain = require("@electron/remote/main");
const realFs = require('fs');
const gracefulFs = require('graceful-fs');
const store = new Store({name: 'settings'});
const ipc = electron.ipcMain;

gracefulFs.gracefulify(realFs);

remoteMain.initialize();

ipc.on('isSentryEnabled', (event, args) => {
    event.returnValue = store.get("sentry.enabled", false);
});

ipc.on('getSentryDsn', (event, args) => {
    event.returnValue = store.get("sentry.dsn");
});

ipc.on('getSentryRelease', (event, args) => {
    event.returnValue = process.env.npm_package_version?.replace("einsatzmonitor@", "")
});

if (store.get("sentry.enabled"))
    Sentry.init({
        dsn: store.get("sentry.dsn") as string,
        release: process.env.npm_package_version?.replace("einsatzmonitor@", "")
    });

const ElectronSampleAppLauncher = new AutoLaunch({
    name: 'Electron-sample-app',
    path: '/opt/einsatzmonitor/node_modules/electron/dist/electron /opt/einsatzmonitor'
    // path: app.getPath('exe'),
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
    // @ts-ignore
    let splash = new BrowserWindow({webPreferences: {nodeIntegration: true, contextIsolation: false, enableRemoteModule: true}, width: 500, height: 500, transparent: true, frame: false, alwaysOnTop: true});
    splash.loadURL(`file://${path.join(__dirname, "../../renderer/splash.html")}`);

    remoteMain.enable(splash.webContents);

    // Create default config
    createDefaultConfig();

    // Create the browser window.
    let win = new BrowserWindow({
        width: 1920,
        height: 1080,
        backgroundColor: "#2e2c29",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // preload: path.join(__dirname, "../../renderer/static/js/preload.js")
        },
        fullscreen: !store.get("debug"),
        autoHideMenuBar: !store.get("debug"),
        show: false
    });

    remoteMain.enable(win.webContents);

    if (store.get("debug"))
        win.webContents.openDevTools({mode: 'undocked'});

    win.loadURL(`file://${path.join(__dirname, "../../renderer/index.html")}`)

    win.webContents.once('did-finish-load', () => {
        setTimeout(() => {
            win.show();
            splash.destroy();
        }, 1500)
    });

    // autoUpdater.checkForUpdates();
}

function createDefaultConfig() {
    setDefaultConfigValue("debug", true);

    setDefaultConfigValue("einsatz.fetch", "disabled");
    setDefaultConfigValue("einsatz.url", "ws://127.0.0.1:8000/ws/einsatzmonitor/?token={api_key}&active_minutes={activeMinutes}");
    setDefaultConfigValue("einsatz.httpFetchInterval", 1);
    setDefaultConfigValue("einsatz.displayTime", 30);

    setDefaultConfigValue("einsatz.showEinheitenLimit", 14);
    setDefaultConfigValue("einsatz.einheitenAlwaysTop", "Ashausen, ELW2, ELW 2");


    setDefaultConfigValue("info.httpFetchInterval", 30);


    setDefaultConfigValue("sentry.enabled", true);
    setDefaultConfigValue("sentry.dsn", "https://712bb85f90424f19857458db49a56853@o967810.ingest.sentry.io/5992237");


    setDefaultConfigValue("googleMapsKey", "123456abc");
    setDefaultConfigValue("feuerwehrLat", "53.365934");
    setDefaultConfigValue("feuerwehrLng", "10.137550");


    setDefaultConfigValue("motionDetector.enabled", false);
    setDefaultConfigValue("motionDetector.filePath", "/opt/einsatzmonitor/motion/motion");
    setDefaultConfigValue("motionDetector.displayOnTimeMinutes", 10);


    setDefaultConfigValue("displayAlwaysOn", false);

    setDefaultConfigValue("alamos.alarmInput.enabled", false);
    setDefaultConfigValue("alamos.alarmInput.password", "");

    setDefaultConfigValue("webserver.alarmInput.enabled", false);

    setDefaultConfigValue("mqtt.alarmInput.enabled", false);
    setDefaultConfigValue("mqtt.alarmInput.host", "");
    setDefaultConfigValue("mqtt.alarmInput.user", "");
    setDefaultConfigValue("mqtt.alarmInput.password", "");
    setDefaultConfigValue("mqtt.alarmInput.topics", "");

    setDefaultConfigValue("background.image", "");
    setDefaultConfigValue("background.color", "rgb(15 15 15)");

    setDefaultConfigValue("aao.customParameter", "unit");

    setDefaultConfigValue("printing.enabled", false);
    setDefaultConfigValue("printing.url", "http://127.0.0.1:5000/print/");

    setDefaultConfigValue("geocoding.enabled", false);
    setDefaultConfigValue("geocoding.engine", "Google");

    setDefaultConfigValue("routing.enabled", false);
    setDefaultConfigValue("routing.engine", "GraphHopper");

    setDefaultConfigValue("google.apikey", "123456abc");
    setDefaultConfigValue("graphhopper.apikey", "123456abc");

    setDefaultConfigValue("status.colors.1", "#0099ff");
    setDefaultConfigValue("status.colors.2", "#02a600");
    setDefaultConfigValue("status.colors.3", "#ffb300");
    setDefaultConfigValue("status.colors.4", "#ff5100");
    setDefaultConfigValue("status.colors.5", "#ae00ff");
    setDefaultConfigValue("status.colors.6", "#ff0000");
    setDefaultConfigValue("status.colors.default", "#4b4b4b");

    setDefaultConfigValue("status.reset.enabled", true);
    setDefaultConfigValue("status.reset.code", 5);
    setDefaultConfigValue("status.reset.seconds", 15);

    setDefaultConfigValue("alarmHistory.enabled", true);
    setDefaultConfigValue("alarmHistory.parameters.id", "einsatznummer");
    setDefaultConfigValue("alarmHistory.parameters.title", "subject");
    setDefaultConfigValue("alarmHistory.parameters.timestamp", "timestamp");
    setDefaultConfigValue("alarmHistory.parameters.keyword", "keyword");
    setDefaultConfigValue("alarmHistory.parameters.location", "location_dest");

    setDefaultConfigValue("alarmHistory.ignoreDuplicatedById.enabled", false);
}

function setDefaultConfigValue(key, value) {
    if (store.has(key))
        return;

    store.set(key, value);
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
