/** Korean labels for the *modelled pieces* in atlas.json and zanatomy.json.
 * Keep the English source name intact in the UI and search index. The vocabulary
 * favours the familiar clinical (older) Korean term where both forms are used.
 */
const exact = {
  // Muscles: established clinical names take precedence over word-by-word rendering.
  'biceps brachii':'상완이두근','triceps brachii':'상완삼두근','biceps femoris':'대퇴이두근',
  'brachialis':'상완근','brachioradialis':'완요골근','coracobrachialis':'오훼완근','anconeus':'주근',
  'deltoid':'삼각근','trapezius':'승모근','masseter':'교근','temporalis':'측두근',
  'digastric':'이복근','genioglossus':'이설근','geniohyoid':'이설골근','hyoglossus':'설골설근',
  'mylohyoid':'악설골근','omohyoid':'견갑설골근','sternohyoid':'흉골설골근','sternothyroid':'흉골갑상근',
  'stylohyoid':'경돌설골근','thyrohyoid':'갑상설골근','uvular muscle':'구개수근',
  'palatopharyngeus':'구개인두근','salpingopharyngeus':'이관인두근','stylopharyngeus':'경돌인두근',
  'inferior pharyngeal constrictor':'하인두수축근','middle pharyngeal constrictor':'중인두수축근','superior pharyngeal constrictor':'상인두수축근',
  'levator veli palatini':'구개범장거근','tensor veli palatini':'구개범장근',
  'aryepiglotticus':'피열후두개근','lateral crico-arytenoid':'외측윤상피열근','posterior crico-arytenoid':'후윤상피열근',
  'oblique arytenoid':'사피열근','transverse arytenoid':'횡피열근','thyro-arytenoid':'갑상피열근','vocalis':'성대근',
  'external anal sphincter':'외항문괄약근','coccygeus':'미골근','iliococcygeus':'장골미골근',
  'pubococcygeus':'치골미골근','puborectalis':'치골직장근','superficial perineal muscle':'표재회음근',
  'subclavius':'쇄골하근','scalenus anterior':'전사각근','scalenus medius':'중사각근','scalenus posterior':'후사각근',
  'longus capitis':'두장근','longus colli':'경장근','cervical rotator':'경회선근','lumbar rotator':'요회선근','thoracic rotator':'흉회선근',
  'lateral lumbar intertransversarius':'외측 요횡돌기간근','medial lumbar intertransversarius':'내측 요횡돌기간근',
  'interspinalis thoracis':'흉극돌기간근','spinalis':'극근','spinalis thoracis':'흉극근','semispinalis thoracis':'흉반극근',
  'rectus capitis anterior':'전두직근','rectus capitis lateralis':'외측두직근',
  'supinator':'회외근','pronator teres':'원회내근','pronator quadratus':'방형회내근',
  'flexor carpi radialis':'요측수근굴근','flexor carpi ulnaris':'척측수근굴근',
  'extensor carpi radialis brevis':'단요측수근신근','extensor carpi radialis longus':'장요측수근신근','extensor carpi ulnaris':'척측수근신근',
  'flexor digitorum profundus':'심지굴근','flexor digitorum superficialis':'천지굴근',
  'extensor digitorum':'총지신근','extensor digiti minimi':'소지신근','extensor indicis':'시지신근',
  'flexor pollicis brevis':'단무지굴근','flexor pollicis longus':'장무지굴근',
  'extensor pollicis brevis':'단무지신근','extensor pollicis longus':'장무지신근',
  'abductor pollicis brevis':'단무지외전근','abductor pollicis longus':'장무지외전근',
  'adductor pollicis':'무지내전근','opponens pollicis':'무지대립근','palmaris longus':'장장근',
  'abductor digiti minimi of hand':'소지외전근','flexor digiti minimi brevis of hand':'단소지굴근',
  'opponens digiti minimi of hand':'소지대립근','opponens digiti minimi of foot':'소지대립근',
  'flexor digiti minimi brevis of foot':'단소지굴근','flexor accessorius':'족저방형근',
  'gemellus inferior':'하쌍자근','gemellus superior':'상쌍자근',
  'piriformis':'이상근','plantaris':'족척근','popliteus':'슬와근',
  'inferior pharyngeal constrictor muscle':'하인두수축근',
  'papillary muscle':'유두근','cricothyroid':'윤상갑상근','longus colli':'경장근',
  'humeral head':'상완골두','ulnar head':'척골두','oblique head':'사두','long head':'장두','short head':'단두',
  'lateral head':'외측두','medial head':'내측두','superficial head':'천두',
  'oblique part':'사부','straight part':'직부','vertical intermediate part':'수직중간부',
  'septal papillary muscle':'중격유두근',
  'lumbrical of foot':'충양근','plantar interosseous of foot':'족저골간근',
  'dorsal interossei of hand':'배측골간근','palmar interossei of hand':'장측골간근',
  'interspinales cervicis':'경극간근','interspinales lumborum':'요극간근',
  'anterior cervical intertransversarii':'전경횡돌기간근','posterior cervical intertransversarii':'후경횡돌기간근',
  'lumbricals of hand':'수충양근',

  // Principal nerves, plexuses and central nervous system.
  'median nerve':'정중신경','ulnar nerve':'척골신경','radial nerve':'요골신경',
  'musculocutaneous nerve':'근피신경','axillary nerve':'액와신경','femoral nerve':'대퇴신경',
  'sciatic nerve':'좌골신경','tibial nerve':'경골신경','common fibular nerve':'총비골신경',
  'deep fibular nerve':'심비골신경','superficial fibular nerve':'천비골신경',
  'sural nerve':'비복신경','saphenous nerve':'복재신경','pudendal nerve':'음부신경',
  'obturator nerve':'폐쇄신경','genitofemoral nerve':'음부대퇴신경',
  'ilio-inguinal nerve':'장골서혜신경','iliohypogastric nerve':'장골하복신경',
  'posterior femoral cutaneous nerve':'후대퇴피신경','lateral femoral cutaneous nerve':'외측대퇴피신경',
  'lateral antebrachial cutaneous nerve':'외측전완피신경','medial antebrachial cutaneous nerve':'내측전완피신경',
  'posterior antebrachial cutaneous nerve':'후전완피신경','medial brachial cutaneous nerve':'내측상완피신경',
  'inferior lateral brachial cutaneous nerve':'하외측상완피신경','superior lateral brachial cutaneous nerve':'상외측상완피신경',
  'medial sural cutaneous nerve':'내측비복피신경','intermediate dorsal cutaneous nerve of foot':'중간족배피신경',
  'medial dorsal cutaneous nerve of foot':'내측족배피신경',
  'brachial plexus':'상완신경총','sympathetic trunk':'교감신경간','sympathetic nerves':'교감신경',
  'spinal nerve':'척수신경','spinal ganglion':'척수신경절','ciliary ganglion':'섬모체신경절',
  'brachium of superior colliculus':'상구완','brachium of inferior colliculus':'하구완',
  'ophthalmic nerve':'안신경','optic nerve':'시신경','oculomotor nerve':'동안신경',
  'trochlear nerve':'활차신경','glossopharyngeal nerve (ix)':'설인신경(IX)',
  'vagus nerve (x)':'미주신경(X)','accessory nerve (xi)':'부신경(XI)',
  'nasociliary nerve':'비모양체신경','lacrimal nerve':'누선신경','frontal nerve':'전두신경',
  'infratrochlear nerve':'활차하신경','supra-orbital nerve':'안와상신경','supratrochlear nerve':'활차상신경',
  'anterior ethmoidal nerve':'전사골신경','posterior ethmoidal nerve':'후사골신경',
  'long ciliary nerve':'장섬모체신경','short ciliary nerve':'단섬모체신경',
  'dorsal scapular nerve':'견갑배신경','long thoracic nerve':'장흉신경',
  'thoracodorsal nerve':'흉배신경','suprascapular nerve':'견갑상신경',
  'superior subscapular nerve':'상견갑하신경','inferior subscapular nerve':'하견갑하신경',
  'lateral pectoral nerve':'외측흉근신경','medial pectoral nerve':'내측흉근신경',
  'superior gluteal nerve':'상둔신경','subclavian nerve':'쇄골하근신경',
  'lateral plantar nerve':'외측족저신경','medial plantar nerve':'내측족저신경',
  'intercostal nerves':'늑간신경','cauda equina':'마미',
  'amygdala':'편도체','angular gyrus':'각회','caudate nucleus':'미상핵',
  'cingulate gyrus':'대상회','corpus callosum':'뇌량','cerebellum':'소뇌',
  'cerebral aqueduct':'중뇌수도','central canal':'중심관','central canal of spinal cord':'척수중심관',
  'cuneate fasciculus':'설상속','gracile fasciculus':'박속','fornix of forebrain':'뇌궁',
  'fusiform gyrus':'방추상회','globus pallidus':'담창구','habenula':'고삐',
  'hippocampus':'해마','hypothalamus':'시상하부','insula':'섬엽',
  'internal capsule':'내포','interpeduncular fossa':'각간와','lamina terminalis':'종판',
  'lateral geniculate body':'외측슬상체','medial geniculate body':'내측슬상체',
  'mammillary body':'유두체','medulla oblongata':'연수','midbrain':'중뇌',
  'occipital lobe':'후두엽','optic chiasm':'시교차','optic tract':'시삭',
  'pons':'교뇌','putamen':'피각','thalamus':'시상',
  'tuber cinereum':'회백융기','stria terminalis':'분계선조','tentorium cerebelli':'소뇌천막',
  'intermediolateral nucleus':'중간외측핵','intermediomedial nucleus':'중간내측핵',
  'nucleus proprius':'고유핵','spinal dura':'척수경막','spinal reticular process':'척수망상돌기',
  'anterior commissure':'전교련','posterior commissure':'후교련',
  'anterior corticospinal tract':'전피질척수로','lateral corticospinal tract':'외측피질척수로',
  'anterior spinocerebellar tract':'전척수소뇌로','posterior spinocerebellar tract':'후척수소뇌로',
  'anterior spinothalamic tract':'전척수시상로','lateral spinothalamic tract':'외측척수시상로',
  'lateral reticulospinal tract':'외측망상척수로','medial reticulospinal tract':'내측망상척수로',
  'lateral vestibulospinal tract':'외측전정척수로','medial vestibulospinal tract':'내측전정척수로',
  'rubrospinal tract':'적핵척수로','tectospinal tract':'덮개척수로','spinotectal tract':'척수덮개로',
  'posterolateral tract':'후외측로','lateral fasciculus proprius':'외측고유속',
  'anterior fasciculus proprius':'전고유속','posterior fasciculus proprius':'후고유속',
  'white matter of cerebral hemisphere':'대뇌반구 백질','white matter of spinal cord':'척수백질',
  'cingulate gyrus':'대상회','parahippocampal gyrus':'해마방회',
  'precentral gyrus':'중심전회','postcentral gyrus':'중심후회',
  'supramarginal gyrus':'연상회','orbital gyrus':'안와회',
  'inferior colliculus':'하구','superior colliculus':'상구',
  'peduncle of midbrain':'대뇌각','septum of telencephalon':'종뇌중격',
  'lateral intermediate substance':'외측중간질','ganglia of sympathetic trunk':'교감신경간신경절',
  'brachium':'팔','posterior horn':'후각','anterior horn':'전각',
  'posterior horn of spinal cord':'척수후각','anterior horn of spinal cord':'척수전각',
  'stria medullaris of thalamus':'시상수질선조','posterior interosseous nerve of forearm':'후골간신경',
  'anterior interosseous nerve of forearm':'전골간신경','posterior cord of brachial plexus':'상완신경총 후속',
  'roots of brachial plexus':'상완신경총 신경근','infrapatellar branch':'슬개하분지',
  'genital branch':'생식지','femoral branch':'대퇴지','sural communicating branch':'비복교통지',
  'nerve to piriformis muscle':'이상근신경','nerve to quadratus femoris muscle':'대퇴방형근신경',
  'communicating branch of median nerve with ulnar nerve':'정중·척골신경 교통지',
  'communicating branch of nasociliary nerve with ciliary ganglion':'비모양체신경·섬모체신경절 교통지',

  // Skeleton and supporting tissue.
  'atlas':'환추','axis':'축추','femur':'대퇴골','fibula':'비골','tibia':'경골',
  'humerus':'상완골','radius':'요골','ulna':'척골','scapula':'견갑골','clavicle':'쇄골',
  'patella':'슬개골','hip bone':'관골','mandible':'하악골','maxilla':'상악골',
  'sacrum':'천골','calcaneus':'종골','talus':'거골','frontal bone':'전두골',
  'parietal bone':'두정골','temporal bone':'측두골','occipital bone':'후두골',
  'sphenoid bone':'접형골','ethmoid':'사골','vomer':'서골','nasal bone':'비골(코뼈)',
  'zygomatic bone':'협골','palatine bone':'구개골','hyoid bone':'설골',
  'sternum':'흉골','body of sternum':'흉골체','manubrium':'흉골병','xiphoid process':'검상돌기',
  'scaphoid':'주상골','lunate':'월상골','triquetral':'삼각골','pisiform':'두상골',
  'trapezium':'대능형골','trapezoid':'소능형골','capitate':'유두골','hamate':'유구골',
  'cuboid bone':'입방골','medial cuneiform bone':'내측설상골',
  'intermediate cuneiform bone':'중간설상골','lateral cuneiform bone':'외측설상골',
  'navicular bone of foot':'족주상골','sesamoid bone of foot':'종자골',
  'arytenoid cartilage':'피열연골','cricoid cartilage':'윤상연골','thyroid cartilage':'갑상연골',
  'cuneiform cartilage':'설상연골','corniculate cartilage':'소각연골','major alar cartilage':'대비익연골',
  'intervertebral disk':'추간판','intervertebral disc':'추간판',
  'gingiva of upper jaw':'상악치은','gingiva of lower jaw':'하악치은',
  'iliotibial tract':'장경인대','inguinal ligament':'서혜인대','calcaneal tendon':'아킬레스건',
  'linea alba':'백선','aponeurosis of epicranius':'모상건막',
  'anterior longitudinal ligament':'전종인대','posterior longitudinal ligament':'후종인대',
  'ligamenta flava':'황색인대','nuchal ligament':'항인대','supraspinous ligament':'극상인대',
  'interspinous ligaments':'극간인대','intertransverse ligaments':'횡돌기간인대',
  'anterior sacro-iliac ligament':'전천장인대','posterior sacro-iliac ligament':'후천장인대',
  'interosseous sacro-iliac ligament':'골간천장인대','sacrospinous ligament':'천극인대',
  'sacrotuberous ligament':'천결절인대','iliolumbar ligament':'장요인대',
  'costotransverse ligament':'늑횡돌인대','long plantar ligament':'장족저인대',
  'stylohyoid ligament':'경돌설골인대','hyo-epiglottic ligament':'설골후두개인대',
  'lateral thyrohyoid ligament':'외측갑상설골인대','median thyrohyoid ligament':'정중갑상설골인대',
  'median cricothyroid ligament':'정중윤상갑상인대','thyro-epiglottic ligament':'갑상후두개인대',
  'vocal ligament':'성대인대','thyrohyoid membrane':'갑상설골막','conus elasticus':'탄성원추',
  'pterygomandibular raphe':'익돌하악봉선','pharyngeal raphe':'인두봉선',
  'flexor retinaculum of wrist':'수근굴근지대','interosseous membrane of forearm':'전완골간막',
  'interosseous membrane of leg':'하퇴골간막','intermediate tendon':'중간건',
  'tendinous arch of levator ani':'항문거근 건궁',
  'check ligament':'제어인대','trochlea':'활차','anterior chamber':'전방',
  'suspensory ligament':'현수인대','superior oblique':'상사근','lateral rectus':'외직근',
  'medial rectus':'내직근','levator palpebrae superioris':'상안검거근',
  'big toe':'엄지발가락','second toe':'둘째발가락','third toe':'셋째발가락',
  'fourth toe':'넷째발가락','little toe':'새끼발가락','thumb':'엄지손가락',
  'index finger':'집게손가락','middle finger':'가운뎃손가락',
  'ring finger':'약지','little finger':'새끼손가락','foot':'발','hand':'손',

  // Clinically familiar vessel names.
  'aorta':'대동맥','abdominal aorta':'복부대동맥','ascending aorta':'상행대동맥',
  'descending aorta':'하행대동맥','descending thoracic aorta':'하행흉부대동맥','arch of aorta':'대동맥궁',
  'pulmonary trunk':'폐동맥간','pulmonary artery':'폐동맥','celiac trunk':'복강동맥',
  'celiac artery':'복강동맥','costocervical trunk':'늑경동맥간','thyrocervical trunk':'갑상경동맥간',
  'brachiocephalic artery':'완두동맥','brachiocephalic vein':'완두정맥',
  'common carotid artery':'총경동맥','internal carotid artery':'내경동맥',
  'vertebral artery':'추골동맥','subclavian artery':'쇄골하동맥','subclavian vein':'쇄골하정맥',
  'axillary artery':'액와동맥','axillary vein':'액와정맥',
  'brachial artery':'상완동맥','deep brachial artery':'심상완동맥','radial artery':'요골동맥',
  'ulnar artery':'척골동맥','femoral artery':'대퇴동맥','femoral vein':'대퇴정맥',
  'deep femoral vein':'심대퇴정맥','popliteal artery':'슬와동맥','popliteal vein':'슬와정맥',
  'anterior tibial artery':'전경골동맥','posterior tibial artery':'후경골동맥',
  'anterior tibial vein':'전경골정맥','posterior tibial vein':'후경골정맥',
  'fibular artery':'비골동맥','fibular vein':'비골정맥',
  'great saphenous vein':'대복재정맥','small saphenous vein':'소복재정맥',
  'basilic vein':'척측피정맥','cephalic vein':'요측피정맥',
  'median cubital vein':'정중주정맥','median antebrachial vein':'정중전완정맥',
  'internal jugular vein':'내경정맥','superior vena cava':'상대정맥','inferior vena cava':'하대정맥',
  'portal vein':'문맥','hepatic portal vein':'간문맥','coronary sinus':'관상정맥동',
  'internal thoracic artery':'내흉동맥','internal thoracic vein':'내흉정맥',
  'thoraco-acromial artery':'흉견봉동맥','lateral circumflex femoral artery':'외측대퇴회선동맥',
  'medial circumflex femoral artery':'내측대퇴회선동맥',
  'lateral circumflex femoral vein':'외측대퇴회선정맥','medial circumflex femoral vein':'내측대퇴회선정맥',
  'anterior cerebral artery':'전대뇌동맥','middle cerebral artery':'중대뇌동맥','posterior cerebral artery':'후대뇌동맥',
  'anterior communicating artery':'전교통동맥','posterior communicating artery':'후교통동맥',
  'anterior inferior cerebellar artery':'전하소뇌동맥','posterior inferior cerebellar artery':'후하소뇌동맥',
  'superior cerebellar artery':'상소뇌동맥','basilar artery':'기저동맥',
  'anterior spinal artery':'전척수동맥','ophthalmic artery':'안동맥',
  'renal artery':'신동맥','renal vein':'신정맥','splenic artery':'비동맥','splenic vein':'비정맥',
  'hepatic vein':'간정맥','middle hepatic vein':'중간간정맥',
  'superior mesenteric artery':'상장간막동맥','inferior mesenteric artery':'하장간막동맥',
  'superior mesenteric vein':'상장간막정맥','inferior mesenteric vein':'하장간막정맥',
  'dorsalis pedis artery':'족배동맥','plantar arch':'족저동맥궁',
  'deep palmar arch':'심장측동맥궁','deep palmar venous arch':'심장측정맥궁',
  'superficial palmar arterial arch':'천장측동맥궁','superficial palmar venous arch':'천장측정맥궁',
  'dorsal venous arch of foot':'족배정맥궁','plantar venous arch of foot':'족저정맥궁',
  'dorsal venous network of hand':'수배정맥망',
  'arcuate artery':'궁상동맥','thalamogeniculate artery':'시상슬상체동맥',
  'thalamoperforating artery':'시상관통동맥','splenial artery':'뇌량팽대동맥',
  'pontine artery':'교뇌동맥','precuneal branch':'설전부 분지','paracentral branch':'방중심 분지',
  'postcommunicating part':'교통후부','precommunicating part':'교통전부',
  'sphenoid part':'접형골부','insular part':'섬엽부','inferior terminal branch':'하종말지',
  'posterior limb':'후각','internal capsule':'내포','central sulcus':'중심구',
  'precentral sulcus':'중심전구','postcentral sulcus':'중심후구',
  'dorsal digital artery of foot':'족배지동맥','plantar digital arteries proper':'고유족저지동맥',
  'plantar digital artery proper':'고유족저지동맥',
  'superior vermian branch':'상충부지','medial branch':'내측지',
  'inferior thyroid artery':'하갑상동맥','anterior circumflex humeral artery':'전상완회선동맥',
  'posterior circumflex humeral artery':'후상완회선동맥','anterior circumflex humeral vein':'전상완회선정맥',
  'arteria radialis indicis':'시지요측동맥','arteria princeps pollicis':'무지주동맥',
  'proper palmar digital artery':'고유장측지동맥','proper palmar digital vein':'고유장측지정맥',
  'anterior interventricular artery':'전심실간동맥','anterior interventricular branch':'전심실간지',
  'posterior interventricular artery':'후심실간동맥','posterior interventricular branch':'후심실간지',
  'left coronary artery':'좌관상동맥','right coronary artery':'우관상동맥',
  'septal branch':'중격지','diagonal branch':'대각지','conus branch':'원추지',
  'conus artery':'원추동맥','caudate lobe branch':'미상엽지',
  'caudal pancreatic artery':'췌미동맥','great pancreatic artery':'대췌동맥',
  'hepatic artery proper':'고유간동맥','dorsal artery of penis':'음경배동맥',
  'marginal artery of colon':'결장변연동맥',
  'accessory hemiazygos vein':'부반기정맥','azygos vein':'기정맥','hemiazygos vein':'반기정맥',
  'deep dorsal vein of penis':'음경심배정맥','superficial dorsal vein of penis':'음경천배정맥',
  'dorsal metatarsal veins of foot':'족배중족정맥',
  'great cardiac vein':'대심정맥','middle cardiac vein':'중간심정맥','small cardiac vein':'소심정맥',
  'pre-hepatic portal vein':'간전문맥','iliolumbar vein':'장요정맥',
  'internal pudendal vein':'내음부정맥','obturator vein':'폐쇄정맥',
  'median sacral vein':'정중천골정맥',

  // Organs and the remaining anatomical systems.
  'heart':'심장','kidney':'신장','ureter':'요관','urethra':'요도','urinary bladder':'방광',
  'spleen':'비장','lobe of thymus':'흉선엽','adrenal gland':'부신','pineal body':'송과체','pituitary gland':'뇌하수체',
  'stomach':'위','esophagus':'식도','duodenum':'십이지장','jejunum':'공장','ileum':'회장',
  'pancreas':'췌장','liver':'간','gallbladder':'담낭','appendix':'충수','rectum':'직장',
  'ascending colon':'상행결장','descending colon':'하행결장','transverse colon':'횡행결장',
  'ileocecal junction':'회맹접합부','mesentery of small intestine':'소장간막','mesoappendix':'충수간막',
  'pancreatic duct':'췌관','pancreatic duct tree':'췌관계','common hepatic duct':'총간관','cystic duct':'담낭관',
  'hepatic duct':'간관','submandibular gland':'악하선','sublingual gland':'설하선',
  'tongue':'혀','taenia libera':'자유결장띠','taenia mesocolica':'장간막결장띠','taenia omentalis':'대망결장띠',
  'transverse mesocolon':'횡행결장간막','main bronchus':'주기관지','main bronchus proper':'고유주기관지',
  'trachea':'기관','pleura':'흉막','epiglottis':'후두개','inferior nasal concha':'하비갑개',
  'lateral nasal cartilage':'외측비연골','septal nasal cartilage':'비중격연골',
  'prostate':'전립선','testis':'고환','epididymis':'부고환','deferent duct':'정관',
  'seminal vesicle':'정낭','glans penis':'귀두','corpus cavernosum of penis':'음경해면체',
  'corpus spongiosum of penis':'요도해면체',
  'skin':'피부','hair of head':'두발','pubic hair':'음모','eyebrow':'눈썹','lip':'입술',
  'cornea':'각막','sclera':'공막','iris':'홍채','lens':'수정체','choroid':'맥락막',
  'vitreous body':'유리체','external ear':'외이','lacrimal bone':'누골',
  'lacrimal gland':'누선','lacrimal sac':'누낭','lacrimal lake':'누호',
  'lacrimal canaliculus':'누소관','nasolacrimal duct':'비루관',
  'common tendinous ring':'총건륜','corona ciliaris':'섬모체관',
  'retina':'망막','eyeball':'안구','cerebral hemisphere':'대뇌반구',
  'lower eyelid':'하안검','upper eyelid':'상안검','tarsal plate':'검판',
  'aortic valve':'대동맥판','pulmonary valve':'폐동맥판','mitral valve':'승모판','tricuspid valve':'삼첨판',
  'atrium':'심방','ventricle':'심실','left atrium':'좌심방','right atrium':'우심방',
  'left ventricle':'좌심실','right ventricle':'우심실','lateral ventricle':'측뇌실',
  'third ventricle':'제3뇌실','fourth ventricle':'제4뇌실','interventricular foramen':'뇌실간공',
  'septal leaflet':'중격엽','caudate lobe':'미상엽','hepatic biliary tree':'간담도계',
  'parenchyma':'실질','pancreas':'췌장','biliary tree':'담도계',
};

// These pieces are productive in source names such as “third posterior intercostal artery”.
const modifier = {
  anterior:'전',posterior:'후',superior:'상',inferior:'하',middle:'중',medial:'내측',lateral:'외측',left:'좌',right:'우',
  internal:'내',external:'외',deep:'심',superficial:'천',common:'총',accessory:'부',proper:'고유',
  central:'중심',intermediate:'중간',upper:'상',lower:'하',ascending:'상행',descending:'하행',
  dorsal:'배측',palmar:'장측',plantar:'족저',proximal:'근위',distal:'원위',
  apical:'첨',basal:'기저',segmental:'구역',lobar:'엽',lingular:'설상',
  thoracic:'흉',abdominal:'복',cervical:'경',lumbar:'요',sacral:'천',iliac:'장골',
  femoral:'대퇴',brachial:'상완',radial:'요골',ulnar:'척골',tibial:'경골',fibular:'비골',
  interosseous:'골간',intercostal:'늑간',metacarpal:'중수',metatarsal:'중족',carpal:'수근',tarsal:'족근',
  digital:'지',plantar:'족저',venous:'정맥',arterial:'동맥',pulmonary:'폐',cardiac:'심',
  hepatic:'간',renal:'신',gastric:'위',pancreatic:'췌',splenic:'비',colic:'결장',
  cerebral:'대뇌',cerebellar:'소뇌',spinal:'척수',temporal:'측두',occipital:'후두',frontal:'전두',
  parietal:'두정',ophthalmic:'안',nasal:'비',ethmoidal:'사골',choroidal:'맥락막',
  pericallosal:'뇌량주위',callosomarginal:'뇌량변연',thalamic:'시상',hypothalamic:'시상하부',
  ventricular:'심실',interventricular:'심실간',coronary:'관상',circumflex:'회선',recurrent:'반회',
  perforating:'관통',collateral:'측부',marginal:'변연',transverse:'횡',longitudinal:'종',
  posteriorly:'후',anteriorly:'전',rectal:'직장',testicular:'고환',ureteric:'요관',
  genicular:'슬',gluteal:'둔',calcaneal:'종골',suprascapular:'견갑상',subscapular:'견갑하',scapular:'견갑',
  axillary:'액와',pectoral:'흉근',sural:'비복',antebrachial:'전완',cutaneous:'피',
  muscular:'근',facial:'안면',angular:'각',polar:'극',prefrontal:'전두전',
  sigmoid:'S상결장',bronchial:'기관지',esophageal:'식도',oesophageal:'식도',
  phrenic:'횡격막',suprarenal:'부신',epigastric:'상복벽',mesenteric:'장간막',
  pancreaticoduodenal:'췌십이지장',gastroduodenal:'위십이지장',gastroepiploic:'위대망',
  'gastro-epiploic':'위대망',ileocolic:'회결장',ileal:'회장',cecal:'맹장',appendicular:'충수',
  costocervical:'늑경',thyrocervical:'갑상경',musculophrenic:'근횡격막',
  thoracodorsal:'흉배', 'thoraco-acromial':'흉견봉',acromial:'견봉',deltoid:'삼각근',
  dorsalis:'배측',pedis:'족',palatine:'구개',ciliary:'섬모체',optic:'시',
  crural:'하퇴',palmaris:'장',anteriorly:'전',intermediomedial:'중간내측',
  anterolateral:'전외측',posteromedial:'후내측',laterobasal:'외측기저',mediobasal:'내측기저',
  frontobasal:'전두기저',temporoooccipital:'측두후두', 'temporo-occipital':'측두후두',
  subcostal:'늑하',supratrochlear:'활차상',infratrochlear:'활차하',
  pontine:'교뇌',splenial:'뇌량팽대',thalamogeniculate:'시상슬상체',thalamoperforating:'시상관통',
  precuneal:'설전부',paracentral:'방중심',insular:'섬엽',sphenoid:'접형골',
  caudate:'미상',caudal:'미측',great:'대',small:'소',prehepatic:'간전', 'pre-hepatic':'간전',
  azygos:'기',hemiazygos:'반기',pudendal:'음부',obturator:'폐쇄',iliolumbar:'장요',
  'subsuperior':'상하',septal:'중격',posterolateral:'후외측',
};
const ordinal = {first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,eleventh:11,twelfth:12};
const noun = {artery:'동맥',arteries:'동맥',vein:'정맥',veins:'정맥',nerve:'신경',nerves:'신경',
  muscle:'근',muscles:'근',ligament:'인대',ligaments:'인대',bone:'골',cartilage:'연골',
  duct:'관',tree:'계',bronchus:'기관지',membrane:'막',tendon:'건',plexus:'신경총',
  ganglion:'신경절',gyrus:'회',nucleus:'핵',fasciculus:'속',tract:'로',
  arch:'궁',network:'망',lobe:'엽',lobule:'소엽',gland:'선',body:'체',
  sinus:'동',canal:'관',foramen:'공',horn:'각',commissure:'교련',
  sulcus:'구',branch:'분지',branches:'분지',segment:'구역',part:'부',head:'두',root:'근',
  trunk:'간',division:'분할부',tributary:'유입지',wall:'벽',cavity:'강',
  leaflet:'엽',cusp:'첨판',ring:'륜',plate:'판',surface:'면',process:'돌기',
  junction:'접합부',fossa:'와',substance:'질',peduncle:'각',
};

function modifierPhrase(english) {
  const words = english.split(/[\s-]+/).filter(Boolean);
  if (!words.length) return null;
  const out = words.map(word => modifier[word] ?? (ordinal[word] ? `제${ordinal[word]}` : null));
  return out.every(Boolean) ? out.join('') : null;
}

function translateCore(raw, fallback, depth=0) {
  if (depth>8) return null;
  const name=raw.toLowerCase().replace(/\s+/g,' ').trim();
  if (!name) return null;
  if (exact[name]) return exact[name];
  if (fallback?.[name]) return fallback[name];

  let match=name.match(/^intervertebral disc ([ctl]\d+-[ctls]\d+)$/);
  if(match) return `제${match[1].toUpperCase()} 추간판`;
  match=name.match(/^hepatovenous segment (i{1,3}|iv|v|vi{0,3}|ix|x)$/);
  if(match) return `간정맥 제${match[1].toUpperCase()}구역`;
  match=name.match(/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) (cervical|thoracic|lumbar) vertebra$/);
  if(match) return `제${ordinal[match[1]]}${({cervical:'경',thoracic:'흉',lumbar:'요'})[match[2]]}추`;
  match=name.match(/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) (rib|costal cartilage|metacarpal bone|metatarsal bone)$/);
  if(match) return `제${ordinal[match[1]]}${({rib:'늑골','costal cartilage':'늑연골','metacarpal bone':'중수골','metatarsal bone':'중족골'})[match[2]]}`;
  match=name.match(/^(proximal|middle|distal) phalanx of (.+)$/);
  if(match){const digit=translateCore(match[2],fallback,depth+1);return digit?`${digit} ${({proximal:'근위',middle:'중위',distal:'원위'})[match[1]]}지골`:null;}
  match=name.match(/^(upper|lower) (central|lateral|first|second)? ?secondary (incisor|molar|premolar|canine) tooth$/);
  if(match){const jaw=match[1]==='upper'?'상악':'하악',position=({central:'중',lateral:'측',first:'제1',second:'제2'})[match[2]]??'',type=({incisor:'절치',molar:'대구치',premolar:'소구치',canine:'견치'})[match[3]];return `${jaw}${position}${type}`;}
  match=name.match(/^set of (.+)$/);
  if(match){const singular=match[1].replace(/\b(arteries|veins|nerves|branches|interossei|lumbricals|ligaments)\b/g,word=>({arteries:'artery',veins:'vein',nerves:'nerve',branches:'branch',interossei:'interossei',lumbricals:'lumbricals',ligaments:'ligament'})[word]);const translated=translateCore(singular,fallback,depth+1);return translated?`${translated}군`:null;}
  match=name.match(/^(first|second|third|fourth) (.+)$/);
  if(match){const translated=translateCore(match[2],fallback,depth+1);return translated?`제${ordinal[match[1]]}${translated}`:null;}
  match=name.match(/^branch of (.+) to (.+)$/);
  if(match){const source=translateCore(match[1],fallback,depth+1),target=translateCore(match[2],fallback,depth+1);return source&&target?`${target}행 ${source} 분지`:null;}
  match=name.match(/^trunk of (.+)$/);
  if(match){const translated=translateCore(match[1],fallback,depth+1);return translated?`${translated} 주간부`:null;}
  match=name.match(/^(.+?) of (.+)$/);
  if(match){
    const left=translateCore(match[1],fallback,depth+1),right=translateCore(match[2],fallback,depth+1);
    if(left&&right){
      // A part or branch of a named structure is rendered as a relation, not a new organ.
      return `${right}의 ${left}`;
    }
  }
  const words=name.split(' ');
  if(words.length>1){
    const last=words.at(-1),stem=words.slice(0,-1).join(' ');
    if(noun[last]){const mod=modifierPhrase(stem)??translateCore(stem,fallback,depth+1);if(mod)return `${mod}${noun[last]}`;}
    for(let i=words.length-1;i>0;i--){const suffix=words.slice(i).join(' '),prefix=words.slice(0,i).join(' '),known=exact[suffix]??fallback?.[suffix];if(known){const mod=modifierPhrase(prefix);if(mod)return `${mod}${known}`;}}
    const all=modifierPhrase(name);if(all)return all;
  }
  return noun[name]??modifier[name]??null;
}

/** Returns a Korean label, or null when a source term needs manual review. */
export function koreanAnatomyName(source, fallback) {
  let name=source.trim(),side='';
  const sides=[...name.matchAll(/\b(left|right)\b/gi)].map(x=>x[1].toLowerCase());
  if(sides.length && sides.every(x=>x===sides[0])){
    side=sides[0]==='left'?'좌측 ':'우측 ';
    name=name.replace(/\b(left|right)\b\s*/gi,' ').replace(/\s+/g,' ').trim();
  }
  // Some Z-Anatomy names carry l/r as an unseparated side suffix.
  const suffix=name.match(/^(.*(?:ligament|ligaments))([lr])$/i);
  if(suffix){name=suffix[1];side=suffix[2].toLowerCase()==='l'?'좌측 ':'우측 ';}
  if(name.startsWith('(')&&name.endsWith(')'))name=name.slice(1,-1);
  const korean=translateCore(name,fallback);
  return korean?`${side}${korean}`:null;
}
