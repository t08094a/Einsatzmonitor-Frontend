const ko = require('knockout');
import {Computed, Observable} from 'knockout';
import {str_pad_left} from "../common";

class Dienst {
    id: Observable = ko.observable();
    title: Observable = ko.observable();
    description: Observable = ko.observable();
    start: Observable = ko.observable();
    is_today: Observable = ko.observable();

    startDate: Computed;
    startUhrzeit: Computed;

    constructor(id: number, title: string, description: string, start: string, is_today: boolean) {
        this.id = ko.observable(id);
        this.title = ko.observable(title);
        this.description = ko.observable(description);
        this.start = ko.observable(start);
        this.is_today = ko.observable(is_today);

        this.startDate = ko.computed(() => {
            return new Date(this.start());
        });

        this.startUhrzeit = ko.computed(() => {
            return str_pad_left(this.startDate().getHours(), '0', 2) + ":" + str_pad_left(this.startDate().getMinutes(), '0', 2)
        });
    }
}

export default Dienst;