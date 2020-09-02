import {Computed, Observable, ObservableArray, PureComputed} from 'knockout';
import Person from './Person';
import Functioning from './Functioning';
import {debug, info} from "electron-log";
import moment from "moment";
import {em, str_pad_left} from "../common";
import settings from "electron-settings";

const ko = require('knockout');
const google = require('google');

// Todo: refactor into module
ko.bindingHandlers.map = {
    /*init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var mapObj = ko.utils.unwrapObservable(valueAccessor());

        var latLng = new google.maps.LatLng(ko.utils.unwrapObservable(mapObj.lat), ko.utils.unwrapObservable(mapObj.lng));

        var options = mapObj.mapOptions();
        options['center'] = latLng;

        options['zoomControl'] = false;
        options['fullscreenControl'] = false;
        options['streetViewControl'] = false;
        options['mapTypeControl'] = false;

        mapObj.googleMap = new google.maps.Map(element, options);

        if (mapObj.einsatzOrtMarker) {
            mapObj.marker = new google.maps.Marker({
                map: mapObj.googleMap,
                position: latLng,
                title: "Einsatzort",
                draggable: true
            });
        }


        //$("#" + element.getAttribute("id")).data("mapObj", mapObj);
    },*/

    update: function (element: any, valueAccessor: any, allBindingsAccessor: any, viewModel: any) {
        var mapObj = ko.utils.unwrapObservable(valueAccessor());
        // console.log("update triggered (" + mapObj.lat() + ":" + mapObj.lng() + ")");

        if (!mapObj.lat() || !mapObj.lng())
            return;

        var einsatzortLatLng = new google.maps.LatLng(ko.utils.unwrapObservable(mapObj.lat), ko.utils.unwrapObservable(mapObj.lng));

        var options = mapObj.mapOptions();
        options['center'] = einsatzortLatLng;

        options['zoomControl'] = false;
        options['fullscreenControl'] = false;
        options['streetViewControl'] = false;
        options['mapTypeControl'] = false;

        mapObj.googleMap = new google.maps.Map(element, options);

        if (mapObj.einsatzOrtMarker) {
            mapObj.marker = new google.maps.Marker({
                map: mapObj.googleMap,
                position: einsatzortLatLng,
                title: "Einsatzort",
                draggable: true
            });
        }

        if (mapObj.route) {
            let directionsService = new google.maps.DirectionsService();
            let directionsDisplay = new google.maps.DirectionsRenderer();

            let feuerwehr = new google.maps.LatLng(settings.get("feuerwehrLat"), settings.get("feuerwehrLng"));

            directionsDisplay.setMap(mapObj.googleMap);

            let request = {
                origin: feuerwehr,
                destination: einsatzortLatLng,
                travelMode: google.maps.TravelMode["DRIVING"],
                region: "de"
            };
            directionsService.route(request, (response: any, status: any) => {
                if (status === 'OK') {
                    directionsDisplay.setDirections(response);

                    // result will contain only 1 route without "alternatives=true"
                    // route will contain only 1 leg with no waypoints
                    let distance = response.routes[0].legs[0].distance.text;
                    let duration = response.routes[0].legs[0].duration.text;

                    mapObj.distance(distance);
                    mapObj.duration(duration);

                    let static_url = 'https://maps.googleapis.com/maps/api/staticmap' +
                        '?size=500x500' +
                        '&scale=2' +
                        '&language=de' +
                        '&maptype=ROADMAP' +
                        '&path=enc:' + response.routes[0].overview_polyline +
                        '&markers=size:mid|color:green|' + feuerwehr.lat() + ',' + feuerwehr.lng() +
                        '&markers=size:mid|color:red|' + mapObj.lat() + ',' + mapObj.lng() +
                        '&key=' + settings.get("googleMapsKey");

                    info(`StaticMap-URL: ${static_url}`)
                }
            });
        }

        //$("#" + element.getAttribute("id")).data("mapObj", mapObj);
    }
};

class Einsatz {
    id: Observable = ko.observable();
    stichwort: Observable = ko.observable();
    stichwort_color: Observable = ko.observable();
    description: Observable = ko.observable();
    alarmzeit: Observable = ko.observable();
    alarmzeit_datetime: Observable = ko.observable();
    adresse: Observable = ko.observable();
    objekt: Observable = ko.observable();
    einheiten: ObservableArray = ko.observableArray([]);
    zusatzinfos: ObservableArray = ko.observableArray([]);
    feedback_persons: ObservableArray = ko.observableArray([]);
    feedback_fe2_id: Observable = ko.observable();

    time_since_alarmierung: Observable = ko.observable("00:00");

    stichwort_color_badge: Computed;

    desc: Observable = ko.observable();

    get_description: Computed;
    get_einheiten_sorted: Computed;

    get_feedback_persons_sorted: PureComputed;

    is_feedback_person_saved = (feedback: any) => {
        return ko.utils.arrayFirst(this.feedback_persons(), (item: any) => {
            return feedback.name === item.name();
        });
    };

    load_alamos_feedback = () => {
        var request = require('request');
        request('https://apager-firemergency-2.appspot.com/fe2/feedback?dbId=' + this.feedback_fe2_id(), (error: any, response: any, body: any) => {
            info(`Alamos Feedback Request | Status: ${response.statusCode}`);

            if (response.statusCode === 200) {
                var response_json = JSON.parse(body);
                var lstOfFeedbacks = response_json.lstOfFeedbacks;

                lstOfFeedbacks.forEach((feedback: any) => {
                    if (this.is_feedback_person_saved(feedback)) {
                        // update
                        debug(`${feedback.name} is already saved in feedback list. Updating entry`);

                        ko.utils.arrayFirst(this.feedback_persons(), (item: any) => {
                            if (feedback.name === item.name()) {
                                item.feedback(feedback.state);
                            }
                            return true;
                            // Todo: is this correct?
                        });
                    } else {
                        // new
                        info(`Creating new feedback entry for ${feedback.name}`);
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
                        this.feedback_persons.push(person);
                    }
                })
            }
        })
    };

    get_function_count = (fn: any, feedback: any) => {
        let count = 0;
        let check: any;

        if (feedback === "YES")
            check = ["YES", "HERE"];
        else if (feedback === "NO")
            check = ["NO", "ABSENT"];
        else
            check = ["RECEIVED", "READ", "FREE"];

        this.feedback_persons().forEach(item => {
            item.functions().forEach((func: any) => {
                let function_name = func.name();

                if (function_name === fn && check.includes(item.feedback())) {
                    count++;
                }
            })
        });

        return count;
    };

    get_visible_einheiten_sorted: Computed;
    get_invisible_einheiten_count: Computed;

    removeTimer = window.setInterval(() => {
        let now = Date.now() / 1000 | 0;
        let diff = now - this.alarmzeit();

        if (diff > 900) {
            this.alarmzeit_datetime(moment(this.alarmzeit() * 1000).format("DD.MM.YYYY HH:mm:ss"));
        }

        let minutes = Math.floor(diff / 60);
        let seconds = diff - minutes * 60;

        let finalTime = str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds | 0, '0', 2);

        this.time_since_alarmierung(finalTime);

        if (minutes >= (settings.get("einsatz.displayTime") as number)) {
            this.stopTasks();

            // Trigger EinsatzRemove event
            em.emit('EinsatzRemove', this);
        }
    }, 500);

    getFeedbackTimer = window.setInterval(() => {
        if (this.feedback_fe2_id() == null) {
            info("No feedback ID found. Not requesting Alamos feedback.");
            return;
        }

        this.load_alamos_feedback();
    }, 5000);

    stopTasks() {
        clearInterval(this.removeTimer);
        clearInterval(this.getFeedbackTimer);
    };

    /* Google Maps Karten */

    load_map() {
        info("Loading google map")
        let geocoder = new google.maps.Geocoder();
        geocoder.geocode({'address': this.adresse()}, (results: any, status: any) => {
            if (status === google.maps.GeocoderStatus.OK) {
                let latitude = results[0].geometry.location.lat();
                let longitude = results[0].geometry.location.lng();

                this.overview_map().lat(latitude);
                this.overview_map().lng(longitude);

                this.route_map().lat(latitude);
                this.route_map().lng(longitude);
            }
        });
    };

    overview_map: Observable = ko.observable({
        lat: ko.observable(),
        lng: ko.observable(),

        mapOptions: ko.observable({
            zoom: 18,
            mapTypeId: google.maps.MapTypeId.SATELLITE
        }),

        einsatzOrtMarker: true,
        route: false
    });

    route_map: Observable = ko.observable({
        lat: ko.observable(),
        lng: ko.observable(),

        mapOptions: ko.observable({
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }),

        einsatzOrtMarker: false,
        route: true,

        distance: ko.observable("0 km"),
        duration: ko.observable("0 Minuten"),
    });

    distDuration: Computed = ko.computed(() => {
        return this.route_map().distance() + " - " + this.route_map().duration();
    });

    constructor(id: number, stichwort: string, stichwort_color: string, description: string, alarmzeit: string, adresse: string, objekt: string) {
        this.id = ko.observable(id);
        this.stichwort = ko.observable(stichwort);
        this.stichwort_color = ko.observable(stichwort_color);
        this.description = ko.observable(description);
        this.alarmzeit = ko.observable(alarmzeit);
        this.adresse = ko.observable(adresse);
        this.objekt = ko.observable(objekt);
        this.load_map();

        this.stichwort_color_badge = ko.computed(() => {
            console.log(this);
            console.log(this.stichwort_color());
            if (!this.stichwort_color())
                return "badge-danger";

            return "badge-" + this.stichwort_color();
        });

        this.get_description = ko.computed(() => {
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

        this.get_einheiten_sorted = ko.computed(() => {
            let custom = (settings.get("einsatz.einheitenAlwaysTop") as string).split(",");

            return this.einheiten().reduce((acc, element) => {
                let found = false;

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

        this.get_feedback_persons_sorted = ko.pureComputed(() => {
            return this.feedback_persons().sort(function (a, b) {
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

        this.get_visible_einheiten_sorted = ko.computed(() => {
            return this.get_einheiten_sorted().slice(0, settings.get("einsatz.showEinheitenLimit"));
        });

        this.get_invisible_einheiten_count = ko.computed(() => {
            return this.einheiten().length - (settings.get("einsatz.showEinheitenLimit") as number);
        });
    }
}

export default Einsatz;