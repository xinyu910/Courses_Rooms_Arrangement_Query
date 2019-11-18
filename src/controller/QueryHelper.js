"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueryHelperExtra_1 = require("./QueryHelperExtra");
class QueryHelper extends QueryHelperExtra_1.default {
    constructor() {
        super();
    }
    queryValidation(query) {
        if (query == null || typeof query !== "object") {
            return 0;
        }
        const allTheKeys = Object.keys(query);
        if (!(allTheKeys[0] === "WHERE" && allTheKeys[1] === "OPTIONS" && (allTheKeys.length === 2
            || allTheKeys.length === 3))) {
            return 0;
        }
        if (allTheKeys.length === 2) {
            if (this.ValidationColumn(query[allTheKeys[1]]) === 0) {
                return 0;
            }
        }
        if (allTheKeys.length === 3) {
            if (!(allTheKeys[2] === "TRANSFORMATIONS") || this.ValidationTransformation(query[allTheKeys[2]]) === 0) {
                return 0;
            }
            if (this.ValidationColumnWithGroup(query[allTheKeys[1]]) === 0) {
                return 0;
            }
        }
        if (JSON.stringify(query[allTheKeys[0]]) === "{}") {
            return 1;
        }
        if (this.ValidationFilter(query[allTheKeys[0]]) === 0 || this.id === null) {
            return 0;
        }
        return 1;
    }
    ValidationTransformation(value) {
        if (value == null || typeof value !== "object") {
            return 0;
        }
        const transKeys = Object.keys(value);
        if (transKeys.length !== 2 || transKeys[0] !== "GROUP" ||
            this.ValidationGroupValue(value[transKeys[0]]) === 0) {
            return 0;
        }
        for (let key in value[transKeys[0]]) {
            if (value[transKeys[0]].hasOwnProperty(key)) {
                this.groupKey.push(key);
            }
        }
        if (transKeys[1] !== "APPLY" || this.ValidationApply(value[transKeys[1]]) === 0) {
            return 0;
        }
        return 1;
    }
    ValidationColumn(value) {
        if (value == null || typeof value !== "object") {
            return 0;
        }
        const OptionKeys = Object.keys(value);
        if (OptionKeys.length > 2 || OptionKeys.length < 1) {
            return 0;
        }
        if (OptionKeys.length === 1) {
            if (OptionKeys[0] !== "COLUMNS") {
                return 0;
            }
            return this.ValidationColumnValue(value[OptionKeys[0]]);
        }
        else if (OptionKeys.length === 2) {
            if (OptionKeys[0] !== "COLUMNS" || OptionKeys[1] !== "ORDER"
                || this.ValidationColumnValue(value[OptionKeys[0]]) === 0 ||
                this.ValidationOrder(value[OptionKeys[1]]) === 0) {
                return 0;
            }
        }
        return 1;
    }
    ValidationColumnWithGroup(value) {
        if (value == null || typeof value !== "object") {
            return 0;
        }
        const OptionKeys = Object.keys(value);
        if (OptionKeys.length > 2 || OptionKeys.length < 1) {
            return 0;
        }
        if (OptionKeys.length === 1) {
            if (OptionKeys[0] !== "COLUMNS") {
                return 0;
            }
            return this.ValidationColumnValueWithGroup(value[OptionKeys[0]]);
        }
        else if (OptionKeys.length === 2) {
            if (OptionKeys[0] !== "COLUMNS" || OptionKeys[1] !== "ORDER"
                || this.ValidationColumnValueWithGroup(value[OptionKeys[0]]) === 0 ||
                this.ValidationOrder(value[OptionKeys[1]]) === 0) {
                return 0;
            }
            return 1;
        }
    }
}
exports.default = QueryHelper;
//# sourceMappingURL=QueryHelper.js.map