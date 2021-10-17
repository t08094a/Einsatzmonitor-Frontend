import Geocoder from "./Geocoder";
import GeocodingResult from "./GeocodingResult";
import {logger, store} from "../../common/common";
import axios from "axios";

class GraphHopperGeocoder implements Geocoder {
    geocode(address: string): Promise<GeocodingResult> {
        return new Promise<GeocodingResult>((resolve, reject) => {
            logger.info("GraphHopperGeocoder | Using graphhopper geocoder to get lat/lng from provided address.");

            axios.get(`https://graphhopper.com/api/1/geocode?q=${address}&locale=de&key=${store.get("graphhopper.apikey") as string}`)
                .then(response => {
                    logger.debug("GraphHopperGeocoder | Geocoding response:", response);

                    if (response.status == 200) {
                        let latitude = response.data.hits[0].point.lat;
                        let longitude = response.data.hits[0].point.lng;

                        return resolve(new GeocodingResult(latitude, longitude));
                    }
                })
                .catch(e => reject(e));
        });
    }

}

export default GraphHopperGeocoder;
