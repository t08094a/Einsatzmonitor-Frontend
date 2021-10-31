import * as L from 'leaflet';
import {Evented} from "leaflet";

declare module '*.html' {
    const content: string;
    export default content;
}


// declare module 'leaflet' {
//     namespace Routing {
//         class GraphHopper extends Evented implements IRouter {
//             constructor(apiKey: any, options?: any);
//
//             route(waypoints: Waypoint[], callback: (error?: IError, routes?: IRoute[]) => any, context?: {}, options?: RoutingOptions): void;
//         }
//     }
// }

