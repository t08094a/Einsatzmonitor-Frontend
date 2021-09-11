import Widget from "../Widget";
import {Computed, ObservableArray} from "knockout";
import axios from "axios";
import {axiosConfigParams, logger, store, updateModel} from "../../../common/common";
import Dienst from "../../../common/models/Dienst";
import * as ko from "knockout";

class InfoAppointmentWidget extends Widget {
    actionTimer: any;
    appointments: ObservableArray = ko.observableArray<any>([]);

    sortedAppointments: Computed = ko.computed(() => {
        return this.appointments ? this.appointments().sort(function (a, b) {
            return a.start() < b.start() ? -1 : (a.start() > b.start() ? 1 : 0);
        }) : null;
    });

    loadAppointments() {
        let url = this.extra_config.get('url')();

        if (!url) {
            logger.info("Keine URL zum Abrufen von Diensten konfiguriert.");
            return;
        }

        axios.get(url, axiosConfigParams)
            .then((response) => {
                let dienste: any = [];

                response.data.forEach((dienst: any) => {
                    dienste.push(dienst.id);

                    let new_dienst = new Dienst(dienst.id, dienst.title, dienst.description, dienst.start, dienst.is_today);

                    var match = ko.utils.arrayFirst(this.appointments(), (item: any) => {
                        return new_dienst.id() === item.id();
                    });

                    // Dienst not in array, add it
                    if (!match) {
                        this.appointments.push(new_dienst);
                    } else {
                        updateModel(match, dienst);
                    }
                });

                this.appointments().forEach((item: any) => {
                    if (!dienste.includes(item.id())) {
                        this.appointments.remove(item);
                    }
                });
            })
    }

    loaded() {
        this.loadAppointments();
    }

    destroy() {
        clearInterval(this.actionTimer);
    }

    constructor(main: any, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.loadAppointments();
        }, 1000 * (store.get("info.httpFetchInterval") as number));

        logger.info("Loaded InfoAppointmentWidget");
    }
}

export default InfoAppointmentWidget;
