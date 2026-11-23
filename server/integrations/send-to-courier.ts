import { Env, HttpError, assert, json, settings } from '../core';

type Courier = "steadfast" | "pathao";

interface StoredOrder {
  id: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  notes: string | null;
  courier_id: string | null;
  courier_consignment_id: string | null;
  courier_tracking_code: string | null;
}

interface CourierCredentials {
  steadfast_api_key?: string;
  steadfast_secret_key?: string;
  pathao_client_id?: string;
  pathao_client_secret?: string;
  pathao_username?: string;
  pathao_password?: string;
  pathao_store_id?: string;
}

export async function handle(req: Request, env: Env): Promise<Response> {
  const { orderId, courier, pathaoCityId, pathaoZoneId } = await req.json<{
    orderId?: string; courier?: Courier; pathaoCityId?: number; pathaoZoneId?: number;
  }>();
  assert(typeof orderId === "string" && /^[0-9a-f-]{36}$/i.test(orderId), "Invalid order ID");
  assert(courier === "steadfast" || courier === "pathao", "Invalid courier");
  const order = await env.DB.prepare(`SELECT id,status,customer_name,customer_phone,customer_address,total_amount,notes,
    courier_id,courier_consignment_id,courier_tracking_code FROM orders WHERE id=?`).bind(orderId).first<StoredOrder>();
  assert(order, "Order not found", 404);
  if (order.courier_id && order.courier_consignment_id) {
    return json({ success: true, message: "অর্ডারটি ইতিমধ্যে কুরিয়ারে পাঠানো হয়েছে",
      consignmentId: order.courier_consignment_id, trackingCode: order.courier_tracking_code });
  }
  assert(!order.courier_id && ['pending','confirmed','processing'].includes(order.status),
    "This order cannot be dispatched. Check its courier and status.", 409);

  const credentials: CourierCredentials = await settings(env);
  if (courier === "steadfast") {
    assert(credentials.steadfast_api_key && credentials.steadfast_secret_key, "Configure Steadfast credentials first", 503);
  } else {
    assert(Number.isSafeInteger(pathaoCityId) && Number(pathaoCityId)>0 &&
      Number.isSafeInteger(pathaoZoneId) && Number(pathaoZoneId)>0, "Enter the Pathao city and zone IDs");
    assert(credentials.pathao_client_id && credentials.pathao_client_secret && credentials.pathao_username &&
      credentials.pathao_password && /^[1-9]\d*$/.test(credentials.pathao_store_id ?? ""), "Configure Pathao credentials and store ID first", 503);
  }

  const lockKey = "courier:" + orderId;
  const lock = await env.DB.prepare(`INSERT INTO checkout_guards(key,order_id,expires_at)
    SELECT ?,id,2147483647 FROM orders
    WHERE id=? AND status IN ('pending','confirmed','processing') AND coalesce(courier_id,'')=''
    ON CONFLICT(key) DO NOTHING RETURNING key`).bind(lockKey,orderId).first();
  assert(lock, "Dispatch already started. Check the courier dashboard before retrying.", 409);
  const details = {
    orderId,
    recipientName: order.customer_name,
    recipientPhone: order.customer_phone,
    recipientAddress: order.customer_address,
    codAmount: order.total_amount,
    note: order.notes ?? undefined,
  };
  let result;
  try {
    result = courier === "steadfast"
      ? await sendToSteadfast(credentials, details)
      : await sendToPathao(credentials, { ...details, cityId: pathaoCityId!, zoneId: pathaoZoneId! });
    assert(result.consignmentId, "Courier confirmation is missing. Check the courier dashboard before retrying.", 502);
    const sentAt = new Date().toISOString();
    const [updated, logged] = await env.DB.batch([
      env.DB.prepare(`UPDATE orders SET courier_id=?,courier_consignment_id=?,courier_tracking_code=?,courier_sent_at=?,
        status=CASE WHEN status IN ('pending','confirmed','processing') THEN 'shipped' ELSE status END WHERE id=?`)
        .bind(courier,result.consignmentId,result.trackingCode,sentAt,orderId),
      env.DB.prepare(`INSERT INTO order_logs(order_id,action,new_status,notes)
        SELECT id,'courier_sent',status,? FROM orders WHERE id=?`)
        .bind("Courier: " + courier + " · " + result.consignmentId,orderId),
    ]);
    assert(updated.meta.changes > 0 && logged.meta.changes > 0, "Courier confirmation could not be linked to the order", 502);
  } catch (error) {
    // A timeout or lost reply can follow a successful booking. Retain the lock
    // until the courier dashboard has been checked.
    if (error instanceof HttpError && error.status === 422) {
      await env.DB.prepare("DELETE FROM checkout_guards WHERE key=?").bind(lockKey).run();
      throw error;
    }
    throw new HttpError(502, "Dispatch could not be confirmed. Check the courier dashboard before retrying.");
  }
  return json({ success: true, message: "অর্ডার কুরিয়ারে পাঠানো হয়েছে", ...result });
}

async function sendToSteadfast(
  credentials: CourierCredentials,
  data: {
    orderId: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    codAmount: number;
    note?: string;
  }
) {
  const { steadfast_api_key, steadfast_secret_key } = credentials;

  if (!steadfast_api_key || !steadfast_secret_key) {
    throw new Error("Steadfast API credentials not configured");
  }

  const response = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
    method: "POST",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "Content-Type": "application/json",
      "Api-Key": steadfast_api_key,
      "Secret-Key": steadfast_secret_key,
    },
    body: JSON.stringify({
      invoice: data.orderId.slice(0, 8).toUpperCase(),
      recipient_name: data.recipientName,
      recipient_phone: data.recipientPhone,
      recipient_address: data.recipientAddress,
      cod_amount: data.codAmount,
      note: data.note || "",
    }),
  });

  const result = await response.json<{status?:number;consignment?:{consignment_id:string|number;tracking_code:string};message?:string}>();

  if (!response.ok || result.status !== 200) {
    const status = response.ok ? result.status : response.status;
    if (status && [400, 401, 403, 422].includes(status)) throw new HttpError(422, "Steadfast rejected the booking. Check the settings and order details.");
    throw new HttpError(502, "Steadfast did not confirm the booking");
  }

  return {
    consignmentId: String(result.consignment?.consignment_id || ""),
    trackingCode: result.consignment?.tracking_code || "",
  };
}

async function sendToPathao(
  credentials: CourierCredentials,
  data: {
    orderId: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    cityId: number;
    zoneId: number;
    codAmount: number;
    note?: string;
  }
) {
  const { pathao_client_id, pathao_client_secret, pathao_username, pathao_password, pathao_store_id } = credentials;

  if (!pathao_client_id || !pathao_client_secret || !pathao_username || !pathao_password) {
    throw new Error("Pathao API credentials not configured");
  }

  // First, get access token
  const tokenResponse = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/issue-token", {
    method: "POST",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: pathao_client_id,
      client_secret: pathao_client_secret,
      username: pathao_username,
      password: pathao_password,
      grant_type: "password",
    }),
  });

  const tokenResult = await tokenResponse.json<{access_token?:string;message?:string}>();

  if (!tokenResponse.ok || !tokenResult.access_token) {
    throw new HttpError(422, "Pathao authentication failed. Check the courier settings.");
  }

  const accessToken = tokenResult.access_token;

  // Create order
  const orderResponse = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/orders", {
    method: "POST",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      store_id: Number(pathao_store_id),
      merchant_order_id: data.orderId.slice(0, 8).toUpperCase(),
      recipient_name: data.recipientName,
      recipient_phone: data.recipientPhone,
      recipient_address: data.recipientAddress,
      recipient_city: data.cityId,
      recipient_zone: data.zoneId,
      delivery_type: 48,
      item_type: 2,
      special_instruction: data.note || "",
      item_quantity: 1,
      item_weight: 0.5,
      amount_to_collect: data.codAmount,
      item_description: "Product delivery",
    }),
  });

  const orderResult = await orderResponse.json<{data?:{consignment_id:string};message?:string;errors?:unknown}>();

  if (!orderResponse.ok) {
    if ([400, 401, 403, 422].includes(orderResponse.status)) throw new HttpError(422, "Pathao rejected the booking. Check the zone and order details.");
    throw new HttpError(502, "Pathao did not confirm the booking");
  }

  return {
    consignmentId: String(orderResult.data?.consignment_id || ""),
    trackingCode: orderResult.data?.consignment_id || "",
  };
}
