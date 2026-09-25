/** Korean names (대한해부학회 우리말 용어, KCMRIC 표기) for the atlas structures a needle path meets.
 * Keys are the atlas name with the side word removed, lower case. */
const TERMS={
 // back and neck
 'trapezius':'등세모근','descending part of trapezius':'등세모근 내림부분','transverse part of trapezius':'등세모근 가로부분','ascending part of trapezius':'등세모근 오름부분',
 'latissimus dorsi':'넓은등근','rhomboid major':'큰마름근','rhomboid minor':'작은마름근','levator scapulae':'어깨올림근',
 'serratus posterior superior':'위뒤톱니근','serratus posterior inferior':'아래뒤톱니근','splenius capitis':'머리널판근','splenius cervicis':'목널판근',
 'iliocostalis cervicis':'목엉덩갈비근','iliocostalis thoracis':'등엉덩갈비근','iliocostalis lumborum':'허리엉덩갈비근',
 'longissimus capitis':'머리가장긴근','longissimus cervicis':'목가장긴근','longissimus thoracis':'등가장긴근','spinalis':'가시근','spinalis thoracis':'등가시근',
 'semispinalis capitis':'머리반가시근','semispinalis cervicis':'목반가시근','semispinalis thoracis':'등반가시근','multifidus':'뭇갈래근',
 'cervical rotator':'목돌림근','thoracic rotator':'등돌림근','lumbar rotator':'허리돌림근','set of interspinales lumborum':'허리가시사이근',
 'lateral lumbar intertransversarius':'가쪽허리가로돌기사이근','medial lumbar intertransversarius':'안쪽허리가로돌기사이근',
 'set of posterior cervical intertransversarii':'뒤목가로돌기사이근','set of anterior cervical intertransversarii':'앞목가로돌기사이근',
 'set of levatores costarum breves':'짧은갈비올림근','set of levatores costarum longi':'긴갈비올림근','levatores costarum longi':'긴갈비올림근','levatores costarum breves':'짧은갈비올림근',
 'quadratus lumborum':'허리네모근','psoas major':'큰허리근','iliacus':'엉덩근',
 'platysma':'넓은목근','sternocleidomastoid':'목빗근','sternohyoid':'복장목뿔근','sternothyroid':'복장방패근','thyrohyoid':'방패목뿔근','omohyoid':'어깨목뿔근',
 'scalenus anterior':'앞목갈비근','scalenus medius':'중간목갈비근','scalenus posterior':'뒤목갈비근','longus capitis':'긴머리근','longus colli':'긴목근',
 'obliquus capitis inferior':'아래머리빗근','obliquus capitis superior':'위머리빗근','rectus capitis posterior major':'큰뒤머리곧은근','rectus capitis posterior minor':'작은뒤머리곧은근',
 // chest and abdomen
 'pectoralis major':'큰가슴근','clavicular part of pectoralis major':'큰가슴근 빗장부분','sternocostal part of pectoralis major':'큰가슴근 복장갈비부분','abdominal part of pectoralis major':'큰가슴근 배부분',
 'pectoralis minor':'작은가슴근','serratus anterior':'앞톱니근','external intercostal muscle':'바깥갈비사이근','internal intercostal muscle':'속갈비사이근','innermost intercostal muscle':'맨속갈비사이근',
 'transversus thoracis':'가슴가로근','diaphragm':'가로막','subclavius':'빗장밑근',
 'external oblique':'배바깥빗근','internal oblique':'배속빗근','transversus abdominis':'배가로근','rectus abdominis':'배곧은근','linea alba':'백색선','inguinal ligament':'샅고랑인대','pyramidalis':'배세모근',
 // shoulder and arm
 'deltoid':'어깨세모근','acromial part of deltoid':'어깨세모근 봉우리부분','clavicular part of deltoid':'어깨세모근 빗장부분','spinal part of deltoid':'어깨세모근 가시부분',
 'supraspinatus':'가시위근','infraspinatus muscle':'가시아래근','infraspinatus':'가시아래근','teres minor':'작은원근','teres major':'큰원근','subscapularis':'어깨밑근',
 'long head of biceps brachii':'위팔두갈래근 긴갈래','short head of biceps brachii':'위팔두갈래근 짧은갈래','brachialis':'위팔근','coracobrachialis':'부리위팔근',
 'long head of triceps brachii':'위팔세갈래근 긴갈래','lateral head of triceps brachii':'위팔세갈래근 가쪽갈래','medial head of triceps brachii':'위팔세갈래근 안쪽갈래','anconeus':'팔꿈치근','brachioradialis':'위팔노근',
 'extensor carpi radialis longus':'긴노쪽손목폄근','extensor carpi radialis brevis':'짧은노쪽손목폄근','extensor carpi ulnaris':'자쪽손목폄근','extensor digitorum':'손가락폄근','extensor digiti minimi':'새끼폄근','extensor indicis':'집게폄근',
 'extensor pollicis longus':'긴엄지폄근','extensor pollicis brevis':'짧은엄지폄근','abductor pollicis longus':'긴엄지벌림근','supinator':'손뒤침근',
 'humeral head of pronator teres':'원엎침근 위팔갈래','ulnar head of pronator teres':'원엎침근 자갈래','pronator quadratus':'네모엎침근',
 'flexor carpi radialis':'노쪽손목굽힘근','humeral head of flexor carpi ulnaris':'자쪽손목굽힘근 위팔갈래','ulnar head of flexor carpi ulnaris':'자쪽손목굽힘근 자갈래','palmaris longus':'긴손바닥근',
 'flexor digitorum superficialis':'얕은손가락굽힘근','flexor digitorum profundus':'깊은손가락굽힘근','flexor pollicis longus':'긴엄지굽힘근','interosseous membrane of forearm':'아래팔뼈사이막',
 // hip and lower limb
 'gluteus maximus':'큰볼기근','gluteus medius':'중간볼기근','gluteus minimus':'작은볼기근','tensor fasciae latae':'넙다리근막긴장근','iliotibial tract':'엉덩정강띠',
 'piriformis':'궁둥구멍근','gemellus superior':'위쌍둥이근','gemellus inferior':'아래쌍둥이근','obturator internus':'속폐쇄근','obturator externus':'바깥폐쇄근','quadratus femoris':'넙다리네모근','coccygeus':'꼬리근','pubococcygeus':'두덩꼬리근',
 'posterior sacro-iliac ligamentr':'뒤엉치엉덩인대','sacrotuberous ligamentr':'엉치결절인대','sacrospinous ligamentr':'엉치가시인대',
 'rectus femoris':'넙다리곧은근','vastus lateralis':'가쪽넓은근','vastus medialis':'안쪽넓은근','vastus intermedius':'중간넓은근','sartorius':'넙다리빗근','gracilis':'두덩정강근','pectineus':'두덩근',
 'adductor longus':'긴모음근','adductor brevis':'짧은모음근','adductor magnus':'큰모음근','adductor minimus':'작은모음근',
 'long head of biceps femoris':'넙다리두갈래근 긴갈래','short head of biceps femoris':'넙다리두갈래근 짧은갈래','semitendinosus':'반힘줄근','semimembranosus':'반막근',
 'medial head of gastrocnemius':'장딴지근 안쪽갈래','lateral head of gastrocnemius':'장딴지근 가쪽갈래','soleus':'가자미근','plantaris':'장딴지빗근','popliteus':'오금근',
 'tibialis anterior':'앞정강근','tibialis posterior':'뒤정강근','extensor digitorum longus':'긴발가락폄근','extensor hallucis longus':'긴엄지발가락폄근',
 'fibularis longus':'긴종아리근','fibularis brevis':'짧은종아리근','flexor digitorum longus':'긴발가락굽힘근','flexor hallucis longus':'긴엄지발가락굽힘근',
 'interosseous membrane of leg':'종아리뼈사이막','calcaneal tendon':'발꿈치힘줄',
 // ligaments and membranes
 'supraspinous ligament':'가시끝인대','interspinous ligaments':'가시사이인대','ligamenta flava':'황색인대','nuchal ligament':'목덜미인대','posterior longitudinal ligament':'뒤세로인대','anterior longitudinal ligament':'앞세로인대','thyrohyoid membrane':'방패목뿔막',
 // bones
 'axis':'중쇠뼈(C2)','atlas':'고리뼈(C1)','occipital bone':'뒤통수뼈','body of sternum':'복장뼈몸통','xiphoid process':'칼돌기','manubrium':'복장뼈자루','clavicle':'빗장뼈','scapula':'어깨뼈',
 'humerus':'위팔뼈','radius':'노뼈','ulna':'자뼈','hip bone':'볼기뼈','sacrum':'엉치뼈','femur':'넙다리뼈','tibia':'정강뼈','fibula':'종아리뼈','patella':'무릎뼈','mandible':'아래턱뼈',
 'thyroid cartilage':'방패연골','cricoid cartilage':'반지연골',
 // hazards
 'common carotid artery':'온목동맥','internal carotid artery':'속목동맥','vertebral artery':'척추동맥','subclavian artery':'빗장밑동맥','axillary artery':'겨드랑동맥','brachial artery':'위팔동맥',
 'radial artery':'노동맥','ulnar artery':'자동맥','femoral artery':'넙다리동맥','popliteal artery':'오금동맥','anterior tibial artery':'앞정강동맥','posterior tibial artery':'뒤정강동맥','fibular artery':'종아리동맥',
 'external iliac artery':'바깥엉덩동맥','common iliac artery':'온엉덩동맥','inferior epigastric artery':'아래배벽동맥','superior epigastric artery':'위배벽동맥','dorsal scapular artery':'등쪽어깨동맥',
 'suprascapular artery':'어깨위동맥','lateral thoracic artery':'가쪽가슴동맥','posterior intercostal arteries':'뒤갈비사이동맥','lumbar artery':'허리동맥','abdominal aorta':'배대동맥','anterior interosseous artery':'앞뼈사이동맥',
 'posterior circumflex humeral artery':'뒤위팔휘돌이동맥','middle genicular artery':'중간무릎동맥',
 'femoral vein':'넙다리정맥','popliteal vein':'오금정맥','internal jugular vein':'속목정맥','brachiocephalic vein':'팔머리정맥','subclavian vein':'빗장밑정맥','axillary vein':'겨드랑정맥',
 'cephalic vein':'노쪽피부정맥','basilic vein':'자쪽피부정맥','great saphenous vein':'큰두렁정맥','small saphenous vein':'작은두렁정맥','external iliac vein':'바깥엉덩정맥','inferior vena cava':'아래대정맥',
 'deep femoral vein':'깊은넙다리정맥','posterior tibial vein':'뒤정강정맥','fibular vein':'종아리정맥','inferior gluteal vein':'아래볼기정맥','superficial epigastric vein':'얕은배벽정맥','lateral thoracic vein':'가쪽가슴정맥',
 'sciatic nerve':'궁둥신경','tibial nerve':'정강신경','common fibular nerve':'온종아리신경','deep fibular nerve':'깊은종아리신경','superficial fibular nerve':'얕은종아리신경','femoral nerve':'넙다리신경','obturator nerve':'폐쇄신경',
 'median nerve':'정중신경','ulnar nerve':'자신경','radial nerve':'노신경','deep branch of radial nerve':'노신경 깊은가지','axillary nerve':'겨드랑신경','musculocutaneous nerve':'근육피부신경',
 'accessory nerve (xi)':'더부신경','vagus nerve (x)':'미주신경','intercostal nerves':'갈비사이신경','spinal dura':'척수경막','white matter of spinal cord':'척수','medulla oblongata':'숨뇌(연수)','cauda equina':'말총',
 'suprascapular nerve':'어깨위신경','dorsal scapular nerve':'등쪽어깨신경','genitofemoral nerve':'음부넙다리신경','ilio-inguinal nerve':'엉덩샅굴신경','posterior femoral cutaneous nerve':'뒤넙다리피부신경','pudendal nerve':'음부신경',
 'roots of brachial plexus':'팔신경얼기 뿌리','posterior division of superior trunk of brachial plexus':'팔신경얼기 위신경줄기','posterior division of middle trunk of brachial plexus':'팔신경얼기 중간신경줄기',
 'pleura':'흉막·허파','upper lobe of lung':'흉막·허파','middle lobe of lung':'흉막·허파','lower lobe of lung':'흉막·허파','lateral pectoral nerve':'가쪽가슴신경','anterior spinal artery':'앞척수동맥','portal vein':'문맥','azygos vein':'홀정맥','renal vein':'콩팥정맥','trachea':'기관','esophagus':'식도',
 'stomach':'위','transverse colon':'가로잘록창자','ascending colon':'오름잘록창자','descending colon':'내림잘록창자','proximal part of ileum':'돌창자','middle part of ileum':'돌창자','distal part of ileum':'돌창자',
 'distal part of jejunum':'빈창자','duodenum':'샘창자','rectum':'곧창자','pancreas':'이자','kidney':'콩팥','ureter':'요관','urinary bladder':'방광','tongue':'혀',
};
const ORD=['','첫째','둘째','셋째','넷째','다섯째','여섯째','일곱째','여덟째','아홉째','열째','열한째','열두째'];
const EN_ORD=['','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'];
export const baseName=(name)=>name.replace(/^(Right|Left)\s+/i,'').replace(/\s+of (right|left)\s+/i,' of ').replace(/\b(right|left)\s+/i,'').toLowerCase();
export function koreanOf(name){
 const base=baseName(name);
 if(TERMS[base])return TERMS[base];
 let m=base.match(/^(\w+) (cervical|thoracic|lumbar) vertebra$/);if(m)return `${ORD[EN_ORD.indexOf(m[1])]}${{cervical:'목뼈',thoracic:'등뼈',lumbar:'허리뼈'}[m[2]]}`;
 m=base.match(/^(\w+) (rib|costal cartilage)$/);if(m)return `${ORD[EN_ORD.indexOf(m[1])]}${m[2]==='rib'?'갈비뼈':'갈비연골'}`;
 if(/hepatovenous segment|lobe of liver/.test(base))return '간';
 if(/pharyn|stylopharyngeus|epiglott|larynx|arytenoid|cricothyroid/.test(base))return '인두·후두';
 if(/intervertebral dis/.test(base))return '척추사이원반';
 if(/wall of (atrium|ventricle)|cavity of ventricle/.test(base))return '심장';
 return null;
}
