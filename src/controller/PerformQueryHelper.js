"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const decimal_js_1 = require("decimal.js");
class PerformQueryHelper {
    constructor() {
        Util_1.default.trace("");
    }
    ComputeAvg(group, applyToken) {
        let arrayOfCourseObject = Object.values(group)[0];
        let sum = 0;
        let total = new decimal_js_1.Decimal(sum);
        arrayOfCourseObject.forEach(function (courseObject) {
            let newNumber = new decimal_js_1.Decimal(courseObject[applyToken]);
            total = decimal_js_1.Decimal.add(total, newNumber);
        });
        let avg = total.toNumber() / arrayOfCourseObject.length;
        return (Number(avg.toFixed(2)));
    }
    ComputeSum(group, applyToken) {
        let arrayOfCourseObject = Object.values(group)[0];
        let sum = 0;
        let total = new decimal_js_1.Decimal(sum);
        arrayOfCourseObject.forEach(function (courseObject) {
            let newNumber = new decimal_js_1.Decimal(courseObject[applyToken]);
            total = decimal_js_1.Decimal.add(total, newNumber);
        });
        return Number(total.toFixed(2));
    }
    ComputeMax(group, applyToken) {
        let applyTokenArray = [];
        let arrayOfCourseObject = Object.values(group)[0];
        arrayOfCourseObject.forEach(function (courseObject) {
            applyTokenArray.push(courseObject[applyToken]);
        });
        return Math.max.apply(Math, applyTokenArray);
    }
    ComputeMin(group, applyToken) {
        let applyTokenArray = [];
        let arrayOfCourseObject = Object.values(group)[0];
        arrayOfCourseObject.forEach(function (courseObject) {
            applyTokenArray.push(courseObject[applyToken]);
        });
        return Math.min.apply(Math, applyTokenArray);
    }
    ComputeCount(group, applyToken) {
        let applyTokenArray = [];
        let arrayOfCourseObject = Object.values(group)[0];
        arrayOfCourseObject.forEach(function (courseObject) {
            if (!applyTokenArray.includes(courseObject[applyToken])) {
                applyTokenArray.push(courseObject[applyToken]);
            }
        });
        return applyTokenArray.length;
    }
    QueryHelper(query, results) {
        let that = this;
        let groups = query["TRANSFORMATIONS"]["GROUP"];
        let arrayOfGroups = [];
        results.forEach(function (object) {
            let groupsObject = {};
            let valueArray = [];
            groups.forEach(function (group) {
                let value = object[group];
                valueArray.push(value);
            });
            let joinedString = valueArray.join("");
            let bool = false;
            if (arrayOfGroups.length !== 0) {
                arrayOfGroups.forEach(function (group2) {
                    if (group2.hasOwnProperty(joinedString)) {
                        group2[joinedString].push(object);
                        bool = true;
                    }
                });
            }
            if (bool === false) {
                let objectArray = [];
                objectArray.push(object);
                groupsObject[joinedString] = objectArray;
                arrayOfGroups.push(groupsObject);
            }
        });
        return that.final(query, arrayOfGroups);
    }
    final(query, arrayOfGroups) {
        let that = this;
        let finalresults = [];
        let column = query["OPTIONS"]["COLUMNS"];
        let applyArray = query["TRANSFORMATIONS"]["APPLY"];
        arrayOfGroups.forEach(function (group) {
            let object = {};
            let arrayOfCourseObject = Object.values(group)[0];
            column.forEach(function (key) {
                if (key.includes("_")) {
                    object[key] = arrayOfCourseObject[0][key];
                }
                else {
                    let applyValue;
                    applyArray.forEach(function (applyObject) {
                        if (Object.keys(applyObject).includes(key)) {
                            applyValue = applyObject[key];
                        }
                    });
                    if (Object.keys(applyValue)[0] === "AVG") {
                        object[key] = that.ComputeAvg(group, Object.values(applyValue)[0]);
                    }
                    else if (Object.keys(applyValue)[0] === "SUM") {
                        object[key] = that.ComputeSum(group, Object.values(applyValue)[0]);
                    }
                    else if (Object.keys(applyValue)[0] === "MAX") {
                        object[key] = that.ComputeMax(group, Object.values(applyValue)[0]);
                    }
                    else if (Object.keys(applyValue)[0] === "MIN") {
                        object[key] = that.ComputeMin(group, Object.values(applyValue)[0]);
                    }
                    else if (Object.keys(applyValue)[0] === "COUNT") {
                        object[key] = that.ComputeCount(group, Object.values(applyValue)[0]);
                    }
                }
            });
            finalresults.push(object);
        });
        return finalresults;
    }
    sort(query, results) {
        let sortkey = query["OPTIONS"]["ORDER"];
        if (results.length !== 0) {
            if (typeof sortkey === "string") {
                this.sortresult(results, sortkey);
            }
            else if (typeof sortkey === "object") {
                let keyArray = sortkey["keys"];
                if (sortkey["dir"] === "UP") {
                    if (keyArray.length === 1) {
                        this.sortresult(results, keyArray[0]);
                    }
                    else {
                        this.sortresultMultipleKey(results, keyArray);
                    }
                }
                else {
                    if (keyArray.length === 1) {
                        this.sortDownresult(results, keyArray[0]);
                    }
                    else {
                        this.sortDownresultMultipleKey(results, keyArray);
                    }
                }
            }
        }
    }
    sortresult(result, key) {
        if (typeof result[0][key] === "number") {
            result.sort(function (first, second) {
                return first[key] - second[key];
            });
        }
        else {
            result.sort(function (first, second) {
                if (first[key] < second[key]) {
                    return -1;
                }
                else if (first[key] > second[key]) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
        }
    }
    sortDownresult(result, key) {
        if (typeof result[0][key] === "number") {
            result.sort(function (first, second) {
                return second[key] - first[key];
            });
        }
        else {
            result.sort(function (first, second) {
                if (first[key] > second[key]) {
                    return -1;
                }
                else if (first[key] < second[key]) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
        }
    }
    sortresultMultipleKey(result, keys) {
        let sortBy = function (properties, targetArray) {
            targetArray.sort(function (i, j) {
                return properties.map(function (prop) {
                    if (typeof i[prop] === "number") {
                        return i[prop] - j[prop];
                    }
                    else {
                        if (i[prop] < j[prop]) {
                            return -1;
                        }
                        else if (i[prop] > j[prop]) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    }
                }).find(function (res) {
                    return res;
                });
            });
        };
        sortBy(keys, result);
    }
    sortDownresultMultipleKey(result, keys) {
        let sortBy = function (properties, targetArray) {
            targetArray.sort(function (i, j) {
                return properties.map(function (prop) {
                    if (typeof i[prop] === "number") {
                        return j[prop] - i[prop];
                    }
                    else {
                        if (i[prop] > j[prop]) {
                            return -1;
                        }
                        else if (i[prop] < j[prop]) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    }
                }).find(function (res) {
                    return res;
                });
            });
        };
        sortBy(keys, result);
    }
}
exports.default = PerformQueryHelper;
//# sourceMappingURL=PerformQueryHelper.js.map