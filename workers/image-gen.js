/**
 * Cloudflare Worker — Flux Schnell image generation for ascii-smht.
 * Deploy separately; app calls this via IMAGE_GEN_URL + IMAGE_GEN_API_KEY.
 *
 * Bindings:
 * - env.API_KEY (secret)
 * - env.AI (Workers AI binding)
 */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    const auth = request.headers.get('Authorization')
    if (auth !== `Bearer ${env.API_KEY}`) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/') {
      return json({ error: 'Not allowed' }, 405)
    }

    const clientKey = request.headers.get('CF-Connecting-IP') || 'unknown'
    const now = Date.now()
    const windowMs = 60_000
    const maxRequests = 5
    const recent = (requestCounts.get(clientKey) || []).filter(
      (timestamp) => now - timestamp < windowMs,
    )
    if (recent.length >= maxRequests) {
      return json({ error: 'Rate limit exceeded' }, 429, {
        'Retry-After': '60',
      })
    }
    recent.push(now)
    requestCounts.set(clientKey, recent)

    try {
      if (!env.AI || typeof env.AI.run !== 'function') {
        return json({ error: 'Workers AI binding missing' }, 500)
      }

      const body = await request.json()
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
      if (!prompt) return json({ error: 'Prompt is required' }, 400)
      if (prompt.length > 500) {
        return json({ error: 'Prompt is too long' }, 400)
      }

      let steps = Number(body.steps ?? 4)
      if (!Number.isFinite(steps)) steps = 4
      steps = Math.min(8, Math.max(1, Math.round(steps)))

      const enhanced = [
        prompt,
        'high contrast, simple shapes, solid background, centered subject, clear silhouette',
      ].join(', ')

      const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt: enhanced.slice(0, 2048),
        steps,
      })

      if (!result?.image) {
        return json({ error: 'No image returned' }, 502)
      }

      const bytes = Uint8Array.from(atob(result.image), (c) => c.charCodeAt(0))
      return new Response(bytes, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-store',
          ...corsHeaders(),
        },
      })
    } catch (_err) {
      return json({ error: 'Failed to generate image' }, 500)
    }
  },
}

const requestCounts = new Map()

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...corsHeaders(),
    },
  })
}
