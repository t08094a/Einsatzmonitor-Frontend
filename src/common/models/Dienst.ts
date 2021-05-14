const ko = require('knockout');
import {Computed, Observable} from 'knockout';
import {str_pad_left} from "../common";

class Dienst {
    id: Observable = ko.observable();
    title: Observable = ko.observable();
    description: Observable = ko.observable();
    start: Observable = ko.observable();
    isToday: Observable = ko.observable();

    startDate: Computed;
    startUhrzeit: Computed;

    constructor(id: number, title: string, description: string, start: string, isToday: boolean) {
        this.id(id);
        this.title(title);
        this.description(description);
        this.start(start);
        this.isToday(isToday);

        this.startDate = ko.computed(() => {
            return new Date(this.start());
        });

        this.startUhrzeit = ko.computed(() => {
            return str_pad_left(this.startDate().getHours(), '0', 2) + ":" + str_pad_left(this.startDate().getMinutes(), '0', 2)
        });
    }
}

export default Dienst;