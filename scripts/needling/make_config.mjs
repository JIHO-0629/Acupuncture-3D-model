import fs from 'fs';
const d = JSON.parse(fs.readFileSync('sheet_data.json', 'utf8'));
const toRows = (objs, headers) => [headers, ...objs.map(o => headers.map(h => o[h] ?? ''))];
const today = '2026-09-22';
const cfg = {
  source: 'C:/Users/jiho3/Documents/Codex/outputs/bodypart3d-landmarks/경혈_데이터_405_WHO_해부학검수_BodyParts3D정리.xlsm',
  output: 'C:/Users/jiho3/Documents/Codex/outputs/needling-sim/경혈_데이터_405_WHO_해부학검수_자침.xlsm',
  mainSheet: '경혈 405', critSheet: '검수기준',
  sUpdates: d.log.map(l => [l.row, l.raw_new]),
  sheets: [
    { name: '자침법', rows: toRows(d.tech, Object.keys(d.tech[0])) },
    { name: '실측근거', rows: toRows(d.meas, Object.keys(d.meas[0])) },
    { name: '모델경로', rows: fs.existsSync('model_paths_all.json') ? toRows(JSON.parse(fs.readFileSync('model_paths_all.json', 'utf8')).rows, d.MODEL_HEADERS) : [d.MODEL_HEADERS] },
    { name: '변경기록', rows: [['date', 'sheet', 'row', 'WHO', 'column', 'old_value', 'new_value', 'reason'],
      ...d.log.map(l => [today, '경혈 405', l.row, l.point_code, 'S', l.raw_old, l.raw_new, 'S열 = KCMRIC 침구법 원문 그대로. T열 판정은 옛 S 기준이라 재평가 필요'])] },
  ],
  criteria: [
    ['자침 시뮬레이션 데이터', '2026-09-22 합의안 (프로토타입 GB21·GB30·GB38 → ⑧ 통과 시 스키마 동결)', ''],
    ['S열 자침법 RAW', 'KCMRIC 침구법 원문을 가공 없이 저장. 파싱은 자침법 시트에서만', '361혈 2026-09-22 수집 (KCMRIC 인용, 비상업 연구용). 옛 값은 변경기록 시트'],
    ['자침법 시트', '한 행 = 혈 × 자침법 (예: GB38-A 直刺, GB38-B 斜刺)', 'hazard_priority는 technique 단위; expected_anatomy는 critical/high만 필수'],
    ['실측근거 시트', '한 행 = 논문의 특정 측정조건 × 특정 통계값', 'evidence_level은 레코드 단위; technique_id는 직접 대응될 때만'],
    ['모델경로 시트', '한 행 = 자침법 × raycast로 만난 한 조직층', 'model/mesh/pose/좌표/raycast 버전 필수'],
    ['자입 寸 해석', 'cun_unit_semantics = unspecified. mm는 conversion_method + conversion_version 달린 파생값만', 'B-cun·F-cun·동신촌 중 기본값 미확정 — 프로토타입에서 비교'],
    ['판정 문구', '안전/위험 판정을 출력하지 않음. clearance·겹침·자세 불일치 같은 사실만', 'model distance ≠ safe depth'],
    ['ED50 명칭', 'measure_type = response, response_definition = adequate_deqi', '임상 효과 깊이로 표기 금지'],
    ['경외기혈', '자침 시뮬레이션 범위 제외 (위치만 유지)', ''],
    ['hazard_priority 근거', 'critical/high/normal은 evidence.mjs의 논문 근거 + KCMRIC 원문 주의문구(不宜深刺·동맥 회피 등)', 'unassessed = 연구·주의문구 없음. 안전하다는 뜻 아님'],
    ['기본 원칙', '별도 검증자료가 없으면 KCMRIC 기준. 영상·사체 연구가 뚜렷한 혈만 실측근거 추가', ''],
  ],
};
fs.writeFileSync('excel_config.json', JSON.stringify(cfg));
console.log(cfg.sheets.map(s => s.name + ':' + s.rows.length + 'x' + s.rows[0].length).join(' '));
