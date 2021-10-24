import {em, logger, userDataPath} from "../common/common";
import path from "path";
import {JSONFile, Low} from "lowdb";
import EinsatzMonitorModel from "./EinsatzMonitor";
import Operation from "../common/models/Operation";
import ko, {Computed} from "knockout";
import AlarmHistoryItem from "../common/models/AlarmHistoryItem";
import AlarmType from "../common/AlarmType";

const file = path.join(userDataPath, 'alarm_history_db.json');
const adapter = new JSONFile<AlarmHistoryItem[]>(file);
const alarmHistoryDb = new Low<AlarmHistoryItem[]>(adapter);

class AlarmHistoryModel {
    private main: EinsatzMonitorModel;
    private alarmHistory: KnockoutObservableArray<AlarmHistoryItem> = ko.observableArray([]);

    public sortedHistory: Computed = ko.computed(() => {
        return this.alarmHistory() ? this.alarmHistory().sort(function (a, b) {
            return Number.parseInt(b.timestamp) - Number.parseInt(a.timestamp);
        }) : null;
    });

    private alarmHistoryItemExists(alarmHistoryItem: AlarmHistoryItem): boolean {
        return this.alarmHistory().filter(item => {
            return item.equals(alarmHistoryItem);
        }).length > 0
    }

    private removeOldHistoryItems(): void {
        this.alarmHistory.remove((alarmHistoryItem: AlarmHistoryItem) => {
            if (!alarmHistoryItem.timestamp) {
                this.removeItemFromDb(alarmHistoryItem);
                return true;
            }

            let yearMs: number = 1000 * 60 * 60 * 24 * 365;
            let isOld: boolean = Date.now() - Number.parseInt(alarmHistoryItem.timestamp) > yearMs;

            if (isOld) {
                logger.debug(`AlarmHistoryModel | AlarmHistoryItem ${alarmHistoryItem.title} is older than one year. Removing.`);
                this.removeItemFromDb(alarmHistoryItem);
            }

            return isOld
        })
    }

    private removeItemFromDb(alarmHistoryItem: AlarmHistoryItem) {
        alarmHistoryDb.data?.forEach((dbItem, index) => {
            if (alarmHistoryItem.equals(dbItem)) {
                alarmHistoryDb.data?.splice(index, 1);
                logger.debug(`AlarmHistoryModel | AlarmHistoryItem ${alarmHistoryItem.title} has been removed from database.`);
            }
        });
        alarmHistoryDb.write();
    }

    private addNewAlarmHistoryItem(alarmHistoryItem: AlarmHistoryItem): void {
        if (this.alarmHistoryItemExists(alarmHistoryItem))
            return;

        this.removeOldHistoryItems();

        logger.debug(`AlarmHistoryModel | Adding new AlarmHistoryItem:`, alarmHistoryItem)

        this.alarmHistory.push(alarmHistoryItem);

        alarmHistoryDb.data = alarmHistoryDb.data || []
        alarmHistoryDb.data.push(alarmHistoryItem);

        logger.debug(`AlarmHistoryModel | New database length: ${alarmHistoryDb.data.length}`)

        alarmHistoryDb.write();
    }

    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        logger.info("Loaded AlarmHistoryModel");

        this.main = einsatzMonitorModel;

        alarmHistoryDb.read().then(() => {
            let alarmHistory = alarmHistoryDb.data;

            if (alarmHistory) {
                alarmHistory.forEach((alarmHistoryItem: any) => {
                    let obj = AlarmHistoryItem.fromJS(alarmHistoryItem);
                    this.alarmHistory.push(obj);
                })
            }
        });

        em.on('OperationHistoryAdd', (operation: Operation) => {
            logger.info(`AlarmHistoryModel | OperationHistoryAdd event fired (${operation.id()})`);

            let alarmHistoryItem = new AlarmHistoryItem(operation.getParameter("keyword"), operation.getParameter("subject_apager"), operation.getParameter("timestamp"), operation.getParameter("location_dest"), AlarmType.ALARM);
            this.addNewAlarmHistoryItem(alarmHistoryItem);
        });

        em.on('NewStatus', (alarmData: any) => {
            logger.info(`AlarmHistoryModel | NewStatus event fired`);
            let alarmHistoryItem = new AlarmHistoryItem(alarmData["keyword"], alarmData["subject_apager"], alarmData["timestamp"], alarmData["location_dest"], AlarmType.STATUS);
            this.addNewAlarmHistoryItem(alarmHistoryItem);
        });
    }
}

export default AlarmHistoryModel;
