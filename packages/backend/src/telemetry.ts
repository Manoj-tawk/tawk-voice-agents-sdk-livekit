/**
 * OpenTelemetry Setup for SigNoz
 * 
 * This module configures OpenTelemetry to send traces, metrics, and logs
 * to SigNoz (open-source observability platform).
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// Configuration
const SIGNOZ_ENDPOINT = process.env.SIGNOZ_ENDPOINT || 'http://localhost:4318';
const SERVICE_NAME = process.env.SERVICE_NAME || 'tawk-voice-agent';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';
const ENVIRONMENT = process.env.DEPLOYMENT_ENVIRONMENT || 'development';

// Create resource with service information
const resource = resourceFromAttributes({
  [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
  [SEMRESATTRS_SERVICE_VERSION]: SERVICE_VERSION,
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: ENVIRONMENT,
});

// OTLP Trace Exporter (for distributed tracing)
const traceExporter = new OTLPTraceExporter({
  url: `${SIGNOZ_ENDPOINT}/v1/traces`,
  headers: {},
});

// OTLP Metric Exporter (for metrics)
const metricExporter = new OTLPMetricExporter({
  url: `${SIGNOZ_ENDPOINT}/v1/metrics`,
  headers: {},
});

// Create SDK instance
let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 */
export function initTelemetry() {
  if (sdk) {
    console.log('[Telemetry] Already initialized');
    return;
  }

  try {
    sdk = new NodeSDK({
      resource,
      spanProcessor: new BatchSpanProcessor(traceExporter, {
        maxQueueSize: 2048,
        scheduledDelayMillis: 1000,
        exportTimeoutMillis: 30000,
        maxExportBatchSize: 512,
      }),
      metricReader: new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 10000, // Export metrics every 10 seconds
      }),
    });

    sdk.start();

    console.log('[Telemetry] OpenTelemetry initialized successfully');
    console.log(`[Telemetry] Service: ${SERVICE_NAME} (${SERVICE_VERSION})`);
    console.log(`[Telemetry] Environment: ${ENVIRONMENT}`);
    console.log(`[Telemetry] SigNoz Endpoint: ${SIGNOZ_ENDPOINT}`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk?.shutdown();
        console.log('[Telemetry] OpenTelemetry shut down successfully');
      } catch (err) {
        console.error('[Telemetry] Error shutting down OpenTelemetry', err);
      } finally {
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('[Telemetry] Failed to initialize OpenTelemetry:', error);
  }
}

/**
 * Shutdown OpenTelemetry SDK
 */
export async function shutdownTelemetry() {
  if (sdk) {
    try {
      await sdk.shutdown();
      console.log('[Telemetry] OpenTelemetry shut down successfully');
    } catch (error) {
      console.error('[Telemetry] Error shutting down OpenTelemetry:', error);
    }
  }
}

/**
 * Get the current SDK instance (for advanced usage)
 */
export function getTelemetrySDK() {
  return sdk;
}

