// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '../../functions/api/site-settings';
import type { Env } from '../../server/core';

describe('public site settings', () => {
  it('uses the public query policy even when a session cookie is present', async () => {
    const bind = vi.fn(() => ({
      all: async () => ({ results: [
        { setting_key: 'site_mode', setting_value: 'website' },
        { setting_key: 'courier_api_key', setting_value: 'private-fixture' },
      ] }),
    }));
    const prepare = vi.fn(() => ({ bind }));
    const request = new Request('https://shop.example/api/site-settings', {
      headers: { Cookie: '__Host-shop_session=test-session' },
    });
    const response = await onRequest({ request, env: { DB: { prepare } } as unknown as Env } as Parameters<typeof onRequest>[0]);
    expect(response.status).toBe(200);
    expect(prepare).toHaveBeenCalledOnce();
    expect(bind.mock.calls[0]).toContain('%api_key%');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.has('Set-Cookie')).toBe(false);
    const body = await response.text();
    expect(body).toContain('site_mode');
    expect(body).not.toContain('courier_api_key');
    expect(body).not.toContain('private-fixture');
  });

  it('rejects writes without contacting D1', async () => {
    const request = new Request('https://shop.example/api/site-settings', { method: 'POST' });
    const response = await onRequest({ request } as Parameters<typeof onRequest>[0]);
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET');
  });
});
