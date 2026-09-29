import path from 'node:path';
import winston from 'winston';
import { __CONFIG__ } from '../config/config.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: time, ...meta }) => {
    const rest = { ...meta };
    delete rest.service;
    delete rest.env;
    const metaString = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
    return `${time} ${level}: ${String(message)}${metaString}`;
});

const logDirectory = path.resolve(process.cwd(), 'logs');

const consoleTransport = new winston.transports.Console(
    __CONFIG__.isProduction
        ? { format: combine(json()) }
        : { format: combine(colorize({ all: true }), consoleFormat) },
);

const logger = winston.createLogger({
    level: __CONFIG__.logging.logLevel,
    defaultMeta: { service: __CONFIG__.server.appName, env: __CONFIG__.env },
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' })),
    transports: [
        consoleTransport,
        new winston.transports.File({
            filename: path.join(logDirectory, `${__CONFIG__.env}-error.log`),
            level: 'error',
            format: json(),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logDirectory, `${__CONFIG__.env}.log`),
            format: json(),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
    ],
});

export default logger;
