import Widget from "./Widget";
import InfoNewsWidget from "./info/InfoNewsWidget";
import InfoAppointmentWidget from "./info/InfoAppointmentWidget";
import InfoOperationWidget from "./info/InfoOperationWidget";
import ClockWidget from "./info/ClockWidget";
import ImageWidget from "./info/ImageWidget";
import WeatherWidget from "./info/WeatherWidget";

type tClassMapping = {
    [key: string]: any
}

const classMapping: tClassMapping = {
    'info-news-widget': InfoNewsWidget,
    'info-dienste-widget': InfoAppointmentWidget,
    'info-operations-widget': InfoOperationWidget,
    'clock-widget': ClockWidget,
    'image-widget': ImageWidget,
    'weather-widget': WeatherWidget
}

let classMappingProxy = new Proxy(classMapping, {
    get: function (target, key) {
        return target.hasOwnProperty(key) ? target[key.toString()] : Widget;
    },
});

// class DynamicWidget {
//     constructor(className: string, args: any) {
//         return new classMappingProxy[className](args);
//     }
// }
//
// export default DynamicWidget

export default function dynamicWidget(name: string) {
    return classMappingProxy[name];
}