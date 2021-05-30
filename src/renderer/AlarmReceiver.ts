import EinsatzMonitorModel from "./EinsatzMonitor";
import {logger} from "../common/common";

abstract class AlarmReceiver {
    private einsatzMonitorModel: EinsatzMonitorModel;

    protected constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        this.einsatzMonitorModel = einsatzMonitorModel;
    }

    protected handleAlarmData(data: any) {
        let alarmId = data.hasOwnProperty('alarmId') ? data['alarmId'] : Math.random().toString().substr(2, 9);
        let alarmData = data.hasOwnProperty('parameters') ? data['parameters'] : data;

        logger.debug(alarmId);
        logger.debug(alarmData);

        switch (alarmData['alarmType']) {
            case "ALARM": {
                logger.info("AlarmReceiver | Received ALARM")

                let einsatz = {
                    'id': alarmId,
                    'stichwort': alarmData['keyword'],
                    'description': alarmData['keyword_description'],
                    'adresse': alarmData['location_dest'],
                    'alarmzeit_seconds': alarmData['timestamp'] / 1000,
                    'einheiten': [],
                    'zusatzinfos': [],
                }

                this.einsatzMonitorModel.addOperation(einsatz);
                break;
            }

            case "STATUS": {
                logger.info("AlarmReceiver | Received STATUS");
                this.einsatzMonitorModel.vehicleModel.updateStatusForVehicle(alarmData['address'], alarmData['status']);
                break;
            }

            default: {
                logger.info(`AlarmReceiver | Received unknown alarmType (${alarmData['alarmType']})`)
                break;
            }
        }
    }
}

export default AlarmReceiver;