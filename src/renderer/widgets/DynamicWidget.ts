import InfoNewsWidget from "./InfoNewsWidget";
import InfoAppointmentWidget from "./InfoAppointmentWidget";
import InfoOperationWidget from "./InfoOperationWidget";
import Widget from "./Widget";

type tClassMapping = {
    [key: string]: any
}

const classMapping: tClassMapping = {
    'info-news-widget': InfoNewsWidget,
    'info-dienste-widget': InfoAppointmentWidget,
    'info-operations-widget': InfoOperationWidget
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