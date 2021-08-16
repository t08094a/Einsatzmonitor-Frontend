import AAO from "../common/models/AAO";
import {em, logger} from "../common/common";
import EinsatzMonitorModel from "./EinsatzMonitor";
import settings from "electron-settings";
import toastr from "toastr";
import Operation from "../common/models/Operation";
import AaoWidget from "./widgets/operation/AaoWidget";
import Widget from "./widgets/Widget";
import * as ko from "knockout";
import * as electron from "electron";
import path from "path";
import {JSONFile, Low} from "lowdb/lib";


const userDataPath = (electron.app || electron.remote.app).getPath('userData');
const file = path.join(userDataPath, 'aao_db.json');
const adapter = new JSONFile(file);
const aaoDb = new Low(adapter);


class AAOModel {
    private main: EinsatzMonitorModel;
    aaos: KnockoutObservableArray<AAO> = ko.observableArray([]);

    saving: KnockoutObservable<boolean> = ko.observable(false);

    newAao: KnockoutObservable<AAO | undefined> = ko.observable<AAO | undefined>();
    newKeyword: KnockoutObservable<string> = ko.observable("");
    newKeywordDescription: KnockoutObservable<string> = ko.observable("");
    newCity: KnockoutObservable<string> = ko.observable("");
    newObject: KnockoutObservable<string> = ko.observable("");

    private ignoreFields = ["enabledTimeFrameDisplay", "isValid", "assignedVehicles", "availableVehicles", "availableVehiclesList", "vehicleModel"];

    constructor(einsatzMonitorModel: EinsatzMonitorModel) {
        logger.info("Loaded AAOModel");
        this.main = einsatzMonitorModel;
        this.newAao(new AAO(this.main.vehicleModel));

        // Check for matching AAOs
        em.on('EinsatzAdd', (operation: Operation) => {
            logger.info(`AAOModel | EinsatzAdd event fired (${operation.id()})`);

            this.aaos().forEach((aao: AAO) => {
                if (aao.isValid(operation)) {
                    logger.info(`Saving AAO ${aao.name()} as matched AAO for Operation ${operation.id()}`);
                    operation.matchedAao(aao);

                    // update widget font sizes
                    this.main.board().widgets().forEach((widget: Widget) => {
                        if (widget instanceof AaoWidget) {
                            // Wait until widget is fully loaded
                            setTimeout(() => {
                                widget.fitIfPossible();
                            }, 200);
                        }
                    });
                }
            })
        });
    }

    addNewKeyword = () => {
        if (this.newKeyword())
            this.newAao()?.keywords.push(this.newKeyword());
    };

    addNewKeywordDescription = () => {
        if (this.newKeywordDescription())
            this.newAao()?.keywordDescriptions.push(this.newKeywordDescription());
    };

    addNewCity = () => {
        if (this.newCity())
            this.newAao()?.cities.push(this.newCity());
    };

    addNewObject = () => {
        if (this.newObject())
            this.newAao()?.objects.push(this.newObject());
    };

    openVehicleSelectModal = () => {
        // save currently unassigned vehicles to a new list for knockout-sortablejs
        this.newAao()?.availableVehiclesList(this.newAao()?.availableVehicles());
        ($('#aaoModalVehicleSelect').appendTo("body") as any).modal('show');
    }

    addAao = (aao: any) => {
        let newAaoCopy = new AAO(this.main.vehicleModel);

        Object.keys(aao).forEach((key: string) => {
            let val = aao[key];

            if (typeof (val) !== "function") {
                // newAaoCopy[key as keyof AAO](val);
                let prop = newAaoCopy[key as keyof AAO];

                // cast vehicles back to their actual object instead of plain JS objects
                if (key == "vehicles1" || key == "vehicles2" || key == "vehicles3") {
                    val.forEach((item: any) => {
                        // @ts-ignore
                        prop.push(this.main.vehicleModel.getVehicleById(item.identification));
                    });
                    return;
                }

                if (ko.isObservable(prop) && !ko.isComputed(prop)) {
                    // @ts-ignore
                    prop(val);
                }
            }
        });

        this.aaos.push(newAaoCopy);
    }

    addNewAao = () => {
        let newAaoJS = ko.toJS(this.newAao);
        this.addAao(newAaoJS);
    }

    removeAao = (item: AAO) => {
        this.aaos.remove(item);
    }

    editAao = (item: AAO) => {
        this.newAao(item);
    }

    loadAaoFromDisk = () => {
        try {
            aaoDb.read().then(() => {
                let aaos = aaoDb.data as [AAO];

                if (aaos) {
                    this.aaos.removeAll();

                    aaos.forEach((aao: AAO) => {
                        this.addAao(aao)
                    })
                }
            })

        } catch (e) {
            logger.debug(e);
            logger.debug("No AAOs saved yet.")
        }
    };

    saveAaoToDisk = () => {
        this.saving(true);

        setTimeout(() => {
            // Also save identification field from vehicles
            let fieldsToSave = ["identification"]

            // Save AAO class fields and ignore special ones
            // Todo: refactor this hacky field name lookup
            Object.keys(new AAO(this.main.vehicleModel)).forEach(key => {
                if (!this.ignoreFields.includes(key)) {
                    fieldsToSave.push(key);
                }
            })

            // @ts-ignore
            let json = ko.toJSON(this.aaos, fieldsToSave);

            aaoDb.data = JSON.parse(json);
            aaoDb.write();

            toastr.success("AAO erfolgreich gespeichert", "Alarm- und Ausrückeordnung");
            this.saving(false);
        }, 100)
    };
}

export default AAOModel;