import type {Atlas} from './anatomy';
import {GB_POINTS,needleProfile as gbNeedleProfile,type GbPointDefinition,type NeedleProfile} from './gb-points';
import source from '../data/li-source.json';
import liLandmarks from '../data/li-landmarks.json';

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
 * Right-side skin anchors generated offline by scripts/li-landmarks.mjs from bone/muscle
 * vertices (KCMRIC primary, WHO 2008 secondary). Still review status, not clinical truth.
 */
export function buildLiPoints(_atlas?:Atlas):AcupointDefinition[] {
 return source.points.map((row,index)=>{
  const number=index+1,match=row.name.match(/^([^（(]+)[（(]([^）)]+)/)!;
  const anchor=liLandmarks.points[row.code as keyof typeof liLandmarks.points];
  if(!anchor)throw new Error('LI landmark missing: '+row.code);
  return {code:row.code as AcupointCode,korean:match[1].trim(),hanja:match[2],english:english[index],
   location:row.canonicalLocation,basis:'골격·근육 정점 기반 랜드마크 · '+anchor.rule,seed:anchor.seed as [number,number,number],
   projection:number>=19?'anterior':'lateral',outward:anchor.outward as [number,number,number],status:'review',
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
