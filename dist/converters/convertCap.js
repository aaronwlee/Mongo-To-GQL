"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCapAndRemovePlural = (fieldName) => {
    let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase();
    if (newFieldName[newFieldName.length - 1] === "s") {
        newFieldName = newFieldName.slice(0, newFieldName.length - 1);
    }
    return newFieldName;
};
exports.convertFirstLowercase = (fieldName) => {
    let newFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
    return newFieldName;
};
exports.convertFirstUppercase = (fieldName) => {
    let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    return newFieldName;
};
exports.convertCapAndAddPlural = (fieldName) => {
    let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase();
    if (newFieldName[newFieldName.length - 1] !== "s") {
        newFieldName += "s";
    }
    return newFieldName;
};
//# sourceMappingURL=convertCap.js.map