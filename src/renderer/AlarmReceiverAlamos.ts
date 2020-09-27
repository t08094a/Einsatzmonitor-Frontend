import EinsatzMonitorModel from "./EinsatzMonitor";
import {info} from "electron-log";
import settings from "electron-settings";
import {replaceAll, sha256} from "../common/common";

const aesEcb = require('aes-ecb');
const net = require('net');
const alarmReceiver = net.createServer();

class AlarmReceiverAlamos {
    einsatzMonitorModel: EinsatzMonitorModel;

    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        this.einsatzMonitorModel = einsatzMonitorModel;

        alarmReceiver.listen(10000, '0.0.0.0', () => {
            info('AlarmReceiver TCP Server is running on port 10000.');
        });

        alarmReceiver.on('connection', (sock: any) => {
            sock.setEncoding('utf8')
            sock.on('data', (data: any) => {
                sha256(settings.get("alamos.alarmInput.password")).then((passwordHash) => {
                    let encodedPassword = passwordHash.substring(0, 32);
                    let decryptedData = aesEcb.decrypt(encodedPassword, data.toString());

                    let finalData = replaceAll(decodeURIComponent(decodeURI(decryptedData.toString())), "+", " ");
                    let alarmJson = JSON.parse(finalData.substring(0, finalData.lastIndexOf("}") + 1));

                    let einsatz = {
                        'id': 0,
                        'stichwort': alarmJson['keyword'],
                        'description': alarmJson['keyword_description'],
                        'adresse': alarmJson['location_dest'],
                        'alarmzeit_seconds': alarmJson['timestamp'] / 1000,
                        'einheiten': [],
                        'zusatzinfos': [],
                    }

                    this.einsatzMonitorModel.add_einsatz(einsatz);
                });
            });
        });
    }
}

export default AlarmReceiverAlamos;
