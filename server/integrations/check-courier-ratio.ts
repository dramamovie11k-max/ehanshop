import { Env, HttpError, Row, assert, json } from '../core';
import { phoneNumber } from '../checkout';

const courierNames = ['pathao', 'steadfast', 'parceldex', 'redx', 'paperfly', 'carrybee'];

function counts(value: Row) {
  const number = (input: unknown) => {
    const result = Number(input);
    return Number.isFinite(result) ? Math.max(0, result) : 0;
  };
  const total = number(value.total_parcel ?? value.total);
  const success = number(value.success_parcel ?? value.success);
  const cancelled = number(value.cancelled_parcel ?? value.cancel);
  const ratio = value.success_ratio ?? (total ? (100 * success / total) : 0);
  return { total_parcel: total, success_parcel: success, cancelled_parcel: cancelled,
    success_ratio: Math.min(100, number(ratio)) };
}

export function normalizeCourierRatio(payload: Row) {
  const data = (payload.data && typeof payload.data === 'object' ? payload.data : payload) as Row;
  const summary = (data.summary && typeof data.summary === 'object' ? data.summary : data) as Row;
  assert(['total_parcel', 'total'].some(key => summary[key] != null && Number.isFinite(Number(summary[key]))),
    'Courier provider returned no usable delivery history', 502);
  const rows = Array.isArray(data.couriers)
    ? data.couriers
    : courierNames.flatMap(name => data[name] && typeof data[name] === 'object' ? [{ name, ...data[name] as Row }] : []);
  return { summary: counts(summary), couriers: rows.filter(row => row && typeof row.name === 'string')
    .map(row => ({ name: row.name, logo: typeof row.logo === 'string' ? row.logo : '', ...counts(row) })) };
}

export async function handle(req: Request, env: Env): Promise<Response> {
  const input = await req.json<{ phone?: string }>();
  const phone = phoneNumber(input.phone);
  assert(/^01[3-9]\d{8}$/.test(phone), 'Enter a valid Bangladesh mobile number');
  const key = await env.DB.prepare('SELECT setting_value FROM site_settings WHERE setting_key=?')
    .bind('bdcourier_api_key').first<{ setting_value: string }>();
  assert(key?.setting_value, 'Configure the BD Courier API key in Courier Settings', 503);
  let result: Row;
  try {
    const response = await fetch('https://api.bdcourier.com/courier-check', {
      method: 'POST', signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key.setting_value },
      body: JSON.stringify({ phone }),
    });
    if (!response.ok) throw new Error('Provider rejected lookup');
    result = await response.json<Row>();
  } catch {
    throw new HttpError(502, 'Courier lookup failed. Try again later.');
  }
  assert(result && result.success !== false && (typeof result.status !== 'number' || result.status < 400),
    'Courier provider rejected the lookup', 502);
  return json({ success: true, data: normalizeCourierRatio(result) });
}
