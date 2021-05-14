import EinsatzMonitorModel from "./EinsatzMonitor";
import axios from "axios";
import settings from "electron-settings";
import toastr from "toastr";
import {axiosConfigParams, logger} from "../common/common";

class AlarmReceiverHttp {
    einsatzMonitorModel: EinsatzMonitorModel;

    check_einsatz(axiosConfig: any) {
        axios.get(settings.getSync("einsatz.url")?.toString()?.replace("{activeMinutes}", ((settings.getSync("einsatz.einsatzDisplayTime") as number) - 2).toString()) as string, axiosConfig)
            .then((response) => {
                response.data.forEach((einsatz: any) => {
                    this.einsatzMonitorModel.addOperation(einsatz);
                })
            })
            .catch((error) => {
                logger.error(`Error while requesting Einsatz from API: ${error.toString()}`);
                toastr.error("Einsätze konnten nicht abgerufen werden.", "Keine Verbindung zum Server");
            })
    }

    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        this.einsatzMonitorModel = einsatzMonitorModel;

        // create task to poll einsatz from http api
        window.setInterval(() => {
            this.check_einsatz(axiosConfigParams);
        }, 1000 * (settings.getSync("einsatz.httpFetchInterval") as number));
    }
}

export default AlarmReceiverHttp;