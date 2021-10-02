import Widget from "../Widget";
import {logger} from "../../../common/common";
import {Computed, ObservableArray} from "knockout";
import ko from "knockout";
import Dienst from "../../../common/models/Dienst";

const ical = __non_webpack_require__('node-ical');

class CalendarWidget extends Widget {
    actionTimer: any;
    events: ObservableArray = ko.observableArray<any>([]);

    sortedEvents: Computed = ko.computed(() => {
        this.fit();

        let sorted = this.events ? this.events().sort(function (a, b) {
            return a.start() < b.start() ? -1 : (a.start() > b.start() ? 1 : 0);
        }) : [];

        try {
            let limit = Number.parseInt(this.extra_config.get('limit')());
            if (limit)
                sorted = sorted?.slice(0, limit);
        } catch (e) {
        }

        return sorted;
    });

    private addEvent(id: number, title: string, description: string, start: string, currentDay: number) {
        let isToday: boolean = new Date(start).setHours(0, 0, 0, 0) == currentDay;

        let newDienst = new Dienst(id, title, description, start, isToday);

        let match = ko.utils.arrayFirst(this.events(), (item: any) => {
            return newDienst.id() === item.id();
        });

        // Event not in array, add it
        if (!match) {
            this.events.push(newDienst);
        } else {
            match.id(id);
            match.title(title);
            match.description(description);
            match.start(start);
            match.isToday(isToday);
        }
    }

    private loadEventsICalendar() {
        let iCalendarUrl = this.extra_config.get('iCalendarUrl')();

        if (!iCalendarUrl) {
            logger.info("Keine iCalendar URL zum Abrufen von Kalendern konfiguriert.");
            return;
        }

        const webEvents = ical.async.fromURL(iCalendarUrl);

        webEvents
            .then((data: any) => {
                let dienste: any = [];

                for (let k in data) {
                    let event = data[k];
                    if (event.type == "VEVENT") {
                        let currentDay = new Date().setHours(0, 0, 0, 0);

                        if (new Date(event.start).setHours(0, 0, 0, 0) >= currentDay) {
                            dienste.push(event.uid);

                            this.addEvent(event.uid, event.summary, event.description, event.start, currentDay);
                        }
                    }
                }

                this.events().forEach((item: any) => {
                    if (!dienste.includes(item.id())) {
                        this.events.remove(item);
                    }
                });
            })
            .catch((error: any) => {
                logger.error("Fehler beim Abrufen der iCalender URL: ", error);
            })
    }

    public loadEvents() {
        switch (this.extra_config.get('calendarSource')()) {
            case "iCalendar":
            default: {
                this.loadEventsICalendar();
            }
        }
    }

    fit() {
        setTimeout(() => {
            this.fitIfPossible();
        }, 100);
    }

    loaded() {
        this.loadEvents();
    }

    destroy() {
        clearInterval(this.actionTimer);
    }

    constructor(main: any, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.loadEvents();
        }, 1000 * 60);

        logger.info("Loaded CalendarWidget");
    }
}

export default CalendarWidget;
