import {logger, store} from "../common/common";
import toastr from "toastr";

const ko = require('knockout');

class SettingsModel {
    settings = ko.observableArray([]);
    einsatzSettings = ko.observableArray([]);
    infoSettings = ko.observableArray([]);

    saving = ko.observable(false);

    schema: any = {
        "debug": {"type": "Boolean"},
        "info.news.show": {"type": "Boolean"},
        "info.einsaetze.show": {"type": "Boolean"},
        "info.dienste.show": {"type": "Boolean"},
        "sentry.enabled": {"type": "Boolean"},
        "motionDetector.enabled": {"type": "Boolean"},
        "displayAlwaysOn": {"type": "Boolean"},
        "einsatz.fetch": {
            "type": "Select",
            "values": [
                {
                    "id": 0,
                    "name": "http"
                },
                {
                    "id": 1,
                    "name": "websocket"
                },
                {
                    "id": 99,
                    "name": "disabled"
                },
            ]
        },
        "alamos.alarmInput.enabled": {"type": "Boolean"},
        "webserver.alarmInput.enabled": {"type": "Boolean"},
        "mqtt.alarmInput.enabled": {"type": "Boolean"},
        "printing.enabled": {"type": "Boolean"},
        "geocoding.enabled": {"type": "Boolean"},
        "geocoding.engine": {
            "type": "Select",
            "values": [
                {
                    "id": 10,
                    "name": "Google"
                },
                {
                    "id": 20,
                    "name": "GraphHopper"
                },
            ]
        },
        "routing.enabled": {"type": "Boolean"},
        "routing.engine": {
            "type": "Select",
            "values": [
                // {
                //     "id": 10,
                //     "name": "Google"
                // },
                {
                    "id": 20,
                    "name": "GraphHopper"
                },
            ]
        },
        "status.reset.enabled": {"type": "Boolean"},
    };

    get_type = (key: any) => {
        return this.schema[key] != null ? this.schema[key]["type"] : "String";
    };

    getValues = (key: any) => {
        if (!this.schema[key]) {
            return []
        }

        if (!this.schema[key]["values"]) {
            return []
        }

        return this.schema[key]["values"].map((item: any) => {
            return new FetchSetting(item.id, item.name);
        });
    }

    loadSettings = () => {
        let all = this.dotNotate(store.store, null, null);
        logger.info('Loaded settings:', all);

        for (let key in all) {
            if (all.hasOwnProperty(key)) {
                // console.log(key, all[key]);
                let settings_obj = new EinsatzMonitorSetting(key, all[key], this.get_type(key), this.getValues(key));

                if (key.startsWith("einsatz.")) {
                    this.einsatzSettings().push(settings_obj);
                    continue;
                }

                if (key.startsWith("info.")) {
                    this.infoSettings().push(settings_obj);
                    continue;
                }

                this.settings().push(settings_obj);
            }
        }
    };

    saveSettings = () => {
        this.saving(true);

        setTimeout(() => {
            this.settings().forEach((s: any) => {
                s.save();
            });

            this.einsatzSettings().forEach((s: any) => {
                s.save();
            });

            this.infoSettings().forEach((s: any) => {
                s.save();
            });

            toastr.success("Einstellungen erfolgreich gespeichert", "Einstellungen");
            this.saving(false);
        }, 100)
    };

    dotNotate = (obj: any, target: any, prefix: any) => {
        target = target || {},
            prefix = prefix || "";

        let self = this;

        Object.keys(obj).forEach(function (key) {
            // console.log(prefix + key, self.get_type(prefix + key));
            // if (self.get_type(key) === "Array")
            //     console.log("isArray", key);

            if (typeof (obj[key]) === "object") {
                self.dotNotate(obj[key], target, prefix + key + ".");
            } else {
                return target[prefix + key] = obj[key];
            }
        });

        return target;
    }
}

class EinsatzMonitorSetting {
    key = ko.observable();
    value = ko.observable();
    type = ko.observable();

    values: any[] = [];

    booleanValues = ko.observableArray([new BooleanSetting(false, "false"), new BooleanSetting(true, "true")]);

    get_value = ko.computed(() => {
        let value = null;

        if (this.type() === "Boolean")
            value = this.get_id_name(this.booleanValues(), this.value());


        if (value != null)
            return value;

        return this.value();
    });

    save = () => {
        logger.info(`Saving config entry ${this.key()} => ${this.value()}`);

        try {
            store.set(this.key(), this.value());
        } catch (e) {
            logger.error(`Error config entry ${this.key()} => ${this.value()}: ${e}`)
        }
    }

    get_id_name = (obj: any, id: any) => {
        let name = null;
        obj.forEach((o: any) => {
            if (o.id() === id) {
                name = o.name();
            }
        });

        return name;
    };

    constructor(key: any, value: any, type: any, values: any[]) {
        this.key = ko.observable(key);
        this.value = ko.observable(value);
        this.type = ko.observable(type);

        this.values = values;
    }

}

class BooleanSetting {
    id = ko.observable();
    name = ko.observable();

    constructor(id: any, name: any) {
        this.id = ko.observable(id);
        this.name = ko.observable(name);
    }
}

class FetchSetting {
    id = ko.observable();
    name = ko.observable();

    constructor(id: any, name: any) {
        this.id = ko.observable(id);
        this.name = ko.observable(name);
    }
}

export default SettingsModel;
