import settings from "electron-settings";
import EinsatzMonitorModel from "./EinsatzMonitor";
import DisplayManager from "./DisplayManager";
import AlarmReceiverWebsocket from "./AlarmReceiverWebsocket";
import AlarmReceiverHttp from "./AlarmReceiverHttp";
import AlarmReceiverAlamos from "./AlarmReceiverAlamos";

const ko = require('knockout');

class EinsatzMonitorController {
    einsatzMonitorModel: EinsatzMonitorModel;
    displayManager: DisplayManager;

    constructor() {
        this.einsatzMonitorModel = new EinsatzMonitorModel();
        this.displayManager = new DisplayManager(this.einsatzMonitorModel);

        if (settings.get("einsatz.fetch") === "websocket") {
            new AlarmReceiverWebsocket(this.einsatzMonitorModel);
        }

        if (settings.get("einsatz.fetch") === "http") {
            new AlarmReceiverHttp(this.einsatzMonitorModel);
        }

        if (settings.get("alamos.alarmInput.enabled")) {
            new AlarmReceiverAlamos(this.einsatzMonitorModel);
        }

        let resizeTimer: NodeJS.Timeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Recalculate grister if window size changed
                this.einsatzMonitorModel.board().gridsterInfo.recalculate_faux_grid();
            }, 250);
        });

        ko.applyBindings(this.einsatzMonitorModel);

        this.einsatzMonitorModel.loaded();
    }
}

export default EinsatzMonitorController