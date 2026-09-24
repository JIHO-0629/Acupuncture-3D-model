import {readFileSync,writeFileSync} from 'node:fs';
import {allPoints} from '../needling/points_all.mjs';

const direct=JSON.parse(readFileSync('data/needling-direct.json','utf8'));
const range=(prefix,first,last)=>Array.from({length:last-first+1},(_,i)=>`${prefix}${first+i}`);
// Provisional high-risk queue from the approved first-release regions. These entries
// require the named reviewer to approve the captured path card before release.
const groups={
 '안와·눈 주위':['BL1','ST1','GB1'],
 '경부·후두하':[...range('ST',9,12),'LI17','LI18','SI16','SI17','TE16','TE17','GB20','GB21','BL10','GV15','GV16','CV22','CV23'],
 '흉곽·견갑부':[...range('LU',1,2),...range('ST',13,18),...range('SP',17,21),...range('KI',22,27),...range('CV',14,21),...range('BL',11,22),...range('BL',41,47),...range('SI',11,15),...range('GB',22,24),...range('LR',13,14)],
 '복부·골반·회음':[...range('CV',1,7),'CV9','ST30','SP12'],
};
const reviewRequired=new Set(Object.values(groups).flat());
const locked=new Set(['ST7','ST17','CV8']);
const effectiveReview=[...reviewRequired].filter(code=>!locked.has(code));
if(effectiveReview.length!==85)throw new Error(`expected 85 review points, got ${effectiveReview.length}`);
const rows=allPoints().map(point=>({
 point:point.code,
 technique:direct[point.code]?.techniqueId??null,
 status:locked.has(point.code)?'locked':reviewRequired.has(point.code)?'review_required':'open',
 reviewer:null,
 reviewedOn:null,
 capture:null,
 dataVersion:'2026-09-24-first-study',
}));
writeFileSync('data/needling-review.json',JSON.stringify(rows,null,2)+'\n');
const metadata=new Map();
for(const meridian of ['LU','ST','SP','HT','SI','BL','KI','PC','TE','LR','CV','GV'])
 for(const point of JSON.parse(readFileSync(`data/meridians/${meridian}.json`,'utf8')).points)metadata.set(point.code,point);
for(const point of JSON.parse(readFileSync('data/li-source.json','utf8')).points){
 const match=point.name.match(/^([^（(]+)[（(]([^）)]+)/);
 metadata.set(point.code,{korean:match?.[1]?.trim()??'',hanja:match?.[2]??'',location:point.canonicalLocation});
}
const gbSource=readFileSync('app/gb-points.ts','utf8');
for(const match of gbSource.matchAll(/\{code:'(GB\d+)',korean:'([^']+)',hanja:'([^']+)',english:'([^']+)',location:'([^']*)'/g))
 metadata.set(match[1],{code:match[1],korean:match[2],hanja:match[3],english:match[4],location:match[5]});
const categoryOf=code=>Object.entries(groups).find(([,codes])=>codes.includes(code))?.[0]??'기타';
const reviewRows=rows.filter(row=>row.status==='review_required');
const lines=[
 '1차 학습본 고위험 자침 경로 검수표',
 '생성 기준: 2026-09-24-first-study',
 `대상: ${reviewRows.length}혈 (검수용 시뮬레이션 허용 · 승인 전 배포 잠금)`,
 '',
 '검수 방법',
 '각 혈을 http://127.0.0.1:3020/ 에서 검색하고 정면·측면·근접 화면을 확인합니다.',
 '아래 다섯 항목이 모두 맞을 때만 승인하십시오.',
 '1. 위치: 마커가 아래 위치 원문과 같은 해부학적 표지점의 피부 표면에 있다.',
 '2. 시작점: 바늘이 공중이나 몸속이 아니라 피부에서 시작한다.',
 '3. 방향: 화면의 방향이 원문 방향과 충돌하지 않는다. 자세가 필요한 혈은 현재 자세의 한계를 표시한다.',
 '4. 경로: 뼈를 관통하지 않고, 표시되는 근육·혈관·신경·장기 층서가 캡처상 해부학적으로 납득된다.',
 '5. 문구: 寸 원문, 모델 환산 mm, 주의문이 서로 뒤바뀌지 않았으며 mm가 임상 안전심도로 표현되지 않는다.',
 '',
 '반려 기준: 하나라도 확인할 수 없거나 잘못되면 반려하고 사유를 한 줄로 적습니다.',
 '판정 표기: [승인] 또는 [반려: 사유]',
 '',
];
for(const [index,row] of reviewRows.entries()){
 const point=metadata.get(row.point)??{},profile=direct[row.point]??{};
 lines.push(`${String(index+1).padStart(2,'0')}. ${row.point} ${point.korean??''} ${point.hanja?`(${point.hanja})`:''} — ${categoryOf(row.point)}`);
 lines.push(`    위치: ${point.location??'앱의 위치 원문 확인 필요'}`);
 lines.push(`    자침 원문: ${profile.raw??'원문 없음'}`);
 lines.push(`    모델 환산: ${profile.minCun??'?'}–${profile.maxCun??'?'}寸 / 상한 ${profile.modelMaxMm??'?'} mm (${profile.cunBasis??'환산 근거 없음'})`);
 lines.push(`    주의: ${profile.caution||'별도 주의문 없음'}`);
 lines.push('    확인: [ ] 위치  [ ] 피부 시작  [ ] 방향  [ ] 경로·층서  [ ] 문구·단위');
 lines.push('    판정: [                    ]');
 lines.push('');
}
lines.push('원문상 잠금(검수로 해제하지 않음): ST7, ST17, CV8');
writeFileSync('reports/needling-review-for-jiho.txt',lines.join('\r\n')+'\r\n');
console.log(`wrote ${rows.length}: ${rows.filter(row=>row.status==='open').length} open, ${rows.filter(row=>row.status==='review_required').length} review, ${rows.filter(row=>row.status==='locked').length} locked`);
console.log('wrote reports/needling-review-for-jiho.txt');
