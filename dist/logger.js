"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const triple_beam_1 = require("triple-beam");
const myFormat = winston_1.format.printf((_a) => {
    var { level, message, label } = _a, others = __rest(_a, ["level", "message", "label"]);
    let formatedString = `${new Date().toLocaleString()} [${label}] ${level}: ${message}`;
    if (others[triple_beam_1.SPLAT]) {
        const splatString = JSON.stringify(others[triple_beam_1.SPLAT], null, 2);
        formatedString += `\n${splatString}\n<- ${level}`;
    }
    return formatedString;
});
const options = {
    format: winston_1.format.combine(winston_1.format.label({ label: "MTG" }), winston_1.format.colorize(), myFormat),
    transports: [
        new winston_1.transports.Console({
            level: process.env.NODE_ENV === "production" ? "error" : "debug"
        }),
        new winston_1.transports.File({ filename: "debug.log", level: "debug" })
    ]
};
const logger = winston_1.createLogger(options);
logger.stream = {
    write: function (message, encoding) {
        logger.info(message.replace('\n', ''));
    }
};
if (process.env.NODE_ENV !== "production") {
    logger.debug("Logging initialized at debug level");
}
exports.default = logger;
//# sourceMappingURL=logger.js.map