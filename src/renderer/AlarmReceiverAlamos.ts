import EinsatzMonitorModel from "./EinsatzMonitor";
import {logger, replaceAll, sha256, store} from "../common/common";
import AlarmReceiver from "./AlarmReceiver";

const net = require('net');
const alarmReceiver = net.createServer();
const CryptoJS = require("crypto-js");

class AlarmReceiverAlamos extends AlarmReceiver {
    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        super(einsatzMonitorModel);

        alarmReceiver.listen(10000, '0.0.0.0', () => {
            logger.info('AlarmReceiverAlamos | AlarmReceiver TCP Server is running on port 10000.');
        });

        alarmReceiver.on('connection', (sock: any) => {
            sock.setEncoding('utf8')
            sock.on('data', (data: any) => {
                sha256(store.get("alamos.alarmInput.password")).then((passwordHash) => {
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

                    this.handleAlarmData(alarmJson);
                });
            });
        });
    }
}

export default AlarmReceiverAlamos;
