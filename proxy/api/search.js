// Vercel Serverless Function — 제품명 기반 디자인 레퍼런스 검색 프록시
// 키는 환경변수(시크릿)에서만 읽습니다. 페이지에는 절대 노출되지 않습니다.
//   NAVER_CLIENT_ID, NAVER_CLIENT_SECRET  (네이버 검색 openapi)
//   GOOGLE_API_KEY, GOOGLE_CX             (구글 Programmable Search)
//   ALLOW_ORIGIN                          (허용 오리진, 예: https://duckjin87-web.github.io)

const NAVER = {
  image: 'https://openapi.naver.com/v1/search/image?display=12&sort=sim&query=',
  blog:  'https://openapi.naver.com/v1/search/blog?display=6&sort=sim&query=',
  shop:  'https://openapi.naver.com/v1/search/shop?display=6&sort=sim&query='
};
const strip = s => (s || '').replace(/<[^>]+>/g, '').trim();

export default async function handler(req, res) {
  const allow = process.env.ALLOW_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const q = (req.query.q || '').toString().trim();
  if (!q) { res.status(400).json({ error: 'q (제품명) required' }); return; }
  const eq = encodeURIComponent(q);
  const out = { query: q, images: [], blogs: [], shops: [], errors: [] };

  const nId = process.env.NAVER_CLIENT_ID, nSec = process.env.NAVER_CLIENT_SECRET;
  const gKey = process.env.GOOGLE_API_KEY, gCx = process.env.GOOGLE_CX;
  const tasks = [];

  if (nId && nSec) {
    const headers = { 'X-Naver-Client-Id': nId, 'X-Naver-Client-Secret': nSec };
    tasks.push(fetch(NAVER.image + eq, { headers }).then(r => r.json()).then(j => {
      (j.items || []).forEach(it => out.images.push(
        { thumb: it.thumbnail, url: it.link, link: it.link, title: strip(it.title), source: 'naver' }));
    }).catch(e => out.errors.push('naver-image: ' + e.message)));
    tasks.push(fetch(NAVER.blog + eq, { headers }).then(r => r.json()).then(j => {
      (j.items || []).forEach(it => out.blogs.push(
        { title: strip(it.title), link: it.link, desc: strip(it.description) }));
    }).catch(e => out.errors.push('naver-blog: ' + e.message)));
    tasks.push(fetch(NAVER.shop + eq, { headers }).then(r => r.json()).then(j => {
      (j.items || []).forEach(it => out.shops.push(
        { title: strip(it.title), link: it.link, image: it.image, price: it.lprice, mall: it.mallName }));
    }).catch(e => out.errors.push('naver-shop: ' + e.message)));
  } else out.errors.push('naver-key-missing');

  if (gKey && gCx) {
    const gu = 'https://www.googleapis.com/customsearch/v1?searchType=image&num=8&key='
      + gKey + '&cx=' + gCx + '&q=' + eq;
    tasks.push(fetch(gu).then(r => r.json()).then(j => {
      if (j.error) { out.errors.push('google: ' + (j.error.message || 'error')); return; }
      (j.items || []).forEach(it => out.images.push({
        thumb: (it.image && it.image.thumbnailLink) || it.link,
        url: it.link, link: (it.image && it.image.contextLink) || it.link,
        title: strip(it.title), source: 'google'
      }));
    }).catch(e => out.errors.push('google-image: ' + e.message)));
  } else out.errors.push('google-key-missing');

  await Promise.all(tasks);
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.status(200).json(out);
}
