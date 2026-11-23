import { json } from './core';

const requestsPerMinute = 240;
const windowMs = 60_000;
const maxTrackedAddresses = 4_096;

type BotSignal = { score?: number; verifiedBot?: boolean };

// Pages isolates share neither memory nor counters. Keep this short-lived gate
// cheap; authentication, checkout and other sensitive operations also enforce D1 limits.
const clients = new Map<string, number>();
let activeWindow = -1;

export function guardDynamicRequest(request: Request, at = Date.now()): Response | undefined {
  const bot = request.cf?.botManagement as BotSignal | undefined;
  const publicRead = request.method === 'GET' || request.method === 'HEAD';
  if (publicRead && bot?.verifiedBot === true) return;
  if (bot?.score === 1 && bot.verifiedBot !== true) {
    return json({ data: null, error: { message: 'Request blocked' } }, 403);
  }

  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return;
  const window = Math.floor(at / windowMs);
  if (window !== activeWindow) {
    activeWindow = window;
    clients.clear();
  }
  const count = clients.get(ip);
  if (count === undefined && clients.size >= maxTrackedAddresses) return;
  if ((count ?? 0) >= requestsPerMinute) {
    const retryAfter = Math.ceil(((window + 1) * windowMs - at) / 1000);
    return json({ data: null, error: { message: 'Too many requests. Please try again later.' } }, 429,
      { 'Retry-After': String(retryAfter) });
  }
  clients.set(ip, (count ?? 0) + 1);
}
