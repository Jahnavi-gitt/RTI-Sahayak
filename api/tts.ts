export default async function handler(req: any, res: any) {
  try {
    const text = req.query?.text || (req.url ? new URL(req.url, 'http://localhost').searchParams.get('text') : '') || '';
    const lang = req.query?.lang || (req.url ? new URL(req.url, 'http://localhost').searchParams.get('lang') : '') || 'ml';

    if (!text || !text.trim()) {
      res.statusCode = 400;
      return res.end('Missing text parameter');
    }

    const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      text.trim()
    )}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamRes.ok) {
      res.statusCode = upstreamRes.status;
      return res.end(`Upstream TTS failed: ${upstreamRes.statusText}`);
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.end(buffer);
  } catch (err: any) {
    res.statusCode = 500;
    return res.end(`TTS proxy error: ${err?.message || 'unknown'}`);
  }
}
