import Widget from "../Widget";
import EinsatzMonitorModel from "../../EinsatzMonitor";
import {extractArguments, logger} from "../../../common/common";
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
        let keywords = this.extra_config.get('filter-keyword')();
        let currentYear = new Date().getFullYear();
        let count: number = 0;

        this.main.alarmHistoryModel.sortedHistory().forEach((item: AlarmHistoryItem) => {
            if (item.type !== AlarmType.ALARM) {
                return;
            }

            let year = new Date(Number.parseInt(item.timestamp)).getFullYear();
            if (year !== currentYear) {
                return;
            }

            if (!keywords) {
                count++;
                return;
            }

            extractArguments(keywords).forEach((keyword: string) => {
                // no input string: count all
                if (keywords.length == 0 && keyword.length == 0) {
                    count++
                } else {
                    if (keyword.length > 0 && item.keyword?.startsWith(keyword)) {
                        count++;
                    }
                }
            });
        });

        return count;
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
