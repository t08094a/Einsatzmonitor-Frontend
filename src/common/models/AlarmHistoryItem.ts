import AlarmType from "../AlarmType";
import {Observable} from "knockout";
import moment from "moment";

class AlarmHistoryItem {
    readonly keyword: string;
    readonly title: string;
    readonly timestamp: string;
    readonly location: string;
    readonly type: AlarmType;

    public timestampDisplay: Observable<string>;

    public static fromJson(json: any): AlarmHistoryItem {
        let obj = JSON.parse(json);
        return this.fromJS(obj);
    }

    public static fromJS(js: any): AlarmHistoryItem {
        return new AlarmHistoryItem(js.keyword, js.title, js.timestamp, js.location, js.type);
    }

    public updateTimestampDisplay() {
        this.timestampDisplay(moment(Number.parseInt(this.timestamp)).fromNow());
    }

    constructor(keyword: string, title: string, timestamp: string, location: string, type: AlarmType) {
        this.keyword = keyword;
        this.title = title;
        this.timestamp = timestamp;
        this.location = location;
        this.type = type;

        this.timestampDisplay = ko.observable("");

        moment.locale("de");
        this.updateTimestampDisplay();
    }
}


export default AlarmHistoryItem;