import ko, {Computed, Observable, ObservableArray} from "knockout";
import {logger, timeIsBetween} from "../common";
import Operation from "./Operation";
import Time from "./Time";
import Vehicle from "./Vehicle";
import VehicleModel from "../../renderer/VehicleModel";

class AAO {
    name: Observable<string> = ko.observable("Neue AAO");

    keywords: ObservableArray<string> = ko.observableArray<string>([]);
    keywordDescriptions: ObservableArray<string> = ko.observableArray<string>([]);
    cities: ObservableArray<string> = ko.observableArray<string>([]);
    objects: ObservableArray<string> = ko.observableArray<string>([]);

    monday: Observable<boolean> = ko.observable(true);
    tuesday: Observable<boolean> = ko.observable(true);
    wednesday: Observable<boolean> = ko.observable(true);
    thursday: Observable<boolean> = ko.observable(true);
    friday: Observable<boolean> = ko.observable(true);
    saturday: Observable<boolean> = ko.observable(true);
    sunday: Observable<boolean> = ko.observable(true);

    startTime: Observable<string> = ko.observable("00:00");
    endTime: Observable<string> = ko.observable("24:00");

    vehicles1: ObservableArray<Vehicle> = ko.observableArray<Vehicle>([]);
    vehicles2: ObservableArray<Vehicle> = ko.observableArray<Vehicle>([]);
    vehicles3: ObservableArray<Vehicle> = ko.observableArray<Vehicle>([]);

    vehicleModel: VehicleModel;

    enabledTimeFrameDisplay: Computed<string>;
    assignedVehicles: Computed<number>;

    availableVehicles: Computed<Vehicle[]>;

    // Underlying array needed for knockout-sortablejs
    availableVehiclesList: ObservableArray = ko.observableArray<any>([]);

    removeKeyword = (item: string) => {
        this.keywords.remove(item);
    }

    removeKeywordDescription = (item: string) => {
        this.keywordDescriptions.remove(item);
    }

    removeCity = (item: string) => {
        this.cities.remove(item);
    }

    removeObject = (item: string) => {
        this.objects.remove(item);
    }

    isValid = (operation: Operation): boolean => {
        if (!operation) {
            logger.debug(`No operation passed to AAO ${this.name()}`);
            return false;
        }

        let keyword = operation.getParameter("keyword");

        if (this.keywords().length > 0) {
            let keywordFound = this.keywords().find(item => keyword == item);

            if (!keywordFound) {
                logger.debug(`Keyword ${keyword} is not valid for AAO ${this.name()}`)
                return false;
            }
        }

        let keywordDescription = operation.getParameter("keyword_description");

        if (this.keywordDescriptions().length > 0) {
            let keywordDescriptionFound = this.keywordDescriptions().find(item => keywordDescription == item);

            if (!keywordDescriptionFound) {
                logger.debug(`KeywordDescription ${keywordDescription} is not valid for AAO ${this.name()}`)
                return false;
            }
        }

        let city = operation.getParameter("city");

        if (this.cities().length > 0) {
            let cityFound = this.cities().find(item => city == item);

            if (!cityFound) {
                logger.debug(`City ${city} is not valid for AAO ${this.name()}`)
                return false;
            }
        }

        let object = operation.getParameter("object");

        if (this.objects().length > 0) {
            let objectFound = this.objects().find(item => object == item);

            if (!objectFound) {
                logger.debug(`Object ${object} is not valid for AAO ${this.name()}`)
                return false;
            }
        }

        let currentDate = new Date();
        let currentDay = currentDate.getDay();

        switch (currentDay) {
            case 0: {
                if (!this.sunday()) {
                    logger.debug(`AAO ${this.name()} is not valid on Sunday`);
                    return false;
                }
                break;
            }

            case 1: {
                if (!this.monday()) {
                    logger.debug(`AAO ${this.name()} is not valid on Monday`);
                    return false;
                }
                break;
            }

            case 2: {
                if (!this.tuesday()) {
                    logger.debug(`AAO ${this.name()} is not valid on Tuesday`);
                    return false;
                }
                break;
            }

            case 3: {
                if (!this.wednesday()) {
                    logger.debug(`AAO ${this.name()} is not valid on Wednesday`);
                    return false;
                }
                break;
            }

            case 4: {
                if (!this.thursday()) {
                    logger.debug(`AAO ${this.name()} is not valid on Thursday`);
                    return false;
                }
                break;
            }

            case 5: {
                if (!this.friday()) {
                    logger.debug(`AAO ${this.name()} is not valid on Friday`);
                    return false;
                }
                break;
            }

            case 6: {
                if (!this.saturday()) {
                    logger.debug(`AAO ${this.name()} is not valid on Saturday`);
                    return false;
                }
                break;
            }

            default:
                break;
        }

        let currentHour = currentDate.getHours();
        let currentMinute = currentDate.getMinutes();

        let startTime = new Time(this.startTime());
        let endTime = new Time(this.endTime());
        let checkTime = new Time(`${currentHour}:${currentMinute}`)

        if (!timeIsBetween(startTime, endTime, checkTime)) {
            logger.debug(`Current time is not in specified time range for AAO ${this.name()}`)
            return false;
        }

        logger.info(`AAO ${this.name()} is valid`)

        return true;
    }

    constructor(vehicleModel: VehicleModel) {
        this.vehicleModel = vehicleModel;

        this.enabledTimeFrameDisplay = ko.computed(() => {
            let dayList = []
            let days = ""
            let time = ""

            if (this.monday() && this.tuesday() && this.wednesday() && this.thursday() && this.friday() && this.saturday() && this.sunday()) {
                days = "Montag bis Sonntag";
            } else {
                this.monday() ? dayList.push("Mo") : "";
                this.tuesday() ? dayList.push("Di") : "";
                this.wednesday() ? dayList.push("Mi") : "";
                this.thursday() ? dayList.push("Do") : "";
                this.friday() ? dayList.push("Fr") : "";
                this.saturday() ? dayList.push("Sa") : "";
                this.sunday() ? dayList.push("So") : "";

                days = dayList.join(", ")
            }

            if (this.startTime() == "00:00" && this.endTime() == "24:00") {
                time = "ganztägig";
            } else {
                time = `${this.startTime()} - ${this.endTime()}`
            }

            return `${days} - ${time}`
        });

        this.availableVehicles = ko.computed(() => {
            return ko.utils.arrayFilter(this.vehicleModel.vehicles(), (item => {
                // let idFound1 = !!this.vehicles1().find(vehicle => vehicle.identification == item.identification);
                // let idFound2 = !!this.vehicles2().find(vehicle => vehicle.identification == item.identification);
                // let idFound3 = !!this.vehicles3().find(vehicle => vehicle.identification == item.identification);

                // return !idFound1 && !idFound2 && !idFound3;

                return !this.vehicles1().includes(item) && !this.vehicles2().includes(item) && !this.vehicles3().includes(item);
            }));
        });

        this.assignedVehicles = ko.computed(() => {
            return this.vehicles1().length + this.vehicles2().length + this.vehicles3().length;
        })
    }
}

export default AAO;