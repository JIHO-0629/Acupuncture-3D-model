import {GB_LANDMARK_SEEDS} from './gb-landmark-seeds';
import {GB_HEAD_CUN_SEEDS} from './head-cun-seeds';

export type ProjectionMode='head'|'lateral'|'anterior'|'posterior'|'dorsal-foot'|'direct';
export type NeedleRegion='face-scalp'|'neck'|'thorax'|'flank-abdomen'|'pelvis-gluteal'|'thigh-knee'|'leg'|'ankle-foot'|'toe'|'upper-limb';
export interface NeedleRelation{kind:'INTERSECT'|'APPROACH'|'AVOID';structure:string}

export interface NeedleProfile{
 region:NeedleRegion;
 label:string;
 probeDepthMm:number;
 conceptualBoundary:boolean;
 warning:string;
 sourceNeedling:string;
 depthValidation:string;
 validationSource:string;
 referenceStructures:string[];
 pointRisk?:string;
 depthRangeCun?:[number,number];
 documentedMaxMm?:number;
 relations?:NeedleRelation[];
}

export interface GbPointDefinition{
 code:`GB${number}`;
 korean:string;
 hanja:string;
 english:string;
 location:string;
 basis:string;
 seed:[number,number,number];
 projection:ProjectionMode;
 /** With projection 'direct': the outward direction at the seed; the needle runs opposite to it. */
 outward?:[number,number,number];
 status:'registered'|'review';
 primarySource:string;
 secondarySource:string;
 verifiedOn:'2026-09-12';
}

const KMCRIC=(code:`GB${number}`)=>`https://m.kmcric.com/knowledge/acupoint/GB/${code}`;
const WHO='https://iris.who.int/handle/10665/353407';
type GbPointInput=Omit<GbPointDefinition,'primarySource'|'secondarySource'|'verifiedOn'>;
const gb=(point:GbPointInput):GbPointDefinition=>({...point,primarySource:KMCRIC(point.code),secondarySource:WHO,verifiedOn:'2026-09-12'});

// These are editable region seeds, not final acupuncture-point coordinates. The viewer
// projects each seed onto the bundled BodyParts3D skin at runtime. Their purpose is to
// identify an anatomical neighbourhood that can be refined against the source meshes.
const GB_POINT_INPUTS:GbPointInput[]=[
 {code:'GB1',korean:'동자료',hanja:'瞳子髎',english:'Tongziliao',location:'외안각에서 가쪽으로 0.5촌(골도분촌)인 눈확 가쪽 구역',basis:'상·하안검이 귀쪽에서 만나는 외안각 피부 구역',seed:[-.064,1.600,.078],projection:'head',status:'review'},
 // 2026-09-15 photo review (images/GB/GB02.png): 이문(TE21)·청궁(SI19)·청회(GB2) stack
 // vertically just anterior to the tragus, GB2 lowest at the intertragic notch. The old
 // seed sat 23 mm below and 34 mm anterior to the notch, out on the cheek over the masseter.
 // Height now taken from the auricle's intertragic notch (y 1.589); z just anterior to the
 // tragus (z -.005) and posterior to the mandibular condyle (z -.006).
 {code:'GB2',korean:'청회',hanja:'聽會',english:'Tinghui',location:'이주간절흔 높이, 하악골 관절돌기 뒤쪽 함요부',basis:'외이 이주간절흔과 하악골 관절돌기',seed:[-.070,1.589,-.002],projection:'lateral',status:'review'},
 // 2026-09-15 photo review (images/GB/GB03.png): GB3 sits directly above the zygomatic arch,
 // vertically in line with ST7 하관 below it. The old seed was 9 mm anterior to the arch
 // midpoint (z .028) and 8 mm above its superior border.
 {code:'GB3',korean:'상관',hanja:'上關',english:'Shangguan',location:'관골궁 위모서리, 하악골 관절돌기 위쪽의 오목한 곳',basis:'관골궁 중점 landmark와 측두부 표면',seed:[-.068,1.588,.028],projection:'lateral',status:'registered'},
 {code:'GB4',korean:'함염',hanja:'頷厭',english:'Hanyan',location:'ST8–GB7 피부 곡선의 위쪽 1/4',basis:'측두부 깨물근 경계 곡선',seed:[-.074,1.622,.030],projection:'head',status:'review'},
 {code:'GB5',korean:'현로',hanja:'懸顱',english:'Xuanlu',location:'ST8–GB7 피부 곡선의 중점',basis:'측두부 깨물근 경계 곡선',seed:[-.077,1.626,.018],projection:'head',status:'review'},
 {code:'GB6',korean:'현리',hanja:'懸釐',english:'Xuanli',location:'ST8–GB7 피부 곡선의 위쪽 3/4',basis:'측두부 깨물근 경계 곡선',seed:[-.080,1.622,.004],projection:'head',status:'review'},
 // 2026-09-15 photo review (images/GB/GB07.png): the crosshair puts GB7 on the horizontal
 // line through the auricular apex. The rebuilt auricle's apex is at y 1.6226, so the old
 // seed (y 1.615) sat 10 mm below the apex line.
 {code:'GB7',korean:'곡빈',hanja:'曲鬢',english:'Qubin',location:'이개첨 수평선과 측두 두발경계선의 교차 구역',basis:'외이 최상단(y 1.6226)과 가상 측두 두발경계선',seed:[-.081,1.623,-.013],projection:'head',status:'review'},
 // 2026-09-15 head B-cun rebuild: GB8..GB11 and GB13..GB19 come from scripts/head-cun.mjs
 // (data/head-cun.json). Distances are arc length on the skin, one local WHO scale per segment:
 // forehead 미간~전발제 3촌 (GB14), scalp 전발제~후발제 12촌 (GB8/9/13/15-18), posterior
 // 유양돌기간 9촌 (GB19). The previous seeds mixed a 17.9 mm/촌 chord with ~35 mm/촌 spacing.
 // GB8 stays on the auricular-apex vertical at 1.5촌 above the temporal hairline of the
 // "Hair of head" mesh; GB9 is 0.5촌 behind it at 2촌 above the hairline; GB10/GB11 are the
 // arc-length thirds of the GB9–GB12 scalp curve. GB13 keeps its x -.052 column until ST8
 // supplies the anterior transverse scale (두유~두유 9촌).
 {code:'GB8',korean:'솔곡',hanja:'率谷',english:'Shuaigu',location:'이개첨 수직선, 측두 두발경계선 위 1.5촌(골도분촌)',basis:'외이 최상단 수직선과 Hair of head 메쉬 측두 발제선, 두피 표면 호길이',seed:GB_HEAD_CUN_SEEDS.GB8,projection:'head',status:'review'},
 {code:'GB9',korean:'천충',hanja:'天衝',english:'Tianchong',location:'이개근 뒤모서리 수직선, 두발경계선 위 2촌(골도분촌)',basis:'GB8 수직선 뒤 0.5촌과 Hair of head 메쉬 발제선, 두피 표면 호길이',seed:GB_HEAD_CUN_SEEDS.GB9,projection:'head',status:'review'},
 {code:'GB10',korean:'부백',hanja:'浮白',english:'Fubai',location:'GB9–GB12 곡선의 위쪽 1/3',basis:'GB9–GB12 두피 표면 곡선의 호길이 1/3',seed:GB_HEAD_CUN_SEEDS.GB10,projection:'head',status:'review'},
 {code:'GB11',korean:'두규음',hanja:'頭竅陰',english:'Touqiaoyin',location:'GB9–GB12 곡선의 위쪽 2/3',basis:'GB9–GB12 두피 표면 곡선의 호길이 2/3',seed:GB_HEAD_CUN_SEEDS.GB11,projection:'head',status:'review'},
 {code:'GB12',korean:'완골',hanja:'完骨',english:'Wangu',location:'유양돌기의 뒤아래쪽 오목한 곳',basis:'유양돌기·제1경추·흉쇄유돌근 뒤 경계',seed:[-.067,1.570,-.065],projection:'head',status:'registered'},
 {code:'GB13',korean:'본신',hanja:'本神',english:'Benshen',location:'전발제 위 0.5촌(골도분촌), 전정중선 가쪽 3촌',basis:'Hair of head 메쉬 전발제, 두피 표면 호길이 (가쪽 열은 ST8 구현 전까지 x -.052 유지)',seed:GB_HEAD_CUN_SEEDS.GB13,projection:'head',status:'review'},
 {code:'GB14',korean:'양백',hanja:'陽白',english:'Yangbai',location:'동공중선, 눈썹 위 1촌(골도분촌)',basis:'눈확위모서리(전두골)와 미간~전발제 3촌 척도, 이마 표면 호길이',seed:GB_HEAD_CUN_SEEDS.GB14,projection:'head',status:'review'},
 {code:'GB15',korean:'두임읍',hanja:'頭臨泣',english:'Toulinqi',location:'동공중선, 전발제 안쪽 0.5촌(골도분촌)',basis:'동공중선 시상 단면의 Hair of head 발제선, 두피 표면 호길이',seed:GB_HEAD_CUN_SEEDS.GB15,projection:'head',status:'review'},
 {code:'GB16',korean:'목창',hanja:'目窓',english:'Muchuang',location:'동공중선, 전발제 안쪽 1.5촌(골도분촌)',basis:'동공중선 시상 단면의 Hair of head 발제선, 두피 표면 호길이',seed:GB_HEAD_CUN_SEEDS.GB16,projection:'head',status:'review'},
 {code:'GB17',korean:'정영',hanja:'正營',english:'Zhengying',location:'동공중선, 전발제 안쪽 2.5촌(골도분촌)',basis:'동공중선 시상 단면의 Hair of head 발제선, 두피 표면 호길이',seed:GB_HEAD_CUN_SEEDS.GB17,projection:'head',status:'review'},
 {code:'GB18',korean:'승영',hanja:'承靈',english:'Chengling',location:'동공중선, 전발제 안쪽 4촌(골도분촌)',basis:'동공중선 시상 단면의 Hair of head 발제선, 두피 표면 호길이',seed:GB_HEAD_CUN_SEEDS.GB18,projection:'head',status:'review'},
 {code:'GB19',korean:'뇌공',hanja:'腦空',english:'Naokong',location:'외후두융기 위모서리 높이, 뒤정중선 가쪽 2.25촌(골도분촌)',basis:'후두골 외후두융기와 유양돌기간 9촌 척도, 뒤통수 표면 호길이',seed:GB_HEAD_CUN_SEEDS.GB19,projection:'head',status:'review'},
 // 2026-09-15 definition rebuild (images/GB/GB20.png): the depression between the SCM and
 // trapezius origins, inferior to the occipital bone. Derived from the meshes: at y 1.560,
 // just under the occipital inferior border (y 1.5632), the right SCM's posterior edge is at
 // x -.058/z -.050 and the descending trapezius' lateral edge at x -.036/z -.074; the seed is
 // the midpoint of that gap. The old seed floated 39 mm behind the skin and landed on the side
 // of the neck, 62 mm below the external occipital protuberance.
 {code:'GB20',korean:'풍지',hanja:'風池',english:'Fengchi',location:'후두골 아래, 흉쇄유돌근과 등세모근 이는곳 사이 함몰부',basis:'후두골 아래모서리와 흉쇄유돌근·등세모근 이는곳 사이 간격의 중점',seed:[-.047,1.560,-.062],projection:'posterior',status:'registered'},
 // 2026-09-23: WHO midpoint of the C7 spinous process tip (0.0004, 1.4469, -0.0787) and the lateral end of the
 // acromion (-0.1665, 1.4224, -0.0433) = (-0.083, 1.4347, -0.061), carried up to the skin on top of the shoulder.
 // The old seed plus a lateral projection landed 82 mm away on the deltoid, and the needle went into the humerus.
 // The needle is vertical, as in the ultrasound series behind the GB21 depth data (Chu 2018: vertical to the skin,
 // parallel to the sagittal plane); the skin triangle here is 24 mm across and its normal leans 44 degrees.
 {code:'GB21',korean:'견정',hanja:'肩井',english:'Jianjing',location:'C7 극돌기와 견봉 외측 끝을 잇는 선의 중점',basis:'제7경추 극돌기 끝과 견봉 외측 끝의 중점, 어깨 위 피부에서 수직 자입',seed:[-.0830,1.4554,-.0610],projection:'direct',outward:[0,1,0],status:'registered'},
 // 2026-09-23: the arm hangs against the chest here, and a lateral projection's normal tilted the needle into
 // biceps brachii. The point stays on the axillary skin at the 4th intercostal level and the needle goes straight
 // medial, as it would with the arm raised. In this pose the axillary hollow leaves ~70 mm to serratus anterior.
 {code:'GB22',korean:'연액',hanja:'淵腋',english:'Yuanye',location:'팔을 든 자세에서 중간겨드랑선 위, 겨드랑 중심 아래 3촌의 제4늑간',basis:'팔을 든 자세를 가정한 중간겨드랑선의 제4늑간(모델은 팔 내림 자세라 가슴벽 바깥 9 mm에 둔 가정 체표). 2026-09-25 검수: 제4·5늑골 사이 중앙',seed:[-.134,1.318,.000],projection:'direct',outward:[-1,0,0],status:'registered'},
 {code:'GB23',korean:'첩근',hanja:'輒筋',english:'Zhejin',location:'가쪽가슴부위 제4늑간, 중간겨드랑선 앞쪽 1촌',basis:'팔을 든 자세를 가정한 제4늑간, 중간겨드랑선 앞 1촌(가슴벽 바깥 9 mm 가정 체표). 2026-09-25 검수: 제4·5늑골 사이',seed:[-.128,1.307,.024],projection:'direct',outward:[-.958,0,.287],status:'registered'},
 {code:'GB24',korean:'일월',hanja:'日月',english:'Riyue',location:'앞가슴부위 제7늑간, 앞정중선 가쪽 4촌',basis:'제7·8늑골 사이 늑간, 유두선 바로 아래 (2026-09-26 유두선 곡선 반영: scripts/needling/relocate-mammillary-2026-09-26.mjs --gb)',seed:[-.10152,1.17704,.09315],projection:'anterior',status:'registered'},
 {code:'GB25',korean:'경문',hanja:'京門',english:'Jingmen',location:'옆배, 제12늑골 자유단 바로 아래쪽',basis:'제12늑골 자유단에서 가장 가까운 피부로 수직으로 올라온 점(2026-09-25 검수)',seed:[-.10618,1.0826,-.06078],projection:'direct',outward:[-.69049,-.23944,-.68257],status:'review'},
 // 2026-09-23: the old seed sat 30 mm below the umbilicus level and 40 mm lateral, where the needle met the iliac
 // crest at 14 mm. Now: vertically below the free end of the 11th rib (-0.108, 1.0888, -0.0049) at the height of
 // the umbilicus landmark (y 1.0297), projected laterally to the flank skin.
 {code:'GB26',korean:'대맥',hanja:'帶脈',english:'Daimai',location:'제11늑골 자유단 아래, 배꼽 중심과 같은 높이',basis:'제11늑골 자유단의 수직선과 배꼽 높이의 교점',seed:[-.108,1.0297,-.005],projection:'lateral',status:'review'},
 {code:'GB27',korean:'오추',hanja:'五樞',english:'Wushu',location:'배꼽 아래 3/5 구간, 위앞엉덩뼈가시 안쪽',basis:'백선상의 가상 배꼽·가상 치골결합·우측 장골',seed:[-.095,.925,.070],projection:'anterior',status:'review'},
 {code:'GB28',korean:'유도',hanja:'維道',english:'Weidao',location:'위앞엉덩뼈가시 아래안쪽의 서혜부 구역',basis:'샅고랑인대 바로 위(인대 위모서리 +6 mm), 위앞엉덩뼈가시 아래안쪽. 2026-09-25 검수: 인대 아래 넓적다리에 있던 점을 평행하게 올림',seed:[-.120,.971,.055],projection:'anterior',status:'review'},
 {code:'GB29',korean:'거료',hanja:'居髎',english:'Juliao',location:'위앞엉덩뼈가시와 대전자 사이 피부 곡선의 중점',basis:'우측 장골과 대퇴골 대전자',seed:[-.135,.910,-.005],projection:'lateral',status:'registered'},
 {code:'GB30',korean:'환도',hanja:'環跳',english:'Huantiao',location:'대전자–천골열공 곡선의 가쪽 1/3 구역',basis:'큰돌기 융기와 엉치뼈틈새를 잇는 선의 가쪽 1/3 지점(2026-09-25 검수)',seed:[-.1003,.8609,-.100],projection:'posterior',status:'review'},
 {code:'GB31',korean:'풍시',hanja:'風市',english:'Fengshi',location:'바로 섰을 때 가운데손가락 끝 높이, 장경인대 뒤쪽 오목한 곳',basis:'모델의 가운데손가락 끝 높이·장경인대 후연',seed:GB_LANDMARK_SEEDS.GB31!,projection:'lateral',status:'review'},
 {code:'GB32',korean:'중독',hanja:'中瀆',english:'Zhongdu',location:'장경인대 뒤쪽, 오금주름 위 7촌',basis:'랜드마크 기반 대전자–슬와횡문 19촌 축·장경인대 후연',seed:GB_LANDMARK_SEEDS.GB32!,projection:'lateral',status:'review'},
 {code:'GB33',korean:'슬양관',hanja:'膝陽關',english:'Xiyangguan',location:'대퇴이두근건과 장경인대 사이, 외측상과 위뒤쪽',basis:'대퇴골·대퇴이두근·장경인대',seed:[-.145,.435,-.045],projection:'lateral',status:'registered'},
 {code:'GB34',korean:'양릉천',hanja:'陽陵泉',english:'Yanglingquan',location:'비골두의 앞먼쪽 피부 구역',basis:'비골 근위부·경골 사이의 전외측 구역',seed:[-.122,.414,-.014],projection:'lateral',status:'registered'},
 {code:'GB35',korean:'양교',hanja:'陽交',english:'Yangjiao',location:'종아리 비골쪽면, 비골 뒤쪽, 외과 융기 위 7촌',basis:'16촌 하퇴축·경골–비골 국소 단면의 비골 후연',seed:GB_LANDMARK_SEEDS.GB35!,projection:'lateral',status:'review'},
 {code:'GB36',korean:'외구',hanja:'外丘',english:'Waiqiu',location:'종아리 비골쪽면, 비골 앞쪽, 외과 융기 위 7촌',basis:'16촌 하퇴축의 외과 위 7촌 높이, 양릉천(GB34)에서 곧게 내려온 선 위 (검수 2026-09-26: 사진처럼 GB34 수직선에 맞춤)',seed:[GB_LANDMARK_SEEDS.GB36![0],GB_LANDMARK_SEEDS.GB36![1],-.014],projection:'lateral',status:'review'},
 {code:'GB37',korean:'광명',hanja:'光明',english:'Guangming',location:'종아리 비골쪽면, 비골 앞쪽, 외과 융기 위 5촌',basis:'16촌 하퇴축·경골–비골 국소 단면의 비골 전연',seed:GB_LANDMARK_SEEDS.GB37!,projection:'lateral',status:'review'},
 {code:'GB38',korean:'양보',hanja:'陽輔',english:'Yangfu',location:'종아리 비골쪽면, 비골 앞쪽, 외과 융기 위 4촌',basis:'16촌 하퇴축·경골–비골 국소 단면의 비골 전연',seed:GB_LANDMARK_SEEDS.GB38!,projection:'lateral',status:'review'},
 {code:'GB39',korean:'현종',hanja:'懸鍾',english:'Xuanzhong',location:'종아리 비골쪽면, 비골 앞쪽, 외과 융기 위 3촌',basis:'16촌 하퇴축·경골–비골 국소 단면의 비골 전연',seed:GB_LANDMARK_SEEDS.GB39!,projection:'lateral',status:'review'},
 {code:'GB40',korean:'구허',hanja:'丘墟',english:'Qiuxu',location:'발목 앞가쪽, 장지신근건 가쪽이면서 외과의 앞먼쪽 오목한 곳',basis:'거골 전방 경계 높이·장지신근 원위부 가쪽 경계',seed:GB_LANDMARK_SEEDS.GB40!,projection:'dorsal-foot',status:'review'},
 {code:'GB41',korean:'족임읍',hanja:'足臨泣',english:'Zulinqi',location:'제4·5중족골 기저 연접부 먼쪽, 제5 장지신근건 가쪽 오목한 곳',basis:'제4·5중족골 기저–원위 골간구간·장지신근 가쪽 경계',seed:GB_LANDMARK_SEEDS.GB41!,projection:'dorsal-foot',status:'review'},
 {code:'GB42',korean:'지오회',hanja:'地五會',english:'Diwuhui',location:'제4·5중족골 사이, 제4중족지관절 몸쪽 오목한 곳',basis:'제4·5중족골이 함께 존재하는 원위 단면의 마주보는 골연',seed:GB_LANDMARK_SEEDS.GB42!,projection:'dorsal-foot',status:'review'},
 {code:'GB43',korean:'협계',hanja:'俠谿',english:'Xiaxi',location:'넷째·다섯째 발가락 사이, 발샅 가장자리의 몸쪽 오목한 곳',basis:'제4·5족지간 물갈퀴연 랜드마크',seed:GB_LANDMARK_SEEDS.GB43!,projection:'dorsal-foot',status:'review'},
 {code:'GB44',korean:'족규음',hanja:'足竅陰',english:'Zuqiaoyin',location:'넷째발가락 외측 발톱뿌리각에서 몸쪽 0.1촌',basis:'제4족지갑 외측 뿌리각 추정 랜드마크',seed:GB_LANDMARK_SEEDS.GB44!,projection:'dorsal-foot',status:'review'},
];

export const GB_POINTS:GbPointDefinition[]=GB_POINT_INPUTS.map(gb);

export const GB_POINT_BY_CODE=new Map(GB_POINTS.map(point=>[point.code,point]));

const NEEDLING_RAW:Record<string,string>={
 GB1:'직자 0.2~0.3촌; 사자 0.3~0.5촌; 횡자 0.5~1촌',GB2:'직자 0.3~0.5촌; 사자 0.5~0.7촌',GB3:'직자 0.2~0.3촌; 사자 0.3~0.5촌',
 GB4:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB5:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB6:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB7:'직자 0.2~0.3촌; 사자 0.3~0.5촌',
 GB8:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB9:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB10:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB11:'직자 0.2~0.3촌; 사자 0.3~0.5촌',
 GB12:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB13:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB14:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB15:'직자 0.2~0.3촌; 사자 0.3~0.5촌',
 GB16:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB17:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB18:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB19:'직자 0.2~0.3촌; 사자 0.3~0.5촌',
 GB20:'직자 0.3~1촌; 사자 0.5~1.5촌',GB21:'직자 0.3~0.5촌',GB22:'사자 0.3~0.5촌',GB23:'사자 0.3~0.5촌',GB24:'사자 0.3~0.5촌',GB25:'직자 0.3~0.5촌',
 GB26:'직자 0.5~0.8촌; 사자 0.5~1촌',GB27:'직자 0.5~0.8촌; 사자 0.5~1촌',GB28:'직자 0.5~0.8촌; 사자 0.5~1촌',GB29:'직자 1~3촌; 사자 1~3촌',
 GB30:'직자 1.5~2.5촌',GB31:'직자 0.5~1.5촌; 사자 0.7~1.5촌',GB32:'직자 0.5~1촌; 사자 0.5~1촌',GB33:'직자 0.3~0.5촌; 사자 0.3~0.8촌',
 GB34:'직자 0.8~1.2촌',GB35:'직자 0.3~0.8촌; 사자 0.5~1촌',GB36:'직자 0.3~0.8촌; 사자 0.5~1.5촌',GB37:'직자 0.5~0.9촌; 사자 0.7~1촌',
 GB38:'직자 0.5~0.7촌',GB39:'직자 0.3~0.5촌; 사자 0.5~1촌',GB40:'직자 0.3~0.5촌; 사자 0.5~1촌',GB41:'직자 0.3~0.5촌',GB42:'직자 0.1~0.4촌; 사자 0.3~0.5촌',
 GB43:'직자 0.2~0.3촌; 사자 0.3~0.5촌',GB44:'직자 0.1~0.2촌; 사자 0.1~0.2촌',
};

const PARTIAL_VALIDATION=new Set(['GB2','GB14','GB20','GB21','GB22','GB23','GB24','GB25','GB30','GB38','GB41','GB43','GB44']);
const REFERENCE_STRUCTURES:Record<NeedleRegion,string[]>={
 'upper-limb':[],
 'face-scalp':['피부·피하조직','표정근/두피근막','골막·두개골 또는 안와 경계'],
 neck:['피부·피하조직','승모근·두반극근 계열','후두하부 혈관·신경 및 경추 경계'],
 thorax:['피부·피하조직','표층근·늑간근','늑골·흉막 개념 경계'],
 'flank-abdomen':['피부·피하조직','외복사근·내복사근·복횡근','복막·복강/후복막 장기 경계'],
 'pelvis-gluteal':['피부·피하조직','둔근·대퇴근막','골반뼈·혈관 및 신경 인접 경계'],
 'thigh-knee':['피부·피하조직','장경인대·대퇴 외측 근육/힘줄','대퇴골·슬관절 및 혈관 경계'],
 leg:['피부·피하조직','전외측 하퇴근·근막','비골·혈관 및 신경 경계'],
 'ankle-foot':['피부·피하조직','폄힘줄·발등 근막/골간근','족근골·중족골 및 발등혈관 경계'],
 toe:['피부·피하조직','발가락 말단 연부조직','발톱바탕·원위지골 경계'],
};

function validationFor(code:string){
 if(code==='GB29')return '불일치 · 수동검수 필요';
 if(PARTIAL_VALIDATION.has(code))return '부분일치 · 접근법/범위 차이';
 return 'KMCRIC 범위 일치';
}

export function needleProfile(code:`GB${number}`):NeedleProfile{
 const number=Number(code.slice(2));
 const shared={sourceNeedling:NEEDLING_RAW[code],depthValidation:validationFor(code),validationSource:`https://m.kmcric.com/knowledge/acupoint/GB/${code}`};
 const finish=(profile:Omit<NeedleProfile,'sourceNeedling'|'depthValidation'|'validationSource'|'referenceStructures'>):NeedleProfile=>({...profile,...shared,referenceStructures:REFERENCE_STRUCTURES[profile.region]});
 if(number<=19)return finish({region:'face-scalp',label:'안구·안와·두개골 위험 경계',probeDepthMm:45,conceptualBoundary:false,warning:'안구·안와·두개골에 접근하면 자동 정지합니다. 특수 자침 방향은 후속 구현 대상이며 현재 궤적은 체표 법선 직자만 표시합니다.'});
 if(number===20)return finish({region:'neck',label:'경부 주요 혈관·경추 위험 경계',probeDepthMm:80,conceptualBoundary:false,warning:'경부 혈관과 신경의 위치는 개인차가 큽니다. 비율은 이 참조 모델의 첫 위험 구조를 기준으로 합니다.',pointRisk:'반대쪽 안구 방향 또는 경부 심부를 향한 임의 궤적을 임상 지침으로 사용하지 마십시오.'});
 if(number===21)return finish({region:'thorax',label:'견정 모델 경로의 첫 위험 구조',probeDepthMm:100,conceptualBoundary:false,warning:'어깨 위에서 수직으로 들어가는 경로입니다. 초음파 연구의 피부-흉막 거리(남 42 mm, 여 35 mm 내외)보다 이 모델의 흉막은 깊게 놓여 있어, 모델 거리를 안전 여유로 읽으면 안 됩니다.',pointRisk:'모델상 여유가 임상 안전을 뜻하지 않습니다.'});
 if(number<=24)return finish({region:'thorax',label:'기흉 위험 경계(개념 모델)',probeDepthMm:100,conceptualBoundary:true,warning:'기흉 고위험 구역입니다. 이 경로의 흉막 교차가 검증되지 않으면 늑골·호흡기 구조를 개념적 경계로 표시합니다.',pointRisk:'모델상 여유가 임상 안전을 뜻하지 않습니다.'});
 if(number<=28)return finish({region:'flank-abdomen',label:'복벽 안쪽 장기 위험 경계',probeDepthMm:100,conceptualBoundary:false,warning:'복막과 장기의 실제 위치는 체형과 자세에 따라 달라집니다. 모델 경계를 실제 환자에게 적용하지 마십시오.'});
 if(number<=30)return finish({region:'pelvis-gluteal',label:'골반 장기·혈관·뼈 위험 경계',probeDepthMm:120,conceptualBoundary:false,warning:'신경을 찌르는 것을 목표로 표현하지 않습니다. GB30의 좌골신경은 인접 위험·변이 구조로만 다룹니다.'});
 if(number<=34)return finish({region:'thigh-knee',label:'혈관·뼈 안전구역 경계',probeDepthMm:100,conceptualBoundary:false,warning:'안전구역은 개인별로 다릅니다. 출혈 위험은 반드시 문진하고, 혈관 위치는 촉진·도플러·초음파 등으로 별도 확인해야 합니다.'});
 if(number<=39)return finish({region:'leg',label:'혈관·뼈 안전구역 경계',probeDepthMm:80,conceptualBoundary:false,warning:'하지 혈관과 신경의 주행에는 변이가 있습니다. 모델의 경계를 실제 환자의 안전심도로 사용하지 마십시오.'});
 if(number<=43)return finish({region:'ankle-foot',label:'힘줄·혈관·뼈 위험 경계',probeDepthMm:12,conceptualBoundary:false,warning:'발목과 발등은 매우 짧은 시뮬레이션 범위만 허용하며 첫 위험 구조 또는 개념 상한 전에 자동 정지합니다.'});
 return finish({region:'toe',label:'원위지골 위험 경계',probeDepthMm:4,conceptualBoundary:true,warning:'말단부는 수 mm의 개념 범위만 표시합니다. 발톱뿌리각은 모델에 없어 근사 체표 위치입니다.'});
}
