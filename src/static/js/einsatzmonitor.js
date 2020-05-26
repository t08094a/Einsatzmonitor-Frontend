/*----------------------------------------------------------------------*/
/* View Model
/*----------------------------------------------------------------------*/

const widgetTypes = {
    INFO: "info",
    OPERATION: "operation"
};

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const app = electron.app || electron.remote.app;
const userDataPath = app.getPath('userData');
const gridsterWidgetsFilePath = path.join(userDataPath, "gridster_widgets.json");
const gridsterWidgetsOperationFilePath = path.join(userDataPath, "gridster_widgets_operation.json");

/*import { EinsatzTest } from "./model/einsatz";
let test = new EinsatzTest("test");
console.log(test);*/

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

            // Trigger EinsatzAdd event
            em.emit('EinsatzAdd', einsatz.id);

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
    };

    self.testeinsatz_fe2_id = ko.observable();
    self.testeinsatz_adresse = ko.observable();
    self.addTesteinsatz = function() {
        self.add_einsatz({
            'id': 1,
            'stichwort': "F1",
            'stichwort_color': "danger",
            'description': "Testalarm",
            'alarmzeit_seconds': moment().unix(),
            'adresse': self.testeinsatz_adresse(),
            'objekt': "(Testobjekt)",
            'einheiten': [
                {
                    'name': "TE FF Testfeuerwehr voll"
                },
                {
                    'name': "TE FF Feuerwehr2 voll"
                }
            ],
            'zusatzinfos': [
                {
                    'name': "Ort",
                    'value': "Testort"
                }
            ]
        });

        if (self.testeinsatz_fe2_id())
            self.get_latest_einsatz().feedback_fe2_id(self.testeinsatz_fe2_id());
    };

    self.clearOperations = function() {
        self.einsaetze().forEach(function (einsatz) {
            einsatz.stopTasks();
        });
        self.einsaetze.removeAll();
    };

    self.board = ko.observable(new BoardViewModel());


    // Widgets
    // Todo: create default extra_config values and set to new widget
    // Todo: Maybe: on widget loading check if default config keys are empty to set them to default value

    // Info
    self.addInfoClock = function () {
        self.board().widgets.push(new Widget("clock-widget", self.getCurrentWidgetType()));
    };

    self.addInfoText = function () {
        self.board().widgets.push(new Widget("text-widget", self.getCurrentWidgetType()));
    };

    self.addInfoNews = function () {
        self.board().widgets.push(new Widget("info-news-widget", self.getCurrentWidgetType()));
    };

    self.addInfoDienste = function () {
        self.board().widgets.push(new Widget("info-dienste-widget", self.getCurrentWidgetType()));
    };

    self.addInfoOperations = function () {
        self.board().widgets.push(new Widget("info-operations-widget", self.getCurrentWidgetType()));
    };

    // Operation
    self.addOperationStichwort = function () {
        self.board().widgets.push(new Widget("operation-stichwort", self.getCurrentWidgetType()));
    };

    self.addOperationAddress = function () {
        self.board().widgets.push(new Widget("operation-address", self.getCurrentWidgetType()));
    };
    self.addOperationAdditionalInformation = function () {
        self.board().widgets.push(new Widget("operation-additionalInformation", self.getCurrentWidgetType()));
    };

    self.addOperationRouteInformation = function () {
        self.board().widgets.push(new Widget("operation-routeInformation", self.getCurrentWidgetType()));
    };

    self.addOperationUnits = function () {
        self.board().widgets.push(new Widget("operation-units", self.getCurrentWidgetType()));
    };

    self.addOperationFeedback = function () {
        self.board().widgets.push(new Widget("operation-feedback", self.getCurrentWidgetType()));
    };

    self.addOperationFeedbackCount = function () {
        self.board().widgets.push(new Widget("operation-feedback-count", self.getCurrentWidgetType()));
    };

    self.addOperationAlarmMinutes = function () {
        self.board().widgets.push(new Widget("operation-alarmMinutes", self.getCurrentWidgetType()));
    };

    self.addOperationOverviewMap = function () {
        self.board().widgets.push(new Widget("operation-overviewMap", self.getCurrentWidgetType()));
    };

    self.addOperationRouteMap = function () {
        self.board().widgets.push(new Widget("operation-routeMap", self.getCurrentWidgetType()));
    };


    self.serialize = function () {
        log.debug(self.board().gridsterInfo.serialize());
    };

    self.saveWidgets = function () {
        var file = self.view() === "info" ? gridsterWidgetsFilePath : gridsterWidgetsOperationFilePath;
        log.info(`View | Saving view ${self.view()} to ${file}`);

        var to_save = [];

        self.board().gridsterInfo.serialize().forEach(widget => {
            wdg = self.board().get_by_id(self.board().widgets(), widget.id);

            log.info(`View | Saving widget ${ko.toJSON(wdg.config.toJSON())}`);

            widget['config'] = wdg.config;
            widget['extra_config'] = wdg.extra_config;
            to_save.push(widget);
        });

        fs.writeFile(file, JSON.stringify(to_save), 'utf8', function (err) {
            if (err) {
                log.error("An error occurred while writing JSON file");
                return log.error(err);
            }

            log.info(`View | JSON file has been written`);
        });
    };

    self.loadWidgets = function (path) {
        log.info(`View | Loading view from ${path}`);

        fs.readFile(path, function (err, data) {
            var jsonParsed = JSON.parse(data);

            jsonParsed.forEach(widget => {
                log.debug(`View | Loaded widget: `, widget);

                wdg = new Widget(widget.config.template, widget.config.type, widget['row'], widget['col'], widget['size_x'], widget['size_y']);

                for (key in widget.config) {
                    if (widget.config.hasOwnProperty(key)) {
                        log.debug(`View | Widget | Config | Set ${key} to ${widget.config[key]}`);
                        wdg.config.push(key, widget.config[key])
                    }
                }

                //wdg.extra_config = widget.extra_config;
                for (key in widget.extra_config) {
                    if (widget.extra_config.hasOwnProperty(key)) {
                        wdg.extra_config.push(key, widget.extra_config[key])
                    }
                }

                self.board().widgets.push(wdg);
            });
        });
    };

    self.load = function () {
        self.loadWidgets(gridsterWidgetsFilePath);
    };

    self.save = function () {
        self.saveWidgets();
    };

    self.clearWidgets = function () {
        //while(self.board().widgets().length > 0) {
        //    self.board().widgets().forEach(wdg => {
        //        self.board().widgets.remove(wdg);
        //    });
        //}
        //self.board().widgets.removeAll();
        self.board().gridsterInfo.remove_all_widgets();
        self.board().widgets.removeAll();
    };

    self.view = ko.observable("init");

    self.getCurrentWidgetType = function () {
        if (self.view() === "info")
            return widgetTypes.INFO;

        return widgetTypes.OPERATION;
    };

    // Update view if "einsaetze" changes
    self.einsaetze.subscribe(function (newValue) {
        self.loadView();
    });

    self.loadView = function () {
        log.info(`View | Switching view - Einsatz: ${self.is_einsatz()} - View: ${self.view()}`);
        if (self.is_einsatz() && self.view() !== "operation") {
            self.view("operation");
            log.info(`View | Loading operation view`);
            self.clearWidgets();
            self.loadWidgets(gridsterWidgetsOperationFilePath);
        }
        if (!self.is_einsatz() && self.view() !== "info") {
            self.view("info");
            log.info(`View | Loading info view`);
            self.clearWidgets();
            self.loadWidgets(gridsterWidgetsFilePath);
        }
    };
    self.loadView();
}

function BoardViewModel() {
    var self = this;

    self.widgets = ko.observableArray([]);
    self.widgetsOperation = ko.observableArray([]);
    self.editWidget = ko.observable();

    gridsterConfig = {
        // widget_margins: [10, 10],
        // widget_base_dimensions: [140, 140],

        widget_margins: [5, 5],
        // widget_base_dimensions: [100, 31],
        widget_base_dimensions: ['auto', 45],
        autogenerate_stylesheet: true,
        min_cols: 1,
        max_cols: 24,
        // extra_rows: 20,
        // min_rows: 30,
        max_rows: 30,
        shift_widgets_up: false,
        shift_larger_widgets_down: false,
        collision: {
            wait_for_mouseup: true
        },
        resize: {
            enabled: true,

            stop: function (e, ui, widget) {
                // var newDimensions = this.serialize(widget)[0];
                // console.log("New size: " + newDimensions.size_x + ", " + newDimensions.size_y);

                // Update font size on widget resize
                self.get_by_id(self.widgets(), parseInt(widget.attr('id'))).fitIfPossible();
            }
        },
        draggable: {
            stop: function (event, ui) {
                // var newrow = ui.$player[0].dataset.row;
                // var newcol = ui.$player[0].dataset.col;
                // console.log("New position: " + newrow + ", " + newcol);
            }
        },
        serialize_params(w, wgd) {
            return {
                id: parseInt(w.attr('id')),
                col: wgd.col,
                row: wgd.row,
                size_x: wgd.size_x,
                size_y: wgd.size_y
            }
        }
    };

    // Initialize the gridster plugin.
    self.gridsterInfo = $("#gridsterInfo ul").gridster(gridsterConfig).data('gridster');

    self.openWidgetAddModal = function () {
        $('#addWidgetModal').appendTo("body").modal('show');
    };

    self.openSettingsMenuModal = function () {
        $('#settingsMenuModal').appendTo("body").modal('show');
    };

    self.get_by_id = function (widgets, id) {
        return ko.utils.arrayFirst(widgets, function (item) {
            return id === item.id;
        });
    };

    /**
     * Used as a callback for knockout's afterAdd function. This will be called
     * after a node has been added to the dom from the foreach template. Here,
     * we need to tell gridster that the node has been added and then set up
     * the correct gridster parameters on the widget.
     */
    self.addGridster = function (node, index, obj) {
        var widget = $(node);
        var column = widget.attr("data-col");
        var row = widget.attr("data-row");

        // only process the main tag which has "data-col" attr
        if (column) {
            var sizeX = obj.datasizex;
            var sizeY = obj.datasizey;
            // var sizeY = (obj.state() === "Minimized" || obj.state() === "Closed") ? 1 : obj.datasizey;

            // add the widget to the next position
            self.gridsterInfo.add_widget(widget, sizeX, sizeY, column, row);

            // trigger fitty to properly scale font size
            self.get_by_id(self.widgets(), parseInt(widget.attr('id'))).fitIfPossible();
        }
    };

    /**
     * Used as a callback for knockout's beforeRemove. Needs
     * to remove node parameter from the dom, or tell gridster
     * that the node should be removed if it is an li.
     */
    self.removeGridster = function (node, index, widget, gridster = self.gridsterInfo) {
        var wdg = $("#" + widget.id);

        if (wdg.attr("data-col")) {
            self.gridsterInfo.remove_widget(wdg);
        } else {
            node.parentNode.removeChild(node);
        }
    };

    self.removeGridsterOperation = function(node, index, widget) {
        self.removeGridster(node, index, widget, self.gridsterOperation);
    };

    /**
     * Remove a widget from knockout
     */
    self.removeWidget = function (widget) {
        try {
            self.widgets.remove(widget);
            self.widgetsOperation.remove(widget);
        } catch (e) {
        }
    };

    /**
     * Returns the template name of the given widget
     * @param widget
     * @returns {*|string}
     */
    self.templateName = function(widget) {
        return widget.config.get('template')();
    };
};

var ids = 1;

class Widget {
    constructor(template_name, type, row = 0, col = 0, x = 3, y = 2) {
        var self = this;

        self.id = ids++;

        self.datasizex = x;
        self.datasizey = y;

        self.dataRow = ko.observable(row);
        self.dataCol = ko.observable(col);

        self.availableAlignments = ko.observableArray(['left', 'center', 'right']);

        self.removeSelected = function () {
            einsatzMonitorModel.board().removeWidget(this);
        };

        self.config = ko.observableDictionary({
            template: template_name,
            type: type,
            align: 'left'
        });

        self.extra_config = ko.observableDictionary();

        self.edit = function() {
            einsatzMonitorModel.board().editWidget(self);
            $('#edit-' + self.id).appendTo("body").modal('show');
            $('.widget-colorpicker').colorpicker({
                extensions: [
                    {
                        name: 'swatches',
                        options: {
                            colors: {
                                'white': '#ffffff',
                                'black': '#000000',
                                'dark': '#343a40',
                                'primary': '#337ab7',
                                'success': '#5cb85c',
                                'info': '#5bc0de',
                                'warning': '#f0ad4e',
                                'danger': '#d9534f',
                                'bootstrap-danger': '#dc3545'
                            },
                            namesAsValues: false
                        }
                    }
                ],
                format: null
            });

            $("[id ='edit-" + self.id + "'] .widget-slider").slider({
                slide: function (event, ui) {
                    self.extra_config.get($(this).attr("data-field"))(ui.value);
                },
                create: function(event, ui){
                    $(this).slider('value', self.extra_config.get($(this).attr("data-field"))());

                    // set max size if available
                    if (parseInt($(this).attr("data-max"))) {
                        $(this).slider('option', 'max', parseInt($(this).attr("data-max")));
                    }
                }
            });
        };

        self.fitIfPossible = function () {
            let max = 50;
            let newmax = parseInt($("[id ='" + self.id + "'] .fitty-element").attr("data-maxfitty"));

            if (newmax)
                max = newmax;

            if (self.extra_config.get('text-fitty')()) {
                fitty("[id ='" + self.id + "'] .fitty-element", {
                    maxSize: max,
                    fitHeight: false
                });
            }
        };
    }
}

class ClockWidget extends Widget {
    constructor(row = 0, col = 0, x = 2, y = 6)  {
        super("clock-widget", widgetTypes.INFO, row, col, x, y) ;
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

// self.check_einsatz(); # Google maps API might not be ready, yet! Maybe add an callback to the loading function.
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

            if (data.type === "new_feedbackId") {
                log.info(`FE2 Feedback ID from WebSocket: ${data.feedbackId.id}`);

                var id = data.feedbackId.id;

                if (einsatzMonitorModel.is_einsatz()) {
                    einsatzMonitorModel.get_latest_einsatz().feedback_fe2_id(id);
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

// Custom widget test
// Todo: Refactor into actual widgets
ko.components.register('like-widget', {
    viewModel: function (params) {
        // Data: value is either null, 'like', or 'dislike'
        this.chosenValue = params.value;

        // Behaviors
        this.like = function () {
            this.chosenValue('like');
        }.bind(this);
        this.dislike = function () {
            this.chosenValue('dislike');
        }.bind(this);
    },
    template:
        '<div>Test</div>'
        /*'<div class="like-or-dislike" data-bind="visible: !chosenValue()">\
            <button data-bind="click: like">Like it</button>\
            <button data-bind="click: dislike">Dislike it</button>\
        </div>\
        <div class="result" data-bind="visible: chosenValue">\
            You <strong data-bind="text: chosenValue"></strong> it\
        </div>'*/
});

ko.applyBindings(einsatzMonitorModel);

window.addEventListener('resize', () => {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
        // Recalculate grister if window size changed
        einsatzMonitorModel.board().gridsterInfo.recalculate_faux_grid();
    }, 250);
});


em.on('EinsatzAdd', (data) => {
    log.info(`EinsatzAdd event fired (${data})`);
    self.turnOnDisplay();
});

em.on('EinsatzRemove', (data) => {
    log.info('EinsatzRemove event fired');
});

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