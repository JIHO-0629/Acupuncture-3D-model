// ⓪~③: KCMRIC RAW(14경맥 361혈) → 자침법 행 파싱, 실측근거, 모델경로 헤더
import fs from 'fs';
import JSZip from 'jszip';
import { HAZARD, buildMeasurements } from './evidence.mjs';

const BASE = '../bodypart3d-landmarks/경혈_데이터_405_WHO_해부학검수_BodyParts3D정리.xlsm';
const MERIDIANS = ['LU', 'LI', 'ST', 'SP', 'HT', 'SI', 'BL', 'KI', 'PC', 'TE', 'GB', 'LR', 'GV', 'CV'];
const FETCHED = MERIDIANS.flatMap(m => JSON.parse(fs.readFileSync(`kcmric_raw_${m}.json`, 'utf8')));
// GB는 fallback 없던 첫 수집본이라 GB28만 수동 확인값으로 채움
const gb28 = FETCHED.find(r => r.code === 'GB28');
if (!gb28.raw) { gb28.raw = '- 直刺 0.5～0.8寸\n- 斜刺 0.5～1寸'; gb28.note = 'KCMRIC 페이지에 침구법 제목(h6) 누락, 본문 블록에서 추출'; }

// 렌더링 전용 기본각 (surface normal 기준). 근거 데이터 아님
const RENDER = { perpendicular: 0, oblique: 45, transverse: 75, pricking_bleeding: 0, contraindicated: '' };
const RANGE = /(\d+(?:\.\d+)?)\s*寸?\s*～\s*(\d+(?:\.\d+)?)\s*寸/g;
const SINGLE = /(?<![\d.～])(\d+(?:\.\d+)?)\s*寸/;
// 원문 혈명 → 코드 (透刺·방향 대상 해석용)
const NAME2CODE = {
  太陽: 'EX-HN5', 魚腰: 'EX-HN4', 印堂: 'EX-HN3', 內膝眼: 'EX-LE4', 三陰交: 'SP6', 湧泉: 'KI1', 勞宮: 'PC8', 後谿: 'SI3',
  合谷: 'LI4', 少海: 'HT3', 內關: 'PC6', 外關: 'TE5', 懸鍾: 'GB39', 陽陵泉: 'GB34', 陰陵泉: 'SP9', 頰車: 'ST6', 迎香: 'LI20',
  解谿: 'ST41', 肩髃: 'LI15', 地倉: 'ST4', 攢竹: 'BL2', 絲竹空: 'TE23', 睛明: 'BL1', 風池: 'GB20', 百會: 'GV20', 崑崙: 'BL60',
  太谿: 'KI3', 丘墟: 'GB40', 照海: 'KI6', 申脈: 'BL62', 間使: 'PC5', 支溝: 'TE6', 曲池: 'LI11', 足三里: 'ST36', 承山: 'BL57',
  天突: 'CV22', 膻中: 'CV17', 中脘: 'CV12', 臍中: 'CV8', 神闕: 'CV8', 下關: 'ST7', 翳風: 'TE17', 聽宮: 'SI19', 率谷: 'GB8',
};
const AXIS = [
  [/上向|上方|向上|위쪽|위를|위로|上으로/, 'superior'], [/下方|아래|下向|下部/, 'inferior'], [/後方|뒤를|뒤쪽|後斜方/, 'posterior'],
  [/前方|앞쪽|前內方/, 'anterior'], [/外方|外側|바깥/, 'lateral'], [/內側|안쪽|內方/, 'medial'],
];

// 뜸 문장 (문헌명 '鍼灸甲乙經'의 灸는 제외)
const isMoxa = t => /艾|壯|^禁灸|^灸/.test(t) && !/刺|鍼/.test(t);
const isProhibition = t => (/^(不宜|不可|宜)/.test(t) || /禁深刺/.test(t)) && !/寸/.test(t);
const hasTechnique = t => /刺|點刺|出血|禁鍼|사자|직자|횡자/.test(t) && !isProhibition(t) && !isMoxa(t);

function classify(t) {
  if (/三稜鍼|點刺出血|出血시키/.test(t)) return 'pricking_bleeding';
  if (/橫刺|횡자/.test(t)) return 'transverse';
  if (/斜刺|사자|비스듬히|斜向|斜方/.test(t)) return 'oblique';
  if (/直刺|직자/.test(t)) return 'perpendicular';
  if (/^禁鍼/.test(t)) return 'contraindicated';
  return 'unspecified';
}

function direction(t) {
  const paren = (t.match(/\(([^)]*)\)/) || [])[1] || '';
  const text = /향|向|쪽으로|方으로|沿해|透刺/.test(t) ? t : '';
  const code = (t.match(/\(([A-Z]{2}\d{1,2})\)/) || [])[1];
  const named = Object.keys(NAME2CODE).find(n => t.includes(n));
  const target = code ? `${named || ''} (${code})`.trim() : named ? `${named} (${NAME2CODE[named]})` : '';
  const axes = AXIS.filter(([re]) => re.test(t)).map(([, a]) => a);
  let ref = '';
  if (target && axes.length) ref = 'anatomical_axis+landmark';
  else if (target) ref = 'landmark';
  else if (axes.length) ref = 'anatomical_axis';
  else if (text) ref = 'landmark(미해석)';
  return { ref, axis: axes.join('+'), target, text: text ? (paren || t) : '' };
}

const HAZ = Object.fromEntries(Object.entries(HAZARD).flatMap(([lvl, m]) => Object.entries(m).map(([p, b]) => [p, [lvl, b]])));
const CAUTION_RE = /禁深刺|腎臟|不宜深刺|不可深刺|不宜過深刺|禁刺|氣胸|肺尖|肺가|動脈을 피|동맥을 피|목동맥|혈관, 신경/;

const tech = [], log = [];
for (const r of FETCHED) {
  // 줄바꿈으로 끊긴 문장 이어붙이기 ('-'로 시작하지 않는 줄은 앞 항목에 합침)
  const items = [];
  for (const l of (r.raw || '').split('\n').filter(Boolean)) {
    if (l.startsWith('-') || !items.length) items.push(l.replace(/^-\s*/, '').trim());
    else items[items.length - 1] += ' ' + l.trim();
  }
  // 한 항목 안의 ' / ' 구분 문장은 별도 항목으로
  for (let i = items.length - 1; i >= 0; i--) if (items[i].includes(' / ')) items.splice(i, 1, ...items[i].split(' / ').map(x => x.trim()));
  let techLines = items.filter(hasTechnique);
  // 역사 문헌 인용(『』)의 禁鍼은 다른 자침법이 있으면 주석으로
  techLines = techLines.filter(t => !(/『|「|明堂/.test(t) && /禁/.test(t) && techLines.some(o => o !== t && !/禁/.test(o))));
  // 임신·조건부 금침, 부작용 서술은 주석
  techLines = techLines.filter(t => !/孕婦|임신|若鍼|신중히 자침|피하여 刺入$/.test(t) || /\d\s*寸/.test(t));
  const notes = items.filter(t => !techLines.includes(t));
  const pointCaution = notes.join(' / ');
  const [hp0, hb0] = HAZ[r.code] || ['unassessed', ''];
  const cautionHit = CAUTION_RE.test(r.raw || '');
  const hp = hp0 === 'unassessed' && cautionHit ? 'high' : hp0;
  const hb = [hb0, cautionHit ? 'KCMRIC 원문 주의문구' : ''].filter(Boolean).join('; ');

  let seq = 0;
  if (!techLines.length) techLines = [''];
  for (const t of techLines) {
    const cls = t ? classify(t) : 'unparsed';
    const ranges = [...t.matchAll(RANGE)];
    const single = !ranges.length && t.match(SINGLE);
    const dir = direction(t);
    const cond = (t.match(/^(.{2,30}?)(?:치료시|치료 시|時에는|時는|時\s)/) || [])[1] || '';
    const mods = [/沿皮刺/.test(t) && '沿皮刺', /透刺/.test(t) && '透刺', /不宜深刺|不可深刺|不宜過深刺|禁深刺/.test(t) && '不宜深刺', /留\d呼/.test(t) && t.match(/留\d呼/)[0]].filter(Boolean).join(', ');
    const parts = ranges.length ? ranges.map(m => [+m[1], +m[2]]) : single ? [[+single[1], +single[1]]] : [null];
    const aimed = cls === 'perpendicular' && (dir.target || dir.axis || dir.text);
    parts.forEach((d, k) => {
      const flags = [];
      if (ranges.length > 1) flags.push(`원문 '또는' 대안 범위 ${k + 1}/${ranges.length}로 분할`);
      if (single) flags.push('단일값 (min=max)');
      if (cond) flags.push(`조건부 자침: ${cond}`);
      if (/입을 벌리고|주먹을 쥐고|팔꿈치를 굽혀|仰臥位/.test(t)) flags.push('자세 조건 있음');
      if (aimed) flags.push('直刺인데 방향 대상 명시 — 법선 0° 확정 보류');
      if (cls === 'unspecified') flags.push('자침 종류 미기재');
      if ([/直刺/, /斜刺/, /橫刺/].filter(re => re.test(t)).length > 1) flags.push('한 문장에 자침 종류 여러 개');
      if (/\d+\s*°/.test(t)) flags.push('원문에 각도 명시 — 기준면 확인');
      if (/\d\s*分/.test(t)) flags.push('分 단위 표현 포함');
      if (dir.text && !dir.target && !dir.axis) flags.push('방향 원문 미해석');
      if (dir.ref === 'anatomical_axis+landmark' || /沿해|骨膜을 따라/.test(t)) flags.push('방향 복합 표현');
      if (cls === 'pricking_bleeding') flags.push('깊이 없음(點刺)');
      if (cls === 'contraindicated') flags.push('KCMRIC: 禁鍼');
      if (!t) flags.push(/艾|壯/.test(r.raw || '') ? 'KCMRIC 침구법에 뜸만 있음 — 자침법 없음' : 'KCMRIC에 자침법 문장 없음');
      if (r.note) flags.push(r.note);
      const review = !t || cls === 'unspecified' || aimed || flags.some(f => /미해석|복합|조건부|자세 조건|여러 개|각도|分 단위/.test(f));
      tech.push({
        technique_id: `${r.code}-${String.fromCharCode(65 + seq++)}`, point_code: r.code, technique_seq: seq,
        raw_line: t,
        direction_class: cls,
        technique_modifier: mods,
        condition_text: cond,
        depth_cun_min: d ? d[0] : '', depth_cun_max: d ? d[1] : '',
        cun_unit_semantics: d ? 'unspecified' : '',
        angle_from_surface_normal_deg: cls === 'perpendicular' && !aimed ? 0 : '',
        render_default_angle_deg: RENDER[cls] ?? '',
        direction_reference: dir.ref, direction_axis: dir.axis, direction_target: dir.target, direction_text_raw: dir.text,
        point_caution_raw: pointCaution,
        hazard_priority: hp, hazard_basis: hb,
        expected_anatomy: '', expected_anatomy_required: ['critical', 'high'].includes(hp) ? 'Y' : '',
        target_structure: '',
        parse_status: review ? 'review' : 'auto',
        parse_note: flags.join(' / '),
        source_url: r.url, fetched_at: r.fetched.slice(0, 10),
      });
    });
  }
  log.push({ point_code: r.code, raw_new: r.raw || '' });
}

const MODEL_HEADERS = ['model_id', 'model_version', 'mesh_version', 'model_pose_id', 'point_code', 'technique_id',
  'point_coordinate_version', 'ray_origin_xyz', 'ray_direction_xyz', 'raycast_version',
  'conversion_method', 'conversion_version', 'depth_mm_estimated_min', 'depth_mm_estimated_max',
  'layer_order', 'structure_id', 'structure_name', 'structure_type', 'entry_mm', 'exit_mm', 'mesh_available', 'notes'];

// 기존 S·V열 값
const z = await JSZip.loadAsync(fs.readFileSync(BASE));
const ss = await z.file('xl/sharedStrings.xml').async('string');
const strs = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join(''));
const sh = await z.file('xl/worksheets/sheet1.xml').async('string');
const cells = {};
for (const m of sh.matchAll(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
  const v = (m[4] || '').match(/<v>([\s\S]*?)<\/v>/);
  const is = (m[4] || '').match(/<t[^>]*>([\s\S]*?)<\/t>/);
  cells[m[1] + m[2]] = /t="s"/.test(m[3]) && v ? strs[+v[1]] : is ? is[1] : v ? v[1] : '';
}
const un = s => (s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/_x000D_/g, '');
const vText = {};
for (let row = 2; row <= 406; row++) {
  const code = cells['J' + row];
  const e = log.find(l => l.point_code === code);
  if (e) { e.row = row; e.raw_old = un(cells['S' + row]); }
  if (cells['V' + row]) vText[code] = un(cells['V' + row]);
}
const meas = buildMeasurements(vText);

fs.writeFileSync('sheet_data.json', JSON.stringify({ tech, meas, MODEL_HEADERS, log: log.filter(l => l.raw_new !== l.raw_old) }, null, 1));
const cnt = k => Object.entries(tech.reduce((a, t) => (a[t[k]] = (a[t[k]] || 0) + 1, a), {})).map(([a, b]) => `${a}:${b}`).join(' ');
console.log('points', FETCHED.length, '| techniques', tech.length, '| S rows matched', log.filter(l => l.row).length, '| S changed', log.filter(l => l.raw_new !== l.raw_old).length);
console.log('class', cnt('direction_class'));
console.log('status', cnt('parse_status'));
console.log('hazard(points)', Object.entries(tech.reduce((a, t) => (a[t.hazard_priority] ??= new Set(), a[t.hazard_priority].add(t.point_code), a), {})).map(([a, b]) => `${a}:${b.size}`).join(' '));
console.log('measurements', meas.length, 'points', new Set(meas.map(m => m.point_code)).size);
