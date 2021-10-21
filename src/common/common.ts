import Time from "./models/Time";
import {Client} from "@googlemaps/google-maps-services-js";
import {Loader} from '@googlemaps/js-api-loader';
import {app} from "@electron/remote";
import Store from "electron-store";

export function str_pad_left(string: number, pad: string, length: number) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
}

export function replaceAll(str: string, search: string, replace: string) {
    return str.split(search).join(replace);
}

let auto_update_fields = ["id", "title", "description", "summary", "description_truncated", "date_formatted", "alarmTime", "alarmzeit_formatted", "color", "start", "isToday"];

// loop over knockout model fields and update with values from json response
export function updateModel(model: any, json: any) {
    $.each(model, (k: string, v) => {
        if (auto_update_fields.includes(k)) {
            if (json[k]) {
                model[k](json[k])
            }
        }
    });
}

export const axiosConfigParams = {
    headers: {
        "Content-Type": "application/json charset=utf-8",
        "Access-Control-Allow-Origin": "*",
    }
};

const exec = require('child_process').exec;

export function execute(command: any, callback: any) {
    exec(command, (error: any, stdout: any, stderr: any) => {
        callback(stdout);
    });
}

export async function sha256(message: any) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
}

const emitter = require('events').EventEmitter;
export const em = new emitter();

export const logger = require('electron-log')
logger.transports.file.sync = false;
logger.transports.file.maxSize = 104857600;

export const alamosFeedbackUrl = (dbId: string) => `https://apager-firemergency-2.appspot.com/fe2/feedback?dbId=${dbId}`;

export function extractArguments(arg: string) {
    return arg?.includes(";") ? arg.split(";") : [arg];
}

export function timeIsBetween(start: Time, end: Time, check: Time) {
    return (start.hour <= end.hour) ? check.isBiggerThan(start) && !check.isBiggerThan(end)
        : (check.isBiggerThan(start) && check.isBiggerThan(end)) || (!check.isBiggerThan(start) && !check.isBiggerThan(end));
}

export const store = new Store({name: 'settings'});

export const userDataPath = app.getPath('userData');

export const client = new Client({});
export const loader = new Loader({
    apiKey: store.get("googleMapsKey") as string,
    version: "weekly",
    libraries: ["geometry"]
});

export default {}
