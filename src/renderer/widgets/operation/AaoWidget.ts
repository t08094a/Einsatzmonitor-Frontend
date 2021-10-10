import Widget from "../Widget";
import EinsatzMonitorModel from "../../EinsatzMonitor";
import {logger} from "../../../common/common";
import {Computed} from "knockout";

class AaoWidget extends Widget {
    main: EinsatzMonitorModel;

    aaoVehicles: Computed = ko.computed(() => {
        if (!this.main.getLatestOperation()?.matchedAao())
            return;

        let vehicles1 = this.main.getLatestOperation()?.matchedAao().vehicles1();
        let vehicles2 = this.main.getLatestOperation()?.matchedAao().vehicles2();
        let vehicles3 = this.main.getLatestOperation()?.matchedAao().vehicles3();

        return [...vehicles1, ...vehicles2, ...vehicles3]
    });

    loaded() {
    }

    destroy() {
    }

    constructor(main: EinsatzMonitorModel, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.main = main;

        logger.info("Loaded AaoWidget");
    }

}

export default AaoWidget;
