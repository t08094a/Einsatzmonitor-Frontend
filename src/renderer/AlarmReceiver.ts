import EinsatzMonitorModel from "./EinsatzMonitor";
import {logger} from "../common/common";
import Operation from "../common/models/Operation";

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
            case "MANUAL":
            case "ALARM": {
                logger.info("AlarmReceiver | Received ALARM")

                let operation = new Operation(alarmId, alarmData['keyword'], "danger", alarmData['keyword_description'], (alarmData['timestamp'] / 1000).toString(), alarmData['location_dest'], alarmData['object']);
                operation.feedbackFe2Id(alarmData['dbId']);

                this.einsatzMonitorModel.addOperation(operation);
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