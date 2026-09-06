import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function ttsProxyPlugin(): Plugin {
  return {
    name: 'tts-proxy-middleware',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        try {
          const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
          const text = parsedUrl.searchParams.get('text');
          const lang = parsedUrl.searchParams.get('lang') || 'ml';

          if (!text || !text.trim()) {
            res.statusCode = 400;
            res.end('Missing text parameter');
            return;
          }

          const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.trim())}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

          const upstreamRes = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          if (!upstreamRes.ok) {
            res.statusCode = upstreamRes.status;
            res.end(`Upstream TTS failed: ${upstreamRes.statusText}`);
            return;
          }

          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const buffer = Buffer.from(await upstreamRes.arrayBuffer());
          res.end(buffer);
        } catch (err: any) {
          res.statusCode = 500;
          res.end(`TTS proxy error: ${err?.message || 'unknown'}`);
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ttsProxyPlugin()],
  base: "./",
})
