import * as T from 'three';

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

type Side='right'|'left';
// Registered to data/landmarks.json::external_acoustic_meatus (right side).
// Local coordinates below were authored with the meatus at z=-1 mm, y=30 mm;
// subtract that local offset once so the complete auricle is not shifted upward.
const MEATUS={x:0.07376,y:1.61943,z:-0.03159};
const ORIGIN={y:MEATUS.y-.030,z:MEATUS.z+.001};
// The BodyParts3D surface closes over the sparse native ear vertices. Keep the
// registered anchors on anatomy, but lift the presentation just outside that skin.
const SURFACE_PROJECTION=.006;
const meta=(id:string,english:string,korean:string,side:Side)=>({
 earStructure:id,english,korean,side,status:'anatomically-parameterized-unverified',
});

/**
 * Bilateral surface presentation for landmarks absent from BodyParts3D's single
 * combined External ear mesh. Coordinates remain in the atlas world frame.
 */
export function createExternalEarPresentation(){
 const root=new T.Group();root.name='External ear landmark presentation';
 const skin=new T.MeshStandardMaterial({color:0xc79d82,roughness:.84,metalness:0,side:T.DoubleSide}),
  ridge=new T.MeshStandardMaterial({color:0xb98774,roughness:.82,metalness:0,side:T.DoubleSide}),
  recess=new T.MeshStandardMaterial({color:0x95685c,roughness:.94,metalness:0,side:T.DoubleSide}),
  opening=new T.MeshStandardMaterial({color:0x2b1c1a,roughness:1,metalness:0,side:T.DoubleSide});
 const materials=[skin,ridge,recess,opening];
 const sides=new Map<Side,T.Group>();
 const mapPoint=(side:Side,[z,y,depth]:[number,number,number])=>
  new T.Vector3((side==='right'?-1:1)*(MEATUS.x+depth),ORIGIN.y+y,ORIGIN.z+z);
 const mapSurfacePoint=(side:Side,point:[number,number,number])=>{
  const mapped=mapPoint(side,point);
  mapped.x+=(side==='right'?-1:1)*SURFACE_PROJECTION;
  return mapped;
 };
 const shell=(side:Side)=>{
  const shape=new T.Shape();
  shape.moveTo(.004,.039);
  shape.bezierCurveTo(.001,.050,-.009,.058,-.022,.057);
  shape.bezierCurveTo(-.035,.055,-.040,.043,-.038,.028);
  shape.bezierCurveTo(-.037,.014,-.032,.002,-.023,-.001);
  shape.bezierCurveTo(-.015,-.004,-.010,.002,-.009,.011);
  shape.bezierCurveTo(-.008,.016,-.005,.019,-.001,.021);
  shape.bezierCurveTo(.002,.023,.001,.025,.004,.027);
  shape.bezierCurveTo(.007,.030,.007,.035,.004,.039);
  const geometry=new T.ExtrudeGeometry(shape,{curveSegments:10,steps:1,depth:.0015,bevelEnabled:true,bevelSegments:2,bevelSize:.0008,bevelThickness:.0006});
  const position=geometry.getAttribute('position'),point=new T.Vector3(),sign=side==='right'?-1:1;
  for(let i=0;i<position.count;i++){
   point.fromBufferAttribute(position,i);
   position.setXYZ(i,sign*(MEATUS.x+SURFACE_PROJECTION+.001+point.z),ORIGIN.y+point.y,ORIGIN.z+point.x);
  }
  position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const object=new T.Mesh(geometry,skin);object.name=`Auricle shell (${side})`;
  object.userData={...meta('auricle','Auricle','귓바퀴',side),landmarkCarrier:true};return object;
 };
 const tube=(side:Side,id:string,en:string,ko:string,points:[number,number,number][],radius:number,material:T.Material)=>{
  const curve=new T.CatmullRomCurve3(points.map(p=>mapSurfacePoint(side,p)),false,'centripetal',.35),
   object=new T.Mesh(new T.TubeGeometry(curve,Math.max(24,points.length*10),radius,8,false),material);
  object.name=`${en} (${side})`;object.userData=meta(id,en,ko,side);return object;
 };
 const ellipsoid=(side:Side,id:string,en:string,ko:string,at:[number,number,number],scale:[number,number,number],material:T.Material)=>{
  const object=new T.Mesh(new T.SphereGeometry(1,20,14),material);object.position.copy(mapSurfacePoint(side,at));
  object.scale.set(...scale);object.name=`${en} (${side})`;object.userData=meta(id,en,ko,side);return object;
 };
 for(const side of ['right','left'] as const){
  const group=new T.Group();group.name=`${side} auricle`;sides.set(side,group);
  group.add(shell(side));
  // Outer free margin, from the crus over the superior/posterior rim into the tail.
  group.add(tube(side,'helix','Helix','이륜',[[.003,.039,.004],[-.006,.053,.0045],[-.020,.056,.005],[-.032,.048,.0047],[-.037,.031,.0043],[-.035,.014,.0038],[-.028,.005,.0033]],.00155,skin));
  // Y-shaped antihelix: stem plus superior and inferior crura.
  group.add(tube(side,'antihelix','Antihelix','대이륜',[[-.020,.015,.005],[-.018,.027,.0055],[-.017,.038,.0058],[-.014,.045,.0055]],.00115,ridge));
  group.add(tube(side,'antihelix','Antihelix','대이륜',[[-.016,.039,.0057],[-.010,.046,.0055],[-.005,.049,.0048]],.00095,ridge));
  group.add(tube(side,'antihelix','Antihelix','대이륜',[[-.017,.038,.0057],[-.024,.043,.0052],[-.029,.046,.0044]],.0009,ridge));
  // Conchal bowl lies medial to the ridges; its opening is anterior, immediately behind the tragus.
  group.add(ellipsoid(side,'concha','Concha','이갑개',[-.010,.030,.0041],[.0009,.0085,.0074],recess));
  const meatus=ellipsoid(side,'external-acoustic-meatus','External acoustic meatus opening','외이도 입구',[-.001,.030,.0052],[.0008,.0027,.0027],opening);
  group.add(meatus);
  group.add(tube(side,'tragus','Tragus','이주',[[.004,.035,.006],[.005,.031,.007],[.003,.027,.0065]],.00145,skin));
  group.add(tube(side,'antitragus','Antitragus','대이주',[[-.004,.018,.006],[-.007,.020,.0068],[-.009,.023,.006]],.00125,ridge));
  // The shell contour supplies the gap; this small recess keeps it readable at atlas scale.
  group.add(ellipsoid(side,'intertragic-notch','Intertragic notch','이주간절흔',[-.001,.023,.0062],[.0007,.0013,.0017],recess));
  // The lobule is carried by the continuous inferior shell contour. A separate
  // sphere reads as a detached bead and destroys the auricle silhouette.
  group.add(tube(side,'crus-of-helix','Crus of helix','이륜각',[[.002,.039,.0045],[-.006,.037,.005],[-.013,.034,.0053]],.00105,ridge));
  root.add(group);
 }
 root.userData.landmarks={
  externalAcousticMeatus:{right:mapPoint('right',[-.001,.030,0]),left:mapPoint('left',[-.001,.030,0])},
  tragus:{right:mapPoint('right',[.004,.031,.006]),left:mapPoint('left',[.004,.031,.006])},
  intertragicNotch:{right:mapPoint('right',[.002,.024,.006]),left:mapPoint('left',[.002,.024,.006])},
  lobule:{right:mapPoint('right',[-.020,.008,.0028]),left:mapPoint('left',[-.020,.008,.0028])},
  mastoidRegion:{right:new T.Vector3(-.04742,1.57037,-.05633),left:new T.Vector3(.04742,1.57037,-.05633)},
  mandibularCondyle:{right:new T.Vector3(-.04507,1.58406,-.00602),left:new T.Vector3(.04507,1.58406,-.00602)},
 };
 return {root,sides,materials};
}
