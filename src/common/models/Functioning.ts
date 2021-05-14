const ko = require('knockout');
import {Observable} from 'knockout';

class Functioning {
    name: Observable = ko.observable();
    color: Observable = ko.observable();

    constructor(name: string, color: string) {
        this.name(name);
        this.color(color);
    }
}

export default Functioning;