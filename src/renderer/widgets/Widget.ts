import {Observable, ObservableArray} from "knockout";
import {BoardViewModel} from "../EinsatzMonitor";

const ko = require('knockout');
const textFit = require('textfit')

let ids = 1;

export const widgetTypes = {
    INFO: "info",
    OPERATION: "operation"
};

class Widget {
    board: BoardViewModel;
    id: number;
    datasizex: number;
    datasizey: number;
    dataRow: Observable = ko.observable();
    dataCol: Observable = ko.observable();
    availableAlignments: ObservableArray;

    removeSelected = () => {
        this.board.removeWidget(this);
        this.destroy();
    };

    config: any;
    extra_config: any = ko.observableDictionary();

    edit = () => {
        this.board.editWidget(this);
        ($('#edit-' + this.id).appendTo("body") as any).modal('show');
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

        ($(sliderSelector) as any).slider({
            // initial value
            value: this.extra_config.get($(sliderSelector).attr("data-field"))(),

            min: 0,
            max: $(sliderSelector).attr("data-max") ? $(sliderSelector).attr("data-max") : 300,

            slide: (event: any, ui: any) => {
                this.extra_config.get($(sliderSelector).attr("data-field"))(ui.value);
            }
        });
    };

    fitIfPossible() {
        let fittyElement = $("[id ='" + this.id + "'] .fitty-element");
        let newMax = parseInt((fittyElement as any).attr("data-maxfitty"));
        let max = newMax ? newMax : 50;

        if (this.extra_config.get('text-fitty')()) {
            textFit(fittyElement, {maxFontSize: max, alignHoriz: true, alignVert: true})
        }
    };

    loaded() {

    }

    destroy() {

    }

    constructor(board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        this.board = board;
        this.id = ids++;

        this.datasizex = x;
        this.datasizey = y;

        this.dataRow = ko.observable(row);
        this.dataCol = ko.observable(col);

        this.config = ko.observableDictionary({
            template: template_name,
            type: type,
            align: 'left'
        });

        this.availableAlignments = ko.observableArray(['left', 'center', 'right']);
    }
}

export default Widget;