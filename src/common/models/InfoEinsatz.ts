const ko = require('knockout');
import {Observable} from 'knockout';

class InfoEinsatz {
    id: Observable = ko.observable();
    title: Observable = ko.observable();
    alarmzeit: Observable = ko.observable();
    alarmzeit_formatted: Observable = ko.observable();
    color: Observable = ko.observable();

    constructor(id: number, title: string, alarmzeit: string, alarmzeit_formatted: string, color: string) {
        this.id = ko.observable(id);
        this.title = ko.observable(title);
        this.alarmzeit = ko.observable(alarmzeit);
        this.alarmzeit_formatted = ko.observable(alarmzeit_formatted);
        this.color = ko.observable(color);
    }
}

export default InfoEinsatz;