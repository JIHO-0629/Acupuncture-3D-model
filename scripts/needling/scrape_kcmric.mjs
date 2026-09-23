// KCMRIC 침구법 원문 수집 (인용 출처용; RAW: 가공 없이 줄 단위 보존)
// usage: node scrape_kcmric.mjs LU 11 [LI 20 ...]
import fs from 'fs';

const dec = s => s.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const clean = s => dec(s).split('\n').map(x => x.trim()).filter(Boolean).join('\n');

const args = process.argv.slice(2);
for (let a = 0; a < args.length; a += 2) {
  const [mer, n] = [args[a], +args[a + 1]];
  const out = [];
  for (let i = 1; i <= n; i++) {
    const code = `${mer}${i}`, url = `https://m.kmcric.com/knowledge/acupoint/${mer}/${code}`;
    const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const m = html.match(/침구법<\/h6>\s*<div class="_editorString">([\s\S]*?)<\/div>/);
    let raw = m ? clean(m[1]) : null, note = '';
    if (!raw) {
      // GB28처럼 '침구법' 제목이 빠진 페이지: 刺/寸이 들어 있는 마지막 본문 블록을 후보로
      const blocks = [...html.matchAll(/<div class="_editorString">([\s\S]*?)<\/div>/g)].map(b => clean(b[1]));
      const cand = blocks.filter(b => /刺/.test(b)).pop();
      if (cand) { raw = cand; note = 'KCMRIC 페이지에 침구법 제목(h6) 누락, 본문 블록에서 추출'; }
    }
    out.push({ code, url, raw, note, fetched: new Date().toISOString() });
    console.log(code, raw ? 'ok' : 'MISSING', note ? '(fallback)' : '');
    await new Promise(r => setTimeout(r, 800));
  }
  fs.writeFileSync(`kcmric_raw_${mer}.json`, JSON.stringify(out, null, 1));
}
