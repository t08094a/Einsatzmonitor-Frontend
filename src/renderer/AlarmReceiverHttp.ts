import EinsatzMonitorModel from "./EinsatzMonitor";
import axios from "axios";
import toastr from "toastr";
import {axiosConfigParams, logger, store} from "../common/common";

class AlarmReceiverHttp {
    einsatzMonitorModel: EinsatzMonitorModel;

    check_einsatz(axiosConfig: any) {
        axios.get((store.get("einsatz.url") as string)?.toString()?.replace("{activeMinutes}", ((store.get("einsatz.einsatzDisplayTime") as number) - 2).toString()) as string, axiosConfig)
            .then((response) => {
                response.data.forEach((einsatz: any) => {
                    this.einsatzMonitorModel.addOperationJson(einsatz);
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
        }, 1000 * (store.get("einsatz.httpFetchInterval") as number));
    }
}

export default AlarmReceiverHttp;
