import { context, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { __CONFIG__ } from '../config/config.js';

interface ActiveTraceIds {
    traceId: string;
    spanId: string;
}

/**
 * OpenTelemetry tracing, exported to Grafana Tempo via OTLP/HTTP.
 *
 * IMPORTANT: server.ts imports this BEFORE ./app.js so the auto
 * instrumentations patch Express/http as they load (CJS patching happens on
 * module require — importing tracing first is what makes it work).
 *
 * - No-ops entirely when TRACING_ENABLED=false.
 * - getActiveTraceIds() injects trace_id/span_id into every winston log line,
 *   which powers the log → trace links (Loki derived fields) in Grafana.
 */
class Tracing {
    private readonly enabled: boolean;
    private sdk: NodeSDK | null = null;

    constructor() {
        this.enabled = __CONFIG__.tracing.enabled;
        this.start();
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    private start(): void {
        if (!this.enabled || this.sdk) return;

        this.sdk = new NodeSDK({
            resource: resourceFromAttributes({
                'service.name': __CONFIG__.server.appName,
                'deployment.environment': __CONFIG__.env,
            }),
            traceExporter: new OTLPTraceExporter({ url: __CONFIG__.tracing.otlpUrl }),
            instrumentations: [getNodeAutoInstrumentations()],
        });
        this.sdk.start();
    }

    public async shutdown(): Promise<void> {
        if (!this.sdk) return;
        await this.sdk.shutdown();
        this.sdk = null;
    }

    public getActiveTraceIds(): ActiveTraceIds | null {
        if (!this.enabled) return null;

        const spanContext = trace.getSpan(context.active())?.spanContext();
        if (!spanContext || !trace.isSpanContextValid(spanContext)) return null;

        return { traceId: spanContext.traceId, spanId: spanContext.spanId };
    }
}

const tracing = new Tracing();

export default tracing;
