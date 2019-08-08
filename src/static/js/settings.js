let settings = require('electron-settings');

function SettingsModel() {
    let self = this;

    self.settings = ko.observableArray([]);
    self.einsatzSettings = ko.observableArray([]);
    self.infoSettings = ko.observableArray([]);

    self.saving = ko.observable(false);

    self.schema = {
        "debug": "Boolean",
        "info.news.show": "Boolean",
        "info.einsaetze.show": "Boolean",
        "info.dienste.show": "Boolean",
        "sentry.enabled": "Boolean",
        "motionDetector.enabled": "Boolean",
        "displayAlwaysOn": "Boolean",
        "einsatz.fetch": "FetchType",
    };

    self.get_type = (key) => {
        return self.schema[key] != null ? self.schema[key] : "String";
    };

    self.loadSettings = () => {
        console.log(settings);
        console.log(settings.getAll());

        let all = dotNotate(settings.getAll());

        for (var key in all) {
            if (all.hasOwnProperty(key)) {
                // console.log(key, all[key]);
                settings_obj = new Setting(key, all[key], self.get_type(key));

                if (key.startsWith("einsatz.")) {
                    self.einsatzSettings.push(settings_obj);
                    continue;
                }

                if (key.startsWith("info.")) {
                    self.infoSettings.push(settings_obj);
                    continue;
                }

                self.settings.push(settings_obj);
            }
        }
    };

    self.saveSettings = () => {
        self.saving(true);

        setTimeout(() => {
            self.settings().forEach((s) => {
                s.save();
            });
            self.einsatzSettings().forEach((s) => {
                s.save();
            });
            self.infoSettings().forEach((s) => {
                s.save();
            });
            toastr.success("Einstellungen erfolgreich gespeichert", "Einstellungen");
            self.saving(false);
        }, 100)
    };

    function dotNotate(obj, target, prefix) {
        target = target || {},
            prefix = prefix || "";

        Object.keys(obj).forEach(function (key) {
            // console.log(prefix + key, self.get_type(prefix + key));
            // if (self.get_type(key) === "Array")
            //     console.log("isArray", key);

            if (typeof (obj[key]) === "object") {
                dotNotate(obj[key], target, prefix + key + ".");
            } else {
                return target[prefix + key] = obj[key];
            }
        });

        return target;
    }
}


function Setting(key, value, type) {
    let self = this;

    self.key = ko.observable(key);
    self.value = ko.observable(value);
    self.type = ko.observable(type);

    self.booleanValues = ko.observableArray([new BooleanSetting(0, "false"), new BooleanSetting(1, "true")]);
    self.fetchValues = ko.observableArray([new FetchSetting(0, "http"), new FetchSetting(1, "websocket")]);

    self.get_value = ko.computed(() => {
        var value = null;

        if (self.type() === "Boolean")
            value = get_id_name(self.booleanValues(), self.value());


        if (value != null)
            return value;

        return self.value();
    });

    self.save = () => {
        console.log("saving... ", self.key(), self.get_value());
        settings.set(self.key(), self.value())
    }
}

get_id_name = (obj, id) => {
    var name = null;
    obj.forEach((o) => {
        if (o.id() === id) {
            name = o.name();
        }
    });

    return name;
};

function BooleanSetting(id, name) {
    let self = this;

    self.id = ko.observable(id);
    self.name = ko.observable(name);
}

function FetchSetting(id, name) {
    let self = this;

    self.id = ko.observable(id);
    self.name = ko.observable(name);
}

let settingsModel = new SettingsModel();
settingsModel.loadSettings();

ko.applyBindings(settingsModel);