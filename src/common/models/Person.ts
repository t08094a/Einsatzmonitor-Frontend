const ko = require('knockout');
import {Computed, Observable, ObservableArray} from 'knockout';

class Person {
    name: Observable = ko.observable();
    functions: ObservableArray = ko.observableArray([]);
    feedback: Observable = ko.observable();

    getFeedbackColor: Computed;

    isHidden(widget: any, fb: any) {
        return widget.extra_config.get('hide-' + fb.toLowerCase())()
    }

    constructor(name: string, feedback: string) {
        this.name(name);
        this.feedback(feedback);

        this.getFeedbackColor = ko.computed(() => {
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