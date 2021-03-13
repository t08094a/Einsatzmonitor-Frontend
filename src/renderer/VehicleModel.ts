import {logger} from "../common/common";
import toastr from "toastr";
import settings from "electron-settings";
import Vehicle from "../common/models/Vehicle";

const ko = require('knockout');

class VehicleModel {
    vehicles = ko.observableArray([]);

    saving = ko.observable(false);
    newVehicle = new Vehicle("", "", "", 2);

    constructor() {
        logger.info("Loaded VehiclesModel")
    }

    addNewVehicle = () => {
        this.vehicles.push(new Vehicle(this.newVehicle.station(), this.newVehicle.identification(), this.newVehicle.name(), this.newVehicle.statusCode()));
    }

    removeVehicle = (item: Vehicle) => {
        this.vehicles.remove(item);
    }

    loadVehiclesFromDisk = () => {
        try {
            let vehicles = settings.getSync("vehicles") as string
            let parsedVehicles = JSON.parse(vehicles);

            this.vehicles.removeAll();

            parsedVehicles.forEach((vehicle: any) => {
                this.vehicles.push(new Vehicle(vehicle.station, vehicle.identification, vehicle.name, vehicle.statusCode))
            })
        } catch (e) {
            logger.debug("No vehicles saved yet.")
        }
    };

    saveVehiclesToDisk = () => {
        this.saving(true);

        setTimeout(() => {
            settings.setSync("vehicles", ko.toJSON(this.vehicles));

            toastr.success("Einstellungen erfolgreich gespeichert", "Einstellungen");
            this.saving(false);
        }, 100)
    };
}

export default VehicleModel;