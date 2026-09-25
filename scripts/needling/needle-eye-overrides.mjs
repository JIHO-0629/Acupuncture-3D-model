/**
 * Anatomy corrections to the Needle's-eye structure lists (2026-09-25 audit).
 * Each change names its reason and references (ids in needle-eye-refs.mjs). The reviewed
 * paths in path-spec.mjs are left untouched; these rules act only on the Needle's-eye view.
 *
 * remove: regex tested against "ko en" of a structure
 * add.near: atlas part regex; the builder measures the structure from the reviewed ray
 * add.concept: a structure the atlas has no mesh for; it is listed but never placed on the plot
 * notes: per-structure anatomy note keyed by regex
 */

export const EXCLUDE_POINTS = {
  ST17: { why: 'KCMRIC 원문이 禁鍼(『鍼灸甲乙經』)이다. 乳中은 자침하지 않는 표지점이다.', refs: ['kcmric'] },
};

const sacrumBlocks = {
  remove: /sciatic|궁둥신경/i,
  why: '경로가 엉치뼈 뒷면에서 멈춘다. 궁둥신경은 엉치뼈 앞(골반 안)과 큰궁둥구멍 아래에 있어 이 경로로 닿지 않는다.',
  refs: ['peuker3'],
};
const sacralForamen = {
  ko: '엉치신경(뒤엉치뼈구멍 속)', en: 'Sacral spinal nerve in the posterior sacral foramen', kind: 'nerve',
  note: 'KCMRIC 원문 "刺入仙骨後孔內". 뒤엉치뼈구멍을 지나면 엉치신경에 닿는다. 모델에는 엉치신경 메시가 없어 위치를 표시하지 않는다.',
  refs: ['kcmric', 'peuker3'],
};
const pleuraConcept = (note, refs = []) => ({
  ko: '흉막·허파 (기흉 위험)', en: 'Pleura / lung', kind: 'boundary', note, refs: ['orahilly22', 'peuker2', ...refs],
});

/**
 * Points added on 2026-09-25 (Jiho: "1번만 진행"). They have no reviewed path yet, so the
 * builder uses the viewer's default straight path (skin normal, documented depth, first bone)
 * and keeps a structure only if its mesh comes within 10 mm of that ray.
 */
const wristUlnar = (why) => ({ region: 'wrist', why, refs: ['spGuyon', 'spUlnarArtery', 'spUlnarNerve'],
  add: { near: [
    { match: '^Right ulnar artery$', ko: '자동맥', en: 'Ulnar artery', refs: ['spUlnarArtery', 'spGuyon'] },
    // Z-Anatomy's ulnar nerve trunk stops above the wrist; its superficial and deep branches carry it on.
    { match: '^Right (Ulnar nerve|Superficial branch of ulnar nerve|Deep branch of ulnar nerve)$', ko: '자신경', en: 'Ulnar nerve', refs: ['spUlnarNerve', 'spGuyon'],
      note: '손목 부위는 Z-Anatomy 자신경 얕은가지·깊은가지 메시로 측정했다.' },
  ] } });
export const EXTRA_POINTS = {
  LU8: { region: 'wrist', why: 'KCMRIC 원문 "刺鍼時 노동맥(radial artery)을 피하여 刺入". 손목 노쪽 동맥 박동부 옆이다. Park & Kim 2013 주의 자침군.',
    refs: ['kcmric', 'parkKim2013', 'spForearmArteries'],
    add: { near: [
      { match: '^Right radial artery$', ko: '노동맥', en: 'Radial artery', refs: ['kcmric', 'spForearmArteries', 'parkKim2013'] },
      { match: '^Right Superficial branch of radial nerve$', ko: '노신경 얕은가지', en: 'Superficial branch of radial nerve', refs: ['spRadialNerve'] },
    ] } },
  LU9: { region: 'wrist', notes: [[/radial artery|노동맥/i, '재검수 필요: 뷰어 기본 경로가 큰마름뼈(11.9 mm)에 막히고, 노동맥이 그 뒤로 계산된다. 원문 방향(손바닥쪽 → 손등쪽)과 혈 위치를 검수해야 한다.']], why: '太淵은 손목주름 노쪽의 노동맥 박동부이다. KCMRIC 원문 "손바닥쪽에서 손등쪽을 향해 刺入". Park & Kim 2013 주의 자침군.',
    refs: ['kcmric', 'parkKim2013', 'spForearmArteries'],
    add: { near: [
      { match: '^Right radial artery$', ko: '노동맥', en: 'Radial artery', refs: ['spForearmArteries', 'parkKim2013'] },
      { match: '^Right Superficial branch of radial nerve$', ko: '노신경 얕은가지', en: 'Superficial branch of radial nerve', refs: ['spRadialNerve', 'spSnuffbox'] },
    ] } },
  HT4: wristUlnar('자쪽손목굽힘근 힘줄 노쪽으로 자동맥·자신경이 나란히 내려간다. Park & Kim 2013 주의 자침군.'),
  HT5: wristUlnar('자쪽손목굽힘근 힘줄 노쪽으로 자동맥·자신경이 나란히 내려간다.'),
  HT6: wristUlnar('자쪽손목굽힘근 힘줄 노쪽으로 자동맥·자신경이 나란히 내려간다.'),
  HT7: wristUlnar('神門은 콩알뼈 노쪽의 손목주름으로, 자동맥·자신경이 Guyon관으로 들어가는 곳이다. Park & Kim 2013 주의 자침군.'),
  PC7: { region: 'wrist', why: '大陵은 손목굴 입구로, 정중신경이 굽힘근지지띠 바로 아래를 지난다. PC6 초음파에서 정중신경 관통이 흔했다(Lin 2013).',
    refs: ['spMedianNerve', 'lin2013'],
    add: { near: [{ match: '^Right Median nerve$', ko: '정중신경', en: 'Median nerve', refs: ['spMedianNerve', 'lin2013'] }] } },
  ST41: { region: 'ankle', why: '解谿는 발목 앞 긴엄지폄근·긴발가락폄근 힘줄 사이로, 앞정강동맥이 발등동맥으로 이어지고 깊은종아리신경이 함께 지난다. Park & Kim 2013 주의 자침군.',
    refs: ['spDorsalisPedis', 'spDeepFibular', 'parkKim2013'],
    add: { near: [
      { match: '^Right dorsalis pedis artery$', ko: '발등동맥', en: 'Dorsalis pedis artery', refs: ['spDorsalisPedis', 'parkKim2013'] },
      { match: '^Right anterior tibial artery$', ko: '앞정강동맥', en: 'Anterior tibial artery', refs: ['spDorsalisPedis'] },
      { match: '^Right Deep fibular nerve$', ko: '깊은종아리신경', en: 'Deep fibular nerve', refs: ['spDeepFibular'] },
    ] } },
  LI5: { region: 'wrist', why: '陽谿는 해부코담배갑으로, 노동맥과 노신경 얕은가지가 지난다. Park & Kim 2013 주의 자침군.',
    refs: ['spSnuffbox', 'parkKim2013'],
    add: { near: [
      { match: '^Right radial artery$', ko: '노동맥', en: 'Radial artery', refs: ['spSnuffbox', 'parkKim2013'] },
      { match: '^Right Superficial branch of radial nerve$', ko: '노신경 얕은가지', en: 'Superficial branch of radial nerve', refs: ['spSnuffbox', 'spRadialNerve'] },
    ] } },
};

export const OVERRIDES = {
  // --- relevance: structures the ray cannot reach, or regex mismatches
  BL23: { remove: /obturator|femoral nerve|폐쇄신경|넙다리신경/i,
    why: '셋째허리뼈(66 mm) 너머의 허리신경얼기 가지이다. 직자 경로의 위험장기는 콩팥이다.', refs: ['spKidneys', 'peuker2'] },
  BL52: { remove: /genitofemoral|femoral nerve|음부넙다리|넙다리신경/i,
    why: '"femoral nerve" 정규식이 음부넙다리신경과 매칭되었고, 모두 66–74 mm 뼈 너머에 있다. 志室의 위험은 콩팥이다(KCMRIC 禁深刺).', notes: [[/kidney|콩팥/i, 'KCMRIC 원문 "禁深刺".']], refs: ['spKidneys', 'kcmric'] },
  BL27: sacrumBlocks, BL28: sacrumBlocks, BL29: sacrumBlocks, BL30: sacrumBlocks,
  BL31: { ...sacrumBlocks, add: { concept: [sacralForamen] } },
  BL32: { add: { concept: [sacralForamen] } },
  BL33: { ...sacrumBlocks, add: { concept: [sacralForamen] } },
  BL34: { ...sacrumBlocks, why: '궁둥신경은 경로에서 30 mm 떨어져 있어 관련 구조가 아니다.', add: { concept: [sacralForamen] } },
  BL35: { remove: /sciatic|궁둥신경/i, why: '궁둥신경은 경로에서 47 mm 떨어져 있다. 꼬리뼈 옆 會陽에서 관련 없는 구조이다.', refs: ['peuker3'] },
  LI12: { remove: /brachial artery|위팔동맥/i,
    why: '위팔동맥은 팔꿈치 가쪽에서 들어간 경로가 관절 반대편 68 mm에서야 만나는 구조이다. 肘髎 근처의 신경은 가쪽위관절융기 앞의 노신경이다.',
    add: { near: [{ match: '^Right Radial nerve$', ko: '노신경', en: 'Radial nerve', refs: ['spRadialNerve'] }] }, refs: ['spRadialNerve'] },
  TE5: { add: { near: [{ match: '^Right Posterior interosseous nerve of forearm$', ko: '뒤뼈사이신경', en: 'Posterior interosseous nerve', refs: ['spPIN'] }] },
    notes: [[/median|정중신경/i, 'KCMRIC 원문 "內關(PC6)을 향해 透刺하기도 한다" — 外關→內關 투자(透刺) 때만 닿는 깊이이다.']], refs: ['kcmric', 'spPIN'] },
  TE6: { remove: /median|정중신경/i, why: '정중신경은 아래팔 반대편(37–40 mm)에 있다. KCMRIC에 투자 기재가 없다. 뒤칸의 신경은 뒤뼈사이신경이다.',
    add: { near: [{ match: '^Right Posterior interosseous nerve of forearm$', ko: '뒤뼈사이신경', en: 'Posterior interosseous nerve', refs: ['spPIN'] }] }, refs: ['spPIN'] },
  TE7: { remove: /median|정중신경/i, why: '정중신경은 아래팔 반대편(40 mm)에 있다. 뒤칸의 신경은 뒤뼈사이신경이다.',
    add: { near: [{ match: '^Right Posterior interosseous nerve of forearm$', ko: '뒤뼈사이신경', en: 'Posterior interosseous nerve', refs: ['spPIN'] }] }, refs: ['spPIN'] },
  // LR9: the overlapping popliteal-vein stump is collapsed in scripts/fit-needle-eye-vessels.mjs (2026-09-25).
  SI12: { remove: /brachial plexus|axillary|팔신경얼기|겨드랑/i,
    why: '팔신경얼기·겨드랑동맥은 어깨뼈 앞쪽 구조이다. 가시위오목의 秉風 아래에는 어깨위신경·혈관이 지난다.',
    add: { near: [
      { match: '^Right Suprascapular nerve$', ko: '어깨위신경', en: 'Suprascapular nerve', refs: ['spSuprascapular'] },
      { match: '^Right suprascapular artery$', ko: '어깨위동맥', en: 'Suprascapular artery', refs: ['spSuprascapular'] },
    ] }, notes: [[/suprascapular|어깨위/i, '어깨위신경·혈관은 가시위근 아래 가시위오목 바닥을 지난다. 모델 경로는 오목 바닥에 닿지 않고 지나가서 실제보다 깊고 멀게 나온다.']], refs: ['spSuprascapular'] },
  TE12: { add: { near: [{ match: '^Right Radial nerve$', ko: '노신경', en: 'Radial nerve', refs: ['spRadialNerve'] }] },
    why: '깊은위팔동맥은 노신경고랑에서 노신경과 함께 지나므로 노신경을 같이 표시한다.', refs: ['spRadialNerve'] },

  // --- structures the list was missing
  HT2: { add: { near: [{ match: '^Right Median nerve$', ko: '정중신경', en: 'Median nerve', refs: ['spMedianNerve'] }] },
    why: '위팔 안쪽 두갈래근고랑에서 정중신경은 위팔동맥과 함께 지난다(모델 7 mm).', refs: ['spMedianNerve', 'peuker3'] },
  LU2: { add: { concept: [pleuraConcept('KCMRIC 원문 "不宜深刺, 刺太深時 氣逆". 빗장아래오목 안쪽 깊은 곳에 폐첨·흉막이 있다(목흉막은 빗장뼈 안쪽 1/3보다 2–3 cm 위).', ['kcmric'])] } },
  KI8: { add: { near: [{ match: '^Right posterior tibial artery$', ko: '뒤정강동맥', en: 'Posterior tibial artery', refs: ['spPosteriorTibialNerve'] }] },
    why: '뒤정강동맥은 깊은뒤칸에서 정강신경과 나란히 지난다(모델 8 mm).', refs: ['spPosteriorTibialNerve'] },

  // --- anatomy notes where the model differs from the reference
  BL40: { notes: [[/popliteal|tibial nerve|오금|정강신경/i, '얕은 곳부터 정강신경 → 오금정맥 → 오금동맥이다. 모델 메시를 이 순서로 보정했다(fit-needle-eye-vessels.mjs). MRI에서 동맥까지 약 26 mm(Hou 2020)로, 모델보다 얕다.']], refs: ['spPopliteal', 'hou2020'] },
  KI10: { notes: [[/popliteal|오금/i, '오금정맥은 오금동맥보다 얕다. 모델 메시를 이 순서로 보정했다(fit-needle-eye-vessels.mjs).']], refs: ['spPopliteal'] },
  ST36: { notes: [[/tibial nerve|정강신경/i, 'Lou 2006 사체 80지: 뒤정강근 뒤경계(44 mm)를 지나면 정강신경·뒤정강혈관에 닿는다. 모델(59 mm)은 문헌보다 깊다.'],
    [/anterior tibial|deep fibular|앞정강|깊은종아리/i, 'Lou 2006: 피부→뼈사이막 22 mm, 뼈사이막 얕은 층에 앞정강동맥 가지·깊은종아리신경이 있다.']], refs: ['st36Cadaver'] },
  SI8: { notes: [[/ulnar|자신경/i, '자신경은 안쪽위관절융기와 팔꿈치머리 사이 자신경고랑 바로 아래를 지난다. 모델 거리(13 mm)는 혈 위치나 메시 차이이다.']], refs: ['spUlnarNerve', 'parkKim2013'] },
  SP11: { notes: [[/femoral artery|넙다리동맥/i, 'KCMRIC 원문 "動脈을 피하여 刺鍼, 不可深刺". 모음근관의 넙다리동맥이 가까이 있다. 모델 거리(17 mm)는 실제보다 멀다.']], refs: ['kcmric', 'spAdductorCanal'] },
  SP12: { notes: [[/femoral|넙다리/i, 'KCMRIC 원문 "動脈을 피하여 刺鍼". 넙다리삼각은 가쪽부터 신경·동맥·정맥 순이다. 衝門은 동맥 바로 가쪽이다. 모델 위치는 재위치 대상이다.']], refs: ['kcmric', 'spFemoralTriangle'] },
  GB34: { notes: [[/common fibular|온종아리/i, '온종아리신경은 종아리뼈목 위를 피부·근막만 덮고 지나며, 71%는 종아리뼈머리를 가로지른다(Kim 2019). 모델 거리(20 mm)는 실제보다 멀다.']], refs: ['spCommonFibular', 'cfnCadaver', 'parkKim2013'] },
  BL38: { notes: [[/common fibular|온종아리/i, '온종아리신경은 넙다리두갈래근 힘줄 안쪽을 따라 내려간다. 모델 거리(15 mm)는 실제보다 멀다.']], refs: ['spCommonFibular'] },
  BL39: { notes: [[/common fibular|온종아리/i, '委陽은 넙다리두갈래근 힘줄 안쪽이다. 온종아리신경이 이 힘줄 안쪽 가장자리를 따라간다.']], refs: ['spCommonFibular'] },
  LI13: { notes: [[/radial|노신경/i, '노신경은 노신경고랑을 돌아 가쪽근육사이막을 뚫는다. LI13 초음파 자침에서 노신경이 밀려나고 접촉 감각이 거의 없었다(Tang 2019).']], refs: ['spRadialNerve', 'li13Radial'] },
  LU5: { notes: [[/radial|노신경/i, '노신경은 팔오금에서 위팔근과 위팔노근 사이로 내려간다. 모델 거리(20 mm)는 재위치 대상인 혈 위치 차이이다.']], refs: ['spRadialNerve'] },
  ST9: { replaceNotes: true, notes: [[/carotid|목동맥/i, '人迎은 온목동맥 박동부이다. 온목동맥 메시를 C3/C4 갈림 높이까지 보정했다(fit-needle-eye-vessels.mjs; Manta 2024, Karangeli 2026). 모델 깊이 17.8 mm, MRI 피부→첫 위험조직 평균 16 mm(Chou 2015).']], refs: ['chou2015', 'spCarotidSheath', 'manta2024', 'karangeli2026', 'kcmric'] },
  KI7: { notes: [[/posterior tibial|뒤정강/i, '뒤정강정맥은 뒤정강동맥의 동반정맥으로 깊은뒤칸에 있다. 동맥에서 8–17 mm 안쪽 피부 밑에 있던 모델 정맥을 동맥 옆으로 보정했다(fit-needle-eye-vessels.mjs).']], refs: ['spPosteriorTibialNerve', 'spTarsalTunnel'] },
  KI9: { notes: [[/posterior tibial vein|뒤정강정맥/i, '뒤정강정맥은 동맥과 함께 가자미근 아래 깊은뒤칸에 있다. 모델 정맥을 동맥 옆으로 보정했다(fit-needle-eye-vessels.mjs).']], refs: ['spPosteriorTibialNerve'] },
  GB21: { notes: [[/pleura|흉막/i, 'KCMRIC 원문 "아래에는 肺尖部가 있으므로 신중히". 초음파 수직 깊이 남 17.4, 여 14.6 mm(Chen 2018). 다른 연구에서는 앉은 자세 38 mm(Chu 2018). 측정 정의에 따라 차이가 크다.']], refs: ['kcmric', 'gb21Us', 'chu2018'] },
  GV15: { notes: [[/spinal|척수/i, 'KCMRIC 원문 "深部에 延髓가 있으므로 不可深刺". GV15 MRI 안전깊이(직자): 남 47.7±5.1, 여 44.6±5.9 mm (Zhou 2019). 첫 위험조직까지 평균 49 mm (Chou 2015).']], refs: ['kcmric', 'zhou2019', 'chou2015'] },
  BL51: { notes: [[/kidney|콩팥/i, 'KCMRIC 원문 "內部에 腎臟이 있으므로 禁深刺".']], refs: ['kcmric', 'spKidneys'] },
  GB25: { notes: [[/kidney|콩팥/i, 'KCMRIC 원문 "不宜深刺". 京門은 12번 갈비뼈 자유끝 아래이고, 콩팥 위극을 12번 갈비뼈가 가로지른다.']], refs: ['kcmric', 'spKidneys'] },
  LI18: { add: { near: [
      { match: '^Right common carotid artery$', ko: '온목동맥', en: 'Common carotid artery', refs: ['spCarotidSheath', 'chou2015'] },
      { match: '^Right internal jugular vein$', ko: '속목정맥', en: 'Internal jugular vein', refs: ['spCarotidSheath'] },
    ] }, why: '목동맥집(온목동맥·속목정맥)을 C3/C4 갈림 높이까지 메시로 보정해 모델로 측정한다. MRI 첫 위험조직까지 평균 13 mm(Chou 2015).', refs: ['spCarotidSheath', 'chou2015'] },
  ST12: { notes: [[/subclavian|빗장밑/i, 'KCMRIC 원문 "直下에는 肺尖部가 있고 … 빗장밑동·정맥이 있어 … 橫刺한다".']], refs: ['kcmric'] },
};
