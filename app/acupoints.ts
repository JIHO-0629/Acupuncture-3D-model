import * as T from 'three';
import type {Atlas} from './anatomy';
import {GB_POINTS,needleProfile as gbNeedleProfile,type GbPointDefinition,type NeedleProfile} from './gb-points';
import source from '../data/li-source.json';

export type AcupointCode = `GB${number}` | `LI${number}`;
export type MeridianId = 'GB' | 'LI';
export type AcupointDefinition = Omit<GbPointDefinition,'code'|'verifiedOn'> & {
 code:AcupointCode; verifiedOn:string; outward?:[number,number,number];
 rawLocation?:string; alternative?:string; sourceStatus?:string; rule?:string;
};
export const MERIDIANS = {
 GB:{id:'GB',label:'담경',name:'족소양담경',english:'GALLBLADDER MERIDIAN',count:44,first:'GB34'},
 LI:{id:'LI',label:'대장경',name:'수양명대장경',english:'LARGE INTESTINE MERIDIAN',count:20,first:'LI4'},
} as const;
const english=['Shangyang','Erjian','Sanjian','Hegu','Yangxi','Pianli','Wenliu','Xialian','Shanglian','Shousanli','Quchi','Zhouliao','Shouwuli','Binao','Jianyu','Jugu','Tianding','Futu','Kouheliao','Yingxiang'];

/**
 * Atlas-specific neighbourhoods, NOT verified clinical coordinates.
 * Proportions use local skeletal axes; absent nail/crease/skin landmarks stay review.
 */
export function buildLiPoints(atlas:Atlas):AcupointDefinition[] {
 const part=(name:string)=>{
  const found=atlas.parts.find(p=>p.name.toLowerCase()===name.toLowerCase());
  if(!found) throw new Error('LI landmark mesh missing: '+name);
  return found;
 };
 const center=(name:string)=>{const b=part(name).bounds;return new T.Vector3(...b[0]).add(new T.Vector3(...b[1])).multiplyScalar(.5);};
 const end=(name:string,proximal:boolean)=>{
  const b=part(name).bounds,c=center(name);c.y=proximal?b[1][1]:b[0][1];return c;
 };
 const radius='Right radius',ulna='Right ulna',humerus='Right humerus';
 const wrist=end(radius,false), elbow=end(humerus,false);
 const axis=elbow.clone().sub(wrist).normalize();
 const radial=center(radius).sub(center(ulna));radial.addScaledVector(axis,-radial.dot(axis)).normalize();
 const dorsal=new T.Vector3().crossVectors(axis,radial).normalize();
 if(dorsal.z>0)dorsal.negate();
 const outward=radial.clone().add(dorsal).normalize();
 const mc=center('Right second metacarpal bone'),thumb=center('Right first metacarpal bone');
 const handAxis=end('Right second metacarpal bone',true).sub(end('Right second metacarpal bone',false)).normalize();
 const handRadial=thumb.sub(mc);handRadial.addScaledVector(handAxis,-handRadial.dot(handAxis)).normalize();
 const handDorsal=new T.Vector3().crossVectors(handAxis,handRadial).normalize();if(handDorsal.z>0)handDorsal.negate();
 const handOutward=handRadial.clone().add(handDorsal).normalize();
 const mcLength=part('Right second metacarpal bone').bounds[1][1]-part('Right second metacarpal bone').bounds[0][1];
 const seeds=new Map<number,T.Vector3>();
 const distal=center('Distal phalanx of right index finger');
 const fingerWidth=part('Distal phalanx of right index finger').bounds[1][0]-part('Distal phalanx of right index finger').bounds[0][0];
 // Nail-root is not a source mesh: F-cun offset is a REVIEW approximation, never B-cun.
 seeds.set(1,distal.addScaledVector(handAxis,fingerWidth*.1).addScaledVector(handRadial,fingerWidth*.55));
 const mcp=end('Right second metacarpal bone',false);
 seeds.set(2,mcp.clone().addScaledVector(handAxis,-mcLength*.08).addScaledVector(handRadial,mcLength*.12));
 seeds.set(3,mcp.clone().addScaledVector(handAxis,mcLength*.08).addScaledVector(handRadial,mcLength*.12));
 seeds.set(4,mc.clone().addScaledVector(handRadial,mcLength*.13));
 seeds.set(5,wrist.clone().addScaledVector(outward,mcLength*.12));
 seeds.set(11,elbow.clone().addScaledVector(radial,mcLength*.13).addScaledVector(dorsal,-mcLength*.04));
 const shoulder=end(humerus,true);
 shoulder.addScaledVector(radial,mcLength*.13);
 seeds.set(15,shoulder);
 const clavicle=end('Right clavicle',true),scapula=end('Right scapula',true);
 seeds.set(16,clavicle.lerp(scapula,.5).addScaledVector(dorsal,mcLength*.15));
 for(const [n,ratio] of [[6,3/12],[7,5/12],[8,8/12],[9,9/12],[10,10/12]])seeds.set(n,seeds.get(5)!.clone().lerp(seeds.get(11)!,ratio));
 // Distinct supraepicondylar neighbourhood, not a LI11 + 1 B-cun shortcut.
 seeds.set(12,elbow.clone().addScaledVector(axis,elbow.distanceTo(shoulder)*.045).addScaledVector(radial,mcLength*.15).addScaledVector(dorsal,-mcLength*.08));
 seeds.set(13,seeds.get(11)!.clone().lerp(shoulder,3/9));
 seeds.set(14,seeds.get(11)!.clone().lerp(shoulder,7/9).addScaledVector(dorsal,-mcLength*.07));
 const scm=center('Right sternocleidomastoid');
 // SCM bounds are a region only; exact borders require vertex/pose visual verification.
 seeds.set(17,new T.Vector3(scm.x-mcLength*.5,center('Cricoid cartilage').y,scm.z-mcLength*.08));
 seeds.set(18,new T.Vector3(scm.x-mcLength*.4,part('Thyroid cartilage').bounds[1][1],scm.z+mcLength*.25));
 const nasal=part('Right lateral nasal cartilage').bounds,lip=part('Orbicularis oris').bounds;
 seeds.set(19,new T.Vector3(nasal[0][0],(nasal[0][1]+lip[1][1])*.5,nasal[1][2]));
 seeds.set(20,new T.Vector3(nasal[0][0]*1.1,(nasal[0][1]+nasal[1][1])*.5,nasal[1][2]*.95));
 return source.points.map((row,index)=>{
  const number=index+1,match=row.name.match(/^([^（(]+)[（(]([^）)]+)/)!;
  const direction=number<=4?handOutward:number<=16?outward:new T.Vector3(-.5,0,1).normalize();
  return {code:row.code as AcupointCode,korean:match[1].trim(),hanja:match[2],english:english[index],
   location:row.canonicalLocation,basis:'메시 경계 기반 근사 · '+row.region,seed:seeds.get(number)!.toArray() as [number,number,number],
   projection:number>=19?'anterior':'lateral',outward:direction.toArray() as [number,number,number],status:'review',
   primarySource:row.source,secondarySource:source.sourceFile,verifiedOn:'',
   rawLocation:row.rawLocation,alternative:row.alternative,sourceStatus:row.sourceStatus,rule:row.rule};
 });
}
export function atlasPoints(atlas:Atlas):AcupointDefinition[]{return [...GB_POINTS,...buildLiPoints(atlas)];}
export function meridianOf(code:string):MeridianId{return code.startsWith('LI')?'LI':'GB';}
export function needleProfile(code:AcupointCode):NeedleProfile {
 if(code.startsWith('GB'))return gbNeedleProfile(code as `GB${number}`);
 const row=source.points.find(p=>p.code===code)!;
 return {region:Number(code.slice(2))>=19?'face-scalp':Number(code.slice(2))>=17?'neck':'upper-limb',
  label:'LI 자침 경로 미검증',probeDepthMm:0,conceptualBoundary:false,
  warning:'LI 위치·지역 프레임은 검수 중입니다. 자침 방향·깊이가 검증되기 전에는 자침 시뮬레이션을 제공하지 않습니다.',
  sourceNeedling:row.rawNeedling||'깊이 미검증',depthValidation:'미검증 · 시뮬레이션 잠금',
  validationSource:row.source,referenceStructures:[row.region],pointRisk:row.rawMethod||undefined};
}
