import fs from 'node:fs';
const { rows, summary } = JSON.parse(fs.readFileSync('model_paths_all.json', 'utf8'));
const pts = new Set(rows.map(r => r.point_code));
console.log('혈', pts.size, '| 행', rows.length, '| 층 행', rows.filter(r => r.layer_order !== 'nearest').length);
const miss = [...new Set(rows.filter(r => r.point_coordinate_version.includes('실패')).map(r => r.point_code))];
console.log('피부 투영 실패:', miss.length ? miss.join(',') : '없음');
const noLayer = [...pts].filter(c => !rows.some(r => r.point_code === c && r.layer_order === 1));
console.log('층이 하나도 안 잡힌 혈:', noLayer.length ? noLayer.join(',') : '없음');
// 첫 층이 뼈인 혈 (KCMRIC 범위가 뼈를 넘는지 확인용)
const bone = summary.filter(s => /@/.test(s.first || '') && /vertebra|rib|bone|sternum|femur|tibia|fibula|ulna|radius|humerus|scapula|clavicle|patella|phalanx|metatarsal|metacarpal|sacrum|carpal|calcaneus|talus/i.test(s.first));
console.log('첫 구조가 뼈인 자침법:', bone.length);
// 신경·흉막에 2 mm 이내로 접근하는 경우
const near = summary.filter(s => s.nerve && +s.nerve.match(/([\d.]+)mm$/)[1] <= 2);
console.log('신경 2 mm 이내 접근:', near.length, '|', near.slice(0, 8).map(s => `${s.technique}:${s.nerve}`).join(' ; '));
const pl = summary.filter(s => s.pleura && +s.pleura.replace('mm','') <= 5);
console.log('흉막 5 mm 이내:', pl.length, '|', pl.slice(0, 6).map(s => `${s.technique}:${s.pleura}`).join(' ; '));
