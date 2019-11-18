"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const restify = require("restify");
const Util_1 = require("../Util");
const InsightFacade_1 = require("../controller/InsightFacade");
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Server {
    constructor(port) {
        Util_1.default.info("Server::<init>( " + port + " )");
        this.port = port;
    }
    stop() {
        Util_1.default.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }
    start() {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Util_1.default.info("Server::start() - start");
                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({ mapFiles: true, mapParams: true }));
                that.rest.use(function crossOrigin(req, res, next) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "X-Requested-With");
                    return next();
                });
                that.rest.get("/echo/:msg", Server.echo);
                that.rest.put("/dataset/:id/:kind", Server.put);
                that.rest.del("/dataset/:id", Server.delete);
                that.rest.post("/query", Server.post);
                that.rest.get("/datasets", Server.get);
                that.rest.get("/.*", Server.getStatic);
                that.rest.listen(that.port, function () {
                    Util_1.default.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });
                that.rest.on("error", function (err) {
                    Util_1.default.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });
            }
            catch (err) {
                Util_1.default.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }
    static echo(req, res, next) {
        Util_1.default.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Util_1.default.info("Server::echo(..) - responding " + 200);
            res.json(200, { result: response });
        }
        catch (err) {
            Util_1.default.error("Server::echo(..) - responding 400");
            res.json(400, { error: err });
        }
        return next();
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
    static getStatic(req, res, next) {
        const publicDir = "frontend/public/";
        Util_1.default.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err, file) {
            if (err) {
                res.send(500);
                Util_1.default.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }
    static put(req, res, next) {
        Util_1.default.trace("Server::put(..) - params: " + JSON.stringify(req.params));
        let content = req.body;
        let bufferContent = Buffer.from(content).toString("base64");
        let id = req.params.id;
        let kind = req.params.kind;
        let insightKind;
        if (kind === "courses") {
            insightKind = IInsightFacade_1.InsightDatasetKind.Courses;
        }
        else if (kind === "rooms") {
            insightKind = IInsightFacade_1.InsightDatasetKind.Rooms;
        }
        else {
            res.json(400, { error: "not courses or rooms" });
            return next();
        }
        try {
            Server.insight.addDataset(id, bufferContent, insightKind)
                .then(function (arr) {
                res.json(200, { result: arr });
                return next();
            })
                .catch(function (err) {
                res.json(400, { error: err.message });
                return next();
            });
        }
        catch (err) {
            Util_1.default.error("Server::put(..) - responding 400");
            res.json(400, { error: err.message });
        }
        return next();
    }
    static delete(req, res, next) {
        Util_1.default.trace("Server::delete(..) - params: " + JSON.stringify(req.params));
        let id = req.params.id;
        try {
            Server.insight.removeDataset(id)
                .then(function (str) {
                res.json(200, { result: str });
                return next();
            })
                .catch(function (err) {
                if (err instanceof IInsightFacade_1.InsightError) {
                    res.json(400, { error: err.message });
                    return next();
                }
                if (err instanceof IInsightFacade_1.NotFoundError) {
                    res.json(404, { error: err.message });
                    return next();
                }
            });
        }
        catch (err) {
            Util_1.default.error("Server::delete(..) - responding 400");
            res.json(400, { error: err.message });
        }
        return next();
    }
    static post(req, res, next) {
        Util_1.default.trace("Server::post(..) - params: " + JSON.stringify(req.params));
        let query = req.body;
        try {
            Server.insight.performQuery(query)
                .then(function (arr) {
                res.json(200, { result: arr });
                return next();
            })
                .catch(function (err) {
                res.json(400, { error: err.message });
                return next();
            });
        }
        catch (err) {
            Util_1.default.error("Server::post(..) - responding 400");
            res.json(400, { error: err.message });
        }
        return next();
    }
    static get(req, res, next) {
        Util_1.default.trace("Server::get(..) - params: " + JSON.stringify(req.params));
        try {
            Server.insight.listDatasets()
                .then(function (arr) {
                res.json(200, { result: arr });
            });
        }
        catch (err) {
            Util_1.default.error("Server::get(..) - responding 400");
            res.json(400, { error: err.message });
        }
        return next();
    }
}
Server.insight = new InsightFacade_1.default();
exports.default = Server;
//# sourceMappingURL=Server.js.map