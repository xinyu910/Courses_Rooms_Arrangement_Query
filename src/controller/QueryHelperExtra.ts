export default class QueryHelperExtra {
    public id: string;
    protected applykey: string[];
    protected groupKey: string[];
    protected columnKey: string[];
    protected count: number;

    constructor() {
        this.id = null;
        this.applykey = [];
        this.groupKey = [];
        this.columnKey = [];
        this.count = 0;
    }

    protected ValidationFilter(value: any): number {
        if (value == null || typeof value !== "object") {
            return 0;
        }
        const allTheWhereKeys = Object.keys(value);
        if (allTheWhereKeys.length !== 1 || !(allTheWhereKeys[0] === "OR" || allTheWhereKeys[0] === "AND"
            || allTheWhereKeys[0] === "LT" || allTheWhereKeys[0] === "GT" || allTheWhereKeys[0] === "EQ"
            || allTheWhereKeys[0] === "IS" || allTheWhereKeys[0] === "NOT")) {
            return 0;
        } else if (allTheWhereKeys[0] === "LT" || allTheWhereKeys[0] === "GT" || allTheWhereKeys[0] === "EQ") {
            return (this.ValidationM(value[allTheWhereKeys[0]]));
        } else if (allTheWhereKeys[0] === "AND" || allTheWhereKeys[0] === "OR") {
            return (this.ValidationLogic(value[allTheWhereKeys[0]]));
        } else if (allTheWhereKeys[0] === "NOT") {
            return (this.ValidationNot(value[allTheWhereKeys[0]]));
        } else if (allTheWhereKeys[0] === "IS") {
            return (this.ValidationIs(value[allTheWhereKeys[0]]));
        } else {
            return 1;
        }
    }

    protected ValidationApply(value: any): number {
        if (!(Array.isArray(value))) {
            return 0;
        } else if (value.length > 0) {
            for (let applyrule of value) {
                if (this.ValidationApplyRule(applyrule) === 0) {
                    return 0;
                }
            }
        }
        return 1;
    }

    private ValidationApplyRule(value: any): number {
        if (value == null || typeof value !== "object") {
            return 0;
        }
        const applyKeys = Object.keys(value);
        if (applyKeys.length !== 1 || (typeof applyKeys[0] !== "string") || applyKeys[0].includes("_")
            || applyKeys[0] === "" || this.ValidApplyToken(value[applyKeys[0]]) === 0) {
            return 0;
        } else {
            if (this.applykey.includes(applyKeys[0])) {
                return 0;
            } else {
                this.applykey.push(applyKeys[0]);
            }
        }
        return 1;
    }

    private ValidApplyToken(value: any): number {
        if (value == null || typeof value !== "object") {
            return 0;
        }
        const Keys = Object.keys(value);
        const keyValue = (Keys[0]);
        if (keyValue == null || typeof keyValue !== "string") {
            return 0;
        } else if (Keys.length !== 1 || !(keyValue === "MAX" || keyValue === "MIN" || keyValue === "AVG"
            || keyValue === "COUNT" || keyValue === "SUM")) {
            return 0;
        }
        if (keyValue === "COUNT") {
            if (this.ValidationMKey(value[Keys[0]]) === 0 && this.ValidationSKey(value[Keys[0]]) === 0) {
                return 0;
            }
        } else {
            if (this.ValidationMKey(value[Keys[0]]) === 0) {
                return 0;
            }
        }
        return 1;
    }

    private ValidationApplyTokenValue(value: any): number {
        if (value == null || typeof value !== "string") {
            return 0;
        } else if (!(value === "MAX" || value === "MIN" || value === "AVG" || value === "COUNT" || value === "SUM")) {
            return 0;
        }
        return 1;
    }

    protected ValidationColumnValue(value: any): number {
        if (!(Array.isArray(value))) {
            return 0;
        } else if (value.length < 1) {
            return 0;
        } else {
            for (let key of value) {
                if (this.ValidateOrderkey(key) === 0) {
                    return 0;
                } else {
                    this.columnKey.push(key);
                }
            }
        }
    }

    protected ValidationColumnValueWithGroup(value: any): number {
        if (!(Array.isArray(value))) {
            return 0;
        } else if (value.length < 1) {
            return 0;
        } else {
            for (let key of value) {
                if (this.ValidateOrderkey(key) === 0 || !(this.groupKey.includes(key) || this.applykey.includes(key))) {
                    return 0;
                } else {
                    this.columnKey.push(key);
                }
            }
        }
        return 1;
    }

    protected ValidationGroupValue(value: any): number {
        if (!(Array.isArray(value)) || value.length < 1) {
            return 0;
        } else {
            for (let key of value) {
                if (this.ValidationMKey(key) === 0 && this.ValidationSKey(key) === 0) {
                    return 0;
                } else {
                    this.groupKey.push(key);
                }
            }
        }
        return 1;
    }

    protected ValidationOrder(value: any): number {
        if (value == null || !(typeof value === "string" || typeof value === "object")) {
            return 0;
        } else if (typeof value === "string") {
            if (this.ValidateOrderkey(value) === 0 || !(this.columnKey.includes(value))) {
                return 0;
            }
        } else if (typeof value === "object") {
            const OrderObject = Object.keys(value);
            if (OrderObject.length !== 2 || !((OrderObject[0] === "dir" && OrderObject[1] === "keys")
                || (OrderObject[0] === "keys" || OrderObject[1] === "dir"))) {
                return 0;
            } else if (typeof value["dir"] !== "string" || !(value["dir"] === "UP"
                || value["dir"] === "DOWN")) {
                return 0;
            } else if (!Array.isArray(value["keys"]) || value["keys"].length < 1) {
                return 0;
            }
            for (let key of value["keys"]) {
                if (!(this.columnKey.includes(key)) || this.ValidateOrderkey(key) === 0) {
                    return 0;
                }
            }
        }
    }

    private ValidateOrderkey(value: any): number {
        if (value == null || typeof value !== "string") {
            return 0;
        } else if (this.ValidationMKey(value) === 0 && this.ValidationSKey(value) === 0) {
            if (!(this.applykey.includes(value))) {
                return 0;
            }
        }
    }

    private ValidationM(value: any): number {
        if (value == null || typeof value !== "object") {
            return 0;
        }
        const alltheMKeys = Object.keys(value);
        if (alltheMKeys.length !== 1 || !(typeof value[alltheMKeys[0]] === "number")) {
            return 0;
        } else {
            return this.ValidationMKey(alltheMKeys[0]);
        }
    }

    private ValidationMKey(key: any): number {
        this.count++;
        const mfield = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
        if (typeof key !== "string") {
            this.count--;
            return 0;
        }
        if (!(key.includes("_"))) {
            this.count--;
            return 0;
        } else {
            let splitted = key.split("_");
            if (splitted.length !== 2 || splitted[0].includes("_") || !(mfield.includes(splitted[1]))) {
                this.count--;
                return 0;
            }
            if (this.count === 1) {
                this.id = splitted[0];
            } else {
                if (splitted[0] !== this.id) {
                    return 0;
                }
            }
        }
        return 1;
    }

    private ValidationLogic(value: any): number {
        if (!(Array.isArray(value))) {
            return 0;
        } else if (value.length < 1) {
            return 0;
        } else {
            let check: boolean = true;
            for (let filter of value) {
                if (this.ValidationFilter(filter) === 0) {
                    check = false;
                }
            }
            if (check === false) {
                return 0;
            }
        }
    }

    private ValidationNot(value: any): number {
        return this.ValidationFilter(value);
    }

    private ValidationIs(value: any): number {
        if (value == null || typeof value !== "object") {
            return 0;
        }
        const alltheSKeys = Object.keys(value);
        if (alltheSKeys.length !== 1 || !(typeof value[alltheSKeys[0]] === "string")) {
            return 0;
        } else if (this.ValidationSKey(alltheSKeys[0]) === 0) {
            return 0;
        } else {
            let a = value[alltheSKeys[0]];
            if (typeof a !== "string") {
                return 0;
            } else {
                if (a.includes("*")) {
                    if (a.length === 1) {
                        return 1;
                    }
                    if (a.substring(1, a.length - 1).includes("*")) {
                        return 0;
                    }
                }
            }
        }
        return 1;
    }

    protected ValidationSKey(key: any): number {
        this.count++;
        if (typeof key !== "string") {
            this.count--;
            return 0;
        }
        const sfield = ["dept", "id", "instructor", "title",
            "uuid", "fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
        if (!(key.includes("_"))) {
            this.count--;
            return 0;
        } else {
            let splitted = key.split("_");
            if (splitted.length !== 2 || splitted[0].includes("_") || !(sfield.includes(splitted[1]))) {
                this.count--;
                return 0;
            }
            if (this.count === 1) {
                this.id = splitted[0];
            } else if (splitted[0] !== this.id) {
                return 0;
            }
        }
        return 1;
    }
}
