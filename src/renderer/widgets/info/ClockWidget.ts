import Widget from "../Widget";
import {Computed, Observable} from "knockout";
import {str_pad_left} from "../../../common/common";

const ko = require('knockout');

class ClockWidget extends Widget {
    actionTimer: any;

    date: Observable<Date> = ko.observable(new Date());
    parsed_clock: Computed = ko.computed(() => {
        return str_pad_left(this.date().getHours(), '0', 2) + ":" + str_pad_left(this.date().getMinutes(), '0', 2) + ":" + str_pad_left(this.date().getSeconds(), '0', 2)
    });

    updateClock() {
        this.date(new Date());
    }

    loaded() {
        this.updateClock();
    }

    destroy() {
        clearInterval(this.actionTimer);
    }

    constructor(board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.updateClock();
        }, 1000 * 1);

        console.log("Loaded ClockWidget");
    }
}

export default ClockWidget;