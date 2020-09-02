const ko = require('knockout');
import {Computed, Observable, ObservableArray} from 'knockout';

class Person {
    name: Observable = ko.observable();
    functions: ObservableArray = ko.observableArray([]);
    feedback: Observable = ko.observable();

    get_feedback_color: Computed;

    isHidden(widget: any, fb: any) {
        return widget.extra_config.get('hide-' + fb.toLowerCase())()
    }

    constructor(name: string, feedback: string) {
        this.name = ko.observable(name);
        this.feedback = ko.observable(feedback);

        this.get_feedback_color = ko.computed(() => {
            if (this.feedback() === "YES")
                return "bg-success";

            if (this.feedback() === "NO")
                return "bg-danger";

            if (this.feedback() === "ABSENT")
                return "bg-danger";

            if (this.feedback() === "FREE")
                return "bg-warning";

            return "bg-secondary"
        });
    }
}

export default Person;