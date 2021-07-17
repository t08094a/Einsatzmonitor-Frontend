import Widget from "../Widget";
import {logger} from "../../../common/common";
import {Computed, Observable} from "knockout";
import ko from "knockout";
import EinsatzMonitorModel from "../../EinsatzMonitor";

class CustomParameterWidget extends Widget {
    main: EinsatzMonitorModel;

    loaded() {
    }

    destroy() {
    }

    constructor(main: EinsatzMonitorModel, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.main = main;

        logger.info("Loaded CustomParameterWidget");
    }
}

export default CustomParameterWidget