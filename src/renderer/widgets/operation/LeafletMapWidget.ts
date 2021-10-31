import Widget from "../Widget";
import EinsatzMonitorModel from "../../EinsatzMonitor";
import {logger, store, userDataPath} from "../../../common/common";
import * as L from "leaflet";
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import {TileLayer} from "leaflet";
import 'leaflet-routing-machine';
import 'lrm-graphhopper';

let leafletImage = require('leaflet-image');


class LeafletMapWidget extends Widget {
    main: EinsatzMonitorModel;
    map?: L.Map;

    lat: string;
    lng: string;

    afterAdd() {
        this.loadMap();
    }

    loaded() {
    }

    destroy() {
        this.removeMap();
    }

    resized() {
        logger.info("LeafletMapWidget | Resizing LeafletMap")
        this.map?.invalidateSize();
    }

    refreshMap() {
        this.removeMap();
        this.loadMap();
    }

    removeMap() {
        this.map?.off();
        this.map?.remove();
    }

    addHydrantsToMap(): Promise<any> {
        let hydrantFiles = fs.readdirSync(path.resolve(userDataPath, 'hydrants')).filter(fn => fn.endsWith('.csv'));

        logger.info("LeafletMapWidget | Adding hydrants to map: ", hydrantFiles);

        this.map?.createPane('hydrants');

        let promises = hydrantFiles.map((file: string) => {
            return new Promise((resolve, reject) => {
                fs.createReadStream(path.resolve(userDataPath, 'hydrants', file))
                    .pipe(csv.parse({headers: true, delimiter: ';'}))
                    .on('error', error => {
                        logger.error("LeafletMapWidget | Fehler beim Laden der Hydranten: ", error);
                        reject(error);
                    })
                    .on('data', row => {
                        if (this.map) {
                            L.circleMarker([row['X-Koordinaten'].replace(",", "."), row['Y-Koordinate'].replace(",", ".")], {
                                color: row["Farbe"] || "#c9000d",
                                radius: 6,
                                fillOpacity: 0.5,
                                // pane: 'hydrants'
                            }).addTo(this.map);
                        }
                    })
                    .on('end', (rowCount: number) => {
                        logger.info(`LeafletMapWidget | ${rowCount} Hydranten geladen`);
                        resolve(rowCount);
                    });
            });
        });

        return Promise.all(promises);
    }

    addRoutingToMap() {
        return new Promise((resolve, reject) => {
            if (!this.map)
                return;

            // @ts-ignore
            let router = new L.Routing.GraphHopper(store.get("graphhopper.apikey") as string)

            L.Routing.control({
                router: router,
                waypoints: [
                    L.latLng(store.get("feuerwehrLat") as number, store.get("feuerwehrLng") as number),
                    L.latLng(Number.parseFloat(this.lat), Number.parseFloat(this.lng))
                ],
                lineOptions: {
                    styles: [
                        {color: '#50a5ff', opacity: 1, weight: 10},
                        {color: '#73B9FF', opacity: 1, weight: 5}
                    ],
                    extendToWaypoints: true,
                    missingRouteTolerance: 10
                },
                fitSelectedRoutes: this.extra_config.get("route-show-full")()
            }).addTo(this.map);

            router.on('response', (response: any) => {
                logger.debug('LeafletMapWidget | This routing request consumed ' + response.credits + ' credit(s)');
                logger.debug('LeafletMapWidget | You have ' + response.remaining + ' left');
                resolve(true);
            })
        });
    }

    loadMap() {
        if (!this.lat || !this.lng) {
            return;
        }

        if (!$('#leaflet-' + this.id).length) {
            return;
        }

        logger.info("LeafletMapWidget | Loading LeafletMap");

        let zoom = this.extra_config.get('zoom')() ? Number.parseInt(this.extra_config.get('zoom')()) : 12;

        this.map = L.map('leaflet-' + this.id, {
            preferCanvas: true,
            zoomControl: false
        }).setView([Number.parseFloat(this.lat), Number.parseFloat(this.lng)], zoom);

        let promises: Promise<any>[] = []

        if (this.extra_config.get('route-show')() && store.get("routing.enabled")) {
            promises.push(this.addRoutingToMap());
        }

        if (this.extra_config.get('add-hydrants')()) {
            promises.push(this.addHydrantsToMap());
        }

        let tileLayer: TileLayer;
        switch (this.extra_config.get('layerName')()) {
            case "OpenStreetMap": {
                tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(this.map);
                break;
            }

            case "WebAtlas_NI": {
                tileLayer = L.tileLayer.wms('https://www.geobasisdaten.niedersachsen.de/doorman/noauth/mapproxy_webatlasni', {
                    layers: 'wa_25832_f'
                }).addTo(this.map);
                break;
            }

            case "CustomWMS": {
                let wmsUrl = this.extra_config.get('customWMSUrl')();
                let wmsLayers = this.extra_config.get('customWMSLayers')();

                if (wmsUrl && wmsLayers) {
                    tileLayer = L.tileLayer.wms(wmsUrl, {
                        layers: wmsLayers
                    }).addTo(this.map);
                }
                break;
            }
        }

        let tileLoadingPromise = new Promise((resolve, reject) => {
            tileLayer.on("load", () => {
                logger.info("LeafletMapWidget | All visible tiles have been loaded.");
                resolve(true);
            })
        })

        promises.push(tileLoadingPromise);

        L.marker([Number.parseFloat(this.lat), Number.parseFloat(this.lng)]).addTo(this.map);

        Promise.all(promises).then(() => {
            logger.info("LeafletMapWidget | Map has been fully loaded.");
            leafletImage(this.map, (err: any, canvas: any) => {
                if (!this.map)
                    return;

                if (!this.extra_config.get('printing-save')())
                    return;

                let printingId = this.extra_config.get('printing-id')();

                if (!printingId)
                    return;

                logger.debug("LeafletMapWidget | Printing ID: " + printingId);
                this.main.getLatestOperation().printingMaps.push({'printingId': printingId, 'imgBase64': canvas.toDataURL()});
            });
        })
    }

    constructor(main: EinsatzMonitorModel, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.main = main;

        this.main.getLatestOperation().parameters.get("lat").subscribe((newValue: any) => {
            if (this.lat !== newValue) {
                this.lat = newValue;
                this.refreshMap();
            }
        })

        this.main.getLatestOperation().parameters.get("lng").subscribe((newValue: any) => {
            if (this.lng !== newValue) {
                this.lng = newValue;
                this.refreshMap();
            }
        })

        this.extra_config.get('layerName').subscribe((newValue: any) => {
            logger.info("LeafletMapWidget | Layer changed")
            this.refreshMap();
        });

        this.extra_config.get('zoom').subscribe((newValue: any) => {
            logger.info("LeafletMapWidget | Zoom changed")
            if (this.lat && this.lng) {
                this.map?.setZoomAround(L.latLng(Number.parseFloat(this.lat), Number.parseFloat(this.lng)), newValue);
            } else {
                this.map?.setZoom(newValue);
            }
        });

        // Try to load initial coordinates
        this.lat = this.main.getLatestOperation().getParameter("lat");
        this.lng = this.main.getLatestOperation().getParameter("lng");

        logger.info("Loaded LeafletMapWidget");
    }
}

export default LeafletMapWidget;
