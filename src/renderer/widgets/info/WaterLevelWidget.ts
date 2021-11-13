import Widget from "../Widget";
import {axiosConfigParams, logger} from "../../../common/common";
import ApexCharts from "apexcharts";
import axios from "axios";
import {Observable} from "knockout";

class WaterLevelWidget extends Widget {
    private chart: any;
    private textColor: string = "grey";
    private currentWaterLevel: Observable = ko.observable("");

    options = {
        chart: {
            type: 'area',
            height: '100%',
            zoom: {
                enabled: false
            },
            toolbar: {
                show: false
            }
        },
        grid: {
            borderColor: "rgba(85,85,85,0.34)",
            clipMarkers: false,
            yaxis: {
                lines: {
                    show: true
                }
            },
        },
        tooltip: {
            theme: "dark"
        },
        xaxis: {
            type: "datetime",
            axisTicks: {
                color: this.textColor
            },
            axisBorder: {
                color: this.textColor
            },
            labels: {
                style: {
                    colors: this.textColor
                }
            }
        },
        yaxis: {
            axisTicks: {
                color: this.textColor
            },
            axisBorder: {
                color: this.textColor
            },
            labels: {
                style: {
                    colors: this.textColor
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        fill: {
            gradient: {
                enabled: true,
                opacityFrom: 0.85,
                opacityTo: 0.25
            }
        },
        series: [{
            name: 'Wasserstand',
            data: []
        }],
    }

    private loadDataPegelonline() {
        let station = this.extra_config.get('pegelonlineStation')();
        let limit = this.extra_config.get('pegelonlineLimit')();

        if (!station) {
            logger.warn('WaterLevelWidget | Pegelonline - Kein Stationsname angegeben.');
            return;
        }

        if (!Number(limit) || ((Number(limit) < 1) || (Number(limit) > 30))) {
            logger.warn('WaterLevelWidget | Pegelonline - Ungültiger Zeitraum angegeben.');
            return;
        }

        axios.get(`https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${station}/W/measurements.json?start=P${limit}D`, axiosConfigParams)
            .then((response) => {
                let measurements = response.data.map((item: any) => {
                    return [item['timestamp'], item['value']]
                })

                this.currentWaterLevel(`Aktueller Wasserstand: ${measurements[measurements.length - 1][1]}cm`);
                this.chart.updateSeries([{data: measurements}], false);

                logger.info("WaterLevelWidget | Successfully updated Pegelonline WaterLevel data.")
            });
    }

    public loadData() {
        switch (this.extra_config.get('apiSource')()) {
            case "Pegelonline":
            default: {
                this.loadDataPegelonline();
            }
        }
    }

    public updateChart() {
        this.chart.updateOptions({
            xaxis: {
                type: "datetime",
                axisTicks: {
                    color: this.textColor
                },
                axisBorder: {
                    color: this.textColor
                },
                labels: {
                    style: {
                        colors: this.textColor
                    }
                }
            },
            yaxis: {
                axisTicks: {
                    color: this.textColor
                },
                axisBorder: {
                    color: this.textColor
                },
                labels: {
                    style: {
                        colors: this.textColor
                    }
                }
            },
        }, false, false);
        this.loadData();
    }

    fit() {
        setTimeout(() => {
            this.fitIfPossible();
        }, 100);
    }

    afterAdd() {
        let chartSelector = "[id ='" + this.id + "'] #waterLevelChart";
        this.textColor = this.extra_config.get('text-color')();
        this.chart = new ApexCharts(document.querySelector(chartSelector), this.options);
        this.chart.render();

        this.loadData();
    }

    loaded() {

    }

    constructor(main: any, board: any, template_name: any, type: any, row = 0, col = 0, x = 3, y = 2) {
        super(main, board, template_name, type, row, col, x, y);

        this.actionTimer = window.setInterval(() => {
            this.loadData();
        }, 1000 * 60);

        this.extra_config.get('text-color').subscribe((newValue: any) => {
            this.textColor = newValue;
        })

        logger.info("Loaded WaterLevelWidget");
    }
}

export default WaterLevelWidget;
