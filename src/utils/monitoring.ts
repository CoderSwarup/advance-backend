import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from '@prometheus-io/client';
import { __CONFIG__ } from '../config/config.js';

interface HttpRequestMetric {
    method: string;
    route: string;
    statusCode: number;
    durationSeconds: number;
}

type LabeledCounter = Counter<'method' | 'route' | 'status_code'>;
type LabeledHistogram = Histogram<'method' | 'route' | 'status_code'>;

/**
 * Prometheus metrics facade.
 *
 * Owns a private Registry (never the global one) so metrics are isolated and
 * testable. When MONITORING_ENABLED=false nothing is collected and the
 * /metrics route is not registered.
 *
 * Exposed metrics:
 *   - process/node defaults (cpu, memory, gc, event loop, …)
 *   - http_requests_total{method,route,status_code}
 *   - http_request_duration_seconds{method,route,status_code}
 *   - http_requests_in_flight
 *   - health_checks_total{status}
 */
class Monitoring {
    private readonly registry: Registry;
    private readonly enabled: boolean;
    private readonly httpRequestsTotal: LabeledCounter;
    private readonly httpRequestDurationSeconds: LabeledHistogram;
    private readonly httpRequestsInFlight: Gauge;
    private readonly healthChecksTotal: Counter<'status'>;

    constructor() {
        this.enabled = __CONFIG__.monitoring.enabled;
        this.registry = new Registry();

        if (this.enabled) {
            collectDefaultMetrics({ register: this.registry });
        }

        this.httpRequestsTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests handled',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });

        this.httpRequestDurationSeconds = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registers: [this.registry],
        });

        this.httpRequestsInFlight = new Gauge({
            name: 'http_requests_in_flight',
            help: 'Number of HTTP requests currently being handled',
            registers: [this.registry],
        });

        this.healthChecksTotal = new Counter({
            name: 'health_checks_total',
            help: 'Total number of health checks served',
            labelNames: ['status'],
            registers: [this.registry],
        });
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public get contentType(): string {
        return this.registry.contentType;
    }

    public async getMetrics(): Promise<string> {
        return this.registry.metrics();
    }

    public recordHttpRequest({ method, route, statusCode, durationSeconds }: HttpRequestMetric): void {
        if (!this.enabled) return;

        const labels = { method, route, status_code: statusCode };
        this.httpRequestsTotal.inc(labels);
        this.httpRequestDurationSeconds.observe(labels, durationSeconds);
    }

    public incInFlight(): void {
        if (!this.enabled) return;
        this.httpRequestsInFlight.inc();
    }

    public decInFlight(): void {
        if (!this.enabled) return;
        this.httpRequestsInFlight.dec();
    }

    public recordHealthCheck(status: 'UP' | 'DOWN'): void {
        if (!this.enabled) return;
        this.healthChecksTotal.inc({ status });
    }
}

const monitoring = new Monitoring();

export default monitoring;
