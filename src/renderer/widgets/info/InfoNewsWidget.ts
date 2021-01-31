import Widget from "../Widget";

const ko = require('knockout');
import {Computed, ObservableArray} from "knockout";
import axios from "axios";
import {axiosConfigParams, logger, updateModel} from "../../../common/common";
import NewsPost from "../../../common/models/NewsPost";
import settings from "electron-settings";

class InfoNewsWidget extends Widget {
    actionTimer: any;
    news: ObservableArray = ko.observableArray([]);

    sortedNews: Computed = ko.computed(() => {
        return this.news ? this.news().sort(function (a, b) {
            return b.id() - a.id();
        }) : null;
    });

    loadNews() {
        let url = this.extra_config.get('url')();

        if (!url) {
            logger.info("Keine URL zum Abrufen von News konfiguriert.");
            return;
        }

        axios.get(url, axiosConfigParams)
            .then((response) => {
                let news: any = [];

                response.data.forEach((news_post: any) => {
                    news.push(news_post.id);

                    let new_newsPost = new NewsPost(news_post.id, news_post.title, news_post.images[0].image_url, news_post.description_truncated, news_post.date_formatted);

                    var match = ko.utils.arrayFirst(this.news(), (item: any) => {
                        return new_newsPost.id() === item.id();
                    });

                    // News not in array, add it
                    if (!match) {
                        this.news.push(new_newsPost)
                    } else {
                        updateModel(match, news_post);
                        match.image_url(news_post.images[0].image_url);
                    }
                });

                this.news().forEach((item: any) => {
                    if (!news.includes(item.id())) {
                        this.news.remove(item);
                    }
                });
            })
    }

    loaded() {
        this.loadNews();
    }

    destroy() {
        clearInterval(this.actionTimer);
    }

    constructor(board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.loadNews();
        }, 1000 * (settings.getSync("info.httpFetchInterval") as number));

        logger.info("Loaded NewsWidget");
    }
}

export default InfoNewsWidget;