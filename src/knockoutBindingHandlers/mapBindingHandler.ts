import settings from "electron-settings";
import {loader, logger} from "../common/common";
import * as ko from "knockout";


const mapBindingHandler = {
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
        let mapObj = ko.utils.unwrapObservable(valueAccessor());
        // console.log("update triggered (" + mapObj.lat() + ":" + mapObj.lng() + ")");

        if (!mapObj)
            return;

        if (!mapObj.lat() || !mapObj.lng())
            return;

        loader
            .load()
            .then((google) => {
                let einsatzortLatLng = new google.maps.LatLng(ko.utils.unwrapObservable(mapObj.lat), ko.utils.unwrapObservable(mapObj.lng));

                let options = mapObj.mapOptions();
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

                    let feuerwehr = new google.maps.LatLng(settings.getSync("feuerwehrLat"), settings.getSync("feuerwehrLng"));

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
                                '&key=' + settings.getSync("googleMapsKey");

                            logger.info(`StaticMap-URL: ${static_url}`)
                        }
                    });
                }
            })
            .catch(e => logger.error(e));

        //$("#" + element.getAttribute("id")).data("mapObj", mapObj);
    }
} as KnockoutBindingHandler;

export default mapBindingHandler;