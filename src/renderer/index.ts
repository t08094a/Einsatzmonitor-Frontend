import EinsatzMonitorController from "./EinsatzMonitorController";
import settings from "electron-settings";

// custom knockout-sortable
require('/src/renderer/static/js/knockout-sortable.js');

export function loadWidgetsHtml() {
    let output = document.querySelector(".template-output");
    let templates = require.context('./widget_templates', true, /.html$/);

    templates.keys().forEach((key: string) => {
        if (output)
            output.innerHTML += templates(key);
    })
}

$(document).ready(() => {
    settings.configure({
        prettify: true
    })

    loadWidgetsHtml();

    let einsatzMonitorController = new EinsatzMonitorController();
});
