import EinsatzMonitorController from "./EinsatzMonitorController";
import * as Sentry from "@sentry/electron";
import {store} from "../common/common";

// custom knockout-sortable
require('/src/renderer/static/js/knockout-sortable.js');

if (store.get("sentry.enabled"))
    Sentry.init({dsn: store.get("sentry.dsn") as string});

export function loadWidgetsHtml() {
    let output = document.querySelector(".template-output");
    let templates = require.context('./widget_templates', true, /.html$/);

    templates.keys().forEach((key: string) => {
        if (output)
            output.innerHTML += templates(key).default;
    })
}

$(document).ready(() => {
    loadWidgetsHtml();

    let einsatzMonitorController = new EinsatzMonitorController();
});
