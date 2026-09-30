import express, { type Express } from 'express';
import globalErrorHandler from './middleware/globalErrorHandler.js';
import metricsMiddleware from './middleware/metrics.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import requestLogger from './middleware/requestLogger.js';
import router from './router/index.js';
import monitoring from './utils/monitoring.js';

const app: Express = express();

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(requestLogger);
app.use(metricsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
    res.status(200).json({ success: true, message: 'API is running' });
});

if (monitoring.isEnabled()) {
    app.get('/metrics', async (_req, res) => {
        res.setHeader('Content-Type', monitoring.contentType);
        res.status(200).send(await monitoring.getMetrics());
    });
}

app.use('/v1', router);
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
