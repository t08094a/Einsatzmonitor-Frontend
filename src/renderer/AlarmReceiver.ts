import EinsatzMonitorModel from "./EinsatzMonitor";
import {logger} from "../common/common";

abstract class AlarmReceiver {
    private einsatzMonitorModel: EinsatzMonitorModel;

    protected constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        this.einsatzMonitorModel = einsatzMonitorModel;
    }

    protected handleAlarmData(data: any) {
        switch (data['alarmType']) {
            case "ALARM": {
                logger.info("AlarmReceiver | Received ALARM")

                let einsatz = {
                    'id': 0,
                    'stichwort': data['keyword'],
                    'description': data['keyword_description'],
                    'adresse': data['location_dest'],
                    'alarmzeit_seconds': data['timestamp'] / 1000,
                    'einheiten': [],
                    'zusatzinfos': [],
                }

                this.einsatzMonitorModel.addOperation(einsatz);
                break;
            }

            case "STATUS": {
                logger.info("AlarmReceiver | Received STATUS");
                this.einsatzMonitorModel.vehicleModel.updateStatusForVehicle(data['address'], data['status']);
                break;
            }

            default: {
                logger.info(`AlarmReceiver | Received unknown alarmType (${data['alarmType']})`)
                break;
            }
        }
    }
}

export default AlarmReceiver;