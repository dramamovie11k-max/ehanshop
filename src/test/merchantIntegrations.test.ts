// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handle as dispatch } from '../../server/integrations/send-to-courier';
import { handle as ratio, normalizeCourierRatio } from '../../server/integrations/check-courier-ratio';
import { handle as facebook } from '../../server/integrations/fb-conversions-api';
import { handle as tiktok } from '../../server/integrations/tiktok-events-api';
import type { Env } from '../../server/core';

const orderId = '12d2cc9c-cea4-4b64-a716-464292133e80';
const order = { id: orderId, status: 'confirmed', customer_name: 'Customer fixture',
  customer_phone: '01700000001', customer_address: 'Test address', total_amount: 500 };
const settings = [
  { setting_key: 'steadfast_api_key', setting_value: 'test-key' },
  { setting_key: 'steadfast_secret_key', setting_value: 'test-secret' },
];
function input(body: object) {
  return new Request('https://shop.example/api/functions/test', { method: 'POST', body: JSON.stringify(body) });
}
function fixture(rows = settings, lock = true) {
  const batch = vi.fn().mockResolvedValue([{ meta: { changes: 1 } }, { meta: { changes: 1 } }]);
  const prepare = vi.fn((sql: string) => ({
    bind: (...values: unknown[]) => ({
      sql, values,
      first: async () => sql.includes('INSERT INTO checkout_guards') ? (lock ? { key: 'reserved' } : null)
        : sql.includes('FROM orders') ? order : { setting_value: 'ratio-fixture' },
      all: async () => ({ results: rows }),
      run: async () => ({ success: true }),
    }),
    all: async () => ({ results: rows }),
  }));
  return { env: { DB: { prepare, batch } } as unknown as Env, prepare, batch };
}
afterEach(() => vi.unstubAllGlobals());

describe('courier dispatch', () => {
  it('uses the D1 order amount and writes courier status and log only after confirmation', async () => {
    const { env, batch } = fixture();
    const fetch = vi.fn().mockResolvedValue(Response.json({ status: 200, consignment: { consignment_id: 123, tracking_code: 'TEST' } }));
    vi.stubGlobal('fetch', fetch);
    const result = await dispatch(input({ orderId, courier: 'steadfast', codAmount: 1, recipientName: 'Ignored' }), env);
    expect(result.status).toBe(200);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ cod_amount: 500, recipient_name: 'Customer fixture' });
    expect(batch).toHaveBeenCalledTimes(1);
    expect(batch.mock.calls[0][0]).toHaveLength(2);
  });

  it('does not mark unconfirmed shipments as sent or issue duplicate bookings', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ status: 200, consignment: {} }));
    vi.stubGlobal('fetch', fetch);
    const { env, batch } = fixture();
    await expect(dispatch(input({ orderId, courier: 'steadfast' }), env)).rejects.toMatchObject({ status: 502 });
    expect(batch).not.toHaveBeenCalled();
    await expect(dispatch(input({ orderId, courier: 'steadfast' }), fixture(settings, false).env))
      .rejects.toMatchObject({ status: 409 });
    expect(fetch).toHaveBeenCalledOnce();
    await expect(dispatch(input({ orderId, courier: 'pathao' }), env)).rejects.toMatchObject({ status: 400 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('passes the selected Pathao city, zone and configured store', async () => {
    const config = ['client_id', 'client_secret', 'username', 'password', 'store_id'].map(field => ({
      setting_key: 'pathao_' + field, setting_value: field === 'store_id' ? '123' : 'test-only',
    }));
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ access_token: 'fixture-token' }))
      .mockResolvedValueOnce(Response.json({ data: { consignment_id: 'ABC123' } }));
    vi.stubGlobal('fetch', fetch);
    const response = await dispatch(input({ orderId, courier: 'pathao', pathaoCityId: 8, pathaoZoneId: 991 }), fixture(config).env);
    expect(response.status).toBe(200);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
      store_id: 123, recipient_city: 8, recipient_zone: 991, amount_to_collect: 500,
    });
  });
});

describe('courier ratio', () => {
  it('normalizes flat and nested reports without presenting a provider failure as zero deliveries', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ status: 200, data: { total: 10, success: 8, cancel: 2,
      couriers: [{ name: 'Steadfast', total: 10, success: 8, cancel: 2 }] } }));
    vi.stubGlobal('fetch', fetch);
    const response = await ratio(input({ phone: '+8801700000001' }), fixture().env);
    const result = await response.json() as { data: ReturnType<typeof normalizeCourierRatio> };
    expect(result.data.summary).toMatchObject({ total_parcel: 10, success_ratio: 80 });
    expect(result.data.couriers[0].success_parcel).toBe(8);
    expect(normalizeCourierRatio({ data: { summary: { total_parcel: 4, success_parcel: 2 }, redx: { total_parcel: 4 } } }).couriers[0].name).toBe('redx');
    expect(() => normalizeCourierRatio({ message: 'error' })).toThrow('no usable delivery history');
    await expect(ratio(input({ phone: '123' }), fixture().env)).rejects.toMatchObject({ status: 400 });
    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe('pixel provider responses', () => {
  it('requires provider confirmation and preserves the event ID', async () => {
    const config = ['fb', 'tiktok'].flatMap(provider => [
      { setting_key: provider + '_pixel_enabled', setting_value: 'true' },
      { setting_key: provider + '_pixel_id', setting_value: '123' },
      { setting_key: provider + '_pixel_access_token', setting_value: 'test-only' },
    ]);
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ events_received: 0 }))
      .mockResolvedValueOnce(Response.json({ events_received: 1 }))
      .mockResolvedValueOnce(Response.json({ code: 1 }))
      .mockResolvedValueOnce(Response.json({ code: 0 }));
    vi.stubGlobal('fetch', fetch);
    const event = { event_name: 'ViewContent', event_id: 'test-event' };
    const { env } = fixture(config);
    expect((await facebook(input(event), env)).status).toBe(502);
    expect((await facebook(input(event), env)).status).toBe(200);
    expect((await tiktok(input(event), env)).status).toBe(502);
    expect((await tiktok(input(event), env)).status).toBe(200);
    for (const [, options] of fetch.mock.calls) expect(JSON.parse(options.body).data[0].event_id).toBe('test-event');
  });
});
