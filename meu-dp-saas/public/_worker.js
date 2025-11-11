export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    // Tenta servir o asset estático normalmente
    const res = await env.ASSETS.fetch(request)
    // Para rotas SPA sem extensão (ex.: /app/folha), faz fallback para index.html
    if (res.status === 404 && !url.pathname.split('/').pop().includes('.')) {
      return env.ASSETS.fetch(new Request(url.origin + '/index.html', request))
    }
    return res
  },
}