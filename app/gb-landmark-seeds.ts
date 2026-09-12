import landmarkData from '../data/landmarks.json';

type Side='right'|'left';
type PointLandmark={id:string;side:Side|null;kind:'point';point:[number,number,number]};
type CurveLandmark={id:string;side:Side|null;kind:'curve';samples:[number,number,number][]};
type Landmark=PointLandmark|CurveLandmark|{id:string;side:Side|null;kind:string};
type Point=[number,number,number];

const landmarks=landmarkData.landmarks as Landmark[];

function requirePoint(id:string,side:Side|null='right'):Point{
 const landmark=landmarks.find(item=>item.id===id&&item.side===side);
 if(!landmark||landmark.kind!=='point'||!('point' in landmark))throw new Error(`Required point landmark is missing: ${id}/${side}`);
 return [...landmark.point] as Point;
}

function requireCurve(id:string,side:Side='right'):[number,number,number][]{
 const landmark=landmarks.find(item=>item.id===id&&item.side===side);
 if(!landmark||landmark.kind!=='curve'||!('samples' in landmark))throw new Error(`Required curve landmark is missing: ${id}/${side}`);
 return landmark.samples;
}

function sampleCurveAtHeight(id:string,height:number):Point{
 const samples=requireCurve(id);
 if(height<samples[0][1]||height>samples[samples.length-1][1])throw new Error(`${id} does not cover height ${height}`);
 for(let index=1;index<samples.length;index++){
  const lower=samples[index-1],upper=samples[index];
  if(height>upper[1])continue;
  const ratio=(height-lower[1])/(upper[1]-lower[1]||1);
  return [lower[0]+(upper[0]-lower[0])*ratio,height,lower[2]+(upper[2]-lower[2])*ratio];
 }
 throw new Error(`Could not sample ${id} at height ${height}`);
}

const poplitealCrease=requirePoint('popliteal_crease');
const greaterTrochanter=requirePoint('greater_trochanter');
const lateralMalleolus=requirePoint('lateral_malleolus_prominence');
const middleFingerTip=requirePoint('middle_finger_tip');
const thighHeight=(cun:number)=>poplitealCrease[1]+(greaterTrochanter[1]-poplitealCrease[1])*cun/19;
const legHeight=(cun:number)=>lateralMalleolus[1]+(poplitealCrease[1]-lateralMalleolus[1])*cun/16;

export const GB_LANDMARK_SEEDS:Partial<Record<`GB${number}`,Point>>={
 GB25:requirePoint('rib_twelfth_free_end'),
 GB31:sampleCurveAtHeight('iliotibial_tract_posterior_border',middleFingerTip[1]),
 GB32:sampleCurveAtHeight('iliotibial_tract_posterior_border',thighHeight(7)),
 GB35:sampleCurveAtHeight('fibula_posterior_border',legHeight(7)),
 GB36:sampleCurveAtHeight('fibula_anterior_border',legHeight(7)),
 GB37:sampleCurveAtHeight('fibula_anterior_border',legHeight(5)),
 GB38:sampleCurveAtHeight('fibula_anterior_border',legHeight(4)),
 GB39:sampleCurveAtHeight('fibula_anterior_border',legHeight(3)),
 GB43:requirePoint('interdigital_web_4_5'),
 GB44:requirePoint('toenail_root_corner_4_lateral'),
};
