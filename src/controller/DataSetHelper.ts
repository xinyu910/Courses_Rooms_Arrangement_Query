import * as JSZip from "jszip";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import Log from "../Util";
import * as fs from "fs";

let parse5 = require("parse5");
let http = require("http");
export default class DataSetHelper {
    private tbody: any;
    private tobody: any;
    private Rooms: any[];

    constructor(ids: string[], myDataSets: any[]) {
        Log.trace("initialize");
        this.tbody = null;
        this.Rooms = [];
        this.tobody = null;
    }

    public getCourseDataSet(id: string, content: string): Promise<any> {
        let dataSets: any = [];
        let that = this;
        return new Promise(function (fulfill: any, reject: any) {
            let jszip = new JSZip();
            let promises: any[] = [];
            jszip.loadAsync(content, {base64: true}).then(function (zip: JSZip) {
                let course = zip.folder("courses/");
                if (course.length === 0) {
                    reject(new InsightError("No valid courses folder"));
                }
                zip.folder("courses/").forEach(function (files, file) {
                    let promise = file.async("text").catch((error: any) => {
                        reject(new InsightError("async error"));
                    });
                    promises.push(promise);
                });
                Promise.all(promises).then(function (data) {
                    dataSets = that.getCoursesHelper(data, id);
                    if (dataSets.length === 0) {
                        reject(new InsightError("No valid course section"));
                    } else {
                        let insightData: InsightDataset = {
                            id: id, kind: InsightDatasetKind.Courses, numRows: dataSets.length
                        };
                        let Data: any = {insightDataSet: insightData, dataSets: dataSets};
                        if (!(fs.existsSync("./data/" + id + ".json"))) {
                            that.writeToFile(id, Data);
                        }
                        fulfill(Data);
                    }
                }).catch((err: any) => {
                    reject(new InsightError("promise all error"));
                });
            }).catch((err: any) => {
                reject(new InsightError("invalid zip file"));
            });
        });
    }

    private getCoursesHelper(data: any[], id: string): any {
        let dataSets: any[] = [];
        data.forEach(function (result: any) {
            let sections: any[];
            try {
                let parsedContent = JSON.parse(result);
                if (parsedContent["result"] !== null) {
                    sections = parsedContent["result"];
                }
                sections.forEach(function (section: any) {
                    if (section.hasOwnProperty("Subject") && section.hasOwnProperty("Course")
                        && section.hasOwnProperty("Avg") && section.hasOwnProperty("Professor")
                        && section.hasOwnProperty("Title") && section.hasOwnProperty("Pass")
                        && section.hasOwnProperty("Fail") && section.hasOwnProperty("Audit")
                        && section.hasOwnProperty("id")
                        && section.hasOwnProperty("Year")) {
                        let courseObject: any = new Object();
                        courseObject[id + "_dept"] = section["Subject"];
                        courseObject[id + "_id"] = section["Course"];
                        courseObject[id + "_avg"] = section["Avg"];
                        courseObject[id + "_instructor"] = section["Professor"];
                        courseObject[id + "_title"] = section["Title"];
                        courseObject[id + "_pass"] = section["Pass"];
                        courseObject[id + "_fail"] = section["Fail"];
                        courseObject[id + "_audit"] = section["Audit"];
                        courseObject[id + "_uuid"] = section["id"].toString();
                        if (section["Section"] === "overall") {
                            courseObject[id + "_year"] = 1900;
                        } else {
                            courseObject[id + "_year"] = Number(section["Year"]);
                        }
                        dataSets.push(courseObject);
                    }
                });
            } catch (error) {
                Log.trace("");
            }
        });
        return dataSets;
    }

    private writeToFile(id: string, data: any): void {
        let d: string = JSON.stringify(data);
        fs.writeFileSync("./data/" + id + ".json", d);
    }

    public getRoomDataSet(id: string, content: string): Promise<any> {
        let that = this;
        return new Promise(function (fulfill: any, reject: any) {
            let jszip = new JSZip();
            jszip.loadAsync(content, {base64: true}).then(function (zip: JSZip) {
                let room = zip.folder("rooms/");
                if (room.length === 0) {
                    reject(new InsightError("No valid courses folder"));
                }
                zip.file("rooms/index.htm").async("text").then(function (htmlcode: any) {
                    let parsed: any = parse5.parse(htmlcode);
                    try {
                        that.getAllBuildings(id, parsed, zip).then(function (rooms: any[]) {
                            let insightData: InsightDataset = {
                                id: id, kind: InsightDatasetKind.Rooms, numRows: that.Rooms.length
                            };
                            let Data: any = {insightDataSet: insightData, dataSets: that.Rooms};
                            that.writeToFile(id, Data);
                            fulfill(Data);
                        }).catch((err: any) => {
                            reject(new InsightError("get all building error"));
                        });
                    } catch {
                        reject(new InsightError("other error"));
                    }
                }).catch((error: any) => {
                    reject(new InsightError("async error"));
                });
            }).catch((err: any) => {
                reject(new InsightError("jszip error"));
            });
        });
    }

    public getAllBuildings(id: any, content: any, file: any): Promise<any> {
        let that = this;
        let promises: any[] = [];
        this.tbody = null;
        let childNodeArray = this.getTBody(content);
        if (childNodeArray == null) {
            return Promise.reject("Missing building information inside index.htm");
        }
        for (let buildingsobj of childNodeArray) {
            if (buildingsobj.nodeName === "tr" && buildingsobj.childNodes.length === 11) {
                let buildingsmallobj: any = Object();
                buildingsmallobj.name = buildingsobj.childNodes[3].childNodes[0].value.trim();
                buildingsmallobj.address = buildingsobj.childNodes[7].childNodes[0].value.trim();
                buildingsmallobj.fullname =
                    buildingsobj.childNodes[5].childNodes[1].childNodes[0].value.trim();
                buildingsmallobj.fileaddress = buildingsobj.childNodes[5].childNodes[1].attrs[0].value;
                buildingsmallobj.id = id;
                if (buildingsmallobj.name != null && buildingsmallobj.address != null &&
                    buildingsmallobj.fullname != null && buildingsmallobj.fileaddress != null) {
                    promises.push(that.parseRoom(id, buildingsmallobj, file));
                }
            }
        }
        return new Promise(function (fulfill: any, reject: any) {
            Promise.all(promises).then(function (nothing: any) {
                if (that.Rooms.length === 0) {
                    return reject(new InsightError("no valid rooms"));
                } else {
                    return fulfill(that.Rooms);
                }
            }).catch((err: any) => {
                reject(new InsightError(""));
            });
        });
    }

    public parseRoom(id: string, buildingsmallobj: any, file: any): Promise<any> {
        let that = this;
        return new Promise(function (fulfill: any, reject: any) {
            that.gethttp(id, buildingsmallobj, file).then(function (preciseloc: any) {
                if ((preciseloc.error == null && (preciseloc.lat != null && preciseloc.lon !== null))) {
                    let fileaddress = buildingsmallobj.fileaddress;
                    let address: string = fileaddress.substr(1);
                    let newAddress = "rooms" + address;
                    file.file(newAddress).async("text").then(function (htmlcode: any) {
                        let buildinginfo: any = new Object();
                        buildinginfo.lat = preciseloc.lat;
                        buildinginfo.lon = preciseloc.lon;
                        buildinginfo.name = buildingsmallobj.name;
                        buildinginfo.address = buildingsmallobj.address;
                        buildinginfo.fullname = buildingsmallobj.fullname;
                        let parsedfile: any = parse5.parse(htmlcode);
                        try {
                            that.getRooms(id, parsedfile, buildinginfo);
                            return fulfill();
                        } catch (err) {
                            return fulfill();
                        }
                    }).catch((err: any) => {
                        return fulfill();
                    });
                }
            }).catch((err: any) => {
                return fulfill();
            });
        });
    }

    public gethttp(id: any, building: any, file: any): Promise<any> {
        return new Promise(function (fulfill, reject) {
            let address: any = encodeURI(building.address);
            http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team074/"
                + address, (res: any) => {
                if (res.code === 404) {
                    reject("invalid url");
                }
                res.setEncoding("utf8");
                let rawData = "";
                res.on("data", function (chunk: any) {
                    rawData += chunk;
                });
                res.on("end", () => {
                    try {
                        let parsedData = JSON.parse(rawData);
                        fulfill(parsedData);
                    } catch (err) {
                        reject(new InsightError(""));
                    }
                });
            }).on("error", function (err: any) {
                fulfill(null);
            });
        });
    }

    public getTBody(content: any): any {
        if (content.childNodes == null) {
            return;
        } else {
            if (content.attrs != null && content.nodeName != null && content.tagName != null) {
                if (content.attrs.length === 1 && content.attrs[0]["name"] === "class" && content.attrs[0]["value"]
                    === "view-content") {
                    this.tbody = content.childNodes[1].childNodes[3].childNodes;
                }
            }
        }
        for (let c of content.childNodes) {
            this.getTBody(c);
        }
        return this.tbody;
    }

    public getRoomContents(content: any): any {
        if (content.childNodes == null) {
            return;
        } else {
            if (content.attrs != null && content.nodeName != null && content.tagName != null) {
                if (content.tagName === "tbody" && content.nodeName === "tbody") {
                    this.tobody = content.childNodes;
                }
            }
        }
        for (let room of content.childNodes) {
            this.getRoomContents(room);
        }
        return this.tobody;
    }

    public getRooms(id: any, content2: any, buildinginfo: any): any {
        let that = this;
        this.tobody = null;
        let roomsContents = that.getRoomContents(content2);
        if (roomsContents != null) {
            for (let content of roomsContents) {
                if (content.nodeName === "tr") {
                    let seats = content.childNodes[3].childNodes[0].value.trim();
                    let num = content.childNodes[1].childNodes[1].childNodes[0].value.trim();
                    let furniture = content.childNodes[5].childNodes[0].value.trim();
                    let type = content.childNodes[7].childNodes[0].value.trim();
                    let href = content.childNodes[9].childNodes[1].attrs[0].value.trim();
                    if (seats != null && num != null && furniture != null && type != null && href != null) {
                        let roomObject: any = new Object();
                        roomObject[id + "_seats"] = Number(seats);
                        roomObject[id + "_type"] = type;
                        roomObject[id + "_number"] = num.toString();
                        roomObject[id + "_fullname"] = buildinginfo.fullname;
                        roomObject[id + "_shortname"] = buildinginfo.name;
                        roomObject[id + "_furniture"] = furniture.toString();
                        roomObject[id + "_name"] = buildinginfo.name + "_" + num.toString();
                        roomObject[id + "_lat"] = Number(buildinginfo.lat);
                        roomObject[id + "_lon"] = Number(buildinginfo.lon);
                        roomObject[id + "_href"] = href;
                        roomObject[id + "_address"] = buildinginfo.address;
                        that.Rooms.push(roomObject);
                    }
                }
            }
        }
    }
}
