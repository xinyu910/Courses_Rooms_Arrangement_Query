import Log from "../Util";
import {Decimal} from "decimal.js";

export default class PerformQueryHelper {
    constructor() {
        Log.trace("");
    }

    public ComputeAvg(group: any, applyToken: any) {
        let arrayOfCourseObject: any = Object.values(group)[0];
        let sum: number = 0;
        let total: Decimal = new Decimal(sum);
        arrayOfCourseObject.forEach(function (courseObject: any) {
            let newNumber: Decimal = new Decimal(courseObject[applyToken]);
            total = Decimal.add(total, newNumber);
        });
        let avg: number = total.toNumber() / arrayOfCourseObject.length;
        return (Number(avg.toFixed(2)));
    }

    public ComputeSum(group: any, applyToken: any) {
        let arrayOfCourseObject: any = Object.values(group)[0];
        let sum: number = 0;
        let total: Decimal = new Decimal(sum);
        arrayOfCourseObject.forEach(function (courseObject: any) {
            let newNumber: Decimal = new Decimal(courseObject[applyToken]);
            total = Decimal.add(total, newNumber);
        });
        return Number(total.toFixed(2));
    }

    public ComputeMax(group: any, applyToken: any) {
        let applyTokenArray: any[] = [];
        let arrayOfCourseObject: any = Object.values(group)[0];
        arrayOfCourseObject.forEach(function (courseObject: any) {
            applyTokenArray.push(courseObject[applyToken]);
        });
        return Math.max.apply(Math, applyTokenArray);
    }

    public ComputeMin(group: any, applyToken: any) {
        let applyTokenArray: any[] = [];
        let arrayOfCourseObject: any = Object.values(group)[0];
        arrayOfCourseObject.forEach(function (courseObject: any) {
            applyTokenArray.push(courseObject[applyToken]);
        });
        return Math.min.apply(Math, applyTokenArray);
    }

    public ComputeCount(group: any, applyToken: any) {
        let applyTokenArray: any[] = [];
        let arrayOfCourseObject: any = Object.values(group)[0];
        arrayOfCourseObject.forEach(function (courseObject: any) {
            if (!applyTokenArray.includes(courseObject[applyToken])) {
                applyTokenArray.push(courseObject[applyToken]);
            }
        });
        return applyTokenArray.length;
    }

    public QueryHelper(query: any, results: any[]): any[] {
        let that = this;
        let groups: string[] = query["TRANSFORMATIONS"]["GROUP"];
        let arrayOfGroups: any = [];
        results.forEach(function (object: any) {
            let groupsObject: any = {};
            let valueArray: any[] = [];
            groups.forEach(function (group: any) {
                let value: any = object[group];
                valueArray.push(value);
            });
            let joinedString: string = valueArray.join("");
            let bool: boolean = false;
            if (arrayOfGroups.length !== 0) {
                arrayOfGroups.forEach(function (group2: any) {
                    if (group2.hasOwnProperty(joinedString)) {
                        group2[joinedString].push(object);
                        bool = true;
                    }
                });
            }
            if (bool === false) {
                let objectArray: any[] = [];
                objectArray.push(object);
                groupsObject[joinedString] = objectArray;
                arrayOfGroups.push(groupsObject);
            }
        });
        return that.final(query, arrayOfGroups);
    }

    public final(query: any, arrayOfGroups: any[]) {
        let that = this;
        let finalresults: any[] = [];
        let column: any = query["OPTIONS"]["COLUMNS"];
        let applyArray: any[] = query["TRANSFORMATIONS"]["APPLY"];
        arrayOfGroups.forEach(function (group: any) {
            let object: any = {};
            let arrayOfCourseObject: any = Object.values(group)[0];
            column.forEach(function (key: string) {
                if (key.includes("_")) {
                    object[key] = arrayOfCourseObject[0][key];
                } else {
                    let applyValue: any;
                    applyArray.forEach(function (applyObject) {
                        if (Object.keys(applyObject).includes(key)) {
                            applyValue = applyObject[key];
                        }
                    });
                    if (Object.keys(applyValue)[0] === "AVG") {
                        object[key] = that.ComputeAvg(group, Object.values(applyValue)[0]);
                    } else if (Object.keys(applyValue)[0] === "SUM") {
                        object[key] = that.ComputeSum(group, Object.values(applyValue)[0]);
                    } else if (Object.keys(applyValue)[0] === "MAX") {
                        object[key] = that.ComputeMax(group, Object.values(applyValue)[0]);
                    } else if (Object.keys(applyValue)[0] === "MIN") {
                        object[key] = that.ComputeMin(group, Object.values(applyValue)[0]);
                    } else if (Object.keys(applyValue)[0] === "COUNT") {
                        object[key] = that.ComputeCount(group, Object.values(applyValue)[0]);
                    }
                }
            });
            finalresults.push(object);
        });
        return finalresults;
    }

    public sort(query: any, results: any[]): any {
        let sortkey: any = query["OPTIONS"]["ORDER"];
        if (results.length !== 0) {
            if (typeof sortkey === "string") {
                this.sortresult(results, sortkey);
            } else if (typeof sortkey === "object") {
                let keyArray: any = sortkey["keys"];
                if (sortkey["dir"] === "UP") {
                    if (keyArray.length === 1) {
                        this.sortresult(results, keyArray[0]);
                    } else {
                        this.sortresultMultipleKey(results, keyArray);
                    }
                } else {
                    if (keyArray.length === 1) {
                        this.sortDownresult(results, keyArray[0]);
                    } else {
                        this.sortDownresultMultipleKey(results, keyArray);
                    }
                }
            }
        }
    }

    public sortresult(result: any, key: any): any {
        if (typeof result[0][key] === "number") {
            result.sort(function (first: any, second: any) {
                return first[key] - second[key];
            });
        } else {
            result.sort(function (first: any, second: any) {
                if (first[key] < second[key]) {
                    return -1;
                } else if (first[key] > second[key]) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }
    }

    public sortDownresult(result: any, key: any): any {
        if (typeof result[0][key] === "number") {
            result.sort(function (first: any, second: any) {
                return second[key] - first[key];
            });
        } else {
            result.sort(function (first: any, second: any) {
                if (first[key] > second[key]) {
                    return -1;
                } else if (first[key] < second[key]) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }
    }

    public sortresultMultipleKey(result: any, keys: any[]): any {
        let sortBy = function (properties: any[], targetArray: any[]) {
            targetArray.sort(function (i, j) {
                return properties.map(function (prop: any) {
                    if (typeof i[prop] === "number") {
                        return i[prop] - j[prop];
                    } else {
                        if (i[prop] < j[prop]) {
                            return -1;
                        } else if (i[prop] > j[prop]) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                }).find(function (res: any) {
                    return res;
                });
            });
        };
        sortBy(keys, result);
    }

    public sortDownresultMultipleKey(result: any, keys: any[]): any {
        let sortBy = function (properties: any[], targetArray: any[]) {
            targetArray.sort(function (i, j) {
                return properties.map(function (prop: any) {
                    if (typeof i[prop] === "number") {
                        return j[prop] - i[prop];
                    } else {
                        if (i[prop] > j[prop]) {
                            return -1;
                        } else if (i[prop] < j[prop]) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                }).find(function (res: any) {
                    return res;
                });
            });
        };
        sortBy(keys, result);
    }
}
