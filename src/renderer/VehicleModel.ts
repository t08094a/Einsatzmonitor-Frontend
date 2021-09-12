import {logger, userDataPath} from "../common/common";
import toastr from "toastr";
import Vehicle from "../common/models/Vehicle";
import * as ko from "knockout";
import path from "path";
import {JSONFile, Low} from "lowdb";

const file = path.join(userDataPath, 'vehicles_db.json');
const adapter = new JSONFile(file);
const vehiclesDb = new Low(adapter);

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
            vehiclesDb.read().then(() => {
                let vehicles = vehiclesDb.data as [Vehicle];

                if (vehicles) {
                    this.vehicles.removeAll();

                    vehicles.forEach((vehicle: any) => {
                        this.vehicles.push(new Vehicle(vehicle.station, vehicle.identification, vehicle.name, vehicle.statusCode))
                    })
                }
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
            vehiclesDb.data = ko.toJS(this.vehicles);
            vehiclesDb.write();

            toastr.success("Fahrzeuge erfolgreich gespeichert", "Fahrzeuge");
            this.saving(false);
        }, 100)
    };
}

export default VehicleModel;
