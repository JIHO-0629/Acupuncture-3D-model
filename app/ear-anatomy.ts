import * as T from 'three';
import landmarkData from '../data/landmarks.json';

/**
 * External ear (auricle) presentation and landmark anchors.
 *
 * BodyParts3D ships one coarse combined "External ear" mesh (FJ2811, 1350 faces
 * for both sides) and the skin mesh has no auricle at all, so the ear-adjacent
 * acupoints (SI19, TE21, GB2, TE17, GB12) had nothing reliable to anchor to.
 * This module builds a clean atlas-grade auricle per side whose geometry is
 * organised around the anatomical anchors those points need, and exposes the
 * anchors as world-frame coordinates for the acupoint pipeline.
 *
 * Anchor derivation (measured on the packed atlas, right side, mm):
 * - The external acoustic pore is a hole in the lateral temporal surface at
 *   y≈1589, z≈-20 (only deep vertices, |x|≈42, between lateral vertices at 64).
 *   The native ear mesh has its deepest (conchal) vertices in the same cell.
 * - The mandibular condyle sits 14 mm anterior at the same height; the mastoid
 *   tip 19 mm below and 36 mm posterior; the zygomatic arch runs anteriorly at
 *   the same height. That is the Frankfort relation the auricle is built on.
 * - Skin over the pore is at |x|≈68, sloping out to 77 at the helix root and in
 *   to 62 at the lobule, so the auricle leans laterally with the skull.
 * The earlier "external_acoustic_meatus" landmark (y 1.619) was the squama
 * above the pore, and "auricular_apex" (y 1.669) the parietal skin: both sat
 * 30 mm too high and are not used here.
 */

export const NATIVE_EAR_PART_ID='FJ2811';

export const EAR_STRUCTURES = [
 ['helix','Helix','이륜'],['antihelix','Antihelix','대이륜'],['tragus','Tragus','이주'],
 ['antitragus','Antitragus','대이주'],['intertragic-notch','Intertragic notch','이주간절흔'],
 ['concha','Concha','이갑개'],['external-acoustic-meatus','External acoustic meatus opening','외이도 입구'],
 ['lobule','Lobule','귓불'],['crus-of-helix','Crus of helix','이륜각'],
] as const;

export const EAR_BONY_CONTEXT = [
 {name:'Mandibular condyle',source:'Mandible',status:'contained'},
 {name:'TMJ',source:'Mandible + Temporal bone',status:'derived'},
 {name:'Mastoid process',source:'Temporal bone',status:'contained'},
 {name:'Zygomatic arch',source:'Temporal bone + Zygomatic bone',status:'contained'},
 {name:'Mandibular ramus / posterior border',source:'Mandible',status:'contained'},
 {name:'Temporal bone',source:'Right/Left temporal bone',status:'native'},
] as const;

export type EarSide='right'|'left';
type Side=EarSide;
type Mm=[number,number,number]; // auricle frame, millimetres: [anterior, superior, lateral]

/** Meatus opening on the skin surface: the origin of the auricle frame (metres, right side). */
const MEATUS_SKIN={lateral:.067,y:1.589,z:-.020};
/** Bony pore, 4 mm deep to the skin opening. */
const MEATUS_PORE_DEPTH=.004;
/** Long axis leans posteriorly at the top (sagittal plane). */
const POSTERIOR_TILT_DEG=12;
/** Follows the skull, which widens above the ear: the helix root leans laterally. */
const LATERAL_LEAN_DEG=14;
/** Auriculocephalic projection about the anterior attachment line. */
const FLARE_DEG=25;
const FLARE_PIVOT_MM=6;

export const EAR_LANDMARK_IDS=[
 'externalAcousticMeatus','externalAcousticPore','tragus','supratragicNotch','intertragicNotch','antitragus',
 'lobule','lobuleInferiorTip','helixApex','helixPosterior','crusOfHelixRoot','conchaFloor',
 'mandibularCondyle','tmj','mastoidProcessTip','zygomaticArchMidpoint','ramusPosteriorBorder',
] as const;
export type EarLandmarkId=(typeof EAR_LANDMARK_IDS)[number];
export type EarLandmark={id:EarLandmarkId;korean:string;side:Side;point:T.Vector3;type:'auricular'|'bony'|'derived';source:string};
export type EarLandmarks=Record<Side,Record<EarLandmarkId,EarLandmark>>;

/** Auricle-frame landmark positions (mm). The auricle group maps these to the world frame. */
const AURICULAR_LANDMARKS:Record<string,{korean:string;at:Mm}>={
 externalAcousticMeatus:{korean:'외이도 입구',at:[0,-.5,-1.5]},
 conchaFloor:{korean:'이갑개 바닥',at:[-5,-2,-2.5]},
 tragus:{korean:'이주',at:[3.5,-1,7]},
 supratragicNotch:{korean:'이주상절흔',at:[5,7,1]},
 intertragicNotch:{korean:'이주간절흔',at:[4.5,-11.5,.5]},
 antitragus:{korean:'대이주',at:[-5,-12,6.6]},
 lobule:{korean:'귓불',at:[-2,-22,3.5]},
 lobuleInferiorTip:{korean:'귓불 하단',at:[-5,-29,1]},
 helixApex:{korean:'이륜 정점',at:[-13,31,5]},
 helixPosterior:{korean:'이륜 후연',at:[-25,8,5]},
 crusOfHelixRoot:{korean:'이륜각 기시',at:[5,7,5]},
};

type PointLandmark={id:string;side:Side|null;kind:string;point?:[number,number,number]};
const registered=(id:string,side:Side)=>{
 const found=(landmarkData.landmarks as PointLandmark[]).find(item=>item.id===id&&item.side===side);
 if(!found?.point)throw new Error(`Required point landmark is missing: ${id}/${side}`);
 return new T.Vector3().fromArray(found.point);
};

const meta=(id:string,english:string,korean:string,side:Side)=>({
 earStructure:id,english,korean,side,status:'anatomically-parameterized-unverified',
});
const rad=T.MathUtils.degToRad;

/**
 * Auricle outline in the auricle frame (mm, [anterior, superior]). One closed loop:
 * the C-shaped ring is traced from the tragus base up the free edge of the tragus,
 * around the conchal wall (crus root → cymba → posterior wall → antitragus), out
 * through the intertragic notch, then around the outer silhouette (lobule → posterior
 * helix → apex → ascending helix). The straight closing edge is the anterior
 * attachment line against the cheek, so the notch is a real gap in the rim and the
 * concha a real bowl that the separate floor fills.
 */
const OUTLINE:[number,number][]=[
 [6,-9],                       // tragus inferior base (anterior lip of the notch)
 [2.5,-6],[.5,-1],[2,4],       // free posterior edge of the tragus, overlying the meatus
 [2,7],[-3,10],[-9,11],        // crus root and the roof of the cymba conchae
 [-13,6],[-14,-1],[-12,-8],    // posterior conchal wall (antihelix base)
 [-7,-12],[-2,-14],            // antitragus
 [5,-15],                      // posterior lip of the notch at the lobule
 [7,-20],[3,-27],[-5,-29],     // lobule
 [-12,-25],[-18,-19],[-22,-12],// helix tail into the lobule
 [-24,-3],[-25,8],[-23,19],    // posterior helix
 [-20,28],[-13,31],[-6,28],    // superior helix and apex
 [-1,21],[3,13],[5,7],         // ascending helix down to the supratragic notch
];

const SKIN_COLOR=0xc9a086,RIDGE_COLOR=0xc19a80,RECESS_COLOR=0x96695c,OPENING_COLOR=0x2a1b19;

export function createExternalEarPresentation(){
 const root=new T.Group();root.name='External ear presentation';
 const skin=new T.MeshStandardMaterial({color:SKIN_COLOR,roughness:.86,metalness:0}),
  ridge=new T.MeshStandardMaterial({color:RIDGE_COLOR,roughness:.84,metalness:0}),
  recess=new T.MeshStandardMaterial({color:RECESS_COLOR,roughness:.95,metalness:0,side:T.DoubleSide}),
  opening=new T.MeshStandardMaterial({color:OPENING_COLOR,roughness:1,metalness:0});
 const materials=[skin,ridge,recess,opening];
 const sides=new Map<Side,T.Group>();
 const frames=new Map<Side,T.Object3D>();

 // Shared geometry: both auricles are the same shape in the auricle frame; the
 // side group carries the mirror, so the left ear is not a shifted copy.
 const shape=new T.Shape();
 shape.moveTo(...OUTLINE[0]);
 shape.splineThru(OUTLINE.slice(1).map(([x,y])=>new T.Vector2(x,y)));
 const plateGeometry=new T.ExtrudeGeometry(shape,{curveSegments:5,steps:1,depth:4,bevelEnabled:true,bevelSegments:3,bevelSize:1.5,bevelThickness:1.5});
 plateGeometry.computeVertexNormals();
 // Concave conchal floor: a spherical cap whose pole points medially, so the bowl
 // is a real depression bounded by the plate's inner walls.
 const capRadius=16,capTheta=.95;
 const floorGeometry=new T.SphereGeometry(capRadius,28,10,0,Math.PI*2,0,capTheta);
 floorGeometry.rotateX(-Math.PI/2); // +y pole → -z (medial)
 const tubeGeometry=(points:Mm[],radius:number)=>{
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal',.5);
  return new T.TubeGeometry(curve,Math.max(16,points.length*6),radius,8,false);
 };
 const geometries:T.BufferGeometry[]=[plateGeometry,floorGeometry];
 const shared={
  helix:tubeGeometry([[4,8,4.8],[2,13,5],[-2,20,5.1],[-6,26,5.1],[-12,29,5.1],[-19,26,5.1],[-23,18,5.1],[-24.5,8,5.1],[-24,-2,5],[-21,-10,4.8],[-17,-17,4.4],[-13,-21,3.8]],1.8),
  antihelixStem:tubeGeometry([[-9,-15,4.9],[-14,-9,5.3],[-17.5,0,5.4],[-18,8,5.3]],1.5),
  antihelixInferiorCrus:tubeGeometry([[-18,8,5.3],[-15,12,5.3],[-9,13.5,5.2],[-3,13,5]],1.15),
  antihelixSuperiorCrus:tubeGeometry([[-18,8,5.3],[-19,15,5.3],[-18,21,5.1],[-15.5,25,4.9]],1.1),
  crusOfHelix:tubeGeometry([[5,7,5],[1,5.5,4],[-3,4,3.1],[-7,3,2.4]],1.2),
 };
 Object.values(shared).forEach(g=>geometries.push(g));
 const ellipsoidGeometry=new T.SphereGeometry(1,18,12);
 geometries.push(ellipsoidGeometry);

 const ellipsoid=(id:string,en:string,ko:string,side:Side,at:Mm,scale:Mm,material:T.Material)=>{
  const object=new T.Mesh(ellipsoidGeometry,material);object.position.set(...at);object.scale.set(...scale);
  object.name=`${en} (${side})`;object.userData=meta(id,en,ko,side);return object;
 };
 const part=(geometry:T.BufferGeometry,id:string,en:string,ko:string,side:Side,material:T.Material)=>{
  const object=new T.Mesh(geometry,material);object.name=`${en} (${side})`;object.userData=meta(id,en,ko,side);return object;
 };

 for(const side of ['right','left'] as const){
  const sign=side==='right'?-1:1;
  // Side frame: auricle x → world +z (anterior), y → +y (superior), z → lateral.
  const group=new T.Group();group.name=`${side} auricle`;
  group.matrixAutoUpdate=false;
  group.matrix.makeBasis(new T.Vector3(0,0,1),new T.Vector3(0,1,0),new T.Vector3(sign,0,0));
  group.matrix.setPosition(sign*MEATUS_SKIN.lateral,MEATUS_SKIN.y,MEATUS_SKIN.z);
  // Orientation: flare about the anterior attachment line, lean with the skull,
  // then tilt the long axis posteriorly. (Applied right to left.)
  const pivot=FLARE_PIVOT_MM/1000;
  const orientation=new T.Object3D();orientation.name=`${side} auricle orientation`;
  orientation.matrixAutoUpdate=false;
  orientation.matrix
   .makeRotationZ(rad(POSTERIOR_TILT_DEG))
   .multiply(new T.Matrix4().makeRotationX(rad(LATERAL_LEAN_DEG)))
   .multiply(new T.Matrix4().makeTranslation(pivot,0,0))
   .multiply(new T.Matrix4().makeRotationY(rad(FLARE_DEG)))
   .multiply(new T.Matrix4().makeTranslation(-pivot,0,0));
  const frame=new T.Group();frame.name=`${side} auricle frame (mm)`;frame.scale.setScalar(.001);
  orientation.add(frame);group.add(orientation);root.add(group);
  sides.set(side,group);frames.set(side,frame);

  const plate=part(plateGeometry,'auricle','Auricle','귓바퀴',side,skin);
  plate.userData.landmarkCarrier=true;
  frame.add(plate);
  const floor=part(floorGeometry,'concha','Concha','이갑개',side,recess);
  floor.position.set(-5,-2,-2.5+capRadius);floor.scale.set(1,1.1,1);
  frame.add(floor);
  frame.add(ellipsoid('external-acoustic-meatus','External acoustic meatus opening','외이도 입구',side,[0,-.5,-1.5],[3.4,3,2.6],opening));
  frame.add(ellipsoid('tragus','Tragus','이주',side,[3.5,-1,3.2],[3,6,3.8],skin));
  frame.add(ellipsoid('antitragus','Antitragus','대이주',side,[-5,-12,3.2],[4.2,2.6,3.4],ridge));
  frame.add(ellipsoid('intertragic-notch','Intertragic notch','이주간절흔',side,[4.5,-11.5,-.5],[2.2,3,1.6],recess));
  frame.add(ellipsoid('lobule','Lobule','귓불',side,[-2,-22,2.5],[7,7.5,4],skin));
  frame.add(part(shared.helix,'helix','Helix','이륜',side,skin));
  frame.add(part(shared.antihelixStem,'antihelix','Antihelix','대이륜',side,ridge));
  frame.add(part(shared.antihelixInferiorCrus,'antihelix','Antihelix (inferior crus)','대이륜 하각',side,ridge));
  frame.add(part(shared.antihelixSuperiorCrus,'antihelix','Antihelix (superior crus)','대이륜 상각',side,ridge));
  frame.add(part(shared.crusOfHelix,'crus-of-helix','Crus of helix','이륜각',side,ridge));
 }
 root.updateMatrixWorld(true);

 const landmarks=computeLandmarks(frames);
 root.userData.landmarks=landmarks;
 return {root,sides,materials,geometries,landmarks};
}

function computeLandmarks(frames:Map<Side,T.Object3D>):EarLandmarks{
 const result={} as EarLandmarks;
 for(const side of ['right','left'] as const){
  const frame=frames.get(side)!,sign=side==='right'?-1:1;
  const entries={} as Record<EarLandmarkId,EarLandmark>;
  const put=(id:EarLandmarkId,korean:string,point:T.Vector3,type:EarLandmark['type'],source:string)=>{entries[id]={id,korean,side,point,type,source};};
  for(const [id,{korean,at}] of Object.entries(AURICULAR_LANDMARKS))
   put(id as EarLandmarkId,korean,frame.localToWorld(new T.Vector3(...at)),'auricular','auricle presentation (parameterised)');
  put('externalAcousticPore','외이공',new T.Vector3(sign*(MEATUS_SKIN.lateral-MEATUS_PORE_DEPTH),MEATUS_SKIN.y,MEATUS_SKIN.z),'bony','temporal bone lateral surface: hole at y≈1.589, z≈-0.020');
  const condyle=registered('mandibular_condyle',side),mastoid=registered('mastoid_process_tip',side),arch=registered('zygomatic_arch_midpoint',side);
  put('mandibularCondyle','하악 관절돌기',condyle,'bony','data/landmarks.json::mandibular_condyle');
  put('tmj','턱관절',condyle.clone().add(new T.Vector3(0,.003,0)),'derived','condyle head + 3 mm (joint space beneath the mandibular fossa)');
  put('mastoidProcessTip','유양돌기 첨',mastoid,'bony','data/landmarks.json::mastoid_process_tip');
  put('zygomaticArchMidpoint','관골궁 중점',arch,'bony','data/landmarks.json::zygomatic_arch_midpoint');
  // Ramus posterior border at the lobule level, measured on the mandible mesh (right, mm):
  // posterior-most ramus vertices run z -3 (y 1545) → -7 (y 1566) → -10 (y 1579) at x≈-45.
  put('ramusPosteriorBorder','하악지 후연',new T.Vector3(sign*.045,1.566,-.007),'bony','mandible mesh, posterior-most ramus vertices at y≈1.566');
  result[side]=entries;
 }
 return result;
}

/** World-frame anchor for ear-adjacent acupoint placement. */
export function earLandmark(landmarks:EarLandmarks,side:Side,id:EarLandmarkId):T.Vector3{
 return landmarks[side][id].point.clone();
}
