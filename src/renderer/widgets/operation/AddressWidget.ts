import Widget from "../Widget";
import EinsatzMonitorModel from "../../EinsatzMonitor";
import {logger} from "../../../common/common";
import {Computed} from "knockout";

class AddressWidget extends Widget {
    locationDisplay: Computed = ko.computed(() => {
        let showObject = this.extra_config.get('show-object')();
        let parameterObject = this.extra_config.get('parameter-object')();
        let parameterLocation = this.extra_config.get('parameter-location')();

        if (!parameterLocation)
            parameterLocation = "location_dest";

        if (!parameterObject)
            parameterObject = "object";

        let location = this.main.getLatestOperation()?.getParameter(parameterLocation);

        if (showObject) {
            let object = this.main.getLatestOperation()?.getParameter(parameterObject);

            location = `${location} ${object}`;
        }

        setTimeout(() => {
            this.fitIfPossible();
        }, 100)

        return location;
    });

    loaded() {
    }

    destroy() {
    }

    constructor(main: EinsatzMonitorModel, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        logger.info("Loaded AddressWidget");
    }
}

export default AddressWidget;
