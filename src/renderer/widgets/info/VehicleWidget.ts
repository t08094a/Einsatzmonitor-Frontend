import Widget from "../Widget";
import {Computed, ObservableArray} from "knockout";
import {logger} from "../../../common/common";
import "../../EinsatzMonitor";
import Vehicle from "../../../common/models/Vehicle";
import * as ko from "knockout";

class VehicleWidget extends Widget {
    availableModes: ObservableArray = ko.observableArray(['Einzelfahrzeug', 'Liste'])

    isSingleMode: Computed = ko.computed(() => {
        return this.extra_config.get('selected-mode')() === "Einzelfahrzeug";
    });

    getVehicleForSingleMode: Computed = ko.computed(() => {
        return ko.utils.arrayFirst(this.main.vehicleModel.vehicles(), (vehicle: Vehicle) => {
            return vehicle.identification() === this.extra_config.get('issi-to-show')()
        });
    });

    getVehiclesForListMode: Computed = ko.computed(() => {
        let filteredVehicles = ko.utils.arrayFilter(this.main.vehicleModel.vehicles(), (vehicle: Vehicle) => {
            if (this.extra_config.get('filter-station')()) {
                return vehicle.station() === this.extra_config.get('filter-station')();
            }
            return true;
        });

        setTimeout(() => {
            this.fitIfPossible();
        }, 200);

        return filteredVehicles;
    });

    loaded() {
    }

    destroy() {
    }

    constructor(main: any, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        logger.info("Loaded VehicleWidget");
    }
}

export default VehicleWidget