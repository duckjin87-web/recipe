// Vercel Serverless Function — 외부 이미지 CORS 우회 프록시
// 검색 썸네일을 canvas(02B 크롭)로 쓰려면 CORS 헤더가 필요 → 서버가 대신 받아 전달
//   ALLOW_ORIGIN 환경변수로 허용 오리진 제한 권장

export default async function handler(req, res) {
  const allow = process.env.ALLOW_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const u = (req.query.url || '').toString();
  if (!/^https?:\/\//i.test(u)) { res.status(400).json({ error: 'bad url' }); return; }
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': '' } });
    if (!r.ok) { res.status(r.status).end(); return; }
    const ct = r.headers.get('content-type') || 'image/jpeg';
    if (!/^image\//i.test(ct)) { res.status(415).json({ error: 'not an image' }); return; }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(buf);
  } catch (e) { res.status(502).json({ error: e.message }); }
}
