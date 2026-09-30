import type { NextFunction, Request, Response } from 'express';
import monitoring from '../utils/monitoring.js';

/**
 * Low-cardinality route label: the matched route (e.g. "/v1/health"), never
 * the raw URL — unmatched paths collapse into "unmatched" so scanners or
 * random 404s cannot explode Prometheus cardinality.
 */
const resolveRoute = (req: Request): string => {
    const route = req.route?.path;
    if (!route) return 'unmatched';
    // nested routers: baseUrl '/v1/health' + route '/' → '/v1/health', not '/v1/health/'
    if (route === '/') return req.baseUrl || '/';
    return `${req.baseUrl}${route}`;
};

const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // /metrics itself is excluded so Prometheus scrapes don't pollute the graphs
    if (!monitoring.isEnabled() || req.path === '/metrics') {
        next();
        return;
    }

    const start = process.hrtime.bigint();
    monitoring.incInFlight();

    // 'close' fires for finished AND aborted requests → in-flight stays balanced
    res.on('close', () => {
        monitoring.decInFlight();
    });

    res.on('finish', () => {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
        monitoring.recordHttpRequest({
            method: req.method,
            route: resolveRoute(req),
            statusCode: res.statusCode,
            durationSeconds,
        });
    });

    next();
};

export default metricsMiddleware;
