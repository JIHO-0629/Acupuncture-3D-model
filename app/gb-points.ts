export type ProjectionMode='head'|'lateral'|'anterior'|'posterior'|'dorsal-foot';
export type NeedleRegion='face-scalp'|'neck'|'thorax'|'flank-abdomen'|'pelvis-gluteal'|'thigh-knee'|'leg'|'ankle-foot'|'toe';

export interface NeedleProfile{
 region:NeedleRegion;
 label:string;
 probeDepthMm:number;
 conceptualBoundary:boolean;
 warning:string;
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
 status:'registered'|'review';
}

// These are editable region seeds, not final acupuncture-point coordinates. The viewer
// projects each seed onto the bundled BodyParts3D skin at runtime. Their purpose is to
// identify an anatomical neighbourhood that can be refined against the source meshes.
export const GB_POINTS:GbPointDefinition[]=[
 {code:'GB1',korean:'동자료',hanja:'瞳子髎',english:'Tongziliao',location:'외안각에서 가쪽으로 0.5촌(골도분촌)인 눈확 가쪽 구역',basis:'상·하안검이 귀쪽에서 만나는 외안각 피부 구역',seed:[-.064,1.600,.078],projection:'head',status:'review'},
 {code:'GB2',korean:'청회',hanja:'聽會',english:'Tinghui',location:'이주와 하악골 관절돌기 사이 구역',basis:'외이도 앞쪽 경계와 하악골 관절돌기',seed:[-.073,1.566,.030],projection:'lateral',status:'review'},
 {code:'GB3',korean:'상관',hanja:'上關',english:'Shangguan',location:'관골궁 중점의 위쪽 구역',basis:'관골궁과 측두부 표면',seed:[-.073,1.596,.037],projection:'lateral',status:'registered'},
 {code:'GB4',korean:'함염',hanja:'頷厭',english:'Hanyan',location:'ST8–GB7 피부 곡선의 위쪽 1/4',basis:'측두부 깨물근 경계 곡선',seed:[-.074,1.622,.030],projection:'head',status:'review'},
 {code:'GB5',korean:'현로',hanja:'懸顱',english:'Xuanlu',location:'ST8–GB7 피부 곡선의 중점',basis:'측두부 깨물근 경계 곡선',seed:[-.077,1.626,.018],projection:'head',status:'review'},
 {code:'GB6',korean:'현리',hanja:'懸釐',english:'Xuanli',location:'ST8–GB7 피부 곡선의 위쪽 3/4',basis:'측두부 깨물근 경계 곡선',seed:[-.080,1.622,.004],projection:'head',status:'review'},
 {code:'GB7',korean:'곡빈',hanja:'曲鬢',english:'Qubin',location:'이개첨 수평선과 측두 두발경계선의 교차 구역',basis:'외이 최상단과 가상 측두 두발경계선',seed:[-.081,1.615,-.012],projection:'head',status:'review'},
 {code:'GB8',korean:'솔곡',hanja:'率谷',english:'Shuaigu',location:'이개첨 수직선에서 측두 두발경계선 안쪽 1.5촌(골도분촌)',basis:'외이 최상단과 피부 표면 두발경계선',seed:[-.075,1.662,-.012],projection:'head',status:'review'},
 {code:'GB9',korean:'천충',hanja:'天衝',english:'Tianchong',location:'이개근 뒤모서리 수직선의 두발경계선 안쪽 구역',basis:'외이 뒤쪽 뿌리와 피부 표면 두발경계선',seed:[-.078,1.644,-.036],projection:'head',status:'review'},
 {code:'GB10',korean:'부백',hanja:'浮白',english:'Fubai',location:'GB9–GB12 곡선의 위쪽 1/3',basis:'유양돌기 뒤모서리를 따르는 피부 곡선',seed:[-.075,1.620,-.055],projection:'head',status:'review'},
 {code:'GB11',korean:'두규음',hanja:'頭竅陰',english:'Touqiaoyin',location:'GB9–GB12 곡선의 위쪽 2/3',basis:'유양돌기 뒤모서리를 따르는 피부 곡선',seed:[-.071,1.598,-.064],projection:'head',status:'review'},
 {code:'GB12',korean:'완골',hanja:'完骨',english:'Wangu',location:'유양돌기 아래뒤쪽, C1 높이의 표면 구역',basis:'유양돌기·제1경추·흉쇄유돌근 뒤 경계',seed:[-.067,1.570,-.065],projection:'head',status:'registered'},
 {code:'GB13',korean:'본신',hanja:'本神',english:'Benshen',location:'전발제 안쪽 0.5촌(골도분촌), 전정중선 가쪽 구역',basis:'가상 전발제선과 전정중선',seed:[-.052,1.668,.044],projection:'head',status:'registered'},
 {code:'GB14',korean:'양백',hanja:'陽白',english:'Yangbai',location:'정면 동공중선에서 눈썹 위쪽 구역',basis:'안구 정면 투영 중심과 기존 눈썹 메시',seed:[-.034,1.638,.085],projection:'head',status:'review'},
 {code:'GB15',korean:'두임읍',hanja:'頭臨泣',english:'Toulinqi',location:'동공중선, 전발제 안쪽 0.5촌(골도분촌)',basis:'안구 정면 투영 중심과 가상 전발제선',seed:[-.035,1.670,.071],projection:'head',status:'review'},
 {code:'GB16',korean:'목창',hanja:'目窓',english:'Muchuang',location:'동공중선, 전발제 안쪽 1.5촌(골도분촌)',basis:'두피 표면의 동공중선',seed:[-.037,1.692,.043],projection:'head',status:'review'},
 {code:'GB17',korean:'정영',hanja:'正營',english:'Zhengying',location:'동공중선, 전발제 안쪽 2.5촌(골도분촌)',basis:'두피 표면의 동공중선',seed:[-.038,1.706,.012],projection:'head',status:'review'},
 {code:'GB18',korean:'승영',hanja:'承靈',english:'Chengling',location:'동공중선, 전발제 안쪽 4촌(골도분촌)',basis:'두피 표면의 동공중선',seed:[-.037,1.704,-.027],projection:'head',status:'review'},
 {code:'GB19',korean:'뇌공',hanja:'腦空',english:'Naokong',location:'외후두융기 위쪽, GB20 위 1.5촌(골도분촌) 구역',basis:'후두골과 외후두융기',seed:[-.035,1.680,-.079],projection:'head',status:'registered'},
 {code:'GB20',korean:'풍지',hanja:'風池',english:'Fengchi',location:'후두골 아래, 흉쇄유돌근과 승모근 사이 구역',basis:'후두골·제1경추·목 근육 경계',seed:[-.060,1.565,-.090],projection:'posterior',status:'registered'},
 {code:'GB21',korean:'견정',hanja:'肩井',english:'Jianjing',location:'C7 극돌기와 견봉 외측 끝을 잇는 구역의 중점',basis:'제7경추와 견갑골 견봉부',seed:[-.125,1.402,-.005],projection:'lateral',status:'registered'},
 {code:'GB22',korean:'연액',hanja:'淵腋',english:'Yuanye',location:'팔을 든 자세의 겨드랑 중심 아래, 제4늑간 높이',basis:'피부를 따르는 가상 중간겨드랑선과 제4늑간',seed:[-.185,1.295,.010],projection:'lateral',status:'registered'},
 {code:'GB23',korean:'첩근',hanja:'輒筋',english:'Zhejin',location:'GB22 앞쪽, 제4늑간 높이의 흉곽 가쪽 구역',basis:'제4·5늑골과 중간겨드랑선',seed:[-.170,1.270,.038],projection:'lateral',status:'registered'},
 {code:'GB24',korean:'일월',hanja:'日月',english:'Riyue',location:'제7늑간, 전정중선 가쪽 흉곽 구역',basis:'제7·8늑골과 늑간 공간',seed:[-.120,1.165,.087],projection:'anterior',status:'registered'},
 {code:'GB25',korean:'경문',hanja:'京門',english:'Jingmen',location:'제12늑골 자유단 아래쪽 구역',basis:'제12늑골 자유단',seed:[-.155,1.080,-.010],projection:'lateral',status:'registered'},
 {code:'GB26',korean:'대맥',hanja:'帶脈',english:'Daimai',location:'제11늑골 자유단 아래, 배꼽 중심과 같은 높이',basis:'제11늑골·백선 기반 가상 배꼽 높이',seed:[-.150,1.000,.025],projection:'lateral',status:'review'},
 {code:'GB27',korean:'오추',hanja:'五樞',english:'Wushu',location:'배꼽 아래 3/5 구간, 위앞엉덩뼈가시 안쪽',basis:'백선상의 가상 배꼽·가상 치골결합·우측 장골',seed:[-.095,.925,.070],projection:'anterior',status:'review'},
 {code:'GB28',korean:'유도',hanja:'維道',english:'Weidao',location:'위앞엉덩뼈가시 아래안쪽의 서혜부 구역',basis:'우측 장골 전상부와 서혜인대 경로',seed:[-.120,.885,.055],projection:'anterior',status:'review'},
 {code:'GB29',korean:'거료',hanja:'居髎',english:'Juliao',location:'위앞엉덩뼈가시와 대전자 사이 피부 곡선의 중점',basis:'우측 장골과 대퇴골 대전자',seed:[-.135,.910,-.005],projection:'lateral',status:'registered'},
 {code:'GB30',korean:'환도',hanja:'環跳',english:'Huantiao',location:'대전자–천골열공 곡선의 가쪽 1/3 구역',basis:'대퇴골 대전자와 천골',seed:[-.135,.840,-.085],projection:'posterior',status:'review'},
 {code:'GB31',korean:'풍시',hanja:'風市',english:'Fengshi',location:'대전자–오금주름 구간에서 오금 위 9/19',basis:'대퇴골 대전자·장경인대·후면 40% 오금주름',seed:[-.165,.650,-.025],projection:'lateral',status:'registered'},
 {code:'GB32',korean:'중독',hanja:'中瀆',english:'Zhongdu',location:'장경인대 뒤쪽, 오금주름 위 7/19 구역',basis:'장경인대와 후면 40% 오금주름',seed:[-.165,.555,-.030],projection:'lateral',status:'review'},
 {code:'GB33',korean:'슬양관',hanja:'膝陽關',english:'Xiyangguan',location:'대퇴이두근건과 장경인대 사이, 외측상과 위뒤쪽',basis:'대퇴골·대퇴이두근·장경인대',seed:[-.145,.435,-.045],projection:'lateral',status:'registered'},
 {code:'GB34',korean:'양릉천',hanja:'陽陵泉',english:'Yanglingquan',location:'비골두의 앞먼쪽 피부 구역',basis:'비골 근위부·경골 사이의 전외측 구역',seed:[-.122,.414,-.014],projection:'lateral',status:'registered'},
 {code:'GB35',korean:'양교',hanja:'陽交',english:'Yangjiao',location:'비골 뒤쪽, 외과 위 7/16 구역',basis:'비골과 가쪽복사 사이의 후외측 피부 경로',seed:[-.145,.250,-.045],projection:'lateral',status:'review'},
 {code:'GB36',korean:'외구',hanja:'外丘',english:'Waiqiu',location:'비골 앞쪽, 외과 위 7/16 구역',basis:'비골과 가쪽복사 사이의 전외측 피부 경로',seed:[-.145,.250,-.005],projection:'lateral',status:'review'},
 {code:'GB37',korean:'광명',hanja:'光明',english:'Guangming',location:'비골 앞쪽, 외과 위 5/16 구역',basis:'GB34–외과 앞쪽 피부 곡선',seed:[-.140,.180,.000],projection:'lateral',status:'review'},
 {code:'GB38',korean:'양보',hanja:'陽輔',english:'Yangfu',location:'비골 앞쪽, 외과 위 4/16 구역',basis:'GB34–외과 앞쪽 피부 곡선',seed:[-.140,.145,.000],projection:'lateral',status:'review'},
 {code:'GB39',korean:'현종',hanja:'懸鍾',english:'Xuanzhong',location:'비골 앞쪽, 외과 위 3/16 구역',basis:'GB34–외과 앞쪽 피부 곡선',seed:[-.140,.110,.000],projection:'lateral',status:'review'},
 {code:'GB40',korean:'구허',hanja:'丘墟',english:'Qiuxu',location:'외과의 앞먼쪽, 긴발가락폄근힘줄 가쪽 구역',basis:'비골 원위부와 긴발가락폄근',seed:[-.150,.065,.040],projection:'dorsal-foot',status:'registered'},
 {code:'GB41',korean:'족임읍',hanja:'足臨泣',english:'Zulinqi',location:'제4·5중족골 바닥 연접부 먼쪽 구역',basis:'제4·5중족골과 긴발가락폄근',seed:[-.150,.035,.045],projection:'dorsal-foot',status:'registered'},
 {code:'GB42',korean:'지오회',hanja:'地五會',english:'Diwuhui',location:'제4·5중족골 사이, 제4중족지관절 몸쪽 구역',basis:'제4·5중족골과 제4중족지관절',seed:[-.150,.026,.073],projection:'dorsal-foot',status:'registered'},
 {code:'GB43',korean:'협계',hanja:'俠谿',english:'Xiaxi',location:'넷째·다섯째 발가락이 처음 만나는 발샅 가장자리 구역',basis:'제4·5발가락 피부 web margin',seed:[-.160,.018,.090],projection:'dorsal-foot',status:'review'},
 {code:'GB44',korean:'족규음',hanja:'足竅陰',english:'Zuqiaoyin',location:'넷째발가락 외측 발톱뿌리각 몸쪽 구역',basis:'제4원위지골과 새끼발가락 쪽 발톱 경계',seed:[-.165,.014,.103],projection:'dorsal-foot',status:'review'},
];

export const GB_POINT_BY_CODE=new Map(GB_POINTS.map(point=>[point.code,point]));

export function needleProfile(code:`GB${number}`):NeedleProfile{
 const number=Number(code.slice(2));
 if(number<=19)return{region:'face-scalp',label:'안구·안와·두개골 위험 경계',probeDepthMm:45,conceptualBoundary:false,warning:'안구·안와·두개골에 접근하면 자동 정지합니다. 특수 자침법은 이번 버전에서 다루지 않습니다.'};
 if(number===20)return{region:'neck',label:'경부 주요 혈관·경추 위험 경계',probeDepthMm:80,conceptualBoundary:false,warning:'경부 혈관과 신경의 위치는 개인차가 큽니다. 비율은 이 참조 모델의 첫 위험 구조를 기준으로 합니다.'};
 if(number<=24)return{region:'thorax',label:'기흉 위험 경계(개념 모델)',probeDepthMm:100,conceptualBoundary:true,warning:'기흉 위험 구역입니다. 흉막은 독립 메시가 없어 늑골·호흡기 구조를 이용한 개념적 경계로만 표시합니다.'};
 if(number<=28)return{region:'flank-abdomen',label:'복벽 안쪽 장기 위험 경계',probeDepthMm:100,conceptualBoundary:false,warning:'복막과 장기의 실제 위치는 체형과 자세에 따라 달라집니다. 모델 경계를 실제 환자에게 적용하지 마십시오.'};
 if(number<=30)return{region:'pelvis-gluteal',label:'골반 장기·혈관·뼈 위험 경계',probeDepthMm:120,conceptualBoundary:false,warning:'신경 타깃을 가정하지 않습니다. GB30의 좌골신경 변이는 현재 모델에 반영되어 있지 않습니다.'};
 if(number<=34)return{region:'thigh-knee',label:'혈관·뼈 안전구역 경계',probeDepthMm:100,conceptualBoundary:false,warning:'안전구역은 개인별로 다릅니다. 문진은 출혈 위험을 확인하며, 혈관 위치는 촉진·도플러·초음파 등으로 별도 확인해야 합니다.'};
 if(number<=39)return{region:'leg',label:'혈관·뼈 안전구역 경계',probeDepthMm:80,conceptualBoundary:false,warning:'하지 혈관과 신경의 주행에는 변이가 있습니다. 모델의 경계를 실제 환자의 안전심도로 사용하지 마십시오.'};
 if(number<=43)return{region:'ankle-foot',label:'힘줄·혈관·뼈 위험 경계',probeDepthMm:25,conceptualBoundary:false,warning:'발목과 발등은 짧은 시뮬레이션 범위만 허용하며 첫 위험 구조 전에 자동 정지합니다.'};
 return{region:'toe',label:'원위지골 위험 경계',probeDepthMm:8,conceptualBoundary:false,warning:'말단부는 매우 얕은 범위만 표시합니다. 발톱뿌리각은 모델에 없어 근사 체표 위치입니다.'};
}
