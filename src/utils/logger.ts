import { inspect } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LokiTransport from 'winston-loki';
import { __CONFIG__ } from '../config/config.js';

const { combine, timestamp, printf, errors, json } = winston.format;

const { logging, server, env } = __CONFIG__;

const logDirectory = path.resolve(process.cwd(), logging.directory);
fs.mkdirSync(logDirectory, { recursive: true });

const rotateTransport = (filename: string, level?: string): DailyRotateFile =>
    new DailyRotateFile({
        filename: path.join(logDirectory, filename),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: `${logging.retentionDays}d`,
        format: json(),
        ...(level ? { level } : {}),
    });

const LEVEL_STYLES: Record<string, { emoji: string; color: (text: string) => string }> = {
    error: { emoji: '❌', color: chalk.red.bold },
    warn: { emoji: '⚠️', color: chalk.yellow.bold },
    info: { emoji: 'ℹ️', color: chalk.cyan.bold },
    debug: { emoji: '🐞', color: chalk.gray.bold },
};

const styleLevel = (level: string): string => {
    const style = LEVEL_STYLES[level];
    const label = level.toUpperCase().padEnd(5);
    return style ? style.color(`${style.emoji} ${label}`) : label;
};

const RESERVED_KEYS = new Set(['service', 'env', 'pid', 'level', 'message', 'timestamp']);

const buildPayload = (raw: Record<string, unknown>): Record<string, unknown> => {
    const entries = Object.fromEntries(Object.entries(raw));
    for (const key of RESERVED_KEYS) delete entries[key];

    const nested = entries.meta;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const { meta: _wrapper, ...others } = entries;
        return { ...(nested as Record<string, unknown>), ...others };
    }

    return entries;
};

const styleMessage = (level: string, text: string): string =>
    level === 'error' ? chalk.red.bold(text) : chalk.white.bold(text);

const consoleFormat = printf(({ level, message, timestamp: time, ...raw }) => {
    const { stack, ...fields } = buildPayload(raw as Record<string, unknown>) as {
        stack?: string;
    } & Record<string, unknown>;

    const header = `${styleLevel(level)} ${chalk.green(`[${time}]`)} ${styleMessage(level, String(message))}`;
    const parts = [header];

    if (Object.keys(fields).length > 0) {
        const [opening, ...rest] = inspect(fields, {
            depth: null,
            colors: true,
            breakLength: 120,
            compact: false,
        }).split('\n');

        parts.push(`  ${chalk.magenta('META')} ${opening}`);
        for (const line of rest) {
            parts.push(`  ${line}`);
        }
    }

    if (typeof stack === 'string' && stack.length > 0) {
        const [firstLine, ...atLines] = stack.split('\n');
        parts.push(`  ${chalk.red('STACK')}`);
        parts.push(`    ${firstLine}`);
        for (const line of atLines) {
            parts.push(`      ${line.trim()}`);
        }
    }

    return `${parts.join('\n')}\n`;
});

const consoleTransport = new winston.transports.Console({
    format: logging.format === 'json' ? json() : consoleFormat,
});

const createLokiTransport = (): LokiTransport =>
    new LokiTransport({
        host: logging.loki.url,
        labels: { app: server.appName, env },
        json: true,
        level: logging.level,
        format: json(),
        batching: true,
        interval: 5,
        replaceTimestamp: true,

        onConnectionError: (error: unknown) => {
            process.stderr.write(`[loki] ${error instanceof Error ? error.message : String(error)}\n`);
        },
    });

const logger = winston.createLogger({
    level: logging.level,
    defaultMeta: { service: server.appName, env, pid: process.pid },
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' })),
    transports: [
        consoleTransport,
        new winston.transports.File({
            filename: path.join(logDirectory, `${env}-error.log`),
            level: 'error',
            format: json(),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logDirectory, `${env}.log`),
            format: json(),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
        rotateTransport(`${env}-%DATE%-error.log`, 'error'),
        rotateTransport(`${env}-%DATE%.log`),
        ...(logging.loki.enabled ? [createLokiTransport()] : []),
    ],
});

export default logger;
