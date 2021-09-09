import EinsatzMonitorController from "./EinsatzMonitorController";
import settings from "electron-settings";
import * as Sentry from "@sentry/electron";

// custom knockout-sortable
require('/src/renderer/static/js/knockout-sortable.js');

if (settings.getSync("sentry.enabled"))
    Sentry.init({dsn: settings.getSync("sentry.dsn") as string});

export function loadWidgetsHtml() {
    let output = document.querySelector(".template-output");
    let templates = require.context('./widget_templates', true, /.html$/);

    templates.keys().forEach((key: string) => {
        if (output)
            output.innerHTML += templates(key).default;
    })
}

$(document).ready(() => {
    settings.configure({
        prettify: true
    })

    loadWidgetsHtml();

    let einsatzMonitorController = new EinsatzMonitorController();
});
