import Widget from "../Widget";
import {logger} from "../../../common/common";
import {Computed, Observable} from "knockout";
import ko from "knockout";
import EinsatzMonitorModel from "../../EinsatzMonitor";

class AlarmMinutesWidget extends Widget {
    main: EinsatzMonitorModel;
    blinking: Observable = ko.observable(false);

    backgroundColor: Computed = ko.computed(() => {
        let seconds = this.main.getLatestOperation()?.secondsSinceAlarm();

        // -> 4 mins => green
        if (seconds <= 240) {
            return "#28a745"
        }

        // 4 -> 6 mins => orange
        if (seconds > 240 && seconds <= 360) {
            return "#d39e00"
        }

        // 6 -> 10 mins => blinking
        if (seconds > 360 && seconds <= 600) {
            this.blinking(true);
            return "#343a40"
        }

        // 10+ mins => red
        this.blinking(false);
        return "#dc3545";
    });

    loaded() {
    }

    destroy() {
    }

    constructor(main: EinsatzMonitorModel, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.main = main;

        logger.info("Loaded AlarmMinutesWidget");
    }
}

export default AlarmMinutesWidget