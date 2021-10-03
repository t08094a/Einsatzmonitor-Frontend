import Widget from "../Widget";
import EinsatzMonitorModel from "../../EinsatzMonitor";
import {logger, userDataPath} from "../../../common/common";
import * as L from "leaflet";
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';


class LeafletMapWidget extends Widget {
    main: EinsatzMonitorModel;
    map?: L.Map;

    lat?: string;
    lng?: string;

    loaded() {
        this.loadMap();
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

    addHydrantsToMap() {
        let hydrantFiles = fs.readdirSync(path.resolve(userDataPath, 'hydrants')).filter(fn => fn.endsWith('.csv'));

        logger.info("Adding hydrants to map: ", hydrantFiles);

        hydrantFiles.forEach((file: string) => {
            fs.createReadStream(path.resolve(userDataPath, 'hydrants', file))
                .pipe(csv.parse({ headers: true, delimiter: ';' }))
                .on('error', error => logger.error("Fehler beim Laden der Hydranten: ", error))
                .on('data', row => {
                    if (this.map) {
                        L.circleMarker([row['X-Koordinaten'].replace(",", "."), row['Y-Koordinate'].replace(",", ".")], {
                            color: row["Farbe"] || "#c9000d",
                            radius: 6,
                            fillOpacity: 0.5
                        }).addTo(this.map);
                    }
                })
                .on('end', (rowCount: number) => console.log(`${rowCount} Hydranten geladen`));
        })
    }

    loadMap() {
        if (!this.lat || !this.lng) {
            return;
        }

        logger.info("LeafletMapWidget | Loading LeafletMap");

        let zoom = this.extra_config.get('zoom')() ? Number.parseInt(this.extra_config.get('zoom')()) : 12;
        this.map = L.map('leaflet-' + this.id, {
            preferCanvas: true,
        }).setView([Number.parseFloat(this.lat), Number.parseFloat(this.lng)], zoom);

        if (this.extra_config.get('add-hydrants')()) {
            this.addHydrantsToMap();
        }

        switch (this.extra_config.get('layerName')()) {
            case "OpenStreetMap": {
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(this.map);
                break;
            }

            case "WebAtlas_NI": {
                L.tileLayer.wms('https://www.geobasisdaten.niedersachsen.de/doorman/noauth/mapproxy_webatlasni', {
                    layers: 'wa_25832_f'
                }).addTo(this.map);
                break;
            }

            case "CustomWMS": {
                let wmsUrl = this.extra_config.get('customWMSUrl')();
                let wmsLayers = this.extra_config.get('customWMSLayers')();

                if (wmsUrl && wmsLayers) {
                    L.tileLayer.wms(wmsUrl, {
                        layers: wmsLayers
                    }).addTo(this.map);
                }
                break;
            }
        }

        L.marker([Number.parseFloat(this.lat), Number.parseFloat(this.lng)]).addTo(this.map);
    }

    constructor(main: EinsatzMonitorModel, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.main = main;

        this.main.getLatestOperation().googleOverviewMap().lat.subscribe((newValue: any) => {
            if (this.lat !== newValue) {
                this.lat = newValue;
                this.refreshMap();
            }
        })

        this.main.getLatestOperation().googleOverviewMap().lng.subscribe((newValue: any) => {
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
        this.lat = this.main.getLatestOperation().googleOverviewMap().lat();
        this.lng = this.main.getLatestOperation().googleOverviewMap().lng();

        setTimeout(this.loadMap, 500);

        logger.info("Loaded LeafletMapWidget");
    }
}

export default LeafletMapWidget;
