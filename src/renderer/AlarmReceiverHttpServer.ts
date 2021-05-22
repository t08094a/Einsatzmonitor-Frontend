import EinsatzMonitorModel from "./EinsatzMonitor";
import {logger} from "../common/common";

const express = __non_webpack_require__('express');
const app = express();

app.use((req: any, res: any, next: any) => {
    delete req.headers['content-encoding'];
    req.headers['content-type'] = "application/json; charset=utf-8";
    next();
});

app.use(express.json())

class AlarmReceiverHttpServer {
    einsatzMonitorModel: EinsatzMonitorModel;

    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        this.einsatzMonitorModel = einsatzMonitorModel;

        app.get('/', (req: any, res: any) => {
            res.send(`EinsatzMonitor V${process.env.npm_package_version}`);
        });

        app.post('/alarm/new', (req: any, res: any) => {
            logger.debug("AlarmReceiverHttpServer | Received alarmJson:")
            logger.debug(req.body)

            switch (req.body['alarmType']) {
                case "ALARM": {
                    logger.info("AlarmReceiverHttpServer | Received ALARM")

                    let einsatz = {
                        'id': 0,
                        'stichwort': req.body['keyword'],
                        'description': req.body['keyword_description'],
                        'adresse': req.body['location_dest'],
                        'alarmzeit_seconds': req.body['timestamp'] / 1000,
                        'einheiten': [],
                        'zusatzinfos': [],
                    }

                    this.einsatzMonitorModel.addOperation(einsatz);
                    break;
                }

                case "STATUS": {
                    logger.info("AlarmReceiverHttpServer | Received STATUS");
                    this.einsatzMonitorModel.vehicleModel.updateStatusForVehicle(req.body['address'], req.body['status']);
                    break;
                }

                default: {
                    logger.info(`AlarmReceiverHttpServer | Received unknown alarmType (${req.body['alarmType']})`)
                    break;
                }
            }
            res.status(200).json({'status': 'OK'});
        });

        app.listen(3000, () => {
            logger.info('AlarmReceiverHttpServer | AlarmReceiver HTTP Server is running on port 3000.');
        });
    }
}

export default AlarmReceiverHttpServer;