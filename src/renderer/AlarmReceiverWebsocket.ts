import ReconnectingWebSocket from "reconnectingwebsocket";
import toastr from "toastr";
import EinsatzMonitorModel from "./EinsatzMonitor";
import {logger, store} from "../common/common";

class AlarmReceiverWebsocket {
    einsatzMonitorModel: EinsatzMonitorModel;

    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        this.einsatzMonitorModel = einsatzMonitorModel;

        setTimeout(() => {
            let einsatzWebsocket = new ReconnectingWebSocket(((store.get("einsatz.url") as string)?.toString() as string)?.replace("{activeMinutes}", ((store.get("einsatz.einsatzDisplayTime") as number) - 2).toString()));
            einsatzWebsocket.reconnectDecay = 1.0;

            einsatzWebsocket.onmessage = (e: any) => {
                let data = JSON.parse(e.data);
                logger.info(`Type from WebSocket: ${data.type}`);

                if (data.type === "new_einsatz") {
                    logger.info(`Einsatz from WebSocket: ${data.einsatz}`);

                    var einsatz = JSON.parse(data.einsatz);
                    this.einsatzMonitorModel.addOperationJson(einsatz);
                }

                if (data.type === "command") {
                    logger.info(`Command from WebSocket: ${data.command}`);

                    if (data.command === "clear") {
                        logger.info(`Clearing display now...`);
                        this.einsatzMonitorModel.operations.removeAll();
                    }
                }

                if (data.type === "new_feedbackId") {
                    logger.info(`FE2 Feedback ID from WebSocket: ${data.feedbackId.id}`);

                    let id = data.feedbackId.id;

                    if (this.einsatzMonitorModel.hasActiveOperation()) {
                        this.einsatzMonitorModel.getLatestOperation().feedbackFe2Id(id);
                    }
                }
            };

            einsatzWebsocket.onclose = () => {
                logger.error(`Websocket closed unexpectedly.`);
                toastr.error("Einsätze können nicht empfangen werden.", "Verbindung zum Server verloren");
            };

            einsatzWebsocket.onerror = () => {
                logger.error(`Websocket errored unexpectedly.`);
                toastr.error("Einsätze können nicht empfangen werden.", "Verbindung zum Server verloren");
            };
        }, 5000); // Wait 5 seconds for google maps api to load
    }
}

export default AlarmReceiverWebsocket;
