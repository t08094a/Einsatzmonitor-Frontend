import {em, logger, store, userDataPath} from "../common/common";
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
        let checkDuplicated = store.get("alarmHistory.ignoreDuplicatedById.enabled") as boolean;

        if (checkDuplicated) {
            return this.alarmHistory().filter(item => {
                return item.id == alarmHistoryItem.id;
            }).length > 0
        }

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
        if (this.alarmHistoryItemExists(alarmHistoryItem)) {
            logger.info("AlarmHistoryModel | AlarmHistoryItem already exists.");
            return;
        }

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

        let idParameter = store.get("alarmHistory.parameters.id") as string;
        let titleParameter = store.get("alarmHistory.parameters.title") as string;
        let keywordParameter = store.get("alarmHistory.parameters.keyword") as string;
        let timestampParameter = store.get("alarmHistory.parameters.timestamp") as string;
        let locationParameter = store.get("alarmHistory.parameters.location") as string;

        em.on('OperationHistoryAdd', (operation: Operation) => {
            logger.info(`AlarmHistoryModel | OperationHistoryAdd event fired (${operation.id()})`);

            if (!store.get("alarmHistory.enabled")) {
                logger.debug("AlarmHistoryModel | History is disabled. Not adding operation to history.")
                return;
            }

            let title = operation.getParameter(titleParameter);

            if (!title) {
                logger.info(`AlarmHistoryModel | Parameter ${titleParameter} not found. Not adding operation to history.`);
                return;
            }

            let alarmHistoryItem = new AlarmHistoryItem(operation.getParameter(idParameter), operation.getParameter(keywordParameter), title, operation.getParameter(timestampParameter), operation.getParameter(locationParameter), AlarmType.ALARM);
            this.addNewAlarmHistoryItem(alarmHistoryItem);
        });

        em.on('NewStatus', (alarmData: any) => {
            logger.info(`AlarmHistoryModel | NewStatus event fired`);

            if (!alarmData[titleParameter]) {
                logger.info(`AlarmHistoryModel | Parameter ${titleParameter} not found. Not adding operation to history.`);
                return;
            }

            let alarmHistoryItem = new AlarmHistoryItem(alarmData[idParameter], alarmData[keywordParameter], alarmData[titleParameter], alarmData[timestampParameter], alarmData[locationParameter], AlarmType.STATUS);
            this.addNewAlarmHistoryItem(alarmHistoryItem);
        });
    }
}

export default AlarmHistoryModel;
