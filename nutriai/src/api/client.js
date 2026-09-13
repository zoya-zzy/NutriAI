// One transport for every backend endpoint, including deployment diagnostics.
export function createApiClient({ baseUrl = '', production = false, fetchImpl = globalThis.fetch } = {}) {
  const base = baseUrl.trim().replace(/\/+$/, '')
  return async function request(path, options = {}, { timeoutMs = 90000 } = {}) {
    if (production && !base) {
      throw new Error('AI 服务尚未连接，请联系网站管理员完成后端部署。')
    }
    if (base) {
      let url
      try { url = new URL(base) } catch { throw new Error('AI 服务地址配置无效。') }
      if (!['http:', 'https:'].includes(url.protocol) || (production &&
        (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
        throw new Error('AI 服务需要可公开访问的 HTTPS 地址。')
      }
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(`${base}${path}`, { ...options, signal: controller.signal })
      if (!(response.headers.get('content-type') || '').includes('application/json')) {
        throw new Error('AI 服务未正确连接，请联系网站管理员检查后端地址。')
      }
      const data = await response.json()
      if (!response.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : data.message
        throw new Error(detail || `AI 服务请求失败（${response.status}），请稍后重试。`)
      }
      return data
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('AI 服务响应超时，请稍后重试。')
      if (error instanceof TypeError) throw new Error('暂时无法连接 AI 服务，请检查网络后重试。')
      throw error
    } finally {
      clearTimeout(timer)
    }
  }
}

export const apiRequest = createApiClient({
  baseUrl: import.meta.env?.VITE_API_BASE || '',
  production: import.meta.env?.PROD || false,
})
