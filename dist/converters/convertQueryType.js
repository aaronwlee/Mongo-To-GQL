"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function convertQueryType(fieldName, type) {
    let returnString = ``;
    if (type.instance === "Date") {
        returnString += `\t${fieldName}_gt: Date\n`;
        returnString += `\t${fieldName}_gte: Date\n`;
        returnString += `\t${fieldName}_lt: Date\n`;
        returnString += `\t${fieldName}_lte: Date\n`;
    }
    else {
        returnString += `\t${fieldName}: String\n`;
        returnString += `\t${fieldName}_ne: String\n`;
        returnString += `\t${fieldName}_in: [String!]\n`;
        returnString += `\t${fieldName}_has: String\n`;
    }
    return returnString;
}
exports.default = convertQueryType;
//# sourceMappingURL=convertQueryType.js.map