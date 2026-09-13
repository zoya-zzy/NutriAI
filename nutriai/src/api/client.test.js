import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from './client.js'

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
})
test('production requires a public backend instead of the static frontend', async () => {
  let called = false
  for (const baseUrl of ['', 'http://localhost:8000', 'https://127.0.0.1', 'invalid']) {
    const api = createApiClient({ production: true, baseUrl, fetchImpl: () => { called = true } })
    await assert.rejects(api('/api/health'))
  }
  assert.equal(called, false)
})
test('normalizes the backend origin and preserves POST data', async () => {
  const api = createApiClient({ baseUrl: ' https://backend.example/ ', production: true,
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://backend.example/api/chat')
      assert.equal(options.method, 'POST')
      assert.equal(options.body, '{"message":"hello"}')
      return json({ success: true })
    } })
  assert.deepEqual(await api('/api/chat', { method: 'POST', body: '{"message":"hello"}' }), { success: true })
})
test('reports HTML fallback, JSON API errors, and network failure', async () => {
  for (const fetchImpl of [
    async () => new Response('<html/>', { headers: { 'Content-Type': 'text/html' } }),
    async () => json({ detail: 'Too large' }, 413),
    async () => { throw new TypeError('Failed to fetch') },
  ]) await assert.rejects(createApiClient({ fetchImpl })('/api/health'))
})
test('aborts a stalled request', async () => {
  const api = createApiClient({ fetchImpl: (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
  }) })
  await assert.rejects(api('/api/chat', {}, { timeoutMs: 10 }), /超时/)
})
