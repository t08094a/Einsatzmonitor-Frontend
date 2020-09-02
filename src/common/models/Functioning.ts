const ko = require('knockout');
import {Observable} from 'knockout';

class Functioning {
    name: Observable = ko.observable();
    color: Observable = ko.observable();

    constructor(name: string, color: string) {
        this.name = ko.observable(name);
        this.color = ko.observable(color);
    }
}

export default Functioning;