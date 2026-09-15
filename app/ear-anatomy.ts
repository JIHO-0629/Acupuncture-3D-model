import * as T from 'three';
import landmarkData from '../data/landmarks.json';

/**
 * External ear (auricle) presentation and landmark anchors.
 *
 * BodyParts3D ships one coarse combined "External ear" mesh (FJ2811, 1350 faces
 * for both sides) and the skin mesh has no auricle at all, so the ear-adjacent
 * acupoints (SI19, TE21, GB2, TE17, GB12) had nothing reliable to anchor to.
 * This module sculpts one smooth relief surface per side, in the skin's own
 * material, organised around the anatomical anchors those points need, and
 * exposes the anchors as world-frame coordinates for the acupoint pipeline.
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
 * - Lateral canthus (z +52) to tragus (z -13): 65 mm, inside the adult 60–75 mm
 *   canthus–tragus range; helix apex at brow level (y 1.615), lobule tip at the
 *   nasal base (y 1.559).
 * The earlier "external_acoustic_meatus" landmark (y 1.619) was the squama
 * above the pore, and "auricular_apex" (y 1.669) the parietal skin: both sat
 * 30 mm too high and are not used here.
 *
 * Orientation follows published auricular anthropometry: long-axis inclination
 * 15–20° posterior, auriculocephalic angle 20–30°, helix–mastoid distance under
 * 20 mm (Farkas; Journal of Craniofacial Surgery 2022 baseline study).
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
type Mm2=[number,number];

/** Meatus opening on the skin surface: the origin of the auricle frame (metres, right side). */
const MEATUS_SKIN={lateral:.067,y:1.589,z:-.020};
/** Bony pore, 4 mm deep to the skin opening. */
const MEATUS_PORE_DEPTH=.004;
/** Long axis leans posteriorly at the top (sagittal plane). */
const POSTERIOR_TILT_DEG=15;
/** Follows the skull, which widens above the ear: the helix root leans laterally. */
const LATERAL_LEAN_DEG=14;
/** Auriculocephalic projection about the anterior attachment line. */
const FLARE_DEG=27;
const FLARE_PIVOT_MM=6;

/** Same values as the integumentary material in scene.tsx, so the ear reads as skin. */
export const EAR_SKIN={color:'#c79d82',roughness:.82,metalness:0};

export const EAR_LANDMARK_IDS=[
 'externalAcousticMeatus','externalAcousticPore','tragus','supratragicNotch','intertragicNotch','antitragus',
 'lobule','lobuleInferiorTip','helixApex','helixPosterior','crusOfHelixRoot','conchaFloor',
 'mandibularCondyle','tmj','mastoidProcessTip','zygomaticArchMidpoint','ramusPosteriorBorder',
] as const;
export type EarLandmarkId=(typeof EAR_LANDMARK_IDS)[number];
export type EarLandmark={id:EarLandmarkId;korean:string;side:Side;point:T.Vector3;type:'auricular'|'bony'|'derived';source:string};
export type EarLandmarks=Record<Side,Record<EarLandmarkId,EarLandmark>>;

/** Auricle-frame landmark positions (mm) on the sculpted surface. */
const AURICULAR_LANDMARKS:Record<string,{korean:string;at:Mm}>={
 externalAcousticMeatus:{korean:'외이도 입구',at:[0,-.5,-6]},
 conchaFloor:{korean:'이갑개 바닥',at:[-5.5,-1,-4]},
 tragus:{korean:'이주',at:[3.5,-1,7]},
 supratragicNotch:{korean:'이주상절흔',at:[5,6.5,1]},
 intertragicNotch:{korean:'이주간절흔',at:[2,-7.5,-1]},
 antitragus:{korean:'대이주',at:[-5,-12,5]},
 lobule:{korean:'귓불',at:[-2,-21,3.7]},
 lobuleInferiorTip:{korean:'귓불 하단',at:[-5,-29,.5]},
 helixApex:{korean:'이륜 정점',at:[-13,30,4.7]},
 helixPosterior:{korean:'이륜 후연',at:[-23,8,4.7]},
 crusOfHelixRoot:{korean:'이륜각 기시',at:[5,8,3.7]},
};

type PointLandmark={id:string;side:Side|null;kind:string;point?:[number,number,number]};
const registered=(id:string,side:Side)=>{
 const found=(landmarkData.landmarks as PointLandmark[]).find(item=>item.id===id&&item.side===side);
 if(!found?.point)throw new Error(`Required point landmark is missing: ${id}/${side}`);
 return new T.Vector3().fromArray(found.point);
};
const rad=T.MathUtils.degToRad;

/**
 * Outer silhouette in the auricle frame (mm, [anterior, superior]), from the
 * lobule's anterior attachment along the free margin and back down the straight
 * attachment line against the cheek. Star-shaped about the conchal centre.
 */
const SILHOUETTE:Mm2[]=[
 [7,-22],[3,-27],[-5,-29],[-12,-25],[-18,-19],[-22,-12],   // lobule and helix tail
 [-24,-3],[-25,8],[-23,19],[-20,28],[-13,32],[-6,29],       // posterior and superior helix
 [-1,22],[3,14],[5,8],[6,0],[7,-10],                        // ascending helix, attachment line
];
const CONCHA_CENTRE:Mm2=[-5.5,-1];

/** Relief features (mm). Ridges are Gaussian tubes along polylines; pads and bowls are elliptical. */
const RIDGES:{points:Mm2[];sigma:number;height:number;fade?:'crus'}[]=[
 {points:[[4,9],[2,14],[-2,21],[-6,27],[-12,30],[-18,27],[-21.5,19],[-23,8],[-22.5,-3],[-20,-11],[-16,-18],[-12,-22]],sigma:2.2,height:3.2}, // helix
 {points:[[-8,-14],[-13,-9],[-16.5,0],[-17,8]],sigma:1.9,height:2.8},            // antihelix stem
 {points:[[-17,8],[-14,12],[-9,13.5],[-3,13]],sigma:1.5,height:2.2},             // inferior crus
 {points:[[-17,8],[-18,15],[-17,21],[-15,25]],sigma:1.4,height:2},               // superior crus
 {points:[[5,8],[1,6],[-3,4.5],[-7,3.5]],sigma:1.5,height:2.4,fade:'crus'},      // crus of helix into the concha
];
const PADS:{centre:Mm2;radii:Mm2;height:number}[]=[
 {centre:[3.5,-1],radii:[3.2,5.5],height:5.5},   // tragus
 {centre:[-5,-12],radii:[4.5,3],height:3.5},     // antitragus
 {centre:[-2,-21],radii:[8.5,8],height:2.2},     // lobule
];
const CONCHA={centre:CONCHA_CENTRE,radii:[9,11.5] as Mm2,depth:5.5};
const MEATUS={centre:[0,-.5] as Mm2,radius:3.6,depth:3.5};

const smoothstep=(a:number,b:number,x:number)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const segmentDistance=(px:number,py:number,ax:number,ay:number,bx:number,by:number)=>{
 const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?T.MathUtils.clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1):0;
 return Math.hypot(px-(ax+dx*t),py-(ay+dy*t));
};
const polylineDistance=(p:Mm2,points:Mm2[])=>{
 let best=Infinity;
 for(let i=1;i<points.length;i++)best=Math.min(best,segmentDistance(p[0],p[1],points[i-1][0],points[i-1][1],points[i][0],points[i][1]));
 return best;
};
const ellipse=(p:Mm2,centre:Mm2,radii:Mm2)=>{
 const s=Math.hypot((p[0]-centre[0])/radii[0],(p[1]-centre[1])/radii[1]);
 return s>=1?0:(1-s*s)*(1-s*s);
};

/** Height of the lateral surface and its shade at an auricle-frame point; t is the normalised radius. */
function relief(p:Mm2,t:number){
 const edge=1-smoothstep(.86,1,t),feature=1-smoothstep(.94,1,t),attach=1-smoothstep(4.5,7,p[0]);
 let height=1.6*edge*attach;
 for(const ridge of RIDGES){
  const d=polylineDistance(p,ridge.points);
  let h=ridge.height*Math.exp(-(d*d)/(ridge.sigma*ridge.sigma));
  if(ridge.fade==='crus')h*=T.MathUtils.clamp((p[0]+8)/12,.35,1);
  height+=h*feature*attach;
 }
 for(const pad of PADS)height+=pad.height*ellipse(p,pad.centre,pad.radii)*feature*attach;
 const bowl=ellipse(p,CONCHA.centre,CONCHA.radii);
 height-=CONCHA.depth*bowl;
 const s=Math.hypot(p[0]-MEATUS.centre[0],p[1]-MEATUS.centre[1])/MEATUS.radius,pit=s>=1?0:1-s*s;
 height-=MEATUS.depth*pit;
 const shade=1-.14*bowl-.8*pit;
 return {height,shade};
}

/** One closed, smooth-shaded auricle: a lateral relief sheet and a flat medial sheet on a polar grid. */
function buildAuricleGeometry(thetaSegments=112,frontRows=18,backRows=5){
 const curve=new T.CatmullRomCurve3(SILHOUETTE.map(([x,y])=>new T.Vector3(x,y,0)),true,'centripetal',.5);
 const polygon=curve.getPoints(240);
 const [cx,cy]=CONCHA_CENTRE;
 const radiusAt=(theta:number)=>{
  const dx=Math.cos(theta),dy=Math.sin(theta);let best=0;
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],ex=b.x-a.x,ey=b.y-a.y,den=dx*ey-dy*ex;
   if(Math.abs(den)<1e-9)continue;
   const ox=a.x-cx,oy=a.y-cy,r=(ox*ey-oy*ex)/den,u=(ox*dy-oy*dx)/den;
   if(r>0&&u>=0&&u<=1)best=Math.max(best,r);
  }
  return best;
 };
 const radii=Array.from({length:thetaSegments},(_,i)=>radiusAt((i/thetaSegments)*Math.PI*2));
 const positions:number[]=[],colors:number[]=[],indices:number[]=[];
 const base=new T.Color(1,1,1);
 const ring=(row:number,rows:number,front:boolean)=>{
  const t=row/rows,start=positions.length/3;
  for(let i=0;i<thetaSegments;i++){
   const theta=(i/thetaSegments)*Math.PI*2,r=radii[i]*t,p:Mm2=[cx+Math.cos(theta)*r,cy+Math.sin(theta)*r];
   const {height,shade}=relief(p,t);
   if(front){positions.push(p[0],p[1],height);colors.push(base.r*shade,base.g*shade,base.b*shade);}
   else{
    // The medial sheet stays medial to the relief, so the conchal bowl and meatus
    // pit never poke through it.
    positions.push(p[0],p[1],Math.min(-1.6*(1-smoothstep(.8,1,t)),height-1.5));
    colors.push(base.r*shade,base.g*shade,base.b*shade);
   }
  }
  return start;
 };
 const sheet=(rows:number,front:boolean)=>{
  const starts:number[]=[];
  for(let row=0;row<=rows;row++)starts.push(ring(row,rows,front));
  for(let row=0;row<rows;row++)for(let i=0;i<thetaSegments;i++){
   const j=(i+1)%thetaSegments,a=starts[row]+i,b=starts[row]+j,c=starts[row+1]+i,d=starts[row+1]+j;
   if(row>0){front?indices.push(a,c,b):indices.push(a,b,c);}
   front?indices.push(b,c,d):indices.push(b,d,c);
  }
  return starts[rows];
 };
 const frontRim=sheet(frontRows,true),backRim=sheet(backRows,false);
 // Stitch the two rims so the margin is watertight.
 for(let i=0;i<thetaSegments;i++){
  const j=(i+1)%thetaSegments,a=frontRim+i,b=frontRim+j,c=backRim+i,d=backRim+j;
  indices.push(a,c,b,b,c,d);
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 geometry.computeBoundingSphere();
 return geometry;
}

export function createExternalEarPresentation(){
 const root=new T.Group();root.name='External ear presentation';
 const skin=new T.MeshStandardMaterial({...EAR_SKIN,vertexColors:true,side:T.DoubleSide});
 const materials=[skin];
 const geometry=buildAuricleGeometry();
 const geometries=[geometry];
 const sides=new Map<Side,T.Group>();
 const frames=new Map<Side,T.Object3D>();

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

  const auricle=new T.Mesh(geometry,skin);
  auricle.name=`Auricle (${side})`;
  auricle.userData={earStructure:'auricle',english:'Auricle',korean:'귓바퀴',side,status:'anatomically-parameterized-unverified',landmarkCarrier:true,relief:EAR_STRUCTURES.map(([id])=>id)};
  frame.add(auricle);
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
