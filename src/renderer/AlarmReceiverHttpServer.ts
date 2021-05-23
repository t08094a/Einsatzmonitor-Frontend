import EinsatzMonitorModel from "./EinsatzMonitor";
import {logger} from "../common/common";

const http = require("http");

class AlarmReceiverHttpServer {
    einsatzMonitorModel: EinsatzMonitorModel;

    // Todo: refactor into reusable module
    handleAlarmData(data: any) {
        switch (data['alarmType']) {
            case "ALARM": {
                logger.info("AlarmReceiverHttpServer | Received ALARM")

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
                logger.info("AlarmReceiverHttpServer | Received STATUS");
                this.einsatzMonitorModel.vehicleModel.updateStatusForVehicle(data['address'], data['status']);
                break;
            }

            default: {
                logger.info(`AlarmReceiverHttpServer | Received unknown alarmType (${data['alarmType']})`)
                break;
            }
        }
    }

    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        this.einsatzMonitorModel = einsatzMonitorModel;

        function processPost(request: any, response: any, callback: any) {
            let data = "";
            if (typeof callback !== 'function')
                return null;

            if (request.method == 'POST') {
                request.on('data', function (chunk: any) {
                    data += chunk;
                });

                request.on('end', function () {
                    try {
                        request.post = JSON.parse(data);
                    } catch (err) {
                        console.error("request body was not JSON");
                    }
                    callback();
                });

            } else {
                response.writeHead(405, {'Content-Type': 'text/plain'});
                response.end();
            }
        }

        let requestListener = async (req: any, res: any) => {
            res.setHeader("Content-Type", "application/json");
            switch (req.url) {
                case "/alarm/new": {
                    if (req.method == 'POST') {
                        processPost(req, res, () => {
                            this.handleAlarmData(req.post);
                            res.writeHead(200);
                            res.end(`{"status": "OK"}`);
                        });
                    } else {
                        res.writeHead(200);
                        res.end(`{"status": "Alarm route"}`);
                    }
                    break;
                }

                default: {
                    res.writeHead(200);
                    res.end(`{"status": "Route not found"}`);
                    break;
                }
            }

        };

        let server = http.createServer(requestListener);

        server.on("connection", function (socket: any) {
            socket.setNoDelay(true);
        });

        server.listen(3000, '0.0.0.0', () => {
            logger.info('AlarmReceiverHttpServer | AlarmReceiver HTTP Server is running on port 3000.');
        });
    }
}

export default AlarmReceiverHttpServer;