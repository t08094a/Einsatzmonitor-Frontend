import EinsatzMonitorModel from "./EinsatzMonitor";
import settings from "electron-settings";
import {logger, replaceAll, sha256} from "../common/common";

const net = require('net');
const alarmReceiver = net.createServer();
const CryptoJS = require("crypto-js");

class AlarmReceiverAlamos {
    einsatzMonitorModel: EinsatzMonitorModel;

    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        this.einsatzMonitorModel = einsatzMonitorModel;

        alarmReceiver.listen(10000, '0.0.0.0', () => {
            logger.info('AlarmReceiverAlamos | AlarmReceiver TCP Server is running on port 10000.');
        });

        alarmReceiver.on('connection', (sock: any) => {
            sock.setEncoding('utf8')
            sock.on('data', (data: any) => {
                sha256(settings.getSync("alamos.alarmInput.password")).then((passwordHash) => {
                    let encodedPassword = passwordHash.substring(0, 32);

                    let key = CryptoJS.enc.Utf8.parse(encodedPassword)
                    let cipherParams = CryptoJS.lib.CipherParams.create({
                        ciphertext: CryptoJS.enc.Base64.parse(data.toString())
                    });

                    let decrypted = CryptoJS.AES.decrypt(cipherParams, key, {mode: CryptoJS.mode.ECB, keySize: 256});
                    let decryptedString = CryptoJS.enc.Utf8.stringify(decrypted)
                    let encodedPlus = replaceAll(decryptedString, "+", "%20")

                    let urlDecodedData = decodeURIComponent(encodedPlus);
                    let alarmJson = JSON.parse(urlDecodedData);

                    logger.debug("AlarmReceiverAlamos | Received alarmJson:")
                    logger.debug(alarmJson)

                    switch (alarmJson['alarmType']) {
                        case "ALARM": {
                            logger.info("AlarmReceiverAlamos | Received ALARM")

                            let einsatz = {
                                'id': 0,
                                'stichwort': alarmJson['keyword'],
                                'description': alarmJson['keyword_description'],
                                'adresse': alarmJson['location_dest'],
                                'alarmzeit_seconds': alarmJson['timestamp'] / 1000,
                                'einheiten': [],
                                'zusatzinfos': [],
                            }

                            this.einsatzMonitorModel.addOperation(einsatz);
                            break;
                        }

                        case "STATUS": {
                            logger.info("AlarmReceiverAlamos | Received STATUS");
                            this.einsatzMonitorModel.vehicleModel.updateStatusForVehicle(alarmJson['address'], alarmJson['status']);
                            break;
                        }

                        default: {
                            logger.info(`AlarmReceiverAlamos | Received unknown alarmType (${alarmJson['alarmType']})`)
                            break;
                        }
                    }
                });
            });
        });
    }
}

export default AlarmReceiverAlamos;
