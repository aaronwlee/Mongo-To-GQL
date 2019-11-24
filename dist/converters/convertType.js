"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const convertCap_1 = require("./convertCap");
function convertType(type) {
    const basic = ["String", "Date", "Number", "Boolean"];
    const noSupportToNumber = [
        "Buffer",
        "Decimal128",
    ];
    const noSupportToJSON = [
        "Map",
        "Mixed"
    ];
    if (basic.includes(type.instance)) {
        if (type.instance === "Number") {
            return "Int";
        }
        else {
            return type.instance;
        }
    }
    else if (type.instance === "Array") {
        if (basic.includes(type.caster.instance)) {
            if (type.caster.instance === "Number") {
                return "[Int]";
            }
            else if (noSupportToNumber.includes(type.instance)) {
                return "[Int]";
            }
            else if (noSupportToJSON.includes(type.instance)) {
                return "JSON";
            }
            else {
                return `[${type.caster.instance}]`;
            }
        }
        else {
            return `[${convertCap_1.convertCapAndRemovePlural(type.caster.options.ref)}]`;
        }
    }
    else if (noSupportToNumber.includes(type.instance)) {
        return "Int";
    }
    else if (noSupportToJSON.includes(type.instance)) {
        return "JSON";
    }
    else if (type.instance === "ObjectID") {
        return convertCap_1.convertCapAndRemovePlural(type.options.ref);
    }
    else {
        return type.instance;
    }
}
exports.default = convertType;
//# sourceMappingURL=convertType.js.map