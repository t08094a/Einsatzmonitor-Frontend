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
    self.distance = ko.observable("0 km");
    self.duration = ko.observable("0 Minuten");
    self.distDuration = ko.computed(function () {
        return self.distance() + " - " + self.duration();
    });

    self.stichwort_color_badge = ko.computed(function () {
        if (!self.stichwort_color())
            return "badge-danger";

        return "badge-" + self.stichwort_color();
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
            einsatzMonitorModel.einsatz(null);
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
    let feuerwehr = new google.maps.LatLng(config.feuerwehrLat, config.feuerwehrLng);
    let mapOptions = {
        zoomControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        mapTypeId: 'satellite',
        zoom: 0,
        center: feuerwehr
    };

    geocoder.geocode({'address': self.adresse()}, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            let latitude = results[0].geometry.location.lat();
            let longitude = results[0].geometry.location.lng();
            let latLng = {lat: latitude, lng: longitude};

            /* Overview Map */
            mapOptions['zoom'] = 18;
            mapOptions['center'] = latLng;

            let overview_map = new google.maps.Map(document.getElementById('map-overview'), mapOptions);

            let marker = new google.maps.Marker({
                position: latLng,
                map: overview_map,
                title: 'Einsatzort'
            });

            /* Route */
            let directionsService = new google.maps.DirectionsService();
            let directionsDisplay = new google.maps.DirectionsRenderer();

            let einsatzort = new google.maps.LatLng(latitude, longitude);

            mapOptions['zoom'] = 14;
            mapOptions['mapTypeId'] = 'roadmap';

            let map = new google.maps.Map(document.getElementById('map-route'), mapOptions);
            directionsDisplay.setMap(map);

            let request = {
                origin: feuerwehr,
                destination: einsatzort,
                // Note that Javascript allows us to access the constant
                // using square brackets and a string value as its
                // "property."
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

                    self.distance(distance);
                    self.duration(duration);
                }
            });

        }
    });
}

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