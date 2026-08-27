import type { Request, Response, NextFunction } from 'express';

export interface ApiErrorResponse {
  error: string;
  message: string;
  success: boolean;
  status: number;
  code?: string;
  path?: string;
  timestamp?: string;
}

/**
 * Standard HTTP status phrases mapping for structured API errors
 */
const STATUS_PHRASES: Record<number, { error: string; defaultMessage: string }> = {
  400: { error: '400 Bad Request', defaultMessage: 'The request could not be understood or was missing required parameters.' },
  401: { error: '401 Unauthorized', defaultMessage: 'Authentication is required to access this resource.' },
  403: { error: '403 Forbidden', defaultMessage: 'Access to this resource is forbidden or blocked by security policies.' },
  404: { error: '404 Not Found', defaultMessage: 'The requested API endpoint was not found.' },
  405: { error: '405 Method Not Allowed', defaultMessage: 'The HTTP method is not supported for this endpoint.' },
  408: { error: '408 Request Timeout', defaultMessage: 'The request took too long to complete. Please check the target URL and retry.' },
  429: { error: '429 Too Many Requests', defaultMessage: 'Rate limit exceeded. Please wait a moment before trying again.' },
  500: { error: '500 Internal Server Error', defaultMessage: 'An unexpected internal server error occurred.' },
  502: { error: '502 Bad Gateway', defaultMessage: 'The upstream server returned an invalid response.' },
  503: { error: '503 Service Unavailable', defaultMessage: 'The service is temporarily unavailable or undergoing maintenance.' },
  504: { error: '504 Gateway Timeout', defaultMessage: 'The upstream server timed out while fulfilling the request.' },
};

/**
 * Express Middleware: Centralized API Response Interceptor
 * 
 * Intercepts all outgoing responses on `/api/*` routes to:
 * 1. Force `Content-Type: application/json; charset=utf-8` on all API responses.
 * 2. Prevent raw HTML (e.g., default error pages, proxy timeout screens) from being sent as an API response.
 * 3. Guarantee that status codes 403, 408, and all other 4xx/5xx responses are cleanly formatted as:
 *    `{ "error": "Status Code", "message": "Reason", "success": false, "status": code }`
 *    preventing the frontend "Unexpected token < in JSON at position 0" syntax crash.
 */
export function apiResponseInterceptor(req: Request, res: Response, next: NextFunction): void {
  // Only apply to /api routes
  if (!req.path.startsWith('/api') && !req.originalUrl.startsWith('/api')) {
    return next();
  }

  // Ensure Content-Type is application/json by default for all API endpoints
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Capture original res.send & res.status methods
  const originalSend = res.send.bind(res);
  const originalEnd = res.end.bind(res);

  // Override res.send to intercept HTML or non-JSON strings on error statuses
  res.send = function (body: any): Response {
    const statusCode = res.statusCode || 200;

    // If status code represents an error (4xx or 5xx)
    if (statusCode >= 400) {
      const statusMeta = STATUS_PHRASES[statusCode] || {
        error: `${statusCode} Error`,
        defaultMessage: `Request failed with status code ${statusCode}`,
      };

      // Check if body is HTML (contains doctype or html tag or starts with <) or plain string
      if (typeof body === 'string') {
        const trimmed = body.trim();
        const isHtml = trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype') || trimmed.toLowerCase().includes('<html');

        if (isHtml || !trimmed.startsWith('{')) {
          const jsonPayload: ApiErrorResponse = {
            error: statusMeta.error,
            message: isHtml ? statusMeta.defaultMessage : (trimmed || statusMeta.defaultMessage),
            success: false,
            status: statusCode,
            path: req.originalUrl || req.url,
            timestamp: new Date().toISOString(),
          };

          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return originalSend(JSON.stringify(jsonPayload));
        }
      } else if (body === undefined || body === null || body === '') {
        const jsonPayload: ApiErrorResponse = {
          error: statusMeta.error,
          message: statusMeta.defaultMessage,
          success: false,
          status: statusCode,
          path: req.originalUrl || req.url,
          timestamp: new Date().toISOString(),
        };

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return originalSend(JSON.stringify(jsonPayload));
      }
    }

    return originalSend(body);
  };

  next();
}

/**
 * Express Error Middleware: Centralized API Error Handler
 * Handles unhandled exceptions or rejected promises in any /api/* route,
 * converting them into standardized JSON error objects.
 */
export function apiErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    return next(err);
  }

  // Handle all API routes
  if (req.path.startsWith('/api') || req.originalUrl.startsWith('/api')) {
    const statusCode = typeof err?.status === 'number' && err.status >= 400 && err.status < 600
      ? err.status
      : (typeof err?.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500);

    const statusMeta = STATUS_PHRASES[statusCode] || {
      error: `${statusCode} Error`,
      defaultMessage: 'An internal API error occurred',
    };

    const errorMessage = err?.message || err?.error || statusMeta.defaultMessage;
    const errorCode = err?.code || (statusCode === 403 ? 'FORBIDDEN' : statusCode === 408 ? 'REQUEST_TIMEOUT' : 'API_ERROR');

    console.error(`[API Error Interceptor] ${req.method} ${req.originalUrl || req.path} -> ${statusCode}:`, errorMessage);

    res.status(statusCode);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      error: statusMeta.error,
      message: errorMessage,
      success: false,
      status: statusCode,
      code: errorCode,
      path: req.originalUrl || req.path,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next(err);
}

/**
 * Express Middleware: Timeout guard for long-running /api/ requests (such as extraction/downloads)
 * If an API request exceeds the configured timeout, it safely terminates with a 408 JSON payload
 * instead of letting reverse proxies (Cloudflare, Nginx, Hostinger) drop the connection with a 504/408 HTML page.
 */
export function createApiTimeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only apply to /api/ routes
    if (!req.path.startsWith('/api') && !req.originalUrl.startsWith('/api')) {
      return next();
    }

    // Skip SSE / streaming proxy downloads if needed
    if (req.path.includes('/stream') || req.path.includes('/proxy-download') || req.path.includes('/events')) {
      return next();
    }

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`[API Timeout Guard] Request to ${req.method} ${req.originalUrl || req.path} exceeded ${timeoutMs}ms limit.`);
        res.status(408);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json({
          error: '408 Request Timeout',
          message: 'The requested media extraction or server operation timed out. Please verify the URL or try a different quality format.',
          success: false,
          status: 408,
          code: 'REQUEST_TIMEOUT',
          path: req.originalUrl || req.path,
          timestamp: new Date().toISOString(),
        });
      }
    }, timeoutMs);

    // Clear timeout when response completes
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}
