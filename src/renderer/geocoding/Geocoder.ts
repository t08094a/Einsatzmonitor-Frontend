import GeocodingResult from "./GeocodingResult";

interface Geocoder {
    geocode(address: string): Promise<GeocodingResult>;
}

export default Geocoder;
