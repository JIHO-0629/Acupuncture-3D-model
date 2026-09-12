export type SystemId = 'skeletal'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac';
export const SYSTEMS: {id:SystemId;name:string;color:string;description:string}[] = [
 {id:'skeletal',name:'Skeleton',color:'#e2d9ba',description:'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.'},
 {id:'muscular',name:'Muscles',color:'#a85b50',description:'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.'},
 {id:'cardiac',name:'Heart',color:'#b96760',description:'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.'},
 {id:'sensory',name:'Sensory organs',color:'#b0c8ce',description:'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.'},
 {id:'arterial',name:'Arteries',color:'#c05245',description:'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.'},
 {id:'venous',name:'Veins',color:'#527c9f',description:'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.'},
 {id:'nervous',name:'Nervous system',color:'#d8b565',description:'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.'},
 {id:'respiratory',name:'Respiratory',color:'#b98991',description:'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.'},
 {id:'digestive',name:'Digestive',color:'#b8916b',description:'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.'},
 {id:'urinary',name:'Urinary',color:'#b47961',description:'The kidneys filter blood and regulate fluid, electrolyte, and acid–base balance. Urine travels through the ureters to the bladder and exits through the urethra.'},
 {id:'lymphatic',name:'Lymphatic',color:'#879f7c',description:'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.'},
 {id:'endocrine',name:'Endocrine',color:'#c5a09a',description:'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.'},
 {id:'reproductive',name:'Reproductive',color:'#bda098',description:'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.'},
 {id:'integumentary',name:'Body surface',color:'#ba9b7d',description:'The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.'},
 {id:'connective',name:'Connective tissue',color:'#aec3bb',description:'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.'},
];
export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'three-quarter'|'front'|'back'|'side';
export interface NeedleHit {id:string;name:string;system:SystemId;distanceMm:number}
export interface NeedleReport {code:string;available:boolean;limitMm:number|null;boundaryMm:number|null;boundaryId:string|null;boundaryLabel:string;conceptual:boolean;hits:NeedleHit[];pathHits:NeedleHit[]}
export interface NeedleState {enabled:boolean;depthRatio:number;revision:number}
export interface RegionFocus {center:[number,number,number];radiusMm:number;revision:number;viewHint?:'dorsal-foot'}
export interface AcupunctureState {visible:boolean;selectedCode:string;showAll:boolean;showLines:boolean}
export interface SceneState {inspectorOpen?:boolean;explode:number;visible:SystemId[];selected:string[];isolate:boolean;view:View;rotate:boolean;reset:number;needle?:NeedleState;acupuncture?:AcupunctureState;regionFocus?:RegionFocus}
const KOREAN_ANATOMY_TERMS:Record<string,string>={
 'abductor digiti minimi of foot':'소지외전근','abductor hallucis':'무지외전근','adductor brevis':'단내전근','adductor longus':'장내전근','adductor magnus':'대내전근','adductor minimus':'소내전근','adductor hallucis':'무지내전근',
 'biceps femoris':'대퇴이두근','long head of biceps femoris':'대퇴이두근 장두','short head of biceps femoris':'대퇴이두근 단두','deltoid':'삼각근','acromial part of deltoid':'삼각근 견봉부','clavicular part of deltoid':'삼각근 쇄골부','spinal part of deltoid':'삼각근 견갑극부',
 'diaphragm':'횡격막','external oblique':'외복사근','internal oblique':'내복사근','transversus abdominis':'복횡근','rectus abdominis':'복직근','pyramidalis':'추체근',
 'external intercostal muscle':'외늑간근','internal intercostal muscle':'내늑간근','innermost intercostal muscle':'최내늑간근','levatores costarum':'늑골거근','levatores costarum breves':'단늑골거근','levatores costarum longi':'장늑골거근','set of levatores costarum breves':'단늑골거근군','set of levatores costarum longi':'장늑골거근군','serratus anterior':'전거근','serratus posterior inferior':'하후거근','serratus posterior superior':'상후거근','transversus thoracis':'흉횡근',
 'pectoralis major':'대흉근','abdominal part of pectoralis major':'대흉근 복부','clavicular part of pectoralis major':'대흉근 쇄골부','sternocostal part of pectoralis major':'대흉근 흉늑부','pectoralis minor':'소흉근',
 'sternocleidomastoid':'흉쇄유돌근','trapezius':'승모근','ascending part of trapezius':'승모근 상승부','descending part of trapezius':'승모근 하강부','transverse part of trapezius':'승모근 횡행부','splenius capitis':'두판상근','splenius cervicis':'경판상근','semispinalis capitis':'두반극근','semispinalis cervicis':'경반극근','longissimus capitis':'두최장근','longissimus cervicis':'경최장근','longissimus thoracis':'흉최장근','iliocostalis cervicis':'경장늑근','iliocostalis thoracis':'흉장늑근','iliocostalis lumborum':'요장늑근',
 'obliquus capitis inferior':'하두사근','obliquus capitis superior':'상두사근','rectus capitis posterior major':'대후두직근','rectus capitis posterior minor':'소후두직근','anterior scalene':'전사각근','middle scalene':'중사각근','posterior scalene':'후사각근','levator scapulae':'견갑거근','rhomboid major':'대능형근','rhomboid minor':'소능형근',
 'inferior oblique':'하사근','inferior rectus':'하직근','lateral rectus':'외직근','levator palpebrae superioris':'상안검거근','medial rectus':'내직근','superior oblique':'상사근','superior rectus':'상직근',
 'gluteus maximus':'대둔근','gluteus medius':'중둔근','gluteus minimus':'소둔근','tensor fasciae latae':'대퇴근막장근','piriformis':'이상근','superior gemellus':'상쌍자근','inferior gemellus':'하쌍자근','obturator internus':'내폐쇄근','obturator externus':'외폐쇄근','quadratus femoris':'대퇴방형근','iliacus':'장골근','psoas major':'대요근','psoas minor':'소요근',
 'rectus femoris':'대퇴직근','vastus medialis':'내측광근','vastus intermedius':'중간광근','vastus lateralis':'외측광근','sartorius':'봉공근','gracilis':'박근','pectineus':'치골근','semimembranosus':'반막근','semitendinosus':'반건양근',
 'gastrocnemius':'비복근','medial head of gastrocnemius':'비복근 내측두','lateral head of gastrocnemius':'비복근 외측두','soleus':'가자미근','plantaris':'족척근','popliteus':'슬와근','tibialis anterior':'전경골근','tibialis posterior':'후경골근','fibularis longus':'장비골근','fibularis brevis':'단비골근','fibularis tertius':'제3비골근','peroneus longus':'장비골근','peroneus brevis':'단비골근','peroneus tertius':'제3비골근',
 'extensor digitorum longus':'장지신근','extensor digitorum brevis':'단지신근','extensor hallucis longus':'장무지신근','extensor hallucis brevis':'단무지신근','flexor digitorum longus':'장지굴근','flexor digitorum brevis':'단지굴근','flexor hallucis longus':'장무지굴근','flexor hallucis brevis':'단무지굴근','quadratus plantae':'족저방형근','first lumbrical of foot':'제1충양근','second lumbrical of foot':'제2충양근','third lumbrical of foot':'제3충양근','fourth lumbrical of foot':'제4충양근',
 'patella':'슬개골','tibia':'경골','fibula':'비골','common fibular nerve':'총비골신경','common peroneal nerve':'총비골신경',
 'temporalis':'측두근','superficial part of masseter':'교근 천부','deep part of masseter':'교근 심부','medial pterygoid':'내측익돌근','upper head of lateral pterygoid':'외측익돌근 상두','lower head of lateral pterygoid':'외측익돌근 하두','aponeurosis of epicranius':'두개건막(모상건막)',
 'orbital part of orbicularis oculi':'안륜근 안와부','palpebral part of orbicularis oculi':'안륜근 안검부','orbicularis oris':'구륜근','corrugator supercilii':'추미근','procerus':'눈살근','nasalis':'비근','depressor septi nasi':'비중격하체근','buccinator':'협근',
 'levator labii superioris':'상순거근','levator labii superioris alaeque nasi':'상순비익거근','levator anguli oris':'구각거근','depressor anguli oris':'구각하체근','depressor labii inferioris':'하순하체근','zygomaticus major':'대관골근','zygomaticus minor':'소관골근','risorius':'소근','mentalis':'이근',
 'latissimus dorsi':'광배근','upper lobe of lung':'폐 상엽','middle lobe of lung':'폐 중엽','lower lobe of lung':'폐 하엽'
};
export function bilingualPartName(name:string){
 const prefix=name.match(/^(Right|Left)\s+(.+)$/i),infix=name.match(/^(.+?)\s+of\s+(right|left)\s+(.+)$/i);
 const sideWord=prefix?.[1]??infix?.[2],side=sideWord?.toLowerCase()==='right'?'우측':sideWord?.toLowerCase()==='left'?'좌측':'';
 const base=(prefix?.[2]??(infix?`${infix[1]} of ${infix[3]}`:name)).toLowerCase();
 const korean=KOREAN_ANATOMY_TERMS[base];
 return korean?`${name} (${side?`${side} `:''}${korean})`:name;
}
export const DEFAULT_VISIBLE:SystemId[] = ['cardiac','sensory','skeletal','muscular','arterial','venous','nervous','respiratory','digestive','urinary','lymphatic','endocrine','reproductive','connective'];
export const EXPLANATIONS:Record<string,string> = {
 'heart':'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
 'liver':'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
 'brain':'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
 'stomach':'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
 'spleen':'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
 'pancreas':'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
 'urinary bladder':'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
 'trachea':'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
 'diaphragm':'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
};
export function explanation(name:string,system:SystemId){return EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find(s=>s.id===system)?.description ?? '';}
