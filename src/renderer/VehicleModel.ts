import {logger} from "../common/common";
import toastr from "toastr";
import settings from "electron-settings";
import Vehicle from "../common/models/Vehicle";
import * as ko from "knockout";

class VehicleModel {
    vehicles: KnockoutObservableArray<Vehicle> = ko.observableArray([]);

    saving: KnockoutObservable<boolean> = ko.observable(false);
    newVehicle: Vehicle = new Vehicle("", "", "", 2);

    constructor() {
        logger.info("Loaded VehiclesModel")
    }

    addNewVehicle = () => {
        this.vehicles.push(new Vehicle(this.newVehicle.station(), this.newVehicle.identification(), this.newVehicle.name(), this.newVehicle.statusCode()));
    }

    removeVehicle = (item: Vehicle) => {
        this.vehicles.remove(item);
    }

    getVehicleById(id: any) {
        return ko.utils.arrayFirst(this.vehicles(), (item: any) => {
            return id === item.identification();
        });
    };

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

    updateStatusForVehicle = (address: any, status: string) => {
        this.vehicles().forEach((vehicle: Vehicle) => {
            if (vehicle.identification() === address) {
                vehicle.statusCode(Number.parseInt(status));
            }
        })
    }

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