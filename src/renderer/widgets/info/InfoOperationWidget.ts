import Widget from "../Widget";

const ko = require('knockout');
import {Computed, ObservableArray} from "knockout";
import axios from "axios";
import settings from "electron-settings";
import {axiosConfigParams, logger, updateModel} from "../../../common/common";
import InfoEinsatz from "../../../common/models/InfoEinsatz";

class InfoOperationWidget extends Widget {
    actionTimer: any;
    operations: ObservableArray = ko.observableArray([]);

    sortedOperations: Computed = ko.computed(() => {
        return this.operations ? this.operations().sort(function (a, b) {
            return b.id() - a.id();
        }) : null;
    });

    loadOperations() {
        let url = this.extra_config.get('url')();

        if (!url) {
            logger.info("Keine URL zum Abrufen von Einsätzen konfiguriert.");
            return;
        }

        axios.get(url, axiosConfigParams)
            .then((response) => {
                let einsaetze: any = [];

                response.data.forEach((einsatz: any) => {
                    einsaetze.push(einsatz.id);

                    let new_einsatz = new InfoEinsatz(einsatz.id, einsatz.title, einsatz.alarmzeit, einsatz.alarmzeit_formatted, einsatz.color);

                    var match = ko.utils.arrayFirst(this.operations(), (item: any) => {
                        return new_einsatz.id() === item.id();
                    });

                    // Einsatz not in array, add it
                    if (!match) {
                        this.operations.push(new_einsatz);
                    } else {
                        updateModel(match, einsatz);
                    }
                });

                this.operations().forEach((item: any) => {
                    if (einsaetze.includes(item.id)) {
                        this.operations.remove(item);
                    }
                })
            })
    }

    loaded() {
        this.loadOperations();
    }

    destroy() {
        clearInterval(this.actionTimer);
    }

    constructor(board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.loadOperations();
        }, 1000 * (settings.get("info.httpFetchInterval") as number));

        console.log("Loaded InfoOperationWidget");
    }
}

export default InfoOperationWidget;