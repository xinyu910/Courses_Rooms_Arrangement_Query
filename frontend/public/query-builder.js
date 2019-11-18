/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    // TODO: implement!
    query["WHERE"] = setwhere(query);
    query["OPTIONS"] = setOptions(query);

    return query;
};

function setwhere(query) {
    let array = [];
    let countnum = 0;
    let kind = document.getElementsByClassName("tab-panel active")[0].attributes.getNamedItem("data-type").value;

    let first = "";
    if (document.getElementsByClassName("control conditions-all-radio")[0].children[0].getAttribute("checked") === "checked") {
        first = "AND";
    } else if (document.getElementsByClassName("control conditions-any-radio")[0].children[0].getAttribut("checked") === "checked") {
        first = "OR";
    } else if (document.getElementsByClassName("control conditions-none-radio")[0].children[0].getAttribut("checked") === "checked") {
        first = "NOT";
    } else {
        first = "";
    }


    let conditions = document.getElementsByClassName("conditions-container")[0].children;
    conditions.forEach(function (condition) {
        let mkey = "";
        let operator = "";
        let term = condition.children[3].children[0].getAttribute("value");
        condition.children[1].children[0].children.forEach(function (field) {
            if (field.getAttribute("selected") === "selected") {
                mkey = kind + "_" + field.getAttribute("value");
            }
        });
        condition.children[2].children[0].children.forEach(function (ope) {
            if (ope.getAttribute("selected") === "selected") {
                operator = ope.getAttribute("value");
            }
        });
        let keyset = getmkeyset(kind);
        if (keyset.includes(term)) {
            term = parseFloat(term);
        }
        let insideobject = {};
        let logic = {};
        insideobject[mkey] = term;
        logic[operator] = insideobject;
        if (condition.children[0].children[0].getAttribute("checked") === "checked") {
            let notobj = {};
            notobj[NOT] = logic;
            array.push(notobj);
            count
        } else {
            array.push(logic);
            countnum++;
        }
    });
    if (countnum === 0) {
        return {};
    }
    if (first === "NOT") {
        let insideobject = {};
        let logic = {};
        insideobject["OR"] = array;
        logic["NOT"] = insideobject;
    } else {
        if (array.length !== 1) {
            let newobj = {};
            newobj[first] = array;
            return newobj;
        } else {
            return array[0];
        }
    }

}

function getmkeyset(key) {
    switch(key) {
        case "courses": return ["courses_pass", "courses_fail", "courses_avg", "courses_year", "courses_audit"];
        case "rooms": return ["rooms_lon", "rooms_lat", "rooms_seats"];
    }
}

function setOptions(query) {
    let kind = document.getElementsByClassName("tab-panel active")[0].attributes.getNamedItem("data-type").value;
    let column = setColumn(kind);
    let order = setOrder(kind);
    return setOp(column, order, kind);
}

function setColumn(kind) {
    let array = [];
    document.getElementsByClassName("form-group columns")[0].children[1].children.forEach(function (field) {
        switch (column.getAttribute("class")) {
            case "control field":
                if (field.children[0].getAttribute("checked") === "checked") {
                    array.push(kind + field.children[0].getAttribute("value"));
                }
            case "control transformation":
                if (field.children[0].getAttribute("checked") === "checked") {
                    array.push(field.children[0].getAttribute("value"));
                }
        }
    });
    return array;
}

function setOrder(kind) {
    let orderarray = [];
    document.getElementsByClassName("form-group order")[0].children[1].children[0].children.forEach(function (order) {
       if (order.getAttribute("selected") === "selected") {
            if (order.getAttribute("class") === "transformation") {
                orderarray.push(order.getAttribute("value"))
            }
            orderarray.push(kind + order.getAttribute("value"));
       }
    });
    return orderarray;
}

function setOp(column, order, kind) {
    let options = {};
    options["COLUMNS"] = column;
    if (order.length === 0) {
        return options;
    }
    if (order.length > 1) {
        if (document.getElementsByClassName("form-group order")[0].children[1].children[1].children[0].getAttribute("checked") === "checked") {
            options["ORDER"] = {dir: "DOWN", keys: orders};
        } else {
            options["ORDER"] = {dir: "UP", keys: orders}
        }
        return options;
    }
    if (document. getElementsByClassName("form-group order")[0].children[1].children[1].children[0].getAttribute("checked") !== "checked") {
        options["ORDER"] = orders[0];
    }
    return options;
}

function setTransformation(kind) {
    let grouparray = [];
    let applyarray = [];
    document.getElementsByClassName("form-group groups")[0].children[1].children.forEach(function (groupfield) {
        if (groupfield.children[0].getAttribute("checked") === "checked") {
            grouparray.push(kind + "_" + groupfield.children[0].getAttribute("value"));
        }
    });
    if (groups.length === 0) {
        return {};
    }
    document.getElementsByClassName("transformations-container")[0].children.forEach(function (applyfield) {
        let obj = {};
        let operator;
        let originialkey;
        let apply = applyfield.children[0].children[0].attributes[1].value;
        applyfield.children[1].children[0].forEach(function (operatorcheck) {
            if (operatorcheck.getAttribute("selected") === "selected") {
                operator = operatorcheck.getAttribute("value");
            }
        });
        applyfield.children[2].children[0].forEach(function (original) {
            if (original.getAttribute("selected") === "selected") {
                originalkey = kind + "_" + original.getAttribute("value");
            }
        });
        let newobj = {};
        newobj[operator] = originialkey;
        obj[apply] = newobj;
        array.push(obj);
    });
    return {GROUP: grouparray, APPLY: applyarray};
}
