import Widget from "../Widget";
import axios from "axios";
import {axiosConfigParams, logger} from "../../../common/common";
import {Computed, Observable} from "knockout";

const ko = require('knockout');

class WeatherWidget extends Widget {
    actionTimer: number;

    name: Observable<string> = ko.observable();
    description: Observable<string> = ko.observable();
    temperature: Observable<string> = ko.observable();
    iconId: Observable<number> = ko.observable();

    descriptionWithText: Computed = ko.computed(() => {
        return this.description() + ", " + this.temperature() + "°C";
    });

    getDisplayName: Computed = ko.computed(() => {
        return this.extra_config.get('customName')() ? this.extra_config.get('customName')() : this.name();
    });

    isDay: Observable<boolean> = ko.observable();

    icon: Computed = ko.computed(() => {
        switch (this.iconId()) {
            case 200:
            case 201:
            case 202:
            case 210:
            case 211:
            case 212:
            case 221:
            case 230:
            case 231:
            case 232:
                return this.isDay() ? "thunder_day" : "thunder_night";
            case 300:
                return "rainysunny"
            case 301:
            case 302:
            case 310:
            case 311:
            case 312:
            case 321:
            case 500:
            case 501:
            case 502:
            case 503:
            case 504:
            case 520:
            case 521:
            case 522:
                return this.isDay() ? "rainy_day" : "rainy_night"
            case 511:
            case 611:
                return "snowrain"
            case 600:
            case 601:
            case 602:
            case 621:
            case 900:
            case 901:
            case 902:
            case 903:
            case 905:
            case 906:
                return this.isDay() ? "snow_day" : "snow_night"
            case 701:
            case 711:
            case 721:
            case 731:
            case 741:
                return this.isDay() ? "fog_day" : "fog_night"
            case 800:
            case 904:
                return this.isDay() ? "sunny" : "dark"
            case 801:
            case 802:
            case 803:
            case 804:
                return this.isDay() ? "cloudy_day" : "cloudy_night"
            default:
                return "sunny"
        }
    });

    updateWeather() {
        if (!this.extra_config.get('apiKey')()) {
            logger.info("Kein OWM API-Key für Wetterabruf konfiguriert.");
            return;
        }

        if (!this.extra_config.get('zipCountry')()) {
            logger.info("Keine PLZ für Wetterabruf konfiguriert.");
            return;
        }

        let hours = new Date().getHours()
        this.isDay(hours > 6 && hours < 22);

        axios.get(`http://api.openweathermap.org/data/2.5/weather?zip=${this.extra_config.get('zipCountry')()}&lang=de&units=metric&appid=${this.extra_config.get('apiKey')()}`, axiosConfigParams)
            .then((response) => {
                if (response.status === 200) {
                    this.name(response.data.name);
                    this.temperature(response.data.main.temp);
                    this.iconId(response.data.weather[0].id);
                    this.description(response.data.weather[0].description);
                    logger.info("Successfully updated weather from OpenWeatherMap server.")
                }
            })
            .catch((error_resp) => {
                logger.error(`Error while requesting weather from OpenWeatherMap server: ${error_resp.toString()}`);
            })
    }

    loaded() {
        this.updateWeather();
    }

    destroy() {
        clearInterval(this.actionTimer);
    }

    constructor(board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.updateWeather();
        }, 1000 * 60);

        logger.info("Loaded WeatherWidget");
    }
}

export default WeatherWidget