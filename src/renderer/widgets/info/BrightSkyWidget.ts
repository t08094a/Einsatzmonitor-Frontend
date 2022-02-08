import {axiosConfigParams, logger, store} from "../../../common/common";
import axios from "axios";
import Widget from "../Widget";
import {Observable} from "knockout";
import ko from "knockout";
import moment from "moment";

class BrightSkyWidget extends Widget {
    name: Observable<string> = ko.observable("");
    temperature: Observable<string> = ko.observable("");
    windSpeed: Observable<string> = ko.observable("");
    cloudCover: Observable<string> = ko.observable("");
    rain: Observable<string> = ko.observable("");
    icon: Observable<string> = ko.observable("");

    temperatureMorning: Observable<string> = ko.observable("");
    iconMorning: Observable<string> = ko.observable("");

    temperatureMidday: Observable<string> = ko.observable("");
    iconMidday: Observable<string> = ko.observable("");

    temperatureEvening: Observable<string> = ko.observable("");
    iconEvening: Observable<string> = ko.observable("");

    getIcon(icon: string) {
        switch (icon) {
            case "clear-day":
                return "wu-day wu-clear"
            case "clear-night":
                return "wu-night wu-clear"
            case "partly-cloudy-day":
                return "wu-day wu-partlycloudy"
            case "partly-cloudy-night":
                return "wu-night wu-partlycloudy"
            case "cloudy":
                return "wu-day wu-cloudy"
            case "fog":
                return "wu-day wu-fog"
            case "wind":
                return "wu-day wu-cloudy"  // Todo: Better wind icon?
            case "rain":
                return "wu-day wu-rain"
            case "sleet":
                return "wu-day wu-sleet"
            case "snow":
                return "wu-day wu-snow"
            case "hail":
                return "wu-day wu-sleet"
            case "thunderstorm":
                return "wu-day wu-tstorms"

            default:
                return "wu-clear"
        }
    }

    updateWeather() {
        let currentDate = moment().format("YYYY-MM-DD");
        let currentHour = moment().format("H");

        axios.get(`https://api.brightsky.dev/weather?lat=${store.get("feuerwehrLat")}&lon=${store.get("feuerwehrLng")}&date=${currentDate}`, axiosConfigParams)
            .then((response) => {
                if (response.status === 200) {
                    this.temperature(`${response.data.weather[currentHour].temperature} °C`);
                    this.windSpeed(`${response.data.weather[currentHour].wind_speed} km/h`);
                    this.cloudCover(`${response.data.weather[currentHour].cloud_cover} %`);
                    this.rain(`${response.data.weather[currentHour].precipitation} mm/h`);
                    this.icon(this.getIcon(response.data.weather[currentHour].icon));

                    this.temperatureMorning(`${response.data.weather[8].temperature} °C`);
                    this.iconMorning(this.getIcon(response.data.weather[8].icon));

                    this.temperatureMidday(`${response.data.weather[12].temperature} °C`);
                    this.iconMidday(this.getIcon(response.data.weather[12].icon));

                    this.temperatureEvening(`${response.data.weather[16].temperature} °C`);
                    this.iconEvening(this.getIcon(response.data.weather[16].icon));
                    logger.info("BrightSkyWidget | Successfully updated weather from BrightSky server.")
                }
            })
            .catch((error_resp) => {
                logger.error(`BrightSkyWidget | Error while requesting weather from BrightSky server: ${error_resp.toString()}`);
            })
    }

    loaded() {
        this.updateWeather();
    }

    constructor(main: any, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.updateWeather();
        }, 1000 * 60 * 15);

        logger.info("Loaded BrightSkyWidget");
    }
}

export default BrightSkyWidget;
