"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const QueryHelper_1 = require("./QueryHelper");
const DataSetHelper_1 = require("./DataSetHelper");
const PerformQueryHelper_1 = require("./PerformQueryHelper");
const fs = require("fs");
class InsightFacade {
    constructor() {
        this.ids = [];
        this.myDataSets = [];
    }
    addDataset(id, content, kind) {
        let that = this;
        if (id == null) {
            return Promise.reject(new IInsightFacade_1.InsightError("Null ID"));
        }
        else if (id.length === 0 || id.includes("_") || id === " ") {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid ID with underscore or whitespace"));
        }
        else if (that.ids.includes(id)) {
            return Promise.reject(new IInsightFacade_1.InsightError("repeated dataset"));
        }
        else if (content == null || kind == null) {
            return Promise.reject(new IInsightFacade_1.InsightError("invalid content and kind"));
        }
        let datasetHelper = new DataSetHelper_1.default(this.ids, this.myDataSets);
        return new Promise(function (fulfill, reject) {
            if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
                datasetHelper.getCourseDataSet(id, content).then((data) => {
                    that.ids.push(data["insightDataSet"]["id"]);
                    that.myDataSets.push(data);
                    fulfill(that.ids);
                }).catch((err) => {
                    reject(err);
                });
            }
            else if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
                datasetHelper.getRoomDataSet(id, content).then((data) => {
                    that.ids.push(data["insightDataSet"]["id"]);
                    that.myDataSets.push(data);
                    fulfill(that.ids);
                }).catch((err) => {
                    reject(err);
                });
            }
        });
    }
    removeDataset(id) {
        let that = this;
        return new Promise(function (fulfill, reject) {
            if (id == null) {
                reject(new IInsightFacade_1.InsightError("Null ID"));
            }
            else if (id.length === 0 || id.includes("_") || id === " ") {
                reject(new IInsightFacade_1.InsightError("Invalid ID with underscore or whitespace"));
            }
            else if (!(that.ids.includes(id))) {
                reject(new IInsightFacade_1.NotFoundError("id not found"));
            }
            else {
                that.myDataSets.forEach(function (dataSet, index) {
                    if (dataSet["insightDataSet"]["id"] === id) {
                        that.ids = that.ids.filter(function (item) {
                            if (item !== id) {
                                return item;
                            }
                        });
                        that.myDataSets.splice(index, 1);
                        fs.unlinkSync("./data/" + id + ".json");
                        fulfill(id);
                    }
                });
            }
        });
    }
    isapplied(course, filter) {
        let filterkeys = Object.keys(filter);
        switch (filterkeys[0]) {
            case "AND":
                return this.isAppliedHelperAnd(course, filter);
            case "OR":
                return this.isAppliedHelperOr(course, filter);
            case "NOT":
                return !this.isapplied(course, filter["NOT"]);
            case "LT":
                let leftstring = Object.keys(filter["LT"])[0];
                let rightnum = Object.values(filter["LT"])[0];
                return course[leftstring] < rightnum;
            case "GT":
                let leftstring1 = Object.keys(filter["GT"])[0];
                let rightnum1 = Object.values(filter["GT"])[0];
                return course[leftstring1] > rightnum1;
            case "EQ":
                let leftstring2 = Object.keys(filter["EQ"])[0];
                let rightnum2 = Object.values(filter["EQ"])[0];
                return course[leftstring2] === rightnum2;
            case "IS":
                return this.isAppliedHelperIs(course, filter);
        }
    }
    isAppliedHelperIs(course, filter) {
        let leftstring3 = Object.keys(filter["IS"])[0];
        let rightstring = Object.values(filter["IS"])[0];
        if (rightstring.includes("*")) {
            let first = rightstring[0] === "*";
            let last = rightstring[rightstring.length - 1] === "*";
            if (first && !last) {
                let newRightstring = rightstring.substr(1);
                let left = course[leftstring3];
                let newLeft = left.substr(left.length - newRightstring.length);
                return newLeft === newRightstring;
            }
            else if (last && !first) {
                let newRightstring = rightstring.substring(0, rightstring.length - 1);
                let left1 = course[leftstring3];
                return left1.substring(0, rightstring.length - 1) === newRightstring;
            }
            else if (first && last) {
                let newRightstring = rightstring.substr(1, rightstring.length - 2);
                let left = course[leftstring3];
                return left.includes(newRightstring);
            }
        }
        else {
            return course[leftstring3] === rightstring;
        }
    }
    isAppliedHelperAnd(course, filter) {
        let that = this;
        let combine = true;
        let andArray = filter["AND"];
        andArray.forEach(function (objects) {
            combine = combine && that.isapplied(course, objects);
        });
        return combine;
    }
    isAppliedHelperOr(course, filter) {
        let that = this;
        let combine1 = false;
        let OrArray = filter["OR"];
        OrArray.forEach(function (objects) {
            combine1 = combine1 || that.isapplied(course, objects);
        });
        return combine1;
    }
    performQuery(query) {
        let that = this;
        let final = [];
        let Query = new QueryHelper_1.default();
        let Perform = new PerformQueryHelper_1.default();
        if (Query.queryValidation(query) === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid query"));
        }
        else {
            return new Promise(function (fulfill, reject) {
                if (!(that.ids.includes(Query.id))) {
                    reject(new IInsightFacade_1.InsightError("ID not found"));
                }
                let where = {};
                where = query["WHERE"];
                let results = [];
                that.myDataSets.forEach(function (dataset) {
                    if (dataset["insightDataSet"]["id"] === Query.id) {
                        let smalldatasets = dataset["dataSets"];
                        smalldatasets.forEach(function (courseobject) {
                            if (Object.keys(where).length === 0 || that.isapplied(courseobject, where)) {
                                results.push(courseobject);
                            }
                        });
                    }
                });
                if (Object.keys(query).length === 3) {
                    final = Perform.QueryHelper(query, results);
                    Perform.sort(query, final);
                }
                else {
                    Perform.sort(query, results);
                    let column = query["OPTIONS"]["COLUMNS"];
                    results.forEach(function (dataobject) {
                        let courseObject = {};
                        column.forEach(function (keys) {
                            courseObject[keys] = dataobject[keys];
                        });
                        final.push(courseObject);
                    });
                }
                if (final.length > 5000) {
                    reject(new IInsightFacade_1.ResultTooLargeError("Too Large"));
                }
                else {
                    fulfill(final);
                }
            });
        }
    }
    listDatasets() {
        let insightDataSet = [];
        let that = this;
        return new Promise(function (fulfill, reject) {
            if (that.myDataSets.length === 0) {
                fulfill(insightDataSet);
            }
            that.myDataSets.forEach(function (dataSet, index) {
                insightDataSet.push(dataSet["insightDataSet"]);
                fulfill(insightDataSet);
            });
        });
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map