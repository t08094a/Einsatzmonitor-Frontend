import Widget from "../Widget";
import {Computed, ObservableArray} from "knockout";
import axios from "axios";
import {axiosConfigParams, logger, store, updateModel} from "../../../common/common";
import InfoEinsatz from "../../../common/models/InfoEinsatz";
import * as ko from "knockout";

class InfoOperationWidget extends Widget {
    operations: ObservableArray = ko.observableArray<any>([]);

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

                    let match = ko.utils.arrayFirst(this.operations(), (item: any) => {
                        return new_einsatz.id() === item.id();
                    });

                    // Operation not in array, add it
                    if (!match) {
                        this.operations.push(new_einsatz);
                    } else {
                        updateModel(match, einsatz);
                    }
                });

                this.operations().forEach((item: any) => {
                    if (!einsaetze.includes(item.id())) {
                        this.operations.remove(item);
                    }
                })
            })
    }

    loaded() {
        this.loadOperations();
    }

    constructor(main: any, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.loadOperations();
        }, 1000 * (store.get("info.httpFetchInterval") as number));

        logger.info("Loaded InfoOperationWidget");
    }
}

export default InfoOperationWidget;
