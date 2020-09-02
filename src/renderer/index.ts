import EinsatzMonitorController from "./EinsatzMonitorController";

export function loadWidgetsHtml() {
    let output = document.querySelector(".template-output");
    let templates = require.context('./widget_templates', true, /.html$/);

    templates.keys().forEach((key: string) => {
        if (output)
            output.innerHTML += templates(key);
    })
}

$(document).ready(() => {
    loadWidgetsHtml();

    let einsatzMonitorController = new EinsatzMonitorController();
});
