// src/lib/env.ts
type AppEnv = 'dev' | 'prod';

// Default to NODE_ENV if NEXT_PUBLIC_APP_ENV not set
export const APP_ENV: AppEnv =
  (process.env.NEXT_PUBLIC_APP_ENV as AppEnv) ??
  (process.env.NODE_ENV === 'production' ? 'prod' : 'dev');

// Base for HTTP calls from the browser
export const HTTP_BASE =
  APP_ENV === 'prod' ? '' : (process.env.NEXT_PUBLIC_DEV_HTTP_BASE ?? 'http://127.0.0.1:5000');

// Base for WebSocket from the browser (call at runtime on client)
export function WS_BASE(): string {
  if (typeof window === 'undefined') return ''; // SSR safeguard
  if (APP_ENV === 'prod') {
    const isHttps = window.location.protocol === 'https:';
    return `${isHttps ? 'wss' : 'ws'}://${window.location.host}`;
  }
  return process.env.NEXT_PUBLIC_DEV_WS_BASE ?? 'ws://127.0.0.1:5000';
}
