// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { guardDynamicRequest } from '../../server/requestGuard';
import { onRequest } from '../../functions/api/[[path]]';
import type { Env } from '../../server/core';

function request(ip: string, method = 'GET', bot?: { score: number; verifiedBot?: boolean }) {
  const result = new Request('https://shop.example/api/site-settings', {
    method,
    headers: { 'CF-Connecting-IP': ip, 'User-Agent': 'Googlebot' },
  });
  if (bot) Object.defineProperty(result, 'cf', { value: { botManagement: bot } });
  return result;
}

describe('dynamic request protection', () => {
  it('limits repeated requests per trusted IP, including an unverified crawler user agent', () => {
    const repeated = request('192.0.2.10');
    for (let index = 0; index < 240; index++) expect(guardDynamicRequest(repeated, 120_001)).toBeUndefined();
    const blocked = guardDynamicRequest(repeated, 120_001);
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get('Retry-After')).toBe('60');
    expect(guardDynamicRequest(request('192.0.2.11'), 120_001)).toBeUndefined();
    expect(guardDynamicRequest(repeated, 180_000)).toBeUndefined();
  });

  it('uses Cloudflare bot signals while leaving verified crawler reads available', () => {
    const automated = request('192.0.2.12', 'GET', { score: 1 });
    expect(guardDynamicRequest(automated)?.status).toBe(403);
    const crawler = request('192.0.2.13', 'GET', { score: 1, verifiedBot: true });
    expect(guardDynamicRequest(crawler)).toBeUndefined();
  });

  it('rejects unsupported integration routes before using D1', async () => {
    const prepare = vi.fn();
    const invalid = new Request('https://shop.example/api/functions/unknown', {
      method: 'POST',
      headers: { Origin: 'https://shop.example', 'Content-Type': 'application/json' },
      body: '{}',
    });
    const response = await onRequest({
      request: invalid, env: { DB: { prepare } } as unknown as Env, waitUntil: vi.fn(),
    } as unknown as Parameters<typeof onRequest>[0]);
    expect(response.status).toBe(404);
    expect(prepare).not.toHaveBeenCalled();
  });
});
