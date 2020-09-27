import {Computed, Observable, ObservableArray} from 'knockout';
const ko = require('knockout');

import Einsatz from "../common/models/Einsatz";
import {debug, warn, info, error} from "electron-log";
import moment from "moment";
import fitty from "fitty";
import toastr from "toastr";
import Widget, {widgetTypes} from "./widgets/Widget";
import {em} from "../common/common";
import InfoNewsWidget from "./widgets/InfoNewsWidget";
import InfoOperationWidget from "./widgets/InfoOperationWidget";
import InfoAppointmentWidget from "./widgets/InfoAppointmentWidget";
import dynamicWidget from "./widgets/DynamicWidget";
import ClockWidget from "./widgets/ClockWidget";

let html_content = require('./widget_templates/info/text_widget.html');

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const app = electron.app || electron.remote.app;
const userDataPath = app.getPath('userData');
const gridsterWidgetsFilePath = path.join(userDataPath, "gridster_widgets.json");
const gridsterWidgetsOperationFilePath = path.join(userDataPath, "gridster_widgets_operation.json");


class EinsatzMonitorModel {
    einsatz: Observable = ko.observable();
    einsaetze: ObservableArray = ko.observableArray([]);

    is_einsatz: Computed = ko.computed(() => {
        return this.einsaetze().length > 0;
    });

    sortedEinsaetze = ko.computed(() => {
        return this.einsaetze().sort(function (a, b) {
            return b.id() - a.id();
        });
    });

    get_latest_einsatz() {
        return this.sortedEinsaetze()[0];
    };

    is_saved(einsatz: any) {
        return ko.utils.arrayFirst(this.einsaetze(), (item: any) => {
            return einsatz.id === item.id();
        });
    };

    add_einsatz(einsatz: any) {
        if (!this.is_saved(einsatz)) {
            let einsatz_obj = new Einsatz(einsatz.id, einsatz.stichwort, einsatz.stichwort_color, einsatz.description, einsatz.alarmzeit_seconds, einsatz.adresse, einsatz.objekt);

            einsatz.einheiten.forEach((einheit: any) => {
                einsatz_obj.einheiten.push(einheit.name);
            });

            einsatz.zusatzinfos.forEach((zusatzinfo: any) => {
                einsatz_obj.zusatzinfos.push({
                    'name': zusatzinfo.name,
                    'value': zusatzinfo.value
                })
            });

            this.einsaetze.push(einsatz_obj);

            // Trigger EinsatzAdd event
            em.emit('EinsatzAdd', einsatz.id);

            info(`Added new einsatz (${einsatz.id}) to array`);

            fitty('.einsatz-einheit div h4', {
                maxSize: 22.5
            });
            fitty('.einsatz-stichwort h1', {
                maxSize: 50
            });
        } else {
            warn(`Einsatz already in array (${einsatz.id})`);
        }
    };

    testeinsatz_fe2_id: Observable = ko.observable();
    testeinsatz_adresse: Observable = ko.observable();
    addTesteinsatz() {
        this.add_einsatz({
            'id': 1,
            'stichwort': "F1",
            'stichwort_color': "danger",
            'description': "Testalarm",
            'alarmzeit_seconds': moment().unix(),
            'adresse': this.testeinsatz_adresse(),
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

        if (this.testeinsatz_fe2_id())
            this.get_latest_einsatz().feedback_fe2_id(this.testeinsatz_fe2_id());
    };

    clearOperations() {
        this.einsaetze().forEach(function (einsatz) {
            einsatz.stopTasks();
        });
        this.einsaetze.removeAll();
    };

    board: Observable = ko.observable(new BoardViewModel());

    // Widgets
    // Todo: create default extra_config values and set to new widget
    // Todo: Maybe: on widget loading check if default config keys are empty to set them to default value

    // Info
    addInfoClock () {
        this.board().widgets.push(new ClockWidget(this.board(), "clock-widget", this.getCurrentWidgetType()));
    };

    addInfoText() {
        this.board().widgets.push(new Widget(this.board(), "text-widget", this.getCurrentWidgetType()));
    };

    addInfoNews() {
        this.board().widgets.push(new InfoNewsWidget(this.board(), "info-news-widget", this.getCurrentWidgetType()));
    };

    addInfoDienste() {
        this.board().widgets.push(new InfoAppointmentWidget(this.board(), "info-dienste-widget", this.getCurrentWidgetType()));
    };

    addInfoOperations() {
        this.board().widgets.push(new InfoOperationWidget(this.board(), "info-operations-widget", this.getCurrentWidgetType()));
    };

    // Operation
    addOperationStichwort() {
        this.board().widgets.push(new Widget(this.board(), "operation-stichwort", this.getCurrentWidgetType()));
    };

    addOperationAddress() {
        this.board().widgets.push(new Widget(this.board(), "operation-address", this.getCurrentWidgetType()));
    };
    addOperationAdditionalInformation() {
        this.board().widgets.push(new Widget(this.board(), "operation-additionalInformation", this.getCurrentWidgetType()));
    };

    addOperationRouteInformation() {
        this.board().widgets.push(new Widget(this.board(), "operation-routeInformation", this.getCurrentWidgetType()));
    };

    addOperationUnits() {
        this.board().widgets.push(new Widget(this.board(), "operation-units", this.getCurrentWidgetType()));
    };

    addOperationFeedback() {
        this.board().widgets.push(new Widget(this.board(), "operation-feedback", this.getCurrentWidgetType()));
    };

    addOperationFeedbackCount() {
        this.board().widgets.push(new Widget(this.board(), "operation-feedback-count", this.getCurrentWidgetType()));
    };

    addOperationAlarmMinutes() {
        this.board().widgets.push(new Widget(this.board(), "operation-alarmMinutes", this.getCurrentWidgetType()));
    };

    addOperationOverviewMap() {
        this.board().widgets.push(new Widget(this.board(), "operation-overviewMap", this.getCurrentWidgetType()));
    };

    addOperationRouteMap() {
        this.board().widgets.push(new Widget(this.board(), "operation-routeMap", this.getCurrentWidgetType()));
    };


    serialize () {
        debug(this.board().gridsterInfo.serialize());
    };

    saveWidgets() {
        var file = this.view() === "info" ? gridsterWidgetsFilePath : gridsterWidgetsOperationFilePath;
        info(`View | Saving view ${this.view()} to ${file}`);

        var to_save: any = [];

        this.board().gridsterInfo.serialize().forEach((widget: any) => {
            let wdg = this.board().get_by_id(this.board().widgets(), widget.id);

            info(`View | Saving widget ${ko.toJSON(wdg.config.toJSON())}`);

            widget['config'] = wdg.config;
            widget['extra_config'] = wdg.extra_config;
            to_save.push(widget);
        });

        fs.writeFile(file, JSON.stringify(to_save), 'utf8', function (err: any) {
            if (err) {
                error("An error occurred while writing JSON file");
                return error(err);
            }

            info(`View | JSON file has been written`);
        });
    };

    loadWidgets(path: any) {
        info(`View | Loading view from ${path}`);

        fs.readFile(path, (err: any, data: any) => {
            var jsonParsed = JSON.parse(data);

            jsonParsed.forEach((widget: any) => {
                debug(`View | Loaded widget: `, widget);

                let WidgetClass = dynamicWidget(widget.config.template);
                let wdg = new WidgetClass(this.board(), widget.config.template, widget.config.type, widget['row'], widget['col'], widget['size_x'], widget['size_y']);

                for (let key in widget.config) {
                    if (widget.config.hasOwnProperty(key)) {
                        debug(`View | Widget | Config | Set ${key} to ${widget.config[key]}`);
                        wdg.config.push(key, widget.config[key])
                    }
                }

                //wdg.extra_config = widget.extra_config;
                for (let key in widget.extra_config) {
                    if (widget.extra_config.hasOwnProperty(key)) {
                        wdg.extra_config.push(key, widget.extra_config[key])
                    }
                }

                wdg.loaded();

                this.board().widgets.push(wdg);
            });
        });
    };

    load() {
        this.loadWidgets(gridsterWidgetsFilePath);
    };

    save() {
        this.saveWidgets();
    };

    clearWidgets() {
        //while(self.board().widgets().length > 0) {
        //    self.board().widgets().forEach(wdg => {
        //        self.board().widgets.remove(wdg);
        //    });
        //}
        //self.board().widgets.removeAll();

        this.board().widgets().forEach((wdg: any) => {
            wdg.destroy();
        });

        this.board().gridsterInfo.remove_all_widgets();
        this.board().widgets.removeAll();
    };

    view: Observable = ko.observable("init");

    getCurrentWidgetType() {
        if (this.view() === "info")
            return widgetTypes.INFO;

        return widgetTypes.OPERATION;
    };

    loadView() {
        info(`View | Switching view - Einsatz: ${this.is_einsatz()} - View: ${this.view()}`);
        if (this.is_einsatz() && this.view() !== "operation") {
            this.view("operation");
            info(`View | Loading operation view`);
            this.clearWidgets();
            this.loadWidgets(gridsterWidgetsOperationFilePath);
        }
        if (!this.is_einsatz() && this.view() !== "info") {
            this.view("info");
            info(`View | Loading info view`);
            this.clearWidgets();
            this.loadWidgets(gridsterWidgetsFilePath);
        }
    };

    constructor() {
        this.loadView();

        // Update view if "einsaetze" changes
        this.einsaetze.subscribe((newValue: any) => {
            this.loadView();
        });

        info("Loaded EinsatzMonitorModel");
    }
}

export class BoardViewModel {
    widgets: ObservableArray = ko.observableArray([]);
    widgetsOperation: ObservableArray = ko.observableArray([]);
    editWidget: Observable = ko.observable();

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

            stop: (e: any, ui: any, widget: any) => {
                // var newDimensions = this.serialize(widget)[0];
                // console.log("New size: " + newDimensions.size_x + ", " + newDimensions.size_y);

                // Update font size on widget resize
                this.get_by_id(this.widgets(), parseInt(widget.attr('id'))).fitIfPossible();
            }
        },
        draggable: {
            stop: (event: any, ui: any) => {
                // var newrow = ui.$player[0].dataset.row;
                // var newcol = ui.$player[0].dataset.col;
                // console.log("New position: " + newrow + ", " + newcol);
            }
        },
        serialize_params(w: any, wgd: any) {
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
    gridsterInfo = ($("#gridsterInfo ul") as any).gridster(this.gridsterConfig).data('gridster');

    openWidgetAddModal() {
        ($('#addWidgetModal').appendTo("body") as any).modal('show');
    };

    openSettingsMenuModal() {
        ($('#settingsMenuModal').appendTo("body") as any).modal('show');
    };

    get_by_id(widgets: any, id: any) {
        return ko.utils.arrayFirst(widgets, (item: any) => {
            return id === item.id;
        });
    };

    getWidgetById(id: any) {
        return ko.utils.arrayFirst(this.widgets(), (item: any) => {
            return id === item.id;
        });
    };

    /**
     * Used as a callback for knockout's afterAdd function. This will be called
     * after a node has been added to the dom from the foreach template. Here,
     * we need to tell gridster that the node has been added and then set up
     * the correct gridster parameters on the widget.
     */
    addGridster = (node: any, index: any, obj: any) => {
        var widget = $(node);
        var column = widget.attr("data-col");
        var row = widget.attr("data-row");

        // only process the main tag which has "data-col" attr
        if (column) {
            var sizeX = obj.datasizex;
            var sizeY = obj.datasizey;
            // var sizeY = (obj.state() === "Minimized" || obj.state() === "Closed") ? 1 : obj.datasizey;

            // add the widget to the next position
            this.gridsterInfo.add_widget(widget, sizeX, sizeY, column, row);

            // trigger fitty to properly scale font size
            this.get_by_id(this.widgets(), parseInt(widget.attr('id') as string)).fitIfPossible();
        }
    };

    /**
     * Used as a callback for knockout's beforeRemove. Needs
     * to remove node parameter from the dom, or tell gridster
     * that the node should be removed if it is an li.
     */
    removeGridster = (node: any, index: any, widget: any, gridster = this.gridsterInfo) => {
        var wdg = $("#" + widget.id);

        if (wdg.attr("data-col")) {
            this.gridsterInfo.remove_widget(wdg);
        } else {
            node.parentNode.removeChild(node);
        }
    };


    /**
     * Remove a widget from knockout
     */
    removeWidget = (widget: any) => {
        try {
            this.widgets.remove(widget);
            this.widgetsOperation.remove(widget);
        } catch (e) {
        }
    };

    /**
     * Returns the template name of the given widget
     * @param widget
     * @returns {*|string}
     */
    templateName(widget: any) {
        return widget.config.get('template')();
    };

    constructor() {
        info("Created BoardViewModel");
    }
}

export default EinsatzMonitorModel

toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": true,
    "onclick": undefined,
    "showDuration": 300,
    "hideDuration": 1000,
    "timeOut": 10000,
    "extendedTimeOut": 1000,
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};


// Custom widget test
// Todo: Refactor into actual widgets
// ko.components.register('test-widget', {
//     viewModel: function (params: any) {
//         this.id = 1;
//
//         this.widget = new Widget(params.board(), "text-widget", "info", 20, 6, 14, 1);
//
//         this.widget.config.push("align", "center");
//         this.widget.extra_config.push("background-color", "center");
//         this.widget.extra_config.push("background-color", "rgba(0, 160, 0, 0.67)");
//         this.widget.extra_config.push("shadow", false);
//         this.widget.extra_config.push("text-color", "rgb(255, 255, 255)");
//         this.widget.extra_config.push("text-size", 60);
//         this.widget.extra_config.push("text-title", "Kein Einsatz aktiv");
//         this.widget.extra_config.push("vert-center", true);
//
//         // Data: value is either null, 'like', or 'dislike'
//         // this.chosenValue = params.value;
//         //
//         // // Behaviors
//         // this.like = function () {
//         //     this.chosenValue('like');
//         // }.bind(this);
//         // this.dislike = function () {
//         //     this.chosenValue('dislike');
//         // }.bind(this);
//
//
//         console.log(params.board().widgets());
//         console.log(params.board().widgets()[0]);
//
//         this.widgets = params.board().widgets();
//
//
//         this.edit = () => {
//             console.log("edit clicked");
//         }
//
//         this.removeSelected = () => {
//             console.log("removeSelected clicked");
//         }
//
//
//         console.log("debug custom component");
//         console.log($(".text-widget-test"));
//
//
//         params.board().gridsterInfo.add_widget($(".text-widget-test"), 14, 1, 6, 20);
//
//         console.log("test-widget viewModel called");
//     },
//     template: html_content.default,
//
//     // synchronous: true
//     // template: {
//     //     require: './widget_templates/test_widget.html'
//     // }
// });
