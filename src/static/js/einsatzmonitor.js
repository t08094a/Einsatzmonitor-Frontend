/*
    Todo: Use electron-settings for configuration
    Todo: Log to file?
    Todo: Display alarmzeit (besides the counter)
 */

/*----------------------------------------------------------------------*/
/* View Model
/*----------------------------------------------------------------------*/
var googleLoaded = false;

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

            console.log("Added " + einsatz.id + " to array");
            fitty('.einsatz-einheit div h4', {
                maxSize: 22.5
            });
            fitty('.einsatz-stichwort h1', {
                maxSize: 50
            });
        } else {
            console.log(einsatz.id + " already in array");
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
}, 1000 * config.info.httpFetchInterval);

if (config.einsatz.fetch === "http") {
    // create task to poll einsatz from http api
    window.setInterval(function () {
        self.check_einsatz();
    }, 1000 * config.einsatz.httpFetchInterval);
}

if (config.einsatz.fetch === "websocket") {
    // create websocket connection
    setTimeout(function () {
        var einsatzWebsocket = new ReconnectingWebSocket(config.einsatz.url.replace("{activeMinutes}", config.einsatz.einsatzDisplayTime - 2));
        einsatzWebsocket.reconnectDecay = 1.0;

        einsatzWebsocket.onmessage = function (e) {
            var data = JSON.parse(e.data);
            var einsatz = JSON.parse(data.einsatz);
            console.log("From webSocket: " + data.einsatz);
            display_einsatz(einsatz);
        };

        einsatzWebsocket.onclose = function (e) {
            console.error('Chat socket closed unexpectedly');
            toastr.error("Einsätze können nicht empfangen werden.", "Verbindung zum Server verloren");
        };

        einsatzWebsocket.onerror = function (e) {
            console.error('Chat socket errored unexpectedly');
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
        url: config.einsatz.url.replace("{activeMinutes}", config.einsatz.einsatzDisplayTime - 2),
        datatype: "json",
        contentType: "application/json charset=utf-8",
        success: function (data) {
            data.forEach(function (einsatz) {
                display_einsatz(einsatz);
            })
        },
        error: function (data) {
            toastr.error("Einsätze konnten nicht abgerufen werden.", "Keine Verbindung zum Server");
        }
    });
}

/**
 *  Load Info Data
 */

function loadInfoData() {
    if (config.info.news.show) {
        self.infoLoadNews();
    }

    if (config.info.einsaetze.show) {
        self.infoLoadEinsaetze();
    }

    if (config.info.dienste.show) {
        self.infoLoadDienste();
    }
}

function infoLoadNews() {
    $.ajax({
        type: 'GET',
        url: config.info.news.url,
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
        url: config.info.einsaetze.url,
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
        url: config.info.dienste.url,
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
if (config.enableMotionDetector) {
    const chokidar = require('chokidar');
    let watcher = chokidar.watch(config.motionDetectorPath);

    watcher.on('add', path => {
        console.log('File ' + path + ' has been added');
    });

    watcher.on('change', path => {
        console.log('File ' + path + ' has been changed');
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
        console.log("Last movement: " + diffSeconds + " ago.");
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
        console.log("Turned on display");
    }
}

function turnOffDisplay() {
    if (hdmiState !== 0) {
        if (config.displayAlwaysOn) {
            return;
        }

        hdmiState = 0;
        execute("vcgencmd display_power 0", function () {
        });
        console.log("Turned off display");

    }
}