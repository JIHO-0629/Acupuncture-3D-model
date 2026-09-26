/** One B-cun scale for the whole body, and an audit of the points against it.
 *
 * Until now each meridian script derived the spans it needed on its own (acupoint-kit.mjs for the
 * arm, ki/lr/st/sp for the leg and abdomen, lu/pc for the chest, head-cun.mjs for the head). The
 * skin ruler and the tap-quiz scoring need those scales at run time, from one place, so this
 * script measures every WHO 2008 proportional span once from the registered landmarks and writes
 * data/cun-scale.json. It then checks two things:
 *
 *  1. consistency: where scripts measure the same body segment differently, how far apart they are;
 *  2. placement: for points with a plain "N B-cun from X" rule, the distance measured on the unified
 *     scale against N. Points are read through the app's own module (app/acupoints.ts) so the audit
 *     sees exactly the coordinates the viewer draws.
 *
 *   node scripts/cun-scale.mjs          write data/cun-scale.json and reports/cun-audit.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { atlas, landmark, mesh, upperLimb, extremeCluster, v, MEDIAL, LATERAL } from './acupoint-kit.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const mm = (metres) => +(metres * 1000).toFixed(1);
const r5 = (p) => p.toArray().map((n) => +n.toFixed(5));

// ---------------------------------------------------------------- spans (right side; the viewer mirrors x)
const arm = upperLimb();
const headCun = read('data/head-cun.json');
const nipple = read('data/nipple.json');
const clavicle = mesh(atlas, 'Right clavicle');
const clavicleMidX = Math.abs((extremeCluster(clavicle, MEDIAL, 0.01).x + extremeCluster(clavicle, LATERAL, 0.01).x) / 2);
// Midline landmarks are registered with side null, paired ones per side.
const L = (id) => { try { return landmark(id); } catch { return landmark(id, null); } };
const vertical = (a, b) => Math.abs(a.y - b.y);

const spans = [];
/** `measure` is the length the scripts divide: a height difference for hanging segments (what the
 *  meridian scripts use), a straight or lateral distance otherwise. */
const span = (id, label, cun, from, to, measure, direction, regions, usedBy, note) => {
  const length = measure(from, to);
  spans.push({ id, label, cun, from: r5(from), to: r5(to), lengthMm: mm(length), cunMm: +(length / cun * 1000).toFixed(2), direction, regions, usedBy, note });
};
const armCrease = v(arm.lateralEpicondyle.x, arm.creaseY, arm.lateralEpicondyle.z);
span('arm', '앞겨드랑주름~팔오금 9촌', 9, v(arm.lateralEpicondyle.x, arm.foldY, arm.lateralEpicondyle.z), armCrease, vertical, 'longitudinal', ['upper-arm'], ['acupoint-kit', 'li-landmarks'], 'cubital crease = 1 B-cun above the lateral epicondyle (reviewer, 2026-09-15)');
span('forearm', '팔오금~손목주름 12촌', 12, armCrease, arm.radialStyloid, vertical, 'longitudinal', ['forearm', 'hand'], ['acupoint-kit', 'li-landmarks', 'lu', 'pc', 'ht', 'si', 'te'], 'wrist crease at the radial styloid level');
span('chest-vertical', '흉골상절흔~흉골체하단 9촌', 9, L('suprasternal_notch'), L('xiphisternal_junction'), vertical, 'longitudinal', ['thorax'], ['cv', 'ki', 'st'], null);
span('upper-abdomen', '흉골체하단~배꼽 8촌', 8, L('xiphisternal_junction'), L('umbilicus'), vertical, 'longitudinal', ['thorax', 'pelvis'], ['cv', 'ki', 'st', 'sp'], null);
span('lower-abdomen', '배꼽~치골결합 상연 5촌', 5, L('umbilicus'), L('pubic_symphysis_superior'), vertical, 'longitudinal', ['pelvis'], ['cv', 'ki', 'st', 'sp'], null);
span('abdomen-transverse', '앞정중선~쇄골중점 4촌 (배)', 4, v(0, 0, 0), v(-clavicleMidX, 0, 0), (a, b) => Math.abs(b.x - a.x), 'transverse', ['pelvis', 'lumbar'], ['st', 'ki', 'sp', 'lu'], 'abdomen and the clavicle level keep the clavicle-midpoint scale');
span('chest-transverse', '앞정중선~유두 4촌 (유두선, 제4늑간 높이)', 4, v(0, 0, 0), v(nipple.centre[0], 0, 0), (a, b) => Math.abs(b.x - a.x), 'transverse', ['thorax'], ['st', 'ki', 'lr', 'pc', 'sp', 'gb'], 'mammillary line curves from the clavicle midpoint out to the nipple (scripts/trunk-arc.mjs); this is its value at nipple height');
const scapulaMedial = L('scapular_spine_medial_end');
span('back-transverse', '뒤정중선~견갑골 내측연 3촌', 3, v(0, scapulaMedial.y, scapulaMedial.z), scapulaMedial, (a, b) => Math.abs(b.x - a.x), 'transverse', ['thorax', 'lumbar', 'shoulder'], ['bl'], 'WHO: medial borders of the scapulae 6 B-cun apart');
span('thigh-anterior', '치골결합 상연~슬개골 바닥 18촌', 18, L('pubic_symphysis_superior'), L('patella_base'), vertical, 'longitudinal', ['thigh'], ['st', 'lr', 'sp'], null);
span('thigh-lateral', '대전자~오금주름 19촌', 19, L('greater_trochanter'), L('popliteal_crease'), vertical, 'longitudinal', ['thigh'], ['gb', 'bl'], null);
span('leg-medial', '경골 내측과 하연~안쪽 복사 13촌', 13, L('medial_tibial_condyle'), L('medial_malleolus_prominence'), vertical, 'longitudinal', ['leg', 'knee'], ['ki', 'lr', 'sp'], 'ki/lr take SP9 as the upper end');
span('leg-lateral', '오금주름~바깥쪽 복사 16촌', 16, L('popliteal_crease'), L('lateral_malleolus_prominence'), vertical, 'longitudinal', ['leg', 'knee'], ['gb', 'bl'], null);
const groundY = 0;
span('ankle', '바깥쪽 복사~발바닥 3촌', 3, L('lateral_malleolus_prominence'), v(L('lateral_malleolus_prominence').x, groundY, L('lateral_malleolus_prominence').z), vertical, 'longitudinal', ['foot'], ['ki'], null);
for (const [key, label] of [['scalp', '전발제~후발제 12촌'], ['forehead', '미간~전발제 3촌'], ['posterior', '유양돌기 사이 9촌']]) {
  const entry = headCun[key];
  if (!entry?.cunMm) continue;
  spans.push({ id: `head-${key}`, label, cun: key === 'scalp' ? 12 : key === 'forehead' ? 3 : 9, lengthMm: null, cunMm: entry.cunMm, direction: key === 'posterior' ? 'transverse' : 'longitudinal', regions: ['head', 'face', 'neck'], usedBy: ['head-cun', 'gv', 'bl', 'gb', 'st', 'te', 'lr'], note: 'arc length on the skin (scripts/head-cun.mjs)' });
}
const byId = Object.fromEntries(spans.map((s) => [s.id, s]));

// ---------------------------------------------------------------- 1. consistency between scripts
const pts = await (async () => {
  const server = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
  try {
    const module = await server.ssrLoadModule(path.join(root, 'app/acupoints.ts'));
    // Seeds sit 10 mm under the skin along outward; measure the skin point where outward is known.
    return new Map(module.ALL_POINTS.map((p) => [p.code, p.outward ? v(...p.seed).addScaledVector(v(...p.outward).normalize(), 0.01) : v(...p.seed)]));
  } finally { await server.close(); }
})();
const pct = (a, b) => `${(((a - b) / b) * 100).toFixed(1)}%`;
const consistency = [];
const compare = (segment, a, b) => consistency.push({ segment, a, b, differs: pct(a.cunMm, b.cunMm) });
// Forearm: the kit and li-landmarks share the definition; ST-style 16 B-cun legs use the point seeds.
const st35 = pts.get('ST35'), st41 = pts.get('ST41');
if (st35 && st41) compare('종아리 앞 16촌', { how: 'ST35→ST41 (st.mjs)', cunMm: +((st35.y - st41.y) / 16 * 1000).toFixed(2) }, { how: '오금주름→바깥쪽 복사 (gb, bl)', cunMm: byId['leg-lateral'].cunMm });
const sp9 = pts.get('SP9');
if (sp9) compare('종아리 안쪽 13촌', { how: 'SP9→안쪽 복사 (ki, lr)', cunMm: +((sp9.y - L('medial_malleolus_prominence').y) / 13 * 1000).toFixed(2) }, { how: '경골 내측과→안쪽 복사 (WHO)', cunMm: byId['leg-medial'].cunMm });
compare('가로 4촌: 가슴(유두) vs 배(쇄골 중점)', { how: '유두 (nipple.json)', cunMm: byId['chest-transverse'].cunMm }, { how: '쇄골 중점', cunMm: byId['abdomen-transverse'].cunMm });
compare('넙다리', { how: '치골~슬개골 바닥 18촌 (st, lr)', cunMm: byId['thigh-anterior'].cunMm }, { how: '대전자~오금 19촌 (gb)', cunMm: byId['thigh-lateral'].cunMm });
compare('배 세로', { how: '명치~배꼽 8촌', cunMm: byId['upper-abdomen'].cunMm }, { how: '배꼽~치골 5촌', cunMm: byId['lower-abdomen'].cunMm });

// ---------------------------------------------------------------- 2. placement of plainly worded points
const rules = [
  // [code, reference (point code or landmark id), B-cun, span, rule text]
  ['ST36', 'ST35', 3, 'st-leg', '독비 아래 3촌'], ['ST37', 'ST35', 6, 'st-leg', '독비 아래 6촌'], ['ST38', 'ST35', 8, 'st-leg', '독비 아래 8촌'], ['ST39', 'ST35', 9, 'st-leg', '독비 아래 9촌'],
  ['SP6', 'medial_malleolus_prominence', 3, 'leg-medial', '안쪽 복사 위 3촌'], ['SP8', 'SP9', 3, 'leg-medial', '음릉천 아래 3촌'], ['LR5', 'medial_malleolus_prominence', 5, 'leg-medial', '안쪽 복사 위 5촌'], ['LR6', 'medial_malleolus_prominence', 7, 'leg-medial', '안쪽 복사 위 7촌'], ['KI7', 'KI3', 2, 'leg-medial', '태계 위 2촌'], ['KI9', 'KI3', 5, 'leg-medial', '태계 위 5촌'],
  ['GB39', 'lateral_malleolus_prominence', 3, 'leg-lateral', '바깥쪽 복사 위 3촌'], ['GB37', 'lateral_malleolus_prominence', 5, 'leg-lateral', '바깥쪽 복사 위 5촌'], ['GB35', 'lateral_malleolus_prominence', 7, 'leg-lateral', '바깥쪽 복사 위 7촌'], ['BL57', 'popliteal_crease', 8, 'leg-lateral', '위중 아래 8촌'],
  ['PC6', 'PC7', 2, 'forearm', '대릉 위 2촌'], ['PC5', 'PC7', 3, 'forearm', '대릉 위 3촌'], ['PC4', 'PC7', 5, 'forearm', '대릉 위 5촌'], ['LU7', 'LU9', 1.5, 'forearm', '태연 위 1.5촌'], ['LU6', 'LU9', 7, 'forearm', '태연 위 7촌'], ['HT4', 'HT7', 1.5, 'forearm', '신문 위 1.5촌'], ['TE5', 'TE4', 2, 'forearm', '양지 위 2촌'], ['TE6', 'TE4', 3, 'forearm', '양지 위 3촌'], ['LI10', 'LI11', 2, 'forearm', '곡지 아래 2촌'], ['LI7', 'LI5', 5, 'forearm', '양계 위 5촌'],
  ['CV12', 'umbilicus', 4, 'upper-abdomen', '배꼽 위 4촌'], ['CV10', 'umbilicus', 2, 'upper-abdomen', '배꼽 위 2촌'], ['CV6', 'umbilicus', 1.5, 'lower-abdomen', '배꼽 아래 1.5촌'], ['CV4', 'umbilicus', 3, 'lower-abdomen', '배꼽 아래 3촌'], ['CV3', 'umbilicus', 4, 'lower-abdomen', '배꼽 아래 4촌'],
  // Same rules against a second reference, to tell a misplaced point from a misplaced reference.
  ['BL57', 'BL40', 8, 'leg-lateral', '위중 아래 8촌 (BL40 기준)'], ['TE5', 'radial_styloid', 2, 'forearm', '손목주름 위 2촌 (요골 경상돌기 높이)'], ['TE6', 'radial_styloid', 3, 'forearm', '손목주름 위 3촌 (요골 경상돌기 높이)'], ['SP8', 'medial_tibial_condyle', 3, 'leg-medial', '경골 내측과 아래 3촌'],
  ['ST34', 'patella_base', 2, 'thigh-anterior', '슬개골 바닥 위 2촌'], ['ST32', 'patella_base', 6, 'thigh-anterior', '슬개골 바닥 위 6촌'], ['SP10', 'patella_base', 2, 'thigh-anterior', '슬개골 내측 상연 위 2촌'],
];
const transverse = [
  ['ST25', 2, 'abdomen-transverse', '배꼽 옆 2촌'], ['KI16', 0.5, 'abdomen-transverse', '배꼽 옆 0.5촌'], ['SP15', 4, 'abdomen-transverse', '배꼽 옆 4촌'], ['ST21', 2, 'abdomen-transverse', '중완 옆 2촌'],
  ['ST17', 4, 'chest-transverse', '앞정중선 옆 4촌 (젖꼭지)'], ['PC1', 5, 'chest-transverse', '젖꼭지 바깥 1촌'], ['KI23', 2, 'chest-transverse', '제4늑간, 앞정중선 옆 2촌'], ['LR14', 4, 'chest-transverse', '유두 아래 제6늑간 (4촌)'], ['LU1', 6, 'abdomen-transverse', '앞정중선 옆 6촌'],
  ['BL13', 1.5, 'back-transverse', '제3흉추 극돌기 아래 옆 1.5촌'], ['BL23', 1.5, 'back-transverse', '제2요추 극돌기 아래 옆 1.5촌'], ['BL42', 3, 'back-transverse', '제3흉추 극돌기 아래 옆 3촌'], ['BL52', 3, 'back-transverse', '제2요추 극돌기 아래 옆 3촌'],
];
// ST's 16 B-cun leg is its own axis; add it as a working span for the audit only.
if (st35 && st41) byId['st-leg'] = { cunMm: (st35.y - st41.y) / 16 * 1000 };
const placement = [];
for (const [code, ref, cun, spanId, text] of rules) {
  const point = pts.get(code), from = pts.get(ref) ?? (() => { try { return L(ref); } catch { return null; } })();
  if (!point || !from || !byId[spanId]) { placement.push({ code, text, missing: true }); continue; }
  const measured = Math.abs(point.y - from.y) * 1000 / byId[spanId].cunMm;
  placement.push({ code, text, span: spanId, expected: cun, measured: +measured.toFixed(2), error: +(measured - cun).toFixed(2) });
}
for (const [code, cun, spanId, text] of transverse) {
  const point = pts.get(code);
  if (!point) { placement.push({ code, text, missing: true }); continue; }
  const measured = Math.abs(point.x) * 1000 / byId[spanId].cunMm;
  placement.push({ code, text, span: spanId, expected: cun, measured: +measured.toFixed(2), error: +(measured - cun).toFixed(2) });
}

// ---------------------------------------------------------------- output
fs.writeFileSync(path.join(root, 'data/cun-scale.json'), JSON.stringify({
  generated: 'scripts/cun-scale.mjs',
  note: 'WHO 2008 proportional bone (B-cun) spans measured once on this body. cunMm is millimetres per B-cun. Right side; mirror x for the left. Scales differ by direction: a transverse span only measures across the body.',
  spans,
}, null, 1));
const flag = (error, cun) => Math.abs(error) >= Math.max(0.3, cun * 0.1) ? '⚠️' : '';
const lines = [
  '# B-cun audit', '', `Generated by \`scripts/cun-scale.mjs\`. Scale: \`data/cun-scale.json\` (${spans.length} spans).`, '',
  '## Unified spans', '', '| span | B-cun | mm per B-cun | used by |', '| --- | ---: | ---: | --- |',
  ...spans.map((s) => `| ${s.label} | ${s.cun} | ${s.cunMm} | ${s.usedBy.join(', ')} |`), '',
  '## Where scripts measure the same segment differently', '', '| segment | A | B | A vs B |', '| --- | --- | --- | ---: |',
  ...consistency.map((c) => `| ${c.segment} | ${c.a.how}: ${c.a.cunMm} mm | ${c.b.how}: ${c.b.cunMm} mm | ${c.differs} |`), '',
  '## Point placement on the unified scale', '', 'Distance along the span axis (vertical spans) or from the midline (transverse), divided by the unified mm per B-cun. ⚠️ = off by ≥ 0.3 B-cun or ≥ 10 %.', '',
  '| point | rule | expected | measured | error | |', '| --- | --- | ---: | ---: | ---: | --- |',
  ...placement.map((p) => p.missing ? `| ${p.code} | ${p.text} | – | – | – | reference missing |` : `| ${p.code} | ${p.text} | ${p.expected} | ${p.measured} | ${p.error > 0 ? '+' : ''}${p.error} | ${flag(p.error, p.expected)} |`),
];
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/cun-audit.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
