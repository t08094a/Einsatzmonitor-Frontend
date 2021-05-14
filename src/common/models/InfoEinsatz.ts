const ko = require('knockout');
import {Observable} from 'knockout';

class InfoEinsatz {
    id: Observable = ko.observable();
    title: Observable = ko.observable();
    alarmzeit: Observable = ko.observable();
    alarmzeit_formatted: Observable = ko.observable();
    color: Observable = ko.observable();

    constructor(id: number, title: string, alarmzeit: string, alarmzeit_formatted: string, color: string) {
        this.id(id);
        this.title(title);
        this.alarmzeit(alarmzeit);
        this.alarmzeit_formatted(alarmzeit_formatted);
        this.color(color);
    }
}

export default InfoEinsatz;