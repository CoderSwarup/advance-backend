import type { NextFunction, Request, Response } from 'express';
import { responseMessage } from '../constants/index.js';
import HttpError from '../utils/httpError.js';

export default (req: Request, _res: Response, next: NextFunction): void => {
    next(new HttpError(404, `${responseMessage.ERROR.NOT_FOUND}: ${req.method} ${req.originalUrl}`));
};
