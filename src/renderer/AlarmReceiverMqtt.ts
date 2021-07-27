import AlarmReceiver from "./AlarmReceiver";
import EinsatzMonitorModel from "./EinsatzMonitor";
import * as mqtt from "mqtt";
import {extractArguments, logger} from "../common/common";
import settings from "electron-settings";

class AlarmReceiverMqtt extends AlarmReceiver {
    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        super(einsatzMonitorModel);

        let client = mqtt.connect(settings.getSync("mqtt.alarmInput.host"), {username: settings.getSync("mqtt.alarmInput.user") as string, password: settings.getSync("mqtt.alarmInput.password") as string});

        logger.debug(client);

        client.on('connect', function () {
            logger.info("AlarmReceiverMqtt | AlarmReceiver MQTT successfully connected.")

            extractArguments(settings.getSync("mqtt.alarmInput.topics") as string).forEach(topic => {
                logger.info(`AlarmReceiverMqtt | Subscribing to topic ${topic}`)
                client.subscribe(topic);
            })
        })

        client.on('message', (topic: string, message: any) => {
            logger.info(`AlarmReceiverMqtt | New message on ${topic}:`, message.toString('utf8'))

            try {
                let alarmJson = JSON.parse(message.toString('utf8'));
                this.handleAlarmData(alarmJson);
            } catch (e) {
                logger.error(e);
            }
        });

        client.on('error', function (error: any) {
            logger.error(error);
        });

        client.on('close', function () {
            logger.info("AlarmReceiverMqtt | Connection closed");
        })

        logger.info('AlarmReceiverMqtt | AlarmReceiver MQTT loaded.');
    }
}

export default AlarmReceiverMqtt;