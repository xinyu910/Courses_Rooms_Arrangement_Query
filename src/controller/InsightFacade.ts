import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import QueryHelper from "./QueryHelper";
import DataSetHelper from "./DataSetHelper";
import PerformQueryHelper from "./PerformQueryHelper";

const fs = require("fs");
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private ids: string[];
    private myDataSets: any[];

    constructor() {
        this.ids = [];
        this.myDataSets = [];
        /*this.myDataSets.forEach(function (dataset: any) {
            if (!(fs.existsSync("./data/" + dataset["insightDataSet"]["id"] + ".json"))) {
                fs.writeFileSync("./data/" + dataset["insightDataSet"]["id"] + ".json", dataset);
            }
        });*/
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let that = this;     /*https://www.vojtechruzicka.com/javascript-this-keyword/*/
        if (id == null) {
            return Promise.reject(new InsightError("Null ID"));
        } else if (id.length === 0 || id.includes("_") || id === " ") {
            return Promise.reject(new InsightError("Invalid ID with underscore or whitespace"));
        } else if (that.ids.includes(id)) {
            return Promise.reject(new InsightError("repeated dataset"));
        } else if (content == null || kind == null) {
            return Promise.reject(new InsightError("invalid content and kind"));
        }
        let datasetHelper = new DataSetHelper(this.ids, this.myDataSets);
        return new Promise(function (fulfill: any, reject: any) {
            if (kind === InsightDatasetKind.Courses) {
                datasetHelper.getCourseDataSet(id, content).then((data: any) => {
                    that.ids.push(data["insightDataSet"]["id"]);
                    that.myDataSets.push(data);
                    fulfill(that.ids);
                }).catch((err: any) => {
                    reject(err);
                });
            } else if (kind === InsightDatasetKind.Rooms) {
                datasetHelper.getRoomDataSet(id, content).then((data: any) => {
                    that.ids.push(data["insightDataSet"]["id"]);
                    that.myDataSets.push(data);
                    fulfill(that.ids);
                }).catch((err: any) => {
                    reject(err);
                });
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        let that = this;
        return new Promise(function (fulfill: any, reject: any) {
            if (id == null) {
                reject(new InsightError("Null ID"));
            } else if (id.length === 0 || id.includes("_") || id === " ") {
                reject(new InsightError("Invalid ID with underscore or whitespace"));
            } else if (!(that.ids.includes(id))) {
                reject(new NotFoundError("id not found"));
            } else {
                that.myDataSets.forEach(function (dataSet: any, index: number) {
                    if (dataSet["insightDataSet"]["id"] === id) {
                        that.ids = that.ids.filter(function (item: string) {
                            if (item !== id) {
                                return item;
                            }
                        });
                        that.myDataSets.splice(index, 1);
                        fs.unlinkSync("./data/" + id + ".json");
                        /*https://stackoverflow.com/questions/40462369/
                        remove-item-from-stored-array-in-angular-2/40462431*/
                        fulfill(id);
                    }
                });
            }
        });
    }

    public isapplied(course: any, filter: any): boolean {
        let filterkeys: any = Object.keys(filter);
        switch (filterkeys[0]) {
            case "AND":
                return this.isAppliedHelperAnd(course, filter);
            case"OR":
                return this.isAppliedHelperOr(course, filter);
            case "NOT":
                return !this.isapplied(course, filter["NOT"]);
            case "LT":
                let leftstring: any = Object.keys(filter["LT"])[0];
                let rightnum: any = Object.values(filter["LT"])[0];
                return course[leftstring] < rightnum;
            case "GT":
                let leftstring1: any = Object.keys(filter["GT"])[0];
                let rightnum1: any = Object.values(filter["GT"])[0];
                return course[leftstring1] > rightnum1;
            case "EQ":
                let leftstring2: any = Object.keys(filter["EQ"])[0];
                let rightnum2: any = Object.values(filter["EQ"])[0];
                return course[leftstring2] === rightnum2;
            case "IS":
                return this.isAppliedHelperIs(course, filter);
        }
    }

    public isAppliedHelperIs(course: any, filter: any) {
        let leftstring3: any = Object.keys(filter["IS"])[0];
        let rightstring: any = Object.values(filter["IS"])[0];
        if (rightstring.includes("*")) {
            let first: boolean = rightstring[0] === "*";
            let last: boolean = rightstring[rightstring.length - 1] === "*";
            if (first && !last) {
                let newRightstring = rightstring.substr(1);
                let left: any = course[leftstring3];
                let newLeft = left.substr(left.length - newRightstring.length);
                return newLeft === newRightstring;
            } else if (last && !first) {
                let newRightstring = rightstring.substring(0, rightstring.length - 1);
                let left1: any = course[leftstring3];
                return left1.substring(0, rightstring.length - 1) === newRightstring;
            } else if (first && last) {
                let newRightstring = rightstring.substr(1, rightstring.length - 2);
                let left = course[leftstring3];
                return left.includes(newRightstring);
            }
        } else {
            return course[leftstring3] === rightstring;
        }
    }

    public isAppliedHelperAnd(course: any, filter: any) {
        let that = this;
        let combine: boolean = true;
        let andArray: any[] = filter["AND"];
        andArray.forEach(function (objects: any) {
            combine = combine && that.isapplied(course, objects);
        });
        return combine;
    }

    public isAppliedHelperOr(course: any, filter: any) {
        let that = this;
        let combine1: boolean = false;
        let OrArray: any[] = filter["OR"];
        OrArray.forEach(function (objects: any) {
            combine1 = combine1 || that.isapplied(course, objects);
        });
        return combine1;
    }

    public performQuery(query: any): Promise<any[]> {
        let that: any = this;
        let final: any[] = [];
        let Query = new QueryHelper();
        let Perform = new PerformQueryHelper();
        if (Query.queryValidation(query) === 0) {
            return Promise.reject(new InsightError("Invalid query"));
        } else {
            return new Promise(function (fulfill: any, reject: any) {
                    if (!(that.ids.includes(Query.id))) {
                        reject(new InsightError("ID not found"));
                    }
                    let where: any = {};
                    where = query["WHERE"];
                    let results: any[] = [];
                    that.myDataSets.forEach(function (dataset: any) {
                        if (dataset["insightDataSet"]["id"] === Query.id) {
                            let smalldatasets: any = dataset["dataSets"];
                            smalldatasets.forEach(function (courseobject: any) {
                                if (Object.keys(where).length === 0 || that.isapplied(courseobject, where)) {
                                    results.push(courseobject);
                                }
                            });
                        }
                    });
                    if (Object.keys(query).length === 3) {
                        final = Perform.QueryHelper(query, results);
                        Perform.sort(query, final);
                    } else {
                        Perform.sort(query, results);
                        let column: any = query["OPTIONS"]["COLUMNS"];
                        results.forEach(function (dataobject: any) {
                            let courseObject: any = {};
                            column.forEach(function (keys: any) {
                                courseObject[keys] = dataobject[keys];
                            });
                            final.push(courseObject);
                        });
                    }
                    if (final.length > 5000) {
                        reject(new ResultTooLargeError("Too Large"));
                    } else {
                        fulfill(final);
                    }
                }
            );
        }
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let insightDataSet: InsightDataset[] = [];
        let that = this;
        return new Promise(function (fulfill: any, reject: any) {
            if (that.myDataSets.length === 0) {
                fulfill(insightDataSet);
            }
            that.myDataSets.forEach(function (dataSet: any, index: number) {
                insightDataSet.push(dataSet["insightDataSet"]);
                fulfill(insightDataSet);
            });
        });
    }
}
