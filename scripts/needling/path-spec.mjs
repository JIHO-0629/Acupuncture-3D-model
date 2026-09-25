/** Reviewer decisions from reports/needling-path-review-vscode.md (2026-09-25), one entry per point.
 * build-needle-paths.mjs merges these into what the model ray meets. Fields:
 *  dir      'face' keeps the viewer's face normal; 'smooth' uses the skin normal averaged over 15 mm
 *           inside one skin region; 'midline' is that with the sideways component removed;
 *           {toward:[x,y,z]|landmark} aims at a point; {vector:[x,y,z]} is fixed. Default: 'smooth'
 *           when the face normal is 15° or more off the averaged one, otherwise 'face'.
 *  drop     regex (source) of model layers left out, with dropWhy.
 *  add      concept layers the model has no mesh for: {ko,en,after?|before?} (regex source of a model layer).
 *  hazards  literature or concept hazards: {ko,en,mm?,basis?,emph?,note?}. They are never drawn as a passed layer.
 *  near     hazards taken from a model mesh near the ray: {match,ko,note?,emph?}; only their depth is shown.
 *  note/posture/blocked  text for the panel.
 * The generic proximity display (every vessel or nerve within 5 mm) is deliberately NOT here:
 * the reviewer will design it as a separate lane in the needling panel.
 */
const H=(ko,en,o={})=>({ko,en,...o});
const C=(ko,en,o={})=>({ko,en,...o});
const N=(match,ko,o={})=>({match,ko,...o});
const PLEURA=(o={})=>H('흉막·허파 (기흉 위험)','Pleura / lung',{emph:true,...o});
const SCIATIC=(o={})=>N('^Right Sciatic nerve$','궁둥신경',o);
const KIDNEY_BASIS='콩팥은 대략 T12–L3 높이(오른쪽이 조금 낮음). 위허리(L1–L3) 가쪽 자침에서 콩팥 천자 위험 — Mansfield 2019 사체 연구 doi:10.1080/10669817.2019.1708593; 성인 15.9%는 L4 높이에도 콩팥 — Yoo 2018 MRI doi:10.1007/s12630-018-01280-w';
const KIDNEY=(o={})=>H('콩팥','Kidney',{basis:KIDNEY_BASIS,emph:true,...o});
const SACRAL=(foramen)=>({dir:{toward:`posterior_sacral_foramen_${foramen}`},hazardsNote:'엉치뼈구멍을 향해 자입',near:[SCIATIC({note:'엉치뼈 가쪽 깊은 곳을 지남. 방향이 가쪽으로 틀어지면 가까워짐'})]});

export const SPEC={
 // ── neck
 CV22:{blocked:'검수 결정(2026-09-25): 기관을 찌를 위험이 큰 혈이라 자침 시뮬레이션을 제공하지 않습니다. 원문의 2단계 자법(얕게 직자 후 복장뼈자루 뒤로 횡자)은 직선 경로로 표현할 수 없습니다.'},
 SI16:{hazards:[H('더부신경','Accessory nerve (XI)',{note:'목빗근 뒤모서리 깊은 곳, 뒤목삼각을 지남(개념 표시)'})],note:'뒤목삼각의 지방은 모델에 없어 빈 구간으로 보입니다.'},
 ST9:{dir:'smooth',hazards:[H('온목동맥(경동맥)','Common carotid artery',{mm:16,emph:true,basis:'Chou 2015 MRI: 피부→주요 목혈관 16 mm doi:10.1136/bmjopen-2015-007819',note:'이 모델에는 이 높이의 경동맥 메시가 없어 개념 표시입니다. 손가락으로 경동맥을 밀어내고 자입'})]},
 ST12:{near:[N('^Right subclavian artery$','빗장밑동맥',{emph:true})],hazards:[PLEURA({note:'첫째갈비뼈 너머 흉막꼭대기'})]},
 ST10:{hazards:[H('방패연골','Thyroid cartilage',{note:'자침 상한 너머. 목표 구조가 아님'})],drop:'Thyroid cartilage',dropWhy:'방패연골은 자침 상한 밖의 위험 구조로만 표시'},
 ST11:{near:[N('^Right brachiocephalic vein$','팔머리정맥',{emph:true,note:'실제로는 복장목뿔근보다 깊음. 모델 메시가 겹쳐 얕게 나옴'})],hazards:[PLEURA({note:'흉막꼭대기'})]},
 LI18:{add:[C('넓은목근','Platysma',{before:'sternocleidomastoid'})],hazards:[H('온목동맥·속목정맥 (목동맥집)','Carotid sheath',{mm:13,emph:true,basis:'Chou 2015 MRI: 피부→주요 목혈관 13 mm doi:10.1136/bmjopen-2015-007819',note:'목빗근 깊은 곳. 이 모델에는 이 높이의 목동맥집 메시가 없음'})]},
 GB20:{dir:{toward:'left_pupil'},near:[N('^Right vertebral artery$','척추동맥',{emph:true}),N('^Medulla oblongata$','숨뇌(연수)',{emph:true})],hazards:[H('척추동맥·숨뇌','Vertebral artery / medulla',{mm:50,basis:'Chou 2015 MRI: 피부→위험조직 50 mm doi:10.1136/bmjopen-2015-007819'})],note:'반대쪽 눈 방향으로 자입. 뒤통수뼈는 목표가 아닙니다.'},
 GB21:{hazards:[PLEURA({mm:38,basis:'Chu 2018 초음파: 피부→흉막 38.1±6.4 mm doi:10.1155/2018/2308102 · 마른 사람은 더 얕음(Chen 2018 doi:10.1016/j.jams.2018.06.004) · Chou 2015 MRI 56 mm',note:'견정은 기흉 보고가 가장 많은 혈입니다. 깊이 직자하지 않습니다'})],note:'이 모델의 수직 경로에는 흉막꼭대기가 닿지 않지만 실제로는 38 mm 안팎에 있습니다.'},
 GV15:{dir:'midline',add:[C('목덜미인대','Nuchal ligament',{after:'trapezius'}),C('뒤고리중쇠막·황색인대','Posterior atlanto-axial membrane',{after:'Nuchal'})],near:[N('^Spinal dura$','척수경막',{emph:true})],hazards:[H('척수','Spinal cord',{mm:48,emph:true,basis:'Zhou 2019 MRI 안전깊이 47.7±5.1 mm doi:10.13703/j.0255-2930.2019.06.014 · Chou 2015 49 mm'})]},
 BL10:{hazards:[H('척추동맥','Vertebral artery',{note:'깊은 곳, 자침 상한 너머'})]},
 SI15:{hazards:[PLEURA()]},
 GV14:{dir:'midline'},GV16:{},
 // ── chest
 LR14:{drop:'Abdominal part of right pectoralis major',dropWhy:'큰가슴근 배부분 메시가 본체에서 떨어져 갈비활까지 뻗은 메시 오류',hazards:[PLEURA({note:'제6늑간 흉막 아래오목(개념 표시)'})]},
 GB24:{hazards:[PLEURA({note:'갈비가로막오목: 흉막 아래끝은 중쇄골선에서 여덟째갈비뼈 높이(개념 표시)'})]},
 GB22:{posture:'팔을 든 자세를 가정한 위치입니다. 모델은 팔을 내린 자세라 실제로 팔을 움직이지 않고 가슴벽 위에 가정 체표를 두었습니다.',hazards:[PLEURA()]},
 GB23:{posture:'팔을 든 자세를 가정한 위치입니다.',hazards:[PLEURA()]},
 LU2:{near:[N('^Right axillary artery$','겨드랑동맥',{emph:true}),N('^Right axillary vein$','겨드랑정맥'),N('cord of brachial plexus','팔신경얼기 다발')],hazards:[H('겨드랑 신경혈관다발','Axillary neurovascular bundle',{emph:true,note:'작은가슴근 깊은 곳. 자침 상한 너머'})]},
 KI22:{hazards:[PLEURA()]},KI23:{hazards:[PLEURA()]},KI24:{hazards:[PLEURA()]},KI25:{hazards:[PLEURA()]},KI26:{hazards:[PLEURA()]},KI27:{hazards:[PLEURA()]},
 ST13:{hazards:[PLEURA()]},ST14:{hazards:[PLEURA()]},ST15:{hazards:[PLEURA()]},ST16:{hazards:[PLEURA()]},ST18:{hazards:[PLEURA()]},
 SP17:{hazards:[PLEURA()]},SP18:{hazards:[PLEURA()]},SP19:{hazards:[PLEURA()]},SP20:{hazards:[PLEURA()]},SP21:{hazards:[PLEURA()]},PC1:{hazards:[PLEURA()]},LU1:{hazards:[PLEURA()]},
 CV15:{dir:'midline',hazards:[H('간·심장','Liver / heart',{note:'깊이 직자하거나 위로 사자하지 않음(오른쪽 간, 왼쪽 심장)'})]},
 // ── back
 BL42:{dir:'smooth',drop:'scapula|subscapularis|infraspinatus|teres|serratus anterior',dropWhy:'임상 자세(어깨뼈 벌림)에서는 어깨뼈가 가쪽으로 빠져 경로에 없음',posture:'엎드려 팔을 늘어뜨려 어깨뼈를 벌린 자세를 가정합니다.',hazards:[PLEURA({note:'바깥줄(3촌) 등 부위는 흉막까지 얕음'})]},
 BL43:{dir:'smooth',drop:'scapula|subscapularis|infraspinatus|teres|serratus anterior',dropWhy:'임상 자세(어깨뼈 벌림)에서는 어깨뼈가 가쪽으로 빠져 경로에 없음',posture:'엎드려 팔을 늘어뜨려 어깨뼈를 벌린 자세를 가정합니다.',hazards:[PLEURA()]},
 BL44:{dir:'smooth',drop:'scapula|subscapularis|infraspinatus|teres|serratus anterior',dropWhy:'임상 자세(어깨뼈 벌림)에서는 어깨뼈가 가쪽으로 빠져 경로에 없음',posture:'엎드려 팔을 늘어뜨려 어깨뼈를 벌린 자세를 가정합니다.',hazards:[PLEURA()]},
 BL41:{hazards:[PLEURA()]},BL45:{hazards:[PLEURA()]},BL46:{hazards:[PLEURA()]},BL47:{hazards:[PLEURA()]},BL48:{hazards:[PLEURA()]},BL49:{hazards:[PLEURA()]},BL50:{hazards:[PLEURA()]},
 BL11:{hazards:[PLEURA()]},BL12:{hazards:[PLEURA()]},BL13:{hazards:[PLEURA()]},BL14:{hazards:[PLEURA()]},BL15:{hazards:[PLEURA()]},BL16:{hazards:[PLEURA()]},BL17:{hazards:[PLEURA()]},BL18:{hazards:[PLEURA()]},BL19:{hazards:[PLEURA()]},
 BL20:{hazards:[KIDNEY()]},BL21:{hazards:[KIDNEY()]},
 BL22:{hazards:[KIDNEY()],note:'허리네모근은 척추세움근 앞(깊은 쪽)에 있으며 자침 상한보다 훨씬 깊습니다.'},
 BL23:{hazards:[KIDNEY({mm:43,basis:`${KIDNEY_BASIS} · 신수 최대 자침 약 4.3 cm(Gao 2017 doi:10.13703/j.0255-2930.2017.08.012)`})],note:'정중선 1.5촌 안쪽은 척추세움근이 목표입니다.'},
 BL24:{hazards:[KIDNEY({note:'L3 높이는 콩팥 아래끝 부근. 가로돌기에 먼저 닿는 경우가 많지만 1.5촌 가쪽에서는 뼈에 닿지 않을 수 있음'})]},
 BL51:{hazards:[KIDNEY()]},BL52:{hazards:[KIDNEY()]},GB25:{hazards:[KIDNEY()]},
 GV11:{dir:'midline'},GV9:{dir:'midline'},GV12:{dir:'midline'},GV13:{dir:'midline'},GV3:{dir:'midline'},GV4:{dir:{vector:[0,0,1]}},GV5:{dir:{vector:[0,0,1]}},GV6:{dir:'midline'},GV7:{dir:'midline'},GV8:{dir:'midline'},GV10:{dir:'midline'},
 // ── sacral and gluteal
 BL27:{dir:{vector:[0,0,1]},near:[SCIATIC()]},BL28:{dir:{vector:[0,0,1]},near:[SCIATIC()]},BL29:{dir:{vector:[0,0,1]},near:[SCIATIC()]},BL30:{dir:{vector:[0,0,1]},near:[SCIATIC()]},
 BL31:SACRAL('S1'),BL32:SACRAL('S2'),BL33:SACRAL('S3'),BL34:SACRAL('S4'),
 BL35:{dir:{vector:[0,0,1]},near:[SCIATIC()],note:'모델에 꼬리뼈가 없어 엉치뼈 끝에서 28 mm 아래를 꼬리뼈 끝으로 추정했습니다.'},
 BL53:{near:[SCIATIC()]},BL54:{near:[SCIATIC({emph:true})]},
 GB29:{add:[C('중간볼기근','Gluteus medius',{after:'tensor fasciae latae'}),C('작은볼기근','Gluteus minimus',{after:'tensor fasciae latae'})]},
 GB30:{near:[SCIATIC({emph:true,note:'끝까지 자침하면 궁둥신경의 찌릿한 득기 반응이 나타나는 깊이'})]},
 BL36:{add:[C('넙다리두갈래근 긴갈래·반힘줄근 기시부','Hamstring origin',{after:'gluteus maximus'})],near:[SCIATIC({emph:true})]},
 BL37:{near:[SCIATIC()]},
 // ── abdomen and groin
 LR11:{near:[N('^Right femoral artery$','넙다리동맥',{emph:true,note:'가쪽에 있음. 타겟하지 않음'})]},
 SP12:{dir:'smooth',near:[N('^Right femoral artery$','넙다리동맥',{emph:true}),N('^Right Femoral nerve$','넙다리신경',{emph:true})]},
 LR12:{near:[N('^Right external iliac artery$|^Right femoral artery$','바깥엉덩·넙다리동맥',{emph:true}),N('^Right external iliac vein$|^Right femoral vein$','바깥엉덩·넙다리정맥',{emph:true}),N('^Right Femoral nerve$','넙다리신경',{emph:true})],note:'샅고랑인대 바로 아래 안쪽으로 동맥·정맥·신경이 지나갑니다. 이 세 구조는 찌르지 않습니다.'},
 ST30:{near:[N('^Right femoral artery$','넙다리동맥',{emph:true})]},
 GB28:{note:'샅고랑인대 바로 위에 있습니다.'},
 KI11:{hazards:[H('방광','Urinary bladder',{note:'깊게 찌르면 방광(가득 찼을 때 더 얕아짐). 자침 상한 너머'})]},
 CV2:{hazards:[H('방광','Urinary bladder',{note:'방광이 차 있으면 얕아짐'})]},CV3:{hazards:[H('방광','Urinary bladder',{note:'방광이 차 있으면 얕아짐'})]},CV4:{hazards:[H('방광','Urinary bladder',{note:'방광이 차 있으면 얕아짐'})]},
 CV1:{dir:'smooth'},
 // ── shoulder and upper limb
 SI12:{hazards:[H('팔신경얼기·겨드랑동맥','Brachial plexus / axillary artery',{note:'가시위오목 바닥 너머, 자침 상한 훨씬 아래'})]},
 SI9:{dir:'horizontal',near:[N('^Right Axillary nerve$','겨드랑신경'),N('posterior circumflex humeral artery','뒤위팔휘돌이동맥')],note:'어깨세모근 깊은 곳 네모공간(사각공간)에 겨드랑신경과 뒤위팔휘돌이동맥이 지납니다.'},
 HT1:{posture:'팔을 벌린 자세에서 취혈하는 혈입니다. 자세 변경(OpenSim)은 이후 반영합니다.',hazards:[H('겨드랑동맥·정맥·팔신경얼기','Axillary neurovascular bundle',{emph:true,note:'자침 상한 아래 깊은 곳'})]},
 HT2:{near:[N('^Right brachial artery$','위팔동맥',{emph:true,note:'경로 근처. 통과하는 층이 아님'})]},
 LI13:{dir:'horizontal',near:[N('^Right Radial nerve$','노신경',{emph:true,note:'목표가 아님. 방향이 틀어지면 찌를 수 있음(Tang & Cheng 2019 doi:10.1089/acu.2019.1335)'})]},
 PC3:{near:[N('^Right brachial artery$','위팔동맥',{emph:true})]},
 SI8:{near:[N('^Right Ulnar nerve$','자신경',{emph:true,note:'자신경고랑의 자신경. 해부학적으로 이 오목 바로 아래를 지남(KCMRIC 원문에는 언급 없음)'})]},
 HT3:{add:[C('원엎침근 위팔갈래','Pronator teres, humeral head',{before:'brachialis'})]},
 LI11:{add:[C('긴노쪽손목폄근','Extensor carpi radialis longus',{after:'brachioradialis'}),C('위팔근','Brachialis',{before:'humerus'})]},
 LU5:{add:[C('위팔노근 안쪽모서리','Brachioradialis, medial border',{before:'brachialis'})],hazards:[H('노신경','Radial nerve',{note:'위팔노근과 위팔근 사이'})]},
 LI10:{add:[C('긴·짧은노쪽손목폄근','Extensor carpi radialis longus / brevis',{after:'brachioradialis'}),C('손뒤침근','Supinator',{before:'radius'})],hazards:[H('노신경 깊은가지','Deep branch of radial nerve',{note:'손뒤침근 속'})]},
 TE7:{dir:'face'},TE9:{dir:'smooth'},SI10:{dir:'horizontal'},
 LI15:{posture:'팔을 벌렸을 때 봉우리 앞쪽 오목에서 취혈합니다. 모델은 팔을 내린 자세라 어깨세모근이 얇게 보입니다.'},
 TE14:{posture:'팔을 벌렸을 때 봉우리 뒤쪽 오목에서 취혈합니다.'},
 // ── lower limb
 LR9:{near:[N('^Right femoral artery$','넙다리동맥',{emph:true,note:'관통하지 않음. 타겟 아님'}),N('^Right femoral vein$','넙다리정맥',{emph:true,note:'관통하지 않음. 타겟 아님'})]},
 SP11:{add:[C('넙다리빗근','Sartorius',{before:'adductor longus'})],near:[N('^Right femoral artery$','넙다리동맥',{emph:true,note:'깊은 곳 모음근관. 자침 상한 너머'})]},
 LR10:{add:[C('긴모음근','Adductor longus',{before:'pectineus'})]},
 BL38:{near:[N('^Right popliteal artery$','오금동맥',{emph:true}),N('^Right Common fibular nerve$','온종아리신경')]},
 BL39:{zone:'오금 가쪽 위험구역',near:[N('^Right Common fibular nerve$','온종아리신경',{emph:true})]},
 BL40:{zone:'오금 신경혈관다발 위험구역',drop:'gastrocnemius|plantaris',dropWhy:'모델의 장딴지근 두 갈래가 오금 가운데를 덮고 있음(실제로는 오금주름 높이에서 좌우로 갈라져 있음)',
  add:[C('오금근막·오금 지방','Popliteal fascia and fat')],
  near:[N('^Right Tibial nerve$','정강신경',{emph:true,note:'가장 얕음'}),N('^Right popliteal vein$','오금정맥',{emph:true}),N('^Right popliteal artery$','오금동맥',{emph:true,note:'실제로는 가장 깊고 정맥이 신경과 동맥 사이에 있음. 문헌(Hou 2020 MRI, doi:10.1177/0964528420958714)에서는 피부→동맥 약 26 mm로 이 모델보다 얕음'})],
  note:'얕은 곳부터 정강신경 → 오금정맥 → 오금동맥 순서입니다. 이 모델은 깊이가 문헌보다 깊고 정맥·동맥 순서가 바뀌어 있습니다.'},
 KI10:{},
 GB34:{add:[C('긴종아리근','Fibularis longus',{before:'extensor digitorum longus'})],near:[N('^Right Common fibular nerve$','온종아리신경',{emph:true,note:'종아리뼈머리 뒤를 감아 지나며 위치 변이가 있음'}),N('^Right popliteal vein$','오금정맥',{note:'자침 상한 너머'}),N('^Right popliteal artery$','오금동맥',{note:'자침 상한 너머'})]},
 SP6:{near:[N('^Right posterior tibial artery$','뒤정강동맥',{emph:true}),N('^Right Tibial nerve$','정강신경',{emph:true})],note:'깊은 뒤칸에서 뒤정강혈관과 정강신경이 동행합니다.'},
 ST36:{drop:'^Right popliteal artery$',dropWhy:'오금동맥은 ST36의 대표 인접 위험구조가 아니며, 이 모델 경로의 지나친 후방 연장에서만 만남',near:[N('^Right anterior tibial artery$','앞정강동맥',{emph:true,note:'뼈사이막 앞쪽의 앞정강 신경혈관다발'}),N('^Right Deep fibular nerve$','깊은종아리신경',{emph:true,note:'앞정강동맥과 함께 앞칸을 지나감'})],note:'앞정강동맥은 문헌(Choi 2026 초음파 HD50 25 mm, doi:10.1016/j.imr.2026.101305)보다 모델에서 약 15 mm 깊습니다. 정확한 수치는 개인 영상화 없이 안전거리로 사용하지 않습니다.'},
};

/** The 230 multi-layer points of the 2026-09-24 review (distal and head points excluded). */
export const REVIEWED=`GB24 LR14 LU2 CV15 GB22 GB23 KI22 KI25 KI26 ST14 ST15 ST16 KI23 KI24 KI27 PC1 SP17 SP19 SP20 SP21 ST13 ST18 ST17 LU1 SP18
BL36 LR9 SP11 LR10 BL37 GB31 GB32 ST31 ST32 ST34 SP10 ST33
BL42 BL43 BL44 GV11 BL22 BL23 BL24 BL51 BL52 GV4 GV5 GV9 GV12 GV13 BL11 BL12 BL13 BL14 BL15 BL16 BL17 BL18 BL19 BL20 BL21 BL25 BL41 BL45 BL46 BL47 BL48 BL50 GV3 GV6 GV7 GV8 GV10 BL26 BL49
BL10 CV22 GB20 GB21 GV15 GV16 LI18 SI16 ST9 ST12 SI15 ST10 ST11 CV23 GV14 LI17 SI14 TE16 SI17 TE15
BL39 BL40 GB34 BL38 GB33 KI10 SP9 LR7 LR8
LR11 SP12 CV1 CV3 CV4 CV10 GB25 GB26 GB28 KI11 KI12 KI13 KI18 LR12 ST23 ST24 ST29 CV2 CV5 CV6 CV7 CV9 CV11 CV13 CV14 GB27 KI14 KI15 KI16 KI17 KI19 KI20 KI21 LR13 SP13 SP14 SP15 SP16 ST19 ST22 ST25 ST26 ST27 ST28 ST30 CV12 ST20 ST21
SI12 LI15 SI9 SI10 SI11 LI14 TE14 LI16 SI13 TE13
HT1 HT2 LI13 PC3 SI8 HT3 LI11 LU5 LI12 LU4 TE10 TE11 TE12 LU3 PC2
LI8 LI10 PC4 SI7 TE7 TE9 LI6 LI7 LI9 LU6 PC5 PC6 TE5 TE6 TE8
BL27 BL28 BL30 BL31 BL32 BL33 BL34 BL35 BL54 GB29 GB30 BL29 GV1 GV2 BL53
BL57 KI7 SP6 ST36 ST40 BL55 BL56 BL58 GB35 GB36 GB38 KI8 KI9 LR5 LR6 SP7 SP8 ST37 ST38 ST39 GB37 GB39`.split(/\s+/);

export function regionOf(code){
 if(/^(GV1[4-6]|BL10|GB2[01]|LI1[78]|ST(9|1[0-2])|SI1[4-7]|TE1[5-6]|CV2[23])$/.test(code))return 'neck';
 if(/^(LU[12]|ST1[3-8]|SP(1[7-9]|2[01])|KI2[2-7]|PC1|GB2[2-4]|LR14|CV1[5-9]|CV2[01])$/.test(code))return 'chest';
 if(/^(ST(19|2\d|30)|SP1[2-6]|KI(1[1-9]|2[01])|CV([1-7]|9|1[0-4])|GB2[5-8]|LR1[1-3])$/.test(code))return 'abdomen';
 if(/^(BL(1[1-9]|2[0-6]|4[1-9]|5[0-2])|GV([3-9]|1[0-3]))$/.test(code))return 'back';
 if(/^(BL(2[7-9]|3[0-5]|5[34])|GB(29|30)|GV[12])$/.test(code))return 'gluteal';
 if(/^(SI(9|1[0-3])|LI1[4-6]|TE1[3-4])$/.test(code))return 'shoulder';
 if(/^(LU[3-5]|LI1[1-3]|HT[1-3]|PC[23]|SI8|TE1[0-2])$/.test(code))return 'arm';
 if(/^(LU6|LI([6-9]|10)|PC[4-6]|SI7|TE[5-9])$/.test(code))return 'forearm';
 if(/^(ST3[1-4]|SP1[01]|LR(9|10)|GB3[12]|BL3[67])$/.test(code))return 'thigh';
 if(/^(BL(3[89]|40)|KI10|GB3[34]|LR[78]|SP9)$/.test(code))return 'knee';
 return 'leg';
}

// Intercostal points use the averaged skin normal, the same ray relocate-review-2026-09-25.mjs scanned the rib gap with.
for(const code of ['KI22','KI23','KI24','KI25','KI26','ST14','ST15','ST16','ST18','SP17','SP18','SP19','SP20','LR14','PC1','GB24'])SPEC[code]={dir:'smooth',...SPEC[code]};
