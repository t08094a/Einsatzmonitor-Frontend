const ko = require('knockout');
import {Observable} from 'knockout';

class NewsPost {
    id: Observable = ko.observable();
    title: Observable = ko.observable();
    image_url: Observable = ko.observable();
    description_truncated: Observable = ko.observable();
    date_formatted: Observable = ko.observable();

    constructor(id: number, title: string, image_url: string, description_truncated: string, date_formatted: string) {
        this.id = ko.observable(id);
        this.title = ko.observable(title);
        this.image_url = ko.observable(image_url);
        this.description_truncated = ko.observable(description_truncated);
        this.date_formatted = ko.observable(date_formatted);
    }
}

export default NewsPost;