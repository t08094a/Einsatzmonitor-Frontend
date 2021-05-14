const ko = require('knockout');
import {Observable} from 'knockout';

class NewsPost {
    id: Observable = ko.observable();
    title: Observable = ko.observable();
    image_url: Observable = ko.observable();
    description_truncated: Observable = ko.observable();
    date_formatted: Observable = ko.observable();

    constructor(id: number, title: string, image_url: string, description_truncated: string, date_formatted: string) {
        this.id(id);
        this.title(title);
        this.image_url(image_url);
        this.description_truncated(description_truncated);
        this.date_formatted(date_formatted);
    }
}

export default NewsPost;