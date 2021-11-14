import {store} from "../common";

const ko = require('knockout');
import {Computed, Observable} from 'knockout';

class Vehicle {
    station: Observable = ko.observable();
    identification: Observable = ko.observable();
    name: Observable = ko.observable();
    statusCode: Observable = ko.observable();
    statusColor: Computed;

    colors: Record<string, string> = store.get("status.colors") as Record<string, string>;

    private getColor(status: string): string {
        let defaultColor = "#4b4b4b";

        if (this.colors) {
            defaultColor = this.colors["default"] ? this.colors["default"] : "#c9c9c9";
            return this.colors[status] ? this.colors[status] : defaultColor;
        }

        return defaultColor;
    }

    constructor(station: string, identification: string, name: string, statusCode: number) {
        this.station(station);
        this.identification(identification);
        this.name(name);
        this.statusCode(statusCode);

        this.statusColor = ko.computed(() => {
            switch (this.statusCode()) {
                case 1:
                    return this.getColor("1");
                case 2:
                    return this.getColor("2");
                case 3:
                    return this.getColor("3");
                case 4:
                    return this.getColor("4");
                case 5:
                    return this.getColor("5");
                case 6:
                    return this.getColor("6");
                default:
                    return this.getColor("default");
            }
        });
    }

    public static fromJSON(json: any): Vehicle {
        let obj = JSON.parse(json);
        return this.fromJS(obj);
    }

    public static fromJS(js: any): Vehicle {
        return new Vehicle(js['station'], js['identification'], js['name'], js['statusCode']);
    }

    public toJSON() {
        return {
            station: this.station(),
            identification: this.identification(),
            name: this.name(),
            statusCode: this.statusCode()
        }
    }
}

export default Vehicle;
