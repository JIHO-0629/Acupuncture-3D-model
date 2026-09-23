// 실측근거 + hazard_priority 시드
// 원칙: 원문(전문 또는 초록)에서 직접 확인한 수치만 넣는다. 확인 못 한 필드는 비운다.
// 소아 연구는 성인 모델 기준이라 제외.

export const HAZARD = {
  // critical: 흉막·중추신경·경동맥처럼 손상 시 중대한 구조가 연구로 확인된 혈
  critical: {
    GB20: 'MRI: 연수 방향 위험구조 (Chou 2015 외)',
    GB21: '흉막(폐첨) — US 3편 + MRI',
    GB22: '흉막 깊이 영상자료 (기존 V열)',
    GB23: '흉막 깊이 영상자료 (기존 V열)',
    GV15: 'MRI: 연수/척수 (Chou 2015, Zhou 2019)',
    GV16: 'MRI/CT/사체: 연수 (Chou 2015, Lin 2013 리뷰)',
    ST9: 'MRI: 경동맥 등 (Chou 2015, 평균 16 mm)',
    ST12: 'Lin 2013 리뷰: 深刺 시 폐 허탈 기록',
    CV15: 'MRI: 방향별 안전깊이 (Cheng 2012)',
    BL11: 'US: 흉막 (Lin 2013 리뷰, BL11–21 12–40 mm)', BL12: 'US: 흉막 (Lin 2013 리뷰)', BL13: 'US/사체: 흉막 (Lin 2013 리뷰)',
    BL14: 'US: 흉막 (Lin 2013 리뷰)', BL15: 'US: 흉막 (Lin 2013 리뷰)', BL16: 'US: 흉막 (Lin 2013 리뷰)',
    BL17: 'US/MRI: 흉막 (Lin 2013 리뷰)', BL18: 'US/MRI: 흉막·간 (Lin 2013 리뷰)', BL19: 'US/MRI: 흉막 (Lin 2013 리뷰)',
    BL20: 'US/MRI: 흉막 (Lin 2013 리뷰)', BL21: 'US: 흉막; MRI: 신장 (Lin 2013, Chen 2022)',
  },
  // high: 신경혈관·복부장기 등 주의가 필요하다고 연구가 분류한 혈
  high: {
    GB24: 'MRI n=20 + KIOM 44혈; KCMRIC 不宜深刺', GB25: 'KIOM 44혈; KCMRIC 不宜深刺', GB30: 'KIOM 44혈; 좌골신경',
    SI14: 'MRI: 위험조직까지 52 mm (Chou 2015)', SI15: 'MRI: 위험조직까지 88 mm (Chou 2015)',
    SI16: 'MRI: 18 mm (Chou 2015)', SI17: 'MRI: 24 mm (Chou 2015)', TE16: 'MRI: 31 mm (Chou 2015)', LI18: 'MRI: 13 mm (Chou 2015)',
    BL22: 'MRI: 신장 (Chen 2022)', BL23: 'MRI: 신장 (Chen 2022)', BL50: 'MRI: 신장 (Chen 2022)', BL51: 'MRI: 신장 (Chen 2022)', BL52: 'MRI: 신장 (Chen 2022)',
    BL40: 'MRI: 슬와동맥 (Hou 2020)', CV12: 'US: 간 관찰 62.7% (Chu 2022)', PC6: 'US: 정중신경 관통 빈번 (Lin 2013 리뷰)',
    BL1: '사체: 안전깊이 80% 기준 (Lin 2013 리뷰)', ST7: '사체: 익구개신경절까지 49.9 mm (Lin 2013 리뷰)', SI18: '사체: 익구개신경절까지 46.6 mm (Lin 2013 리뷰)',
    // Park & Kim 2013 오수혈 US: '주의 자침 필요'군
    ...Object.fromEntries(['LU8', 'LU9', 'LU10', 'LI5', 'ST36', 'ST41', 'SP3', 'HT4', 'HT7', 'HT8', 'SI3', 'SI8', 'KI2', 'KI3', 'KI10', 'KI27', 'GB34', 'GB38', 'LR3', 'LR4']
      .map(p => [p, 'Park 2013 오수혈 US: 주의 자침 필요군'])),
  },
  // normal: 연구에 포함됐지만 주의군이 아닌 혈
  normal: {
    GB41: 'Park 2013 포함, 주의군 아님', GB43: 'Park 2013 포함, 주의군 아님',
    ...Object.fromEntries(['LU11', 'HT9', 'PC9', 'LI1', 'LI2', 'SI1', 'SI2', 'TE1', 'ST45', 'BL66', 'GB44', 'SP1', 'SP2', 'LR1', 'BL67']
      .map(p => [p, 'Park 2013: 뼈까지 얕음 — 문헌 깊이 범위 수정 필요군'])),
  },
};
// ST36은 Choi 2026 근거도 있음
HAZARD.high.ST36 = 'Park 2013 주의군 + Choi 2026: 전경골동맥 HD50 25 mm, TI 1.09';

export function buildMeasurements(vText) {
  const meas = [];
  const M = o => meas.push({
    measurement_id: `M${String(meas.length + 1).padStart(3, '0')}`, point_code: '', technique_id: '', source_id: '', doi: '',
    measure_type: 'hazard', response_definition: '', point_definition_used: '', endpoint_definition: '',
    measurement_axis: '', probe_orientation: '', posture: '', respiratory_phase: '', side: '',
    population: '', subgroup: 'all', n: '', statistic_type: '', value_mm: '', dispersion_type: '', dispersion_mm: '',
    ci_level: '', ci_low_mm: '', ci_high_mm: '', range_low_mm: '', range_high_mm: '',
    ultrasound_device: '', probe_frequency: '', compression_protocol: '', evidence_level: 'imaging', verification: '', notes: '', ...o,
  });

  // --- GB21: Chu 2018 (PMC 전문 확인)
  const chu = {
    point_code: 'GB21', source_id: 'Chu et al. 2018', doi: '10.1155/2018/2308102',
    point_definition_used: 'WHO: midpoint of line C7 spinous process ↔ lateral end of acromion',
    endpoint_definition: 'skin → pleural membrane', measurement_axis: 'vertical to skin',
    probe_orientation: 'vertical to skin, parallel to sagittal plane', side: 'L+R pooled',
    population: 'healthy Korean volunteers 19–32 y', ultrasound_device: 'SonoAce R7 (Samsung Medison)',
    probe_frequency: 'L5-13IS linear', verification: 'PMC 전문 확인 (2026-09-22)',
  };
  M({ ...chu, posture: 'sitting (StP)', respiratory_phase: 'normal', n: 52, statistic_type: 'mean', value_mm: 38.08, dispersion_type: 'SD', dispersion_mm: 6.36, notes: 'Discussion: 전체 38.0±6.36, StP 38.08±6.36. 6.42는 원문에 없음' });
  M({ ...chu, posture: 'prone, arms raised (PPA)', respiratory_phase: 'normal', n: 52, statistic_type: 'mean', value_mm: 40.41, dispersion_type: 'SD', dispersion_mm: 6.67 });
  M({ ...chu, posture: 'prone, arms along trunk (PPB)', respiratory_phase: 'normal', n: 52, statistic_type: 'mean', value_mm: 42.11, dispersion_type: 'SD', dispersion_mm: 6.93, notes: '개인 간 StP↔PPB 차이 최대 19.5 mm' });
  M({ ...chu, posture: '미상 (원문 미명시)', subgroup: 'male', statistic_type: 'mean', value_mm: 42.27, dispersion_type: 'SD', dispersion_mm: 5.71, notes: '어느 자세 기준인지 원문에 없음' });
  M({ ...chu, posture: '미상 (원문 미명시)', subgroup: 'female', statistic_type: 'mean', value_mm: 34.59, dispersion_type: 'SD', dispersion_mm: 4.72, notes: '어느 자세 기준인지 원문에 없음' });
  M({ ...chu, subgroup: 'male', statistic_type: 'mean_CI', ci_level: '99%', ci_low_mm: 39.27, ci_high_mm: 45.27 });
  M({ ...chu, subgroup: 'female', statistic_type: 'mean_CI', ci_level: '99%', ci_low_mm: 32.35, ci_high_mm: 36.60 });
  M({ ...chu, subgroup: 'male', statistic_type: 'author_safe_limit', value_mm: 35, notes: '저자 결론: 20대 남 <35 mm. 측정값 아님' });
  M({ ...chu, subgroup: 'female', statistic_type: 'author_safe_limit', value_mm: 30, notes: '저자 결론: 20대 여 <30 mm. 측정값 아님' });

  // --- GB21: Chen 2018 (초록만)
  const chen = {
    point_code: 'GB21', source_id: 'Chen et al. 2018', doi: '10.1016/j.jams.2018.06.004',
    endpoint_definition: 'skin → pleural line of lung apex', measurement_axis: 'vertical',
    side: 'R and L measured', population: 'Taiwanese adults, median age 29 y',
    verification: '초록만 확인 — 전문 접근 불가(403). 자세·혈위정의·탐촉자 방향·기기 미확인',
  };
  M({ ...chen, subgroup: 'male', n: 41, statistic_type: 'mean', value_mm: 17.4, notes: '남성은 좌우 차이 유의. SD 초록에 없음' });
  M({ ...chen, subgroup: 'female', n: 60, statistic_type: 'mean', value_mm: 14.6 });

  // --- Choi 2026: GB21, ST36 (PMC 전문 확인)
  const choiBase = {
    source_id: 'Choi et al. 2026', doi: '10.1016/j.imr.2026.101305', measurement_axis: 'perpendicular to skin',
    posture: 'semi-seated 45°', side: 'left', population: 'healthy young adults, age 22.3±0.4 y',
    ultrasound_device: 'AcuViz Pocket (FCU)', compression_protocol: 'generous gel, light contact, visual check of no superficial deformation',
    verification: 'PMC 전문 확인 (2026-09-22)',
  };
  const choiResp = {
    measure_type: 'response',
    response_definition: 'adequate_deqi: 첫 지속성 산·중·창·온·방산감, 날카로운 통증 제외; 0.3 cm 단위 전진 + 1 Hz 180° 염전 3 s',
    endpoint_definition: 'needle insertion depth at de-qi onset', probe_orientation: 'n/a (실제 직자)',
    notes: '침 40 mm × 0.30 mm. 위험깊이 전 무반응자는 최대 삽입깊이로 censoring 포함',
  };
  for (const [pt, endpoint, probe, hd50, ed50, hdM, hdF, edM, edF] of [
    ['GB21', 'skin → pleural membrane', 'perpendicular to skin, parallel to sagittal plane', 37, 24, [40.2, 0.9], [35.5, 0.5], [26.4, 1.7], [25.2, 1.6]],
    ['ST36', 'skin → anterior tibial artery', 'perpendicular to skin, parallel to horizontal plane', 25, 23, [25.0, 0.5], [23.5, 0.5], [23.3, 0.9], [21.7, 0.9]],
  ]) {
    const b = { ...choiBase, point_code: pt, point_definition_used: pt === 'GB21' ? 'WHO: midpoint C7 spinous process ↔ lateral end of acromion' : 'WHO: 3 B-cun inferior to ST35 on ST35–ST41 line' };
    M({ ...b, endpoint_definition: endpoint, probe_orientation: probe, n: 39, statistic_type: 'HD50 (median)', value_mm: hd50 });
    M({ ...b, endpoint_definition: endpoint, probe_orientation: probe, subgroup: 'male', n: 19, statistic_type: 'mean', value_mm: hdM[0], dispersion_type: 'SE', dispersion_mm: hdM[1] });
    M({ ...b, endpoint_definition: endpoint, probe_orientation: probe, subgroup: 'female', n: 20, statistic_type: 'mean', value_mm: hdF[0], dispersion_type: 'SE', dispersion_mm: hdF[1] });
    M({ ...b, ...choiResp, technique_id: `${pt}-A`, n: 39, statistic_type: 'ED50 (median)', value_mm: ed50 });
    M({ ...b, ...choiResp, technique_id: `${pt}-A`, subgroup: 'male', n: 19, statistic_type: 'mean', value_mm: edM[0], dispersion_type: 'SE', dispersion_mm: edM[1] });
    M({ ...b, ...choiResp, technique_id: `${pt}-A`, subgroup: 'female', n: 20, statistic_type: 'mean', value_mm: edF[0], dispersion_type: 'SE', dispersion_mm: edF[1] });
  }

  // --- Chou 2015: 경부·견부 11혈 MRI n=394 (초록 확인, cm → mm)
  const chou = {
    source_id: 'Chou et al. 2015', doi: '10.1136/bmjopen-2015-007819', point_definition_used: 'WHO standard',
    endpoint_definition: 'skin → 합병증을 일으킬 수 있는 첫 조직 (원문: any tissues that would cause possible/severe complications)',
    population: 'Taiwan single center, all BMI/sex pooled', n: 394, statistic_type: 'mean',
    verification: '초록 확인 (cm 단위 → mm). 혈별 위험조직 이름·자세는 전문 확인 필요',
  };
  for (const [pt, cm] of [['GB21', 5.6], ['SI14', 5.2], ['SI15', 8.8], ['GV15', 4.9], ['GV16', 4.6], ['GB20', 5.0], ['ST9', 1.6], ['SI16', 1.8], ['SI17', 2.4], ['TE16', 3.1], ['LI18', 1.3]])
    M({ ...chou, point_code: pt, value_mm: Math.round(cm * 100) / 10 });

  // --- Zhou 2019: GV15 MRI, 정상군 n=207 (초록 확인)
  const zhou = {
    point_code: 'GV15', source_id: 'Zhou et al. 2019', doi: '10.13703/j.0255-2930.2019.06.014', statistic_type: 'safety_depth_mean',
    population: '정상 해부 구조, 중등도 체격 (정상군 n=207)', endpoint_definition: 'safety depth (정의는 전문 확인 필요)',
    verification: '초록 확인. 중국어 원문', notes: '환축추 탈구군(n=177)은 해부 변형이라 제외',
  };
  M({ ...zhou, subgroup: 'male', measurement_axis: 'perpendicular', value_mm: 47.72, dispersion_type: 'SD', dispersion_mm: 5.06 });
  M({ ...zhou, subgroup: 'male', measurement_axis: 'oblique', value_mm: 42.69, dispersion_type: 'SD', dispersion_mm: 5.53 });
  M({ ...zhou, subgroup: 'female', measurement_axis: 'perpendicular', value_mm: 44.63, dispersion_type: 'SD', dispersion_mm: 5.85 });
  M({ ...zhou, subgroup: 'female', measurement_axis: 'oblique', value_mm: 39.88, dispersion_type: 'SD', dispersion_mm: 6.18 });

  // --- Cheng 2012: CV15 MRI n=10, 방향별 안전깊이 (초록 확인)
  const cheng = {
    point_code: 'CV15', source_id: 'Cheng et al. 2012', doi: '', statistic_type: 'safety_depth_mean', n: 10, population: 'healthy adults',
    endpoint_definition: 'safe depth (정의는 전문 확인 필요)', verification: '초록 확인 (PMID 22741258). 각도 기준면 원문 확인 필요',
  };
  for (const [axis, v, sd] of [['perpendicular', 16.99, 2.86], ['45° downward', 22.72, 5.35], ['45° upward', 24.61, 2.92], ['15° downward', 53.47, 5.72],
    ['15° upward', 25.76, 2.61], ['45° to the right', 24.89, 4.34], ['45° to the left', 21.79, 3.84]])
    M({ ...cheng, measurement_axis: axis, value_mm: v, dispersion_type: 'SD', dispersion_mm: sd });

  // --- Hou 2020: BL40 MRI n=124 (초록 확인)
  const hou = {
    point_code: 'BL40', source_id: 'Hou et al. 2020', doi: '10.1177/0964528420958714', point_definition_used: 'WHO standard',
    endpoint_definition: 'popliteal artery 거리의 70% (저자 정의 safe depth)', statistic_type: 'safe_depth_70pct_mean',
    population: 'clinical knee MRI patients', verification: '초록 확인', notes: '측정값이 아니라 동맥까지 거리 × 0.7',
  };
  M({ ...hou, n: 124, value_mm: 18.51, dispersion_type: 'SD', dispersion_mm: 3.56 });
  M({ ...hou, subgroup: 'low/normal BMI', value_mm: 17.24, dispersion_type: 'SD', dispersion_mm: 3.14 });
  M({ ...hou, subgroup: 'overweight', value_mm: 18.76, dispersion_type: 'SD', dispersion_mm: 2.90 });
  M({ ...hou, subgroup: 'obese', value_mm: 22.01, dispersion_type: 'SD', dispersion_mm: 3.71 });
  M({ ...hou, statistic_type: 'author_safe_limit', value_mm: 12.5, notes: '저자 권고: 직자 시 25 mm 침으로 약 12.5 mm (BMI>28이면 17.5 mm)' });

  // --- Chu 2022: CV12 US n=83 (초록 확인)
  M({
    point_code: 'CV12', source_id: 'Chu et al. 2022', doi: '10.3390/healthcare10091707', n: 83, population: 'healthy volunteers',
    endpoint_definition: 'allowable needle insertion range (ANIR) — 장기(간 등) 전까지', statistic_type: 'mean', value_mm: 25.3, dispersion_type: 'SD', dispersion_mm: 10.2,
    verification: '초록 확인 — 초록에 단위 표기 없음, mm로 추정. 전문 확인 필요', notes: '간이 영상에 보인 비율 62.7%; 여성이 더 두꺼움',
  });

  // --- Lin 2013 리뷰 인용값 (1차 문헌 미확인)
  const lin = { source_id: 'Lin et al. 2013 (review)', doi: '10.1155/2013/740508', evidence_level: 'review-cited', verification: '리뷰 본문 인용값 — 1차 문헌 미확인' };
  for (const [src, lo, hi] of [['MRI', 27.05, 45.55], ['CT', 27.73, 33.39], ['cadaver', 43.46, 57.42]])
    M({ ...lin, point_code: 'GV16', statistic_type: 'suggested_safe_depth_range', range_low_mm: lo, range_high_mm: hi, notes: `측정도구: ${src}` });
  M({ ...lin, point_code: 'GV16', statistic_type: 'suggested_safe_depth', value_mm: 40.08, notes: '측정도구: cadaver' });
  M({ ...lin, point_code: 'ST7', endpoint_definition: 'skin → sphenopalatine ganglion', statistic_type: 'mean', value_mm: 49.9, evidence_level: 'review-cited (cadaver)', notes: '자침 방향에 따라 변함' });
  M({ ...lin, point_code: 'SI18', endpoint_definition: 'skin → sphenopalatine ganglion', statistic_type: 'mean', value_mm: 46.6, evidence_level: 'review-cited (cadaver)', notes: '자침 방향에 따라 변함' });
  M({ ...lin, point_code: 'PC6', measure_type: 'hazard', endpoint_definition: 'needle tip ↔ median nerve 거리 (Streitberger)', statistic_type: 'mean', value_mm: 1.8, dispersion_type: 'SD', dispersion_mm: 2.2, range_low_mm: 0, range_high_mm: 11.3, notes: '정중신경 관통이 흔했으나 신경학적 후유증 없음' });
  for (let i = 11; i <= 21; i++)
    M({ ...lin, point_code: `BL${i}`, endpoint_definition: 'needling depth (Lian, US)', statistic_type: 'range_over_BL11-21', range_low_mm: 12, range_high_mm: 40, notes: 'BL11–BL21 11혈 통합 범위 — 혈별 값 아님' });

  // --- Park & Kim 2013 / 기존 V열 수치 (원문 재확인 필요)
  const park = { source_id: 'Park & Kim 2013', doi: '10.1016/j.ctim.2013.08.003', ultrasound_device: 'colour Doppler US', point_definition_used: 'WHO 위치에 펜 표시', verification: '값은 기존 V열 출처. 초록에 수치 없음 — 전문 확인 필요' };
  M({ ...park, point_code: 'GB38', endpoint_definition: '혈관/신경 (구조명 원문 미확인)', statistic_type: 'mean', value_mm: 22.7, range_low_mm: 18.8, range_high_mm: 24.8 });
  M({ ...park, point_code: 'GB34', endpoint_definition: '혈관/신경 (구조명 원문 미확인)', statistic_type: 'mean', value_mm: 21.2, range_low_mm: 18.6, range_high_mm: 23.4 });
  M({ ...park, point_code: 'GB44', endpoint_definition: 'skin → bone', statistic_type: 'mean', value_mm: 2.7, range_low_mm: 2.5, range_high_mm: 2.8 });
  for (const pt of ['GB20', 'GB22', 'GB23', 'GB24'])
    if (vText[pt]) M({ point_code: pt, source_id: '기존 V열 (출처 V열 참조)', statistic_type: 'text_only', evidence_level: 'imaging', verification: '기존 V열 문구 그대로 — 수치 분해·원문 재확인 필요', notes: vText[pt] });
  M({ point_code: 'GB30', source_id: 'Kim et al. 2017', doi: '10.1016/j.imr.2017.09.003', statistic_type: 'image_only', population: 'n=85 (KIOM·원광대 고위험 44혈)', verification: '전문 확인 — 깊이 미측정 연구(해부 영상 확보 목적)', notes: '44혈 목록은 표로만 제공되어 확인 못 함' });
  return meas;
}
