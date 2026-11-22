import { json, type Env } from '../../server/core';
import { runQuery } from '../../server/database';

export const onRequest: PagesFunction<Env> = async ({ env, request }) => {
  if (request.method !== 'GET') {
    return json({ data: null, error: { message: 'Method not allowed' } }, 405, { Allow: 'GET' });
  }
  try {
    const result = await runQuery(env, {
      table: 'site_settings',
      action: 'select',
      select: 'setting_key,setting_value,updated_at',
    }, null, request);
    return json(result);
  } catch {
    return json({ data: null, error: { message: 'Unable to load storefront settings' } }, 500);
  }
};
