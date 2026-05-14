// Worker entry point. Routes /api/picks/:id to KV-backed handlers,
// falls through to static assets (the bundled index.html) for everything else.

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API: /api/picks/:id
    const match = url.pathname.match(/^\/api\/picks\/([^/]+)$/);
    if (match) {
      const id = match[1];
      if (!isValidId(id)) return json({ error: 'Invalid ID' }, 400);

      if (request.method === 'GET') {
        const value = await env.PICKS.get(`user:${id}`);
        if (value === null) return json(null);
        return new Response(value, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      if (request.method === 'PUT') {
        const body = await request.text();
        if (body.length > MAX_PAYLOAD_BYTES) {
          return json({ error: 'Payload too large' }, 413);
        }
        try { JSON.parse(body); } catch (e) {
          return json({ error: 'Invalid JSON' }, 400);
        }
        await env.PICKS.put(`user:${id}`, body);
        return json({ ok: true });
      }

      return json({ error: 'Method not allowed' }, 405);
    }

    // Everything else: serve the bundled static asset (index.html)
    return env.ASSETS.fetch(request);
  }
};
