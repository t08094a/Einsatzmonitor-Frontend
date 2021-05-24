import EinsatzMonitorModel from "./EinsatzMonitor";
import {logger} from "../common/common";
import AlarmReceiver from "./AlarmReceiver";

const http = require("http");

class AlarmReceiverHttpServer extends AlarmReceiver {
    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        super(einsatzMonitorModel);

        let server = http.createServer(this.requestListener);

        server.on("connection", function (socket: any) {
            socket.setNoDelay(true);
        });

        server.listen(3000, '0.0.0.0', () => {
            logger.info('AlarmReceiverHttpServer | AlarmReceiver HTTP Server is running on port 3000.');
        });
    }

    private processPost(request: any, response: any, callback: any) {
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
                    logger.error("AlarmReceiverHttpServer | Received request body is not a valid JSON object");
                }
                callback();
            });

        } else {
            response.writeHead(405, {'Content-Type': 'text/plain'});
            response.end();
        }
    }

    private requestListener = async (req: any, res: any) => {
        res.setHeader("Content-Type", "application/json");
        switch (req.url) {
            case "/alarm/new": {
                if (req.method == 'POST') {
                    this.processPost(req, res, () => {
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
}

export default AlarmReceiverHttpServer;