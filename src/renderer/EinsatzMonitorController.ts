import EinsatzMonitorModel from "./EinsatzMonitor";
import DisplayManager from "./DisplayManager";
import AlarmReceiverWebsocket from "./AlarmReceiverWebsocket";
import AlarmReceiverHttp from "./AlarmReceiverHttp";
import AlarmReceiverAlamos from "./AlarmReceiverAlamos";
import mapBindingHandler from "../knockoutBindingHandlers/mapBindingHandler";
import * as ko from 'knockout';
import AlarmReceiverHttpServer from "./AlarmReceiverHttpServer";
import AlarmReceiverMqtt from "./AlarmReceiverMqtt";
import {store} from "../common/common";

class EinsatzMonitorController {
    einsatzMonitorModel: EinsatzMonitorModel;
    displayManager: DisplayManager;

    constructor() {
        this.einsatzMonitorModel = new EinsatzMonitorModel();
        this.displayManager = new DisplayManager(this.einsatzMonitorModel);

        if (store.get("einsatz.fetch") === "websocket") {
            new AlarmReceiverWebsocket(this.einsatzMonitorModel);
        }

        if (store.get("einsatz.fetch") === "http") {
            new AlarmReceiverHttp(this.einsatzMonitorModel);
        }

        if (store.get("alamos.alarmInput.enabled")) {
            new AlarmReceiverAlamos(this.einsatzMonitorModel);
        }

        if (store.get("webserver.alarmInput.enabled")) {
            new AlarmReceiverHttpServer(this.einsatzMonitorModel);
        }

        if (store.get("mqtt.alarmInput.enabled")) {
            new AlarmReceiverMqtt(this.einsatzMonitorModel);
        }

        let resizeTimer: NodeJS.Timeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Recalculate grister if window size changed
                this.einsatzMonitorModel.board().gridsterInfo.recalculate_faux_grid();
            }, 250);
        });

        (<any>ko.bindingHandlers).map = mapBindingHandler;
        ko.applyBindings(this.einsatzMonitorModel);

        this.einsatzMonitorModel.loaded();
    }
}

interface KnockoutBindingHandlers {
    map: KnockoutBindingHandler;
}

export default EinsatzMonitorController
