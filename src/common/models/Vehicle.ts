const ko = require('knockout');
import {Computed, Observable, ObservableArray} from 'knockout';

class Vehicle {
    station: Observable = ko.observable();
    identification: Observable = ko.observable();
    name: Observable = ko.observable();
    statusCode: Observable = ko.observable();
    statusColor: Computed;

    constructor(station: string, identification: string, name: string, statusCode: number) {
        this.station = ko.observable(station);
        this.identification = ko.observable(identification);
        this.name = ko.observable(name);
        this.statusCode = ko.observable(statusCode);

        this.statusColor = ko.computed(() => {
            switch (this.statusCode()) {
                case 1:
                    return "#0099ff";
                case 2:
                    return "#02a600";
                case 3:
                    return "#ffb300";
                case 4:
                    return "#ff5100";
                case 5:
                    return "#ae00ff";
                case 6:
                    return "#ff0000";
                default:
                    return "#c9c9c9"
            }
        });
    }
}

export default Vehicle;