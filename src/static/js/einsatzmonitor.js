/*----------------------------------------------------------------------*/
/* View Model
/*----------------------------------------------------------------------*/

function EinsatzMonitorModel() {
    var self = this;

    self.einsatz = ko.observable();
    self.einsaetze = ko.observableArray([]);
    self.info = ko.observable(new Info());

    /*self.is_einsatz = ko.computed(function () {
        return self.einsatz()
    });*/

    self.is_einsatz = ko.computed(function () {
        return self.einsaetze().length > 0;
    });

    self.sortedEinsaetze = ko.computed(function () {
        return self.einsaetze().sort(function (a, b) {
            return b.id() - a.id();
        });
    });

    self.get_latest_einsatz = function () {
        return self.sortedEinsaetze()[0];
    };

    self.is_saved = function (einsatz) {
        return ko.utils.arrayFirst(self.einsaetze(), function (item) {
            return einsatz.id === item.id();
        });
    };

    self.add_einsatz = function (einsatz) {
        if (!self.is_saved(einsatz)) {
            einsatz_obj = new Einsatz(einsatz.id, einsatz.stichwort, einsatz.stichwort_color, einsatz.description, einsatz.alarmzeit_seconds, einsatz.adresse, einsatz.objekt);

            einsatz.einheiten.forEach(function (einheit) {
                einsatz_obj.einheiten.push(einheit.name);
            });

            einsatz.zusatzinfos.forEach(function (zusatzinfo) {
                einsatz_obj.zusatzinfos.push({
                    'name': zusatzinfo.name,
                    'value': zusatzinfo.value
                })
            });

            self.einsaetze.push(einsatz_obj);

            window.dispatchEvent(new CustomEvent(
                "newEinsatzDisplay",
                {
                    detail: {
                        message: "Hello World!",
                        time: new Date(),
                    },
                    bubbles: true,
                    cancelable: false
                }
            ));

            log.info(`Added new einsatz (${einsatz.id}) to array`);

            fitty('.einsatz-einheit div h4', {
                maxSize: 22.5
            });
            fitty('.einsatz-stichwort h1', {
                maxSize: 50
            });
        } else {
            log.warn(`Einsatz already in array (${einsatz.id})`);
        }
    }
}

einsatzMonitorModel = new EinsatzMonitorModel();

toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": true,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "10000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

//self.check_einsatz(); # Google maps API might not be ready, yet! Maybe add an callback to the loading function.
self.loadInfoData();

window.setInterval(function () {
    self.loadInfoData();
}, 1000 * settings.get("info.httpFetchInterval"));

if (settings.get("einsatz.fetch") === "http") {
    // create task to poll einsatz from http api
    window.setInterval(function () {
        self.check_einsatz();
    }, 1000 * settings.get("einsatz.httpFetchInterval"));
}

if (settings.get("einsatz.fetch") === "websocket") {
    // create websocket connection
    setTimeout(function () {
        var einsatzWebsocket = new ReconnectingWebSocket(settings.get("einsatz.url").replace("{activeMinutes}", settings.get("einsatz.einsatzDisplayTime") - 2));
        einsatzWebsocket.reconnectDecay = 1.0;

        einsatzWebsocket.onmessage = function (e) {
            var data = JSON.parse(e.data);
            log.info(`Type from WebSocket: ${data.type}`);

            if (data.type === "new_einsatz") {
                log.info(`Einsatz from WebSocket: ${data.einsatz}`);

                var einsatz = JSON.parse(data.einsatz);
                display_einsatz(einsatz);
            }

            if (data.type === "command") {
                log.info(`Command from WebSocket: ${data.command}`);

                if (data.command === "clear") {
                    log.info(`Clearing display now...`);
                    einsatzMonitorModel.einsaetze.removeAll();
                }
            }
        };

        einsatzWebsocket.onclose = function (e) {
            log.error(`Websocket closed unexpectedly: ${e.toString()}`);
            toastr.error("Einsätze können nicht empfangen werden.", "Verbindung zum Server verloren");
        };

        einsatzWebsocket.onerror = function (e) {
            log.error(`Websocket errored unexpectedly: ${e.toString()}`);
            toastr.error("Einsätze können nicht empfangen werden.", "Verbindung zum Server verloren");
        };
    }, 5000); // Wait 5 seconds for google maps api to load
}

const exec = require('child_process').exec;

function execute(command, callback) {
    exec(command, (error, stdout, stderr) => {
        callback(stdout);
    });
}

function display_einsatz(einsatz) {
    einsatzMonitorModel.add_einsatz(einsatz);
}

function check_einsatz() {
    $.ajax({
        type: 'GET',
        url: settings.get("einsatz.url").replace("{activeMinutes}", settings.get("einsatz.einsatzDisplayTime") - 2),
        datatype: "json",
        contentType: "application/json charset=utf-8",
        success: function (data) {
            data.forEach(function (einsatz) {
                display_einsatz(einsatz);
            })
        },
        error: function (data) {
            log.error(`Error while requesting Einsatz from API: ${data.toString()}`);
            toastr.error("Einsätze konnten nicht abgerufen werden.", "Keine Verbindung zum Server");
        }
    });
}

/**
 *  Load Info Data
 */

function loadInfoData() {
    if (settings.get("info.news.show")) {
        self.infoLoadNews();
    }

    if (settings.get("info.einsaetze.show")) {
        self.infoLoadEinsaetze();
    }

    if (settings.get("info.dienste.show")) {
        self.infoLoadDienste();
    }
}

function infoLoadNews() {
    $.ajax({
        type: 'GET',
        url: settings.get("info.news.url"),
        datatype: "json",
        contentType: "application/json charset=utf-8",
        success: function (data) {
            let news = [];

            data.forEach(function (news_post) {
                news.push(news_post.id);

                let new_newsPost = new NewsPost(news_post.id, news_post.title, news_post.images[0].image_url, news_post.description_truncated, news_post.date_formatted);

                var match = ko.utils.arrayFirst(einsatzMonitorModel.info().news(), function (item) {
                    return new_newsPost.id() === item.id();
                });

                // News not in array, add it
                if (!match) {
                    einsatzMonitorModel.info().news.push(new_newsPost)
                } else {
                    updateModel(match, news_post);
                    match.image_url(news_post.images[0].image_url);
                }
            });

            einsatzMonitorModel.info().news().forEach(function (item) {
                if ($.inArray(item.id(), news) == "-1") {
                    einsatzMonitorModel.info().news.remove(item);
                }
            });
        }
    });
}

function infoLoadEinsaetze() {
    $.ajax({
        type: 'GET',
        url: settings.get("info.einsaetze.url"),
        datatype: "json",
        contentType: "application/json charset=utf-8",
        success: function (data) {
            let einsaetze = [];

            data.forEach(function (einsatz) {
                einsaetze.push(einsatz.id);

                let new_einsatz = new InfoEinsatz(einsatz.id, einsatz.title, einsatz.alarmzeit, einsatz.alarmzeit_formatted, einsatz.color);

                var match = ko.utils.arrayFirst(einsatzMonitorModel.info().einsaetze(), function (item) {
                    return new_einsatz.id() === item.id();
                });

                // Einsatz not in array, add it
                if (!match) {
                    einsatzMonitorModel.info().einsaetze.push(new_einsatz);
                } else {
                    updateModel(match, einsatz);
                }
            });

            einsatzMonitorModel.info().einsaetze().forEach(function (item) {
                if ($.inArray(item.id(), einsaetze) == "-1") {
                    einsatzMonitorModel.info().einsaetze.remove(item);
                }
            });
        }
    });
}

function infoLoadDienste() {
    $.ajax({
        type: 'GET',
        url: settings.get("info.dienste.url"),
        datatype: "json",
        contentType: "application/json charset=utf-8",
        success: function (data) {
            let dienste = [];

            data.forEach(function (dienst) {
                dienste.push(dienst.id);

                let new_dienst = new Dienst(dienst.id, dienst.title, dienst.description, dienst.start, dienst.is_today);

                var match = ko.utils.arrayFirst(einsatzMonitorModel.info().dienste(), function (item) {
                    return new_dienst.id() === item.id();
                });

                // Dienst not in array, add it
                if (!match) {
                    einsatzMonitorModel.info().dienste.push(new_dienst);
                } else {
                    updateModel(match, dienst);
                }
            });

            einsatzMonitorModel.info().dienste().forEach(function (item) {
                if ($.inArray(item.id(), dienste) == "-1") {
                    einsatzMonitorModel.info().dienste.remove(item);
                }
            });
        }
    });
}

/**
 *  Helper functions
 */

let auto_update_fields = ["id", "title", "description", "description_truncated", "date_formatted", "alarmzeit", "alarmzeit_formatted", "color", "start", "is_today"];

// loop over knockout model fields and update with values from json response
function updateModel(model, json) {
    $.each(model, function (k, v) {
        if (auto_update_fields.includes(k)) {
            if (json[k]) {
                model[k](json[k])
            }
        }
    });
}

function str_pad_left(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
}


ko.applyBindings(einsatzMonitorModel);

window.addEventListener("newEinsatzDisplay", function (e) {
    console.log("New einsatz event fired");
    console.log(e);
    self.turnOnDisplay();
}, false);

window.addEventListener("einsatzRemoved", function (e) {
    console.log("Einsatz removed event fired");
    console.log(e);
}, false);


let lastMovement = 0;
if (settings.get("motionDetector.enabled")) {
    const chokidar = require('chokidar');
    let watcher = chokidar.watch(settings.get("motionDetector.filePath"));

    watcher.on('add', path => {
        log.info(`File ${path} has been added`);
    });

    watcher.on('change', path => {
        log.info(`File ${path} has been changed`);
        lastMovement = new Date().getTime();
        self.turnOnDisplay();
    });
}

let hdmiState = -1; // Default unknown

// Task every minute to check if we should turn the display off
// We won't turn it off if there currently is an einsatz
window.setInterval(function () {
    if (ko.unwrap(einsatzMonitorModel.is_einsatz())) {
        return;
    }

    // Don't turn the display off if last movement is 600s or less ago
    let currentTimestamp = new Date().getTime();
    let diffSeconds = (currentTimestamp - lastMovement) / 1000;

    if (diffSeconds < 600) {
        log.info(`Last movement: ${diffSeconds}s ago.`);
        return;
    }

    // Else turn Display off
    self.turnOffDisplay();

}, 1000 * 60);

function turnOnDisplay() {
    if (hdmiState !== 1) {
        hdmiState = 1;
        execute("vcgencmd display_power 1", function () {
        });
        log.info('Turned on display');
    }
}

function turnOffDisplay() {
    if (hdmiState !== 0) {
        if (settings.get("displayAlwaysOn")) {
            return;
        }

        hdmiState = 0;
        execute("vcgencmd display_power 0", function () {
        });
        log.info('Turned off display');
    }
}