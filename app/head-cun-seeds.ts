import headCun from '../data/head-cun.json';

/**
 * Head acupoint seeds placed on geodesic B-cun scales (scripts/head-cun.mjs).
 * Distances are arc length on the skin, one local WHO scale per segment:
 * forehead 미간~전발제 3촌, scalp 전발제~후발제 12촌, posterior 유양돌기간 9촌.
 */
type Point=[number,number,number];
type HeadCunPoint={code:string;point:number[]};

const points=headCun.points as HeadCunPoint[];

function requireHeadPoint(code:string):Point{
 const found=points.find(item=>item.code===code);
 if(!found||found.point.length!==3)throw new Error(`Required head-cun point is missing: ${code}`);
 return [found.point[0],found.point[1],found.point[2]];
}

export const HEAD_SCALP_CUN_MM=headCun.scalp.cunMm;

export const GB_HEAD_CUN_SEEDS={
 GB8:requireHeadPoint('GB8'),
 GB9:requireHeadPoint('GB9'),
 GB10:requireHeadPoint('GB10'),
 GB11:requireHeadPoint('GB11'),
 GB13:requireHeadPoint('GB13'),
 GB14:requireHeadPoint('GB14'),
 GB15:requireHeadPoint('GB15'),
 GB16:requireHeadPoint('GB16'),
 GB17:requireHeadPoint('GB17'),
 GB18:requireHeadPoint('GB18'),
 GB19:requireHeadPoint('GB19'),
};
