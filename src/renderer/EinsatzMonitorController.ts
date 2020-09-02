import settings from "electron-settings";
import axios from "axios";
import NewsPost from "../common/models/NewsPost";
import {axiosConfigParams, updateModel} from "../common/common";
import InfoEinsatz from "../common/models/InfoEinsatz";
import Dienst from "../common/models/Dienst";
import EinsatzMonitorModel from "./einsatzmonitor";
import DisplayManager from "./DisplayManager";
import AlarmReceiverWebsocket from "./AlarmReceiverWebsocket";
import AlarmReceiverHttp from "./AlarmReceiverHttp";
import AlarmReceiverAlamos from "./AlarmReceiverAlamos";

const ko = require('knockout');

class EinsatzMonitorController {
    einsatzMonitorModel: EinsatzMonitorModel;
    displayManager: DisplayManager;

    loadInfoData() {
        if (settings.get("info.news.show")) {
            this.infoLoadNews();
        }

        if (settings.get("info.einsaetze.show")) {
            this.infoLoadEinsaetze();
        }

        if (settings.get("info.dienste.show")) {
            this.infoLoadDienste();
        }
    }

    infoLoadNews() {
        axios.get(settings.get("info.news.url") as string, axiosConfigParams)
            .then((response) => {
                let news: any = [];

                response.data.forEach((news_post: any) => {
                    news.push(news_post.id);

                    let new_newsPost = new NewsPost(news_post.id, news_post.title, news_post.images[0].image_url, news_post.description_truncated, news_post.date_formatted);

                    var match = ko.utils.arrayFirst(this.einsatzMonitorModel.info().news(), (item: any) => {
                        return new_newsPost.id() === item.id();
                    });

                    // News not in array, add it
                    if (!match) {
                        this.einsatzMonitorModel.info().news.push(new_newsPost)
                    } else {
                        updateModel(match, news_post);
                        match.image_url(news_post.images[0].image_url);
                    }
                });

                this.einsatzMonitorModel.info().news().forEach((item: any) => {
                    if (news.includes(item.id)) {
                        this.einsatzMonitorModel.info().news.remove(item);
                    }
                });
            })
    }

    infoLoadEinsaetze() {
        axios.get(settings.get("info.einsaetze.url") as string, axiosConfigParams)
            .then((response) => {
                let einsaetze: any = [];

                response.data.forEach((einsatz: any) => {
                    einsaetze.push(einsatz.id);

                    let new_einsatz = new InfoEinsatz(einsatz.id, einsatz.title, einsatz.alarmzeit, einsatz.alarmzeit_formatted, einsatz.color);

                    var match = ko.utils.arrayFirst(this.einsatzMonitorModel.info().einsaetze(), (item: any) => {
                        return new_einsatz.id() === item.id();
                    });

                    // Einsatz not in array, add it
                    if (!match) {
                        this.einsatzMonitorModel.info().einsaetze.push(new_einsatz);
                    } else {
                        updateModel(match, einsatz);
                    }
                });

                this.einsatzMonitorModel.info().einsaetze().forEach((item: any) => {
                    if (einsaetze.includes(item.id)) {
                        this.einsatzMonitorModel.info().einsaetze.remove(item);
                    }
                })
            })
    }

    infoLoadDienste() {
        axios.get(settings.get("info.dienste.url") as string, axiosConfigParams)
            .then((response) => {
                let dienste: any = [];

                response.data.forEach((dienst: any) => {
                    dienste.push(dienst.id);

                    let new_dienst = new Dienst(dienst.id, dienst.title, dienst.description, dienst.start, dienst.is_today);

                    var match = ko.utils.arrayFirst(this.einsatzMonitorModel.info().dienste(), (item: any) => {
                        return new_dienst.id() === item.id();
                    });

                    // Dienst not in array, add it
                    if (!match) {
                        this.einsatzMonitorModel.info().dienste.push(new_dienst);
                    } else {
                        updateModel(match, dienst);
                    }
                });

                this.einsatzMonitorModel.info().dienste().forEach((item: any) => {
                    if (dienste.includes(item.id)) {
                        this.einsatzMonitorModel.info().dienste.remove(item);
                    }
                });
            })
    }

    constructor() {
        this.einsatzMonitorModel = new EinsatzMonitorModel();
        this.displayManager = new DisplayManager(this.einsatzMonitorModel);

        if (settings.get("einsatz.fetch") === "websocket") {
            new AlarmReceiverWebsocket(this.einsatzMonitorModel);
        }

        if (settings.get("einsatz.fetch") === "http") {
            new AlarmReceiverHttp(this.einsatzMonitorModel);
        }

        if (settings.get("alamos.alarmInput.enabled")) {
            new AlarmReceiverAlamos(this.einsatzMonitorModel);
        }

        let resizeTimer: NodeJS.Timeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Recalculate grister if window size changed
                this.einsatzMonitorModel.board().gridsterInfo.recalculate_faux_grid();
            }, 250);
        });

        ko.applyBindings(this.einsatzMonitorModel);

        /**
         *  Load Info Data
         */

        this.loadInfoData();

        window.setInterval(() => {
            this.loadInfoData();
        }, 1000 * (settings.get("info.httpFetchInterval") as number));
    }
}

export default EinsatzMonitorController