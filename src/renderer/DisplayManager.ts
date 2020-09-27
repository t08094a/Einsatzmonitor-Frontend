import {info} from "electron-log";
import settings from "electron-settings";
import EinsatzMonitorModel from "./EinsatzMonitor";
import {em, execute} from "../common/common";

const ko = require('knockout');
const net = require('net');
const controlServer = net.createServer();

let hdmiState = -1; // Default unknown
let lastMovement = 0;

class DisplayManager {
    einsatzMonitorModel: EinsatzMonitorModel;

    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        this.einsatzMonitorModel = einsatzMonitorModel;

        em.on('EinsatzAdd', (data: any) => {
            info(`EinsatzAdd event fired (${data})`);
            turnOnDisplay();
        });

        em.on('EinsatzRemove', (operation: any) => {
            info('EinsatzRemove event fired');

            // Todo: move outside since it has nothing to do with display
            this.einsatzMonitorModel.einsaetze.splice(einsatzMonitorModel.einsaetze().indexOf(operation), 1);
        });

        controlServer.listen(11000, '0.0.0.0', () => {
            info('Control TCP Server is running on port 11000.');
        });

        controlServer.on('connection', (sock: any) => {
            sock.on('data', function (data: any) {
                let parsedData = JSON.parse(data);

                if (parsedData['event'] === 'sensor_trigger') {
                    if (parsedData['sensor'] === 'motion' && settings.get("motionDetector.enabled")) {
                        lastMovement = new Date().getTime();
                        turnOnDisplay();
                    }
                }
            });
        });

        // Task every minute to check if we should turn the display off
        // We won't turn it off if there currently is an einsatz
        window.setInterval(function () {
            if (ko.unwrap(einsatzMonitorModel.is_einsatz())) {
                return;
            }

            // Don't turn the display off if last movement is 600s or less ago
            let currentTimestamp = new Date().getTime();
            let diffSeconds = (currentTimestamp - lastMovement) / 1000;

            if (diffSeconds < 600) {
                info(`Last movement: ${diffSeconds}s ago.`);
                return;
            }

            // Else turn Display off
            turnOffDisplay();

        }, 1000 * 60);

        function turnOnDisplay() {
            if (hdmiState !== 1) {
                hdmiState = 1;
                execute("vcgencmd display_power 1", function () {
                });
                info('Turned on display');
            }
        }

        function turnOffDisplay() {
            if (hdmiState !== 0) {
                if (settings.get("displayAlwaysOn")) {
                    return;
                }

                hdmiState = 0;
                execute("vcgencmd display_power 0", function () {
                });
                info('Turned off display');
            }
        }
    }
}

export default DisplayManager;