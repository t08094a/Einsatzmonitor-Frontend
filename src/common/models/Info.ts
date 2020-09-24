const ko = require('knockout');
import {Observable, ObservableArray, Computed} from 'knockout';
import {str_pad_left} from "../common";

class Info {
    date: Observable<Date> = ko.observable(new Date());

    parsed_clock: Computed = ko.computed(() => {
        return str_pad_left(this.date().getHours(), '0', 2) + ":" + str_pad_left(this.date().getMinutes(), '0', 2) + ":" + str_pad_left(this.date().getSeconds(), '0', 2)
    });

    constructor() {
        this.start();
    }

    start() {
        setInterval(() => {
            this.date(new Date());
        }, 1000 * 1);
    }
}

export default Info;