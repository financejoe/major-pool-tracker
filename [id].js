// Cloudflare Pages Function: handles /api/picks/:id
// GET returns the saved picks blob (or null), PUT replaces it.

const ID_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;
const MAX_PAYLOAD_BYTES = 50000;

function json(body, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function isValidId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

export async function onRequestGet(context) {
  const { id } = context.params;
  if (!isValidId(id)) return json({ error: 'Invalid ID' }, 400);
  const value = await context.env.PICKS.get(`user:${id}`);
  if (value === null) return json(null);
  return new Response(value, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestPut(context) {
  const { id } = context.params;
  if (!isValidId(id)) return json({ error: 'Invalid ID' }, 400);

  const body = await context.request.text();
  if (body.length > MAX_PAYLOAD_BYTES) {
    return json({ error: 'Payload too large' }, 413);
  }
  try {
    JSON.parse(body);
  } catch (e) {
    return json({ error: 'Invalid JSON' }, 400);
  }
  await context.env.PICKS.put(`user:${id}`, body);
  return json({ ok: true });
}

export async function onRequest() {
  return json({ error: 'Method not allowed' }, 405);
}
