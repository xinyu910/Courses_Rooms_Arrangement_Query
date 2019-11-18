/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        // TODO: implement!
        let req = new XMLHttpRequest();
        req.send(JSON.stringify(query));
        req.open("POST", "http://localhost:4321/query", true);
        req.onload = function (result) {
            fulfill(result);
        };
    });
};
