import os from 'node:os';
import type { Request, Response } from 'express';
import { __CONFIG__ } from '../config/config.js';
import { responseMessage } from '../constants/index.js';
import HttpError from '../utils/httpError.js';
import httpResponse from '../utils/httpResponse.js';
import logger from '../utils/logger.js';

interface HealthData {
    status: 'UP' | 'DOWN';
    uptime: number;
    timestamp: string;
    environment: string;
    version: string | null;
    memory: NodeJS.MemoryUsage;
    loadAverage: number[];
}

const gatherHealthData = (): HealthData => ({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: __CONFIG__.env,
    version: process.env.npm_package_version ?? null,
    memory: process.memoryUsage(),
    loadAverage: os.loadavg(),
});

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = gatherHealthData();

        httpResponse(req, res, 200, responseMessage.SUCCESS, data);
    } catch (error) {
        logger.error('HEALTH_CHECK_FAILED', {
            meta: {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : null,
            },
        });

        throw new HttpError(500, responseMessage.ERROR.SOMETHING_WENT_WRONG, false);
    }
};

export default { healthCheck };
