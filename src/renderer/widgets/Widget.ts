import {Computed, Observable, ObservableArray} from "knockout";
import EinsatzMonitorModel, {BoardViewModel} from "../EinsatzMonitor";
import * as ko from "knockout";

// const customTextFit = require('customTextFit');
// const textFit = require('textfit')


let ids = 1;

export const widgetTypes = {
    INFO: "info",
    OPERATION: "operation"
};

class Widget {
    main: EinsatzMonitorModel;
    board: BoardViewModel;
    id: number;
    datasizex: number;
    datasizey: number;
    dataRow: Observable = ko.observable();
    dataCol: Observable = ko.observable();
    availableAlignments: ObservableArray = ko.observableArray<string>([]);

    protected actionTimer?: any;

    removeSelected = () => {
        this.board.removeWidget(this);
        this.destroy();
    };

    config: any;
    // @ts-ignore
    extra_config: any = ko.observableDictionary();

    edit = () => {
        this.board.editWidget(this);
        let editModalSelector = '#edit-' + this.id;
        ($(editModalSelector).appendTo("body") as any).modal('show');

        // @ts-ignore
        $(editModalSelector).draggable({
            handle: ".modal-header"
        });

        ($('.widget-colorpicker') as any).colorpicker({
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

        let sliderSelector = "[id ='edit-" + this.id + "'] .widget-slider";

        for (let sliderObj of $(sliderSelector) as any) {
            ($(sliderObj) as any).slider({
                // initial value
                value: this.extra_config.get($(sliderObj).attr("data-field"))(),

                min: 0,
                max: $(sliderObj).attr("data-max") || 300,

                slide: (event: any, ui: any) => {
                    this.extra_config.get($(sliderObj).attr("data-field"))(ui.value);
                }
            });
        }
    };

    fitIfPossible() {
        let fittyElement = $("[id ='" + this.id + "'] .fitty-element");
        let newMax = parseInt((fittyElement as any).attr("data-maxfitty"));
        let max = newMax ? newMax : 50;

        if (this.extra_config.get('text-fitty')()) {
            // @ts-ignore
            customTextFit(fittyElement, {maxFontSize: max, alignHoriz: true, alignVert: true, multiLine: true})
        }
    };

    getBackgroundColor: Computed = ko.computed(() => {
        return this.extra_config?.get("background-color")() || "rgba(255, 255, 255, 0)"
    });

    afterAdd() {

    }

    resized() {

    }

    loaded() {

    }

    destroy() {
        clearInterval(this.actionTimer);
    }

    constructor(main: any, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        this.main = main;
        this.board = board;
        this.id = ids++;

        this.datasizex = x;
        this.datasizey = y;

        this.dataRow(row);
        this.dataCol(col);

        // @ts-ignore
        this.config = ko.observableDictionary({
            template: template_name,
            type: type,
            align: 'left'
        });

        this.availableAlignments(['left', 'center', 'right']);
    }
}

export default Widget;
