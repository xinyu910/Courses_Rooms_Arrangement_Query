"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
const IInsightFacade_1 = require("./IInsightFacade");
const Util_1 = require("../Util");
const fs = require("fs");
let parse5 = require("parse5");
let http = require("http");
class DataSetHelper {
    constructor(ids, myDataSets) {
        Util_1.default.trace("initialize");
        this.tbody = null;
        this.Rooms = [];
        this.tobody = null;
    }
    getCourseDataSet(id, content) {
        let dataSets = [];
        let that = this;
        return new Promise(function (fulfill, reject) {
            let jszip = new JSZip();
            let promises = [];
            jszip.loadAsync(content, { base64: true }).then(function (zip) {
                let course = zip.folder("courses/");
                if (course.length === 0) {
                    reject(new IInsightFacade_1.InsightError("No valid courses folder"));
                }
                zip.folder("courses/").forEach(function (files, file) {
                    let promise = file.async("text").catch((error) => {
                        reject(new IInsightFacade_1.InsightError("async error"));
                    });
                    promises.push(promise);
                });
                Promise.all(promises).then(function (data) {
                    dataSets = that.getCoursesHelper(data, id);
                    if (dataSets.length === 0) {
                        reject(new IInsightFacade_1.InsightError("No valid course section"));
                    }
                    else {
                        let insightData = {
                            id: id, kind: IInsightFacade_1.InsightDatasetKind.Courses, numRows: dataSets.length
                        };
                        let Data = { insightDataSet: insightData, dataSets: dataSets };
                        if (!(fs.existsSync("./data/" + id + ".json"))) {
                            that.writeToFile(id, Data);
                        }
                        fulfill(Data);
                    }
                }).catch((err) => {
                    reject(new IInsightFacade_1.InsightError("promise all error"));
                });
            }).catch((err) => {
                reject(new IInsightFacade_1.InsightError("invalid zip file"));
            });
        });
    }
    getCoursesHelper(data, id) {
        let dataSets = [];
        data.forEach(function (result) {
            let sections;
            try {
                let parsedContent = JSON.parse(result);
                if (parsedContent["result"] !== null) {
                    sections = parsedContent["result"];
                }
                sections.forEach(function (section) {
                    if (section.hasOwnProperty("Subject") && section.hasOwnProperty("Course")
                        && section.hasOwnProperty("Avg") && section.hasOwnProperty("Professor")
                        && section.hasOwnProperty("Title") && section.hasOwnProperty("Pass")
                        && section.hasOwnProperty("Fail") && section.hasOwnProperty("Audit")
                        && section.hasOwnProperty("id")
                        && section.hasOwnProperty("Year")) {
                        let courseObject = new Object();
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
                        }
                        else {
                            courseObject[id + "_year"] = Number(section["Year"]);
                        }
                        dataSets.push(courseObject);
                    }
                });
            }
            catch (error) {
                Util_1.default.trace("");
            }
        });
        return dataSets;
    }
    writeToFile(id, data) {
        let d = JSON.stringify(data);
        fs.writeFileSync("./data/" + id + ".json", d);
    }
    getRoomDataSet(id, content) {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let jszip = new JSZip();
            jszip.loadAsync(content, { base64: true }).then(function (zip) {
                let room = zip.folder("rooms/");
                if (room.length === 0) {
                    reject(new IInsightFacade_1.InsightError("No valid courses folder"));
                }
                zip.file("rooms/index.htm").async("text").then(function (htmlcode) {
                    let parsed = parse5.parse(htmlcode);
                    try {
                        that.getAllBuildings(id, parsed, zip).then(function (rooms) {
                            let insightData = {
                                id: id, kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: that.Rooms.length
                            };
                            let Data = { insightDataSet: insightData, dataSets: that.Rooms };
                            that.writeToFile(id, Data);
                            fulfill(Data);
                        }).catch((err) => {
                            reject(new IInsightFacade_1.InsightError("get all building error"));
                        });
                    }
                    catch (_a) {
                        reject(new IInsightFacade_1.InsightError("other error"));
                    }
                }).catch((error) => {
                    reject(new IInsightFacade_1.InsightError("async error"));
                });
            }).catch((err) => {
                reject(new IInsightFacade_1.InsightError("jszip error"));
            });
        });
    }
    getAllBuildings(id, content, file) {
        let that = this;
        let promises = [];
        this.tbody = null;
        let childNodeArray = this.getTBody(content);
        if (childNodeArray == null) {
            return Promise.reject("Missing building information inside index.htm");
        }
        for (let buildingsobj of childNodeArray) {
            if (buildingsobj.nodeName === "tr" && buildingsobj.childNodes.length === 11) {
                let buildingsmallobj = Object();
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
        return new Promise(function (fulfill, reject) {
            Promise.all(promises).then(function (nothing) {
                if (that.Rooms.length === 0) {
                    return reject(new IInsightFacade_1.InsightError("no valid rooms"));
                }
                else {
                    return fulfill(that.Rooms);
                }
            }).catch((err) => {
                reject(new IInsightFacade_1.InsightError(""));
            });
        });
    }
    parseRoom(id, buildingsmallobj, file) {
        let that = this;
        return new Promise(function (fulfill, reject) {
            that.gethttp(id, buildingsmallobj, file).then(function (preciseloc) {
                if ((preciseloc.error == null && (preciseloc.lat != null && preciseloc.lon !== null))) {
                    let fileaddress = buildingsmallobj.fileaddress;
                    let address = fileaddress.substr(1);
                    let newAddress = "rooms" + address;
                    file.file(newAddress).async("text").then(function (htmlcode) {
                        let buildinginfo = new Object();
                        buildinginfo.lat = preciseloc.lat;
                        buildinginfo.lon = preciseloc.lon;
                        buildinginfo.name = buildingsmallobj.name;
                        buildinginfo.address = buildingsmallobj.address;
                        buildinginfo.fullname = buildingsmallobj.fullname;
                        let parsedfile = parse5.parse(htmlcode);
                        try {
                            that.getRooms(id, parsedfile, buildinginfo);
                            return fulfill();
                        }
                        catch (err) {
                            return fulfill();
                        }
                    }).catch((err) => {
                        return fulfill();
                    });
                }
            }).catch((err) => {
                return fulfill();
            });
        });
    }
    gethttp(id, building, file) {
        return new Promise(function (fulfill, reject) {
            let address = encodeURI(building.address);
            http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team074/"
                + address, (res) => {
                if (res.code === 404) {
                    reject("invalid url");
                }
                res.setEncoding("utf8");
                let rawData = "";
                res.on("data", function (chunk) {
                    rawData += chunk;
                });
                res.on("end", () => {
                    try {
                        let parsedData = JSON.parse(rawData);
                        fulfill(parsedData);
                    }
                    catch (err) {
                        reject(new IInsightFacade_1.InsightError(""));
                    }
                });
            }).on("error", function (err) {
                fulfill(null);
            });
        });
    }
    getTBody(content) {
        if (content.childNodes == null) {
            return;
        }
        else {
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
    getRoomContents(content) {
        if (content.childNodes == null) {
            return;
        }
        else {
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
    getRooms(id, content2, buildinginfo) {
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
                        let roomObject = new Object();
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
exports.default = DataSetHelper;
//# sourceMappingURL=DataSetHelper.js.map