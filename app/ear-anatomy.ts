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
// X is left/right, Y is superior/inferior and Z is anterior/posterior.
const MEATUS={x:0.07376,y:1.61943,z:-0.03159};
const meta=(id:string,english:string,korean:string,side:Side)=>({
 earStructure:id,english,korean,side,status:'anatomically-parameterized-unverified',
});

/**
 * Bilateral surface presentation for landmarks absent from BodyParts3D's single
 * combined External ear mesh. Coordinates remain in the atlas world frame.
 */
export function createExternalEarPresentation(){
 const root=new T.Group();root.name='External ear landmark presentation';
 const skin=new T.MeshStandardMaterial({color:0xc58f78,roughness:.82,metalness:0}),
  ridge=new T.MeshStandardMaterial({color:0xb87b68,roughness:.78,metalness:0}),
  recess=new T.MeshStandardMaterial({color:0x85594f,roughness:.9,metalness:0}),
  opening=new T.MeshStandardMaterial({color:0x241918,roughness:1,metalness:0});
 const materials=[skin,ridge,recess,opening];
 const sides=new Map<Side,T.Group>();
 const mapPoint=(side:Side,[z,y,depth]:[number,number,number])=>
  new T.Vector3((side==='right'?-1:1)*(MEATUS.x+depth),MEATUS.y+y,MEATUS.z+z);
 const tube=(side:Side,id:string,en:string,ko:string,points:[number,number,number][],radius:number,material:T.Material)=>{
  const curve=new T.CatmullRomCurve3(points.map(p=>mapPoint(side,p)),false,'centripetal',.35),
   object=new T.Mesh(new T.TubeGeometry(curve,Math.max(24,points.length*10),radius,8,false),material);
  object.name=`${en} (${side})`;object.userData=meta(id,en,ko,side);return object;
 };
 const ellipsoid=(side:Side,id:string,en:string,ko:string,at:[number,number,number],scale:[number,number,number],material:T.Material)=>{
  const object=new T.Mesh(new T.SphereGeometry(1,24,16),material);object.position.copy(mapPoint(side,at));
  object.scale.set(...scale);object.name=`${en} (${side})`;object.userData=meta(id,en,ko,side);return object;
 };
 for(const side of ['right','left'] as const){
  const group=new T.Group();group.name=`${side} auricle`;sides.set(side,group);
  // Outer free margin, from the crus over the superior/posterior rim into the tail.
  group.add(tube(side,'helix','Helix','이륜',[[.001,.039,.003],[-.006,.054,.004],[-.020,.057,.0045],[-.032,.048,.004],[-.036,.030,.0035],[-.034,.013,.003],[-.026,.005,.0025]],.00225,skin));
  // Y-shaped antihelix: stem plus superior and inferior crura.
  group.add(tube(side,'antihelix','Antihelix','대이륜',[[-.020,.016,.005],[-.018,.027,.006],[-.017,.038,.0065],[-.014,.046,.006]],.00175,ridge));
  group.add(tube(side,'antihelix','Antihelix','대이륜',[[-.016,.039,.006],[-.010,.047,.006],[-.005,.050,.005]],.00135,ridge));
  group.add(tube(side,'antihelix','Antihelix','대이륜',[[-.017,.038,.006],[-.025,.044,.0055],[-.029,.047,.004]],.0013,ridge));
  // Conchal bowl lies medial to the ridges; its opening is anterior, immediately behind the tragus.
  group.add(ellipsoid(side,'concha','Concha','이갑개',[-.009,.030,.001],[.0017,.012,.0105],recess));
  const meatus=ellipsoid(side,'external-acoustic-meatus','External acoustic meatus opening','외이도 입구',[-.001,.030,0],[.0014,.0037,.0037],opening);
  group.add(meatus);
  group.add(ellipsoid(side,'tragus','Tragus','이주',[[.004,.031,.006][0],[.004,.031,.006][1],[.004,.031,.006][2]],[.0038,.0065,.0043],skin));
  group.add(ellipsoid(side,'antitragus','Antitragus','대이주',[-.008,.019,.006],[.0034,.0048,.005],ridge));
  // A recessed bridge makes the notch legible while preserving the true gap between tragus and antitragus.
  group.add(tube(side,'intertragic-notch','Intertragic notch','이주간절흔',[[.002,.024,.006],[-.001,.021,.006],[-.004,.020,.006]],.00072,recess));
  group.add(ellipsoid(side,'lobule','Lobule','귓불',[-.020,.008,.0028],[.0045,.0085,.0068],skin));
  group.add(tube(side,'crus-of-helix','Crus of helix','이륜각',[[.001,.039,.004],[-.006,.037,.005],[-.013,.035,.0055]],.00155,ridge));
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
