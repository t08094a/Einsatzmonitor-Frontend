import {logger, store} from "../common";

const ko = require('knockout');
import {Computed, Observable} from 'knockout';

class Vehicle {
    readonly station: Observable = ko.observable();
    readonly identification: Observable = ko.observable();
    readonly name: Observable = ko.observable();
    private resetTimer?: number;
    private _statusCode: Observable = ko.observable();
    readonly statusColor: Computed;

    private colors: Record<string, string> = store.get("status.colors") as Record<string, string>;

    public get statusCode(): Observable {
        return this._statusCode;
    }

    public updateStatus(statusCode: number) {
        let previousStatusCode = this.statusCode();
        this._statusCode(statusCode);

        logger.debug(`Vehicle | [${this.name()}] New status: ${statusCode}; Previous status: ${previousStatusCode};`);

        let resetEnabled = store.get("status.reset.enabled");
        let resetCode = store.get("status.reset.code") as number;
        let resetSeconds = store.get("status.reset.seconds") as number;

        if (resetEnabled && statusCode == resetCode && previousStatusCode != resetCode) {
            this.resetTimer = window.setTimeout(() => {
                this._statusCode(previousStatusCode);
                clearTimeout(this.resetTimer);
                logger.debug(`Vehicle | [${this.name()}] Status reset to ${previousStatusCode}`);
            }, 1000 * resetSeconds);
        }

        if (statusCode != resetCode) {
            clearTimeout(this.resetTimer);
        }
    }

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
        this._statusCode(statusCode);

        this.statusColor = ko.computed(() => {
            switch (this._statusCode()) {
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
            statusCode: this._statusCode()
        }
    }
}

export default Vehicle;
