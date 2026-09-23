// 361 표준경혈의 seed·outward·projection을 뷰어와 같은 근거에서 모은다.
// 12경맥은 data/meridians/*.json, LI는 data/li-landmarks.json, GB는 app/gb-points.ts를 읽는다.
import fs from 'node:fs';

const REPO = 'C:/Users/jiho3/Documents/Codex/2026-09-09/we-are-building-an-acupuncture-anatomy/human-atlas';
const json = (p) => JSON.parse(fs.readFileSync(`${REPO}/${p}`, 'utf8'));
const landmarks = json('data/landmarks.json').landmarks;
const lm = (id, side = 'right') => landmarks.find((l) => l.id === id && l.side === (l.side === null ? null : side))?.point
  ?? landmarks.find((l) => l.id === id)?.point;
const curve = (id) => landmarks.find((l) => l.id === id && l.side === 'right').samples;
const sampleCurveAtHeight = (id, h) => {
  const s = curve(id);
  for (let i = 1; i < s.length; i++) if (h <= s[i][1]) {
    const r = (h - s[i - 1][1]) / (s[i][1] - s[i - 1][1] || 1);
    return [s[i - 1][0] + (s[i][0] - s[i - 1][0]) * r, h, s[i - 1][2] + (s[i][2] - s[i - 1][2]) * r];
  }
  throw new Error(`${id} @ ${h}`);
};
const popliteal = lm('popliteal_crease'), trochanter = lm('greater_trochanter'), malleolus = lm('lateral_malleolus_prominence'), middleFinger = lm('middle_finger_tip');
const thighHeight = (cun) => popliteal[1] + (trochanter[1] - popliteal[1]) * cun / 19;
const legHeight = (cun) => malleolus[1] + (popliteal[1] - malleolus[1]) * cun / 16;
// app/gb-landmark-seeds.ts와 같은 규칙
const GB_LANDMARK_SEEDS = {
  GB25: lm('rib_twelfth_free_end'),
  GB31: sampleCurveAtHeight('iliotibial_tract_posterior_border', middleFinger[1]),
  GB32: sampleCurveAtHeight('iliotibial_tract_posterior_border', thighHeight(7)),
  GB35: sampleCurveAtHeight('fibula_posterior_border', legHeight(7)),
  GB36: sampleCurveAtHeight('fibula_anterior_border', legHeight(7)),
  GB37: sampleCurveAtHeight('fibula_anterior_border', legHeight(5)),
  GB38: sampleCurveAtHeight('fibula_anterior_border', legHeight(4)),
  GB39: sampleCurveAtHeight('fibula_anterior_border', legHeight(3)),
  GB40: lm('gb40_ankle_depression'), GB41: lm('gb41_metatarsal_depression'), GB42: lm('gb42_metatarsal_interspace'),
  GB43: lm('interdigital_web_4_5'), GB44: lm('toenail_root_corner_4_lateral'),
};
const GB_HEAD_CUN_SEEDS = Object.fromEntries(json('data/head-cun.json').points.map((p) => [p.code, p.point]));

export function allPoints() {
  const out = [];
  // GB: gb-points.ts에서 code·seed·projection을 읽는다 (TS를 그대로 실행할 수 없어 정규식으로 읽음)
  const gbSource = fs.readFileSync(`${REPO}/app/gb-points.ts`, 'utf8');
  for (const chunk of gbSource.split(/\{code:'/).slice(1)) {
    const code = chunk.slice(0, chunk.indexOf("'"));
    if (!/^GB\d+$/.test(code)) continue;
    const entry = chunk.slice(0, chunk.indexOf('},'));
    const seedExpr = entry.match(/seed:(\[[-\d.,\s]+\]|GB_LANDMARK_SEEDS\.GB\d+!?|GB_HEAD_CUN_SEEDS\.GB\d+!?)/)?.[1];
    const projection = entry.match(/projection:'([a-z-]+)'/)?.[1];
    const outward = entry.match(/outward:\[([-\d.,\s]+)\]/)?.[1].split(',').map(Number);
    if (!seedExpr || !projection) throw new Error(`gb-points.ts 파싱 실패: ${code}`);
    // '.078' 같은 축약 숫자가 있어 JSON.parse 대신 직접 읽는다
    const seed = seedExpr.startsWith('[') ? seedExpr.slice(1, -1).split(',').map(Number)
      : seedExpr.startsWith('GB_LANDMARK') ? GB_LANDMARK_SEEDS[seedExpr.match(/GB\d+/)[0]]
        : GB_HEAD_CUN_SEEDS[seedExpr.match(/GB\d+/)[0]];
    if (!seed) throw new Error(`seed missing for ${code}`);
    out.push({ code, seed, projection, ...(outward ? { outward } : {}) });
  }
  // LI
  for (const [code, p] of Object.entries(json('data/li-landmarks.json').points)) out.push({ code, seed: p.seed, outward: p.outward, projection: 'lateral' });
  // 나머지 경맥
  for (const mer of ['LU', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'TE', 'LR', 'CV', 'GV'])
    for (const p of json(`data/meridians/${mer}.json`).points)
      out.push({ code: p.code, seed: p.seed, outward: p.outward, projection: p.projection ?? (p.outward ? 'direct-outward' : 'lateral') });
  return out;
}

if (process.argv[1]?.endsWith('points_all.mjs')) {
  const p = allPoints();
  const per = {};
  for (const x of p) per[x.code.replace(/\d+$/, '')] = (per[x.code.replace(/\d+$/, '')] ?? 0) + 1;
  console.log(p.length, JSON.stringify(per));
  console.log(p.filter((x) => !x.seed || x.seed.length !== 3).map((x) => x.code).join(',') || 'seed 누락 없음');
}
