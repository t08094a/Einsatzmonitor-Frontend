import {client, logger, store} from "../../common/common";
import Geocoder from "./Geocoder";
import GeocodingResult from "./GeocodingResult";

class GoogleGeocoder implements Geocoder {
    geocode(address: string): Promise<GeocodingResult> {
        return new Promise<GeocodingResult>((resolve, reject) => {
            logger.info("GoogleGeocoder | Using google geocoder to get lat/lng from provided address.");

            client
                .geocode({
                    params: {
                        address: address,
                        key: store.get("google.apikey") as string
                    }
                })
                .then(r => {
                    logger.debug("GoogleGeocoder | Geocoding response:", r);

                    let latitude = r.data.results[0].geometry.location.lat;
                    let longitude = r.data.results[0].geometry.location.lng;

                    return resolve(new GeocodingResult(latitude, longitude));
                })
                .catch(e => reject(e));
        });
    }
}

export default GoogleGeocoder;
