import Widget from "../Widget";
import EinsatzMonitorModel from "../../EinsatzMonitor";
import {logger} from "../../../common/common";
import {Computed} from "knockout";
import AlarmHistoryItem from "../../../common/models/AlarmHistoryItem";
import AlarmType from "../../../common/AlarmType";

class HistoryWidget extends Widget {
    private actionTimer: any;

    alarmHistoryItems: Computed = ko.computed(() => {
        if (!this.main.alarmHistoryModel.sortedHistory())
            return [];

        this.fit();

        let alarmHistoryItems = this.main.alarmHistoryModel.sortedHistory();

        let hideAlarm: boolean = this.extra_config.get('hide-alarm')();
        let hideStatus: boolean = this.extra_config.get('hide-status')();

        let alarmHistoryItemsFiltered = alarmHistoryItems.filter((item: AlarmHistoryItem) => {
            return item.type == AlarmType.ALARM && !hideAlarm || item.type == AlarmType.STATUS && !hideStatus;
        })

        try {
            let limit = Number.parseInt(this.extra_config.get('limit')());
            if (limit)
                alarmHistoryItemsFiltered = alarmHistoryItemsFiltered.slice(0, limit);
        } catch (e) {
        }

        return alarmHistoryItemsFiltered;
    });

    alarmCountForKeyword: Computed = ko.computed(() => {
        let keyword = this.extra_config.get('filter-keyword')();
        let currentYear = new Date().getFullYear();

        let filteredOperations = this.main.alarmHistoryModel.sortedHistory().filter((item: AlarmHistoryItem) => {
            let year = new Date(Number.parseInt(item.timestamp)).getFullYear();
            return item.keyword?.startsWith(keyword) && year == currentYear && item.type == AlarmType.ALARM;
        })

        return filteredOperations.length;
    });

    private updateTimestampDisplay() {
        this.alarmHistoryItems().forEach((alarmHistoryItem: AlarmHistoryItem) => {
            alarmHistoryItem.updateTimestampDisplay();
        });
    }

    fit() {
        setTimeout(() => {
            this.fitIfPossible();
        }, 100);
    }

    loaded() {

    }

    destroy() {
        clearInterval(this.actionTimer);
    }

    constructor(main: EinsatzMonitorModel, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.updateTimestampDisplay();
        }, 1000 * 1);

        let parametersToUpdate = ["show-location", "count-only"];

        parametersToUpdate.forEach((parameter: string) => {
            this.extra_config.get(parameter).subscribe((newValue: any) => {
                this.fit();
            });
        })

        logger.info("Loaded HistoryWidget");
    }
}

export default HistoryWidget;