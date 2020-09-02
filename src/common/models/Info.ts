const ko = require('knockout');
import {Observable, ObservableArray, Computed} from 'knockout';
import {str_pad_left} from "../common";

class Info {
    news: ObservableArray = ko.observableArray([]);
    einsaetze: ObservableArray = ko.observableArray([]);
    dienste: ObservableArray = ko.observableArray([]);

    sortedNews: Computed = ko.computed(() => {
        return this.news ? this.news().sort(function (a, b) {
            return b.id() - a.id();
        }) : null;
    });

    sortedEinsaetze: Computed = ko.computed(() => {
        return this.einsaetze ? this.einsaetze().sort(function (a, b) {
            //return a.id() < b.id() ? -1 : (a.id() > b.id() ? 1 : 0);
            return b.id() - a.id();
            //return a.id() == b.id() ? 0 : (a.id() < b.id() ? -1 : 1)
        }) : null;
    });

    // sort by start_date since the newest entry is not always the last dienst
    sortedDienste: Computed = ko.computed(() => {
        return this.dienste ? this.dienste().sort(function (a, b) {
            return a.start() < b.start() ? -1 : (a.start() > b.start() ? 1 : 0);
        }) : null;
    });

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