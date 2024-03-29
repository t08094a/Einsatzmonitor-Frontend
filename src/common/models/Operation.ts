import {Computed, Observable, PureComputed} from 'knockout';
import Person from './Person';
import Functioning from './Functioning';
import moment from "moment";
import {alamosFeedbackUrl, axiosConfigParams, em, logger, store, str_pad_left, userDataPath} from "../common";
import axios from "axios";
import AAO from "./AAO";
import * as ko from "knockout";
import * as nunjucks from "nunjucks";
import fs from "fs";
import path from "path";
import Vehicle from "./Vehicle";
import GoogleGeocoder from "../../renderer/geocoding/GoogleGeocoder";
import GeocodingResult from "../../renderer/geocoding/GeocodingResult";
import Geocoder from "../../renderer/geocoding/Geocoder";
import GraphHopperGeocoder from "../../renderer/geocoding/GraphHopperGeocoder";
import TextToSpeech from "../../renderer/tts/TextToSpeech";
import {BrowserWindow} from "@electron/remote";
import tmp from "tmp";

class Operation {
    id: Observable = ko.observable();

    keyword: Observable = ko.observable();
    keywordColor: Observable = ko.observable();
    keywordColorBadge: Computed;

    description: Observable = ko.observable();
    desc: Observable = ko.observable();
    getDescription: Computed;

    alarmTime: Observable = ko.observable();
    alarmTimeDatetime: Observable = ko.observable();
    secondsSinceAlarm: Observable = ko.observable(0);
    timeSinceAlarm: Observable = ko.observable("00:00");

    street: Observable = ko.observable();
    object: Observable = ko.observable();

    feedbackPersons: KnockoutObservableArray<any> = ko.observableArray([]);
    getFeedbackPersonsSorted: PureComputed;
    feedbackFe2Id: Observable = ko.observable();

    units: KnockoutObservableArray<any> = ko.observableArray([]);
    getUnitsSorted: Computed;

    zusatzinfos: KnockoutObservableArray<any> = ko.observableArray([]);

    // @ts-ignore
    parameters: any = ko.observableDictionary();

    matchedAao: Observable<AAO | undefined> = ko.observable();

    private isFeedbackPersonSaved = (feedback: any): boolean => {
        return ko.utils.arrayFirst(this.feedbackPersons(), (item: any) => {
            return feedback.name === item.name();
        });
    };

    public getParameter = (parameter: string): string => {
        return this.parameters.get(parameter)();
    }

    loadAlamosFeedback = () => {
        axios.get(alamosFeedbackUrl(this.feedbackFe2Id()), axiosConfigParams)
            .then((response) => {
                if (response.status === 200) {
                    let lstOfFeedbacks = response.data.lstOfFeedbacks;

                    lstOfFeedbacks.forEach((feedback: any) => {
                        if (this.isFeedbackPersonSaved(feedback)) {
                            this.feedbackPersons().forEach((feedbackPerson: Person) => {
                                if (feedback.name == feedbackPerson.name()) {
                                    feedbackPerson.feedback(feedback.state);
                                }
                            })
                        } else {
                            // new
                            logger.info(`Operation | Creating new feedback entry for ${feedback.name}: ${feedback.state}`);
                            let person = new Person(feedback.name, feedback.state);
                            if (feedback.functions) {
                                if (feedback.functions.includes(";")) {
                                    feedback.functions.split(";").forEach((item: any) => {
                                        person.functions.push(new Functioning(item, "badge-primary"));
                                    });
                                } else {
                                    person.functions.push(new Functioning(feedback.functions, "badge-primary"));
                                }
                            }
                            this.feedbackPersons.push(person);
                        }
                    });
                    logger.debug(`Operation | Successfully updated ${lstOfFeedbacks.length} feedback entries.`);
                }
            })
            .catch((error_resp) => {
                logger.error(`Error while requesting feedback from Alamos server: ${error_resp.toString()}`);
            })
    };

    // Todo: Refactor into separate FeedbackCountWidget class
    getFunctionCount = (fn: string, feedback: string, countTotal: boolean) => {
        let count = 0;
        let check: any;

        if (feedback === "YES")
            check = ["YES", "HERE"];
        else if (feedback === "NO")
            check = ["NO", "ABSENT"];
        else
            check = ["RECEIVED", "READ", "FREE"];

        this.feedbackPersons().forEach((feedbackPerson: Person) => {
            if (!countTotal) {
                feedbackPerson.functions().forEach((func: any) => {
                    let function_name = func.name();

                    if (fn && function_name === fn && check.includes(feedbackPerson.feedback())) {
                        count++;
                    }
                })
            } else {
                if (check.includes(feedbackPerson.feedback())) {
                    count++;
                }
            }

        });

        return count;
    };

    getVisibleUnitsSorted: Computed;
    getInvisibleUnitsCount: Computed;

    removeTimer = window.setInterval(() => {
        let now = Date.now() / 1000 | 0;
        let diff = now - this.alarmTime();

        if (diff > 900) {
            this.alarmTimeDatetime(moment(this.alarmTime() * 1000).format("DD.MM.YYYY HH:mm:ss"));
        }

        let minutes = Math.floor(diff / 60);
        let seconds = diff - minutes * 60;

        let finalTime = str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds | 0, '0', 2);

        this.secondsSinceAlarm(diff)
        this.timeSinceAlarm(finalTime);

        if (minutes >= (store.get("einsatz.displayTime") as number)) {
            this.stopTasks();

            // Trigger EinsatzRemove event
            em.emit('EinsatzRemove', this);
        }
    }, 500);

    getFeedbackTimer = window.setInterval(() => {
        if (this.feedbackFe2Id() == null) {
            logger.info("Operation | No feedback ID found. Not requesting Alamos feedback.");
            return;
        }

        this.loadAlamosFeedback();
    }, 5000);

    stopTasks() {
        clearInterval(this.removeTimer);
        clearInterval(this.getFeedbackTimer);
    };

    /* Google Maps Karten */
    loadGoogleMap = () => {
        logger.info("Operation | Loading google map")

        if (this.getParameter("lat") && this.getParameter("lng")) {
            logger.info("Operation | Using lat/lng from alarm parameters.")
            this.setCoordinatesParameter(this.getParameter("lat"), this.getParameter("lng"));
            return;
        }

        if (!store.get("geocoding.enabled")) {
            logger.warn("Operation | Geocoding is disabled but coordinates parameters are missing. Maps won't work for this alarm.");
            return;
        }

        let geocoder: Geocoder;

        switch (store.get("geocoding.engine") as string) {
            case "Google": {
                geocoder = new GoogleGeocoder();
                break;
            }

            case "GraphHopper": {
                geocoder = new GraphHopperGeocoder();
                break;
            }

            default: {
                geocoder = new GoogleGeocoder();
            }
        }

        geocoder.geocode(this.street())
            .then((result: GeocodingResult) => {
                this.setCoordinatesParameter(result.lat.toString(), result.lng.toString());
            })
            .catch((e) => logger.error(e));
    };

    setCoordinatesParameter(lat: string, lng: string) {
        this.parameters.set("lat", lat);
        this.parameters.set("lng", lng);

        this.setGoogleMapsCoordinates(lat, lng);
    }

    setGoogleMapsCoordinates(lat: string, lng: string) {
        this.googleOverviewMap().lat(lat);
        this.googleOverviewMap().lng(lng);

        this.googleRouteMap().lat(lat);
        this.googleRouteMap().lng(lng);
    }

    googleOverviewMap: Observable = ko.observable({
        lat: ko.observable(),
        lng: ko.observable(),

        mapOptions: ko.observable({
            zoom: 18,
            mapTypeId: 'satellite'
        }),

        einsatzOrtMarker: true,
        route: false
    });

    googleRouteMap: Observable = ko.observable({
        lat: ko.observable(),
        lng: ko.observable(),

        mapOptions: ko.observable({
            zoom: 18,
            mapTypeId: 'roadmap'
        }),

        einsatzOrtMarker: false,
        route: true,

        distance: ko.observable("0 km"),
        duration: ko.observable("0 Minuten"),
    });

    distDuration: Computed = ko.computed(() => {
        return this.googleRouteMap().distance() + " - " + this.googleRouteMap().duration();
    });

    printingMaps: KnockoutObservableArray<any> = ko.observableArray([]);

    print() {
        let url = store.get("printing.url") as string;

        if (!url) {
            logger.info("Operation | No printing URL configured. Exiting.")
            return;
        }

        nunjucks.configure({autoescape: false});
        let templateFiles = fs.readdirSync(path.resolve(userDataPath, 'printingTemplates')).filter(fn => fn.endsWith('.html'));

        templateFiles.forEach((file: string) => {
            let templateFile = path.resolve(userDataPath, 'printingTemplates', file);
            let template = fs.readFileSync(templateFile, 'utf8')

            let parameters = this.parameters.toJSON();

            let aaoVehicleNames: string[] = [];
            let matchedAao = this.matchedAao();
            if (matchedAao) {
                let aaoVehicles = [...matchedAao.vehicles1(), ...matchedAao.vehicles2(), ...matchedAao.vehicles3()]
                aaoVehicles.forEach((aaoVehicle: Vehicle) => {
                    aaoVehicleNames.push(aaoVehicle.name());
                })
            }

            parameters['aaoVehicles'] = aaoVehicleNames;
            parameters['maps'] = this.printingMaps();

            logger.debug("Operation | Printing parameters: ", parameters);

            let res = nunjucks.renderString(template, parameters);
            let encoded = Buffer.from(res).toString("base64");

            const tmpRenderedTemplate = tmp.fileSync({postfix: '.html'});

            try {
                fs.writeFileSync(tmpRenderedTemplate.name, res);
                logger.info(`Operation | Saved rendered printing template to ${tmpRenderedTemplate.name}`)
            } catch (err) {
                logger.error("Operation | Error saving rendered printing template:", err);
            }

            let window_to_PDF = new BrowserWindow({show: false});
            window_to_PDF.loadFile(tmpRenderedTemplate.name);

            let defaultCopies = Number.parseInt(store.get("printing.defaultCopies", 1) as string) || 1;

            window_to_PDF.webContents.on("did-finish-load", () => {
                window_to_PDF.webContents.printToPDF({
                    landscape: false,
                    marginsType: 0,
                    printBackground: true,
                    printSelectionOnly: false,
                    pageSize: "A4",
                })
                    .then((buffer) => {
                        if (store.get("printing.storePDF", false)) {
                            fs.writeFileSync(path.resolve(userDataPath, 'printingTemplates', `${this.getParameter("keyword")}_${moment().unix()}.pdf`), buffer);
                        }
                    })
                    .then(() => {
                        return new Promise((resolve) => {
                            window_to_PDF.webContents.print({silent: true, printBackground: true, copies: aaoVehicleNames.length > 0 ? aaoVehicleNames.length : defaultCopies});
                            setTimeout(() => {
                                resolve(true);
                            }, 2000);
                        })
                    })
                    .finally(() => {
                        window_to_PDF.close();
                        tmpRenderedTemplate.removeCallback();
                    })
            });

            /**
             * @deprecated Will be removed in future release.
             */
            if (store.get("printing.remote")) {
                axios.post(url, {
                    html: encoded,
                    amount: aaoVehicleNames.length
                })
                    .then((response: any) => {
                        logger.info("Operation | Response from printing server:", response)
                    })
                    .catch((error: string) => {
                        logger.error("Operation | Error sending print request:", error)
                    })
            }
        });
    }

    doTextToSpeech() {
        let text = store.get("tts.text") as string;
        let matches = text.matchAll(/{{(.*?)}}/gm);
        let replacedText = text;

        // @ts-ignore
        for (const match of matches) {
            let replace = match[0];
            let parameter = match[1];
            let parameterContent = this.getParameter(parameter.trim());

            replacedText = replacedText.replace(replace, parameterContent ? parameterContent : "");
        }

        logger.info("Operation | TTS:", replacedText);

        let textToSpeech = new TextToSpeech(replacedText);
        textToSpeech.run();
    }

    constructor(id: number, keyword: string, keywordColor: string, description: string, alarmTime: string, adresse: string, objekt: string, alarmData?: any) {
        this.id(id);
        this.keyword(keyword);
        this.keywordColor(keywordColor);
        this.description(description);
        this.alarmTime(alarmTime);
        this.street(adresse);
        this.object(objekt);

        // Backwards compatibility
        this.parameters.set("keyword", keyword);
        this.parameters.set("keyword_color", keywordColor);
        this.parameters.set("keyword_description", description);
        this.parameters.set("location_dest", adresse);
        this.parameters.set("object", objekt);

        if (alarmData) {
            Object.keys(alarmData).forEach(key => {
                this.parameters.set(key, alarmData[key]);

                if (key == "vehicles") {
                    try {
                        let parsedVehicles = JSON.parse(alarmData[key]);
                        this.parameters.set(key, parsedVehicles);

                        // Todo: refactor this
                        parsedVehicles.forEach((vehicle: any) => {
                            this.units.push(vehicle.name);
                        })
                    } catch (e) {
                        logger.debug("Operation | Error while parsing vehicles from alarmData:", e)

                        let vehicles = alarmData[key].split("\n");

                        this.units(vehicles);
                        this.parameters.set(key, vehicles);
                    }
                }
            })
        }

        this.loadGoogleMap();

        if (store.get("printing.enabled")) {
            // Print alarm after 20 seconds
            setTimeout(() => {
                this.print();
            }, 1000 * (store.get("printing.delay", 20) as number));
        }

        if (store.get("tts.enabled")) {
            this.doTextToSpeech();
        }

        this.keywordColorBadge = ko.computed(() => {
            if (!this.keywordColor())
                return "badge-danger";

            return "badge-" + this.keywordColor();
        });

        this.getDescription = ko.computed(() => {
            if (this.description() != null)
                return this.description();

            if (this.desc && this.desc() != null) {
                return this.desc();
            }

            ko.utils.arrayForEach(this.zusatzinfos(), (zusatzinfo: any) => {
                if (zusatzinfo.name === "Meldebild") {
                    this.desc(zusatzinfo.value);

                    // Zusatzinfo löschen, da es bereits beim Stichwort angezeigt wird
                    this.zusatzinfos().splice(this.zusatzinfos().indexOf(this), 1);
                }
            });

            return this.desc();
        });

        this.getUnitsSorted = ko.computed(() => {
            let custom = (store.get("einsatz.einheitenAlwaysTop") as string).split(",");

            return this.units().reduce((acc, element) => {
                let found: boolean = false;

                custom.forEach((value: any) => {
                    if (element.includes(value)) {
                        found = true;
                    }
                });

                if (found) {
                    return [element, ...acc];
                }
                return [...acc, element];
            }, []);
        });

        this.getFeedbackPersonsSorted = ko.pureComputed(() => {
            return this.feedbackPersons().sort(function (a, b) {
                let sortVal = 0;

                if (a.feedback() === "YES" && b.feedback() !== "YES") {
                    sortVal--;
                }
                if (a.feedback() !== "YES" && b.feedback() === "YES") {
                    sortVal++;
                }

                if (a.functions().length > b.functions().length && (a.feedback() === "YES" && b.feedback() === "YES")) {
                    sortVal--;
                }
                if (a.functions().length < b.functions().length && (a.feedback() === "YES" && b.feedback() === "YES")) {
                    sortVal++;
                }

                if (a.functions().length > b.functions().length && (a.feedback() !== "YES" && b.feedback() !== "YES")) {
                    sortVal--;
                }
                if (a.functions().length < b.functions().length && (a.feedback() !== "YES" && b.feedback() !== "YES")) {
                    sortVal++;
                }

                // console.log(a.name() + " VS " + b.name() + ": " + sortVal);

                return sortVal;
            });
        });

        this.getVisibleUnitsSorted = ko.computed(() => {
            return this.getUnitsSorted().slice(0, store.get("einsatz.showEinheitenLimit"));
        });

        this.getInvisibleUnitsCount = ko.computed(() => {
            return this.units().length - (store.get("einsatz.showEinheitenLimit") as number);
        });
    }
}

export default Operation;
