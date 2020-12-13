import Widget from "../Widget";
import {Computed} from "knockout";
const ko = require('knockout');

class ImageWidget extends Widget {
    actionTimer: number;

    updateImage() {

    }

    classes: Computed = ko.computed(() => {
        let classes = ""

        if (this.extra_config.get('width100')()) {
            classes = classes + " w-100"
        }

        if (this.extra_config.get('heigth100')()) {
            classes = classes + " h-100"
        }

        if (this.extra_config.get('image-center')()) {
            classes = classes + " image-center"
        }

        return classes;
    });

    loaded() {
        this.updateImage();
    }

    destroy() {
        clearInterval(this.actionTimer);
    }

    constructor(board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.updateImage();
        }, 1000 * 60 * 60);

        console.log("Loaded ImageWidget");
    }
}

export default ImageWidget