import { createLogger, LoggerOptions, transports, format } from "winston";
import { SPLAT } from 'triple-beam';

const myFormat = format.printf(({ level, message, label, ...others }) => {
    let formatedString = `${new Date().toLocaleString()} [${label}] ${level}: ${message}`;
    if (others[SPLAT]) {
        const splatString = JSON.stringify(others[SPLAT], null, 2)
        formatedString += `\n${splatString}\n<- ${level}`
    }
    return formatedString;
});

const options: LoggerOptions = {
    format: format.combine(
        format.label({ label: "MonToG" }),
        format.colorize(),
        myFormat
    ),
    transports: [
        new transports.Console({
            level: process.env.NODE_ENV === "production" ? "error" : "debug"
        }),
        new transports.File({ filename: "debug.log", level: "debug" })
    ]
};

const logger: any = createLogger(options);
logger.stream = {
    write: function (message:any , encoding: any) {
        logger.info(message.replace('\n', ''));
    }
}

export default logger;
