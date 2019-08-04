function Einsatz(id, stichwort, stichwort_color, description, alarmzeit, adresse, objekt) {
    let self = this;

    self.id = ko.observable(id);
    self.stichwort = ko.observable(stichwort);
    self.stichwort_color = ko.observable(stichwort_color);
    self.description = ko.observable(description);
    self.alarmzeit = ko.observable(alarmzeit);
    self.adresse = ko.observable(adresse);
    self.objekt = ko.observable(objekt);
    self.einheiten = ko.observableArray([]);
    self.zusatzinfos = ko.observableArray([]);

    self.time_since_alarmierung = ko.observable("00:00");

    self.stichwort_color_badge = ko.computed(function () {
        if (!self.stichwort_color())
            return "badge-danger";

        return "badge-" + self.stichwort_color();
    });

    self.desc = ko.observable();
    self.get_description = ko.computed(function () {
        if (self.description() != null)
            return self.description();

        if (self.desc() != null) {
            return self.desc();
        }

        ko.utils.arrayForEach(self.zusatzinfos(), function (zusatzinfo) {
            if (zusatzinfo.name === "Meldebild") {
                self.desc(zusatzinfo.value);

                // Zusatzinfo löschen, da es bereits beim Stichwort angezeigt wird
                self.zusatzinfos().splice(self.zusatzinfos().indexOf(this), 1);
            }
        });
        return self.desc();
    });

    self.get_einheiten_sorted = ko.computed(() => {
        let custom = config.einsatz.einheitenAlwaysTop;

        sorted__array = self.einheiten().reduce((acc, element) => {
            var found = false;

            custom.forEach((value) => {
                if (element.includes(value)) {
                    found = true;
                }
            });

            if (found === true) {
                return [element, ...acc];
            }
            return [...acc, element];
        }, []);

        return sorted__array;
    });

    self.get_visible_einheiten_sorted = ko.computed(() => {
        return self.get_einheiten_sorted().slice(0, config.einsatz.showEinheitenLimit);
    });

    self.get_invisible_einheiten_count = ko.computed(() => {
        return self.einheiten().length - config.einsatz.showEinheitenLimit;
    });

    let removeTimer = window.setInterval(function () {
        let now = Date.now() / 1000 | 0;
        let diff = now - self.alarmzeit();

        let minutes = Math.floor(diff / 60);
        let seconds = diff - minutes * 60;

        let finalTime = str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds | 0, '0', 2);

        self.time_since_alarmierung(finalTime);

        if (minutes >= config.einsatz.einsatzDisplayTime) {
            clearInterval(removeTimer);
            einsatzMonitorModel.einsaetze.splice(einsatzMonitorModel.einsaetze().indexOf(this), 1);

            window.dispatchEvent(new CustomEvent(
                "einsatzRemoved",
                {
                    detail: {
                        message: "Hello World!",
                        time: new Date(),
                    },
                    bubbles: true,
                    cancelable: false
                }
            ));
        }
    }, 500);

    /* Google Maps Karten */
    let geocoder = new google.maps.Geocoder();

    self.load_map = function () {
        geocoder.geocode({'address': self.adresse()}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                let latitude = results[0].geometry.location.lat();
                let longitude = results[0].geometry.location.lng();

                self.overview_map().lat(latitude);
                self.overview_map().lng(longitude);

                self.route_map().lat(latitude);
                self.route_map().lng(longitude);
            }
        });
    };

    self.load_map();

    self.overview_map = ko.observable({
        lat: ko.observable(),
        lng: ko.observable(),

        mapOptions: ko.observable({
            zoom: 18,
            mapTypeId: google.maps.MapTypeId.SATELLITE
        }),

        einsatzOrtMarker: true,
        route: false
    });

    self.route_map = ko.observable({
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

    self.distDuration = ko.computed(function () {
        return self.route_map().distance() + " - " + self.route_map().duration();
    });
}

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

    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
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

            let feuerwehr = new google.maps.LatLng(config.feuerwehrLat, config.feuerwehrLng);

            directionsDisplay.setMap(mapObj.googleMap);

            let request = {
                origin: feuerwehr,
                destination: einsatzortLatLng,
                travelMode: google.maps.TravelMode["DRIVING"],
                region: "de"
            };
            directionsService.route(request, function (response, status) {
                if (status === 'OK') {
                    directionsDisplay.setDirections(response);

                    // result will contain only 1 route without "alternatives=true"
                    // route will contain only 1 leg with no waypoints
                    let distance = response.routes[0].legs[0].distance.text;
                    let duration = response.routes[0].legs[0].duration.text;

                    mapObj.distance(distance);
                    mapObj.duration(duration);

                    static_url = 'https://maps.googleapis.com/maps/api/staticmap' +
                        '?size=500x500' +
                        '&scale=2' +
                        '&language=de' +
                        '&maptype=ROADMAP' +
                        '&path=enc:' + response.routes[0].overview_polyline +
                        '&markers=size:mid|color:green|' + feuerwehr.lat() + ',' + feuerwehr.lng() +
                        '&markers=size:mid|color:red|' + mapObj.lat() + ',' + mapObj.lng() +
                        '&key=' + config.googleMapsKey;
                }
            });
        }

        //$("#" + element.getAttribute("id")).data("mapObj", mapObj);
    }
};

function Info() {
    let self = this;

    self.news = ko.observableArray();
    self.einsaetze = ko.observableArray();
    self.dienste = ko.observableArray();

    self.sortedNews = ko.computed(function () {
        return self.news().sort(function (a, b) {
            return b.id() - a.id();
        });
    });

    self.sortedEinsaetze = ko.computed(function () {
        return self.einsaetze().sort(function (a, b) {
            //return a.id() < b.id() ? -1 : (a.id() > b.id() ? 1 : 0);
            return b.id() - a.id();
            //return a.id() == b.id() ? 0 : (a.id() < b.id() ? -1 : 1)
        });
    });

    // sort by start_date since the newest entry is not always the last dienst
    self.sortedDienste = ko.computed(function () {
        return self.dienste().sort(function (a, b) {
            return a.start() < b.start() ? -1 : (a.start() > b.start() ? 1 : 0);
        });
    });

    self.date = ko.observable(new Date());
    self.parsed_clock = ko.computed(function () {
        return str_pad_left(self.date().getHours(), '0', 2) + ":" + str_pad_left(self.date().getMinutes(), '0', 2) + ":" + str_pad_left(self.date().getSeconds(), '0', 2)
    });

    setInterval(function () {
        self.date(new Date());
    }, 1000 * 1);
}

function NewsPost(id, title, image, description_truncated, date_formatted) {
    let self = this;

    self.id = ko.observable(id);
    self.title = ko.observable(title);
    self.image_url = ko.observable(image);
    self.description_truncated = ko.observable(description_truncated);
    self.date_formatted = ko.observable(date_formatted);
}

function InfoEinsatz(id, title, alarmzeit, alarmzeit_formatted, color) {
    let self = this;

    self.id = ko.observable(id);
    self.title = ko.observable(title);
    self.alarmzeit = ko.observable(alarmzeit);
    self.alarmzeit_formatted = ko.observable(alarmzeit_formatted);
    self.color = ko.observable(color);
}

function Dienst(id, title, description, start, is_today) {
    let self = this;

    self.id = ko.observable(id);
    self.title = ko.observable(title);
    self.description = ko.observable(description);
    self.start = ko.observable(start);
    self.is_today = ko.observable(is_today);

    self.startDate = ko.computed(function () {
        return new Date(self.start());
    });

    self.startUhrzeit = ko.computed(function () {
        return str_pad_left(self.startDate().getHours(), '0', 2) + ":" + str_pad_left(self.startDate().getMinutes(), '0', 2)
    });
}