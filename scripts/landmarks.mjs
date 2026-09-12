/** Derive the anatomical landmarks that acupoint rules are allowed to reference.
 *
 * Every landmark names the meshes it came from and how it was found, so a rule that
 * cites "the anterior border of the fibula" can be traced back to fibula geometry
 * rather than to a hand-placed coordinate.
 *
 * Quality is recorded on two independent axes, because they genuinely differ:
 *   anatomicalConfidence - how well this point matches the real structure on a person
 *   frameConfidence      - how well it serves as the origin of a WHO proportional axis
 * The umbilicus is the clearest case: as anatomy it is a guess, but as the origin of
 * the 8/5 abdominal B-cun scale WHO defines it by exactly that division, so the frame
 * confidence is high while the anatomical confidence is low.
 *
 * Usage: node scripts/landmarks.mjs
 * Output: data/landmarks.json
 */
import fs from 'node:fs';
import * as T from 'three';
import { loadAtlas, mesh, has, extreme, extremeCluster, extremeInSection, centroid, slab, sidedName, SIDES, sideSign } from './atlas-geometry.mjs';

const atlas = loadAtlas();
const landmarks = [];
const skipped = [];
const v = (x, y, z) => new T.Vector3(x, y, z);
const round = (point) => [+point.x.toFixed(5), +point.y.toFixed(5), +point.z.toFixed(5)];

function add(record) {
  landmarks.push(record);
  return record;
}
/** Register a point landmark. Throws rather than inventing a position when a mesh is missing. */
function point(id, korean, side, build, meta) {
  try {
    const result = build();
    if (!result) throw new Error('derivation produced no point');
    add({ id, korean, side, kind: 'point', point: round(result), ...meta });
  } catch (error) {
    skipped.push({ id, side, reason: error.message });
  }
}
function curve(id, korean, side, build, meta) {
  try {
    const samples = build();
    if (!samples || samples.length < 2) throw new Error('derivation produced no polyline');
    add({ id, korean, side, kind: 'curve', samples: samples.map(round), ...meta });
  } catch (error) {
    skipped.push({ id, side, reason: error.message });
  }
}

const span = (part, axis) => [part.box.min.getComponent(axis), part.box.max.getComponent(axis)];
const frac = (part, axis, from, to) => {
  const [lo, hi] = span(part, axis);
  return (p) => {
    const t = (p.getComponent(axis) - lo) / (hi - lo || 1);
    return t >= from && t <= to;
  };
};
const both = (...tests) => (p) => tests.every((test) => test(p));

// ---------------------------------------------------------------- median planes
add({
  id: 'anterior_median_plane', korean: '전정중선', side: null, kind: 'plane',
  plane: { normal: [1, 0, 0], constant: 0 },
  type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
  derivation: 'sagittal plane x=0; the reference body is modelled symmetric about it',
  sources: ['atlas coordinate frame'],
});
add({
  id: 'posterior_median_plane', korean: '후정중선', side: null, kind: 'plane',
  plane: { normal: [1, 0, 0], constant: 0 },
  type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
  derivation: 'same sagittal plane as the anterior median line; the two differ only in which surface a rule projects onto',
  sources: ['atlas coordinate frame'],
});

// ---------------------------------------------------------------- head and neck
for (const side of SIDES) {
  const sign = sideSign(side);
  point('pupil_center', '동공 중심', side, () => centroid(mesh(atlas, sidedName(side, 'lens'))), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'centroid of the lens mesh', sources: [sidedName(side, 'lens')],
  });

  point('lateral_canthus', '외안각', side, () => extreme(mesh(atlas, sidedName(side, 'sclera')), v(sign, 0, 0)), {
    type: 'derived', anatomicalConfidence: 'medium', frameConfidence: 'high',
    derivation: 'lateral pole of the sclera; the palpebral commissure itself is not modelled, and the globe equator is the nearest bony-independent stand-in',
    sources: [sidedName(side, 'sclera')],
  });

  point('mandibular_condyle', '하악 관절돌기', side, () => {
    const mandible = mesh(atlas, 'Mandible');
    return extremeCluster(mandible, v(0, 1, -0.35), 0.01, (p) => Math.sign(p.x) === sign && Math.abs(p.x) > 0.02);
  }, {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'highest posterior vertices of the mandible on this side', sources: ['Mandible'],
  });

  point('external_acoustic_meatus', '외이도', side, () => {
    const temporal = mesh(atlas, sidedName(side, 'temporal bone'));
    return extremeCluster(temporal, v(sign, 0, 0), 0.01);
  }, {
    type: 'estimated', anatomicalConfidence: 'medium', frameConfidence: 'medium',
    derivation: 'most lateral vertices of the temporal bone, which surround the external acoustic pore; the meatus is an opening and has no mesh of its own',
    sources: [sidedName(side, 'temporal bone')],
  });

  point('zygomatic_arch_midpoint', '관골궁 중점', side, () => {
    const zygomatic = mesh(atlas, sidedName(side, 'zygomatic bone'));
    const temporal = mesh(atlas, sidedName(side, 'temporal bone'));
    const posterior = extreme(zygomatic, v(0, 0, -1));
    const anterior = extreme(temporal, v(0, 0, 1), (p) => p.y > temporal.box.min.y + (temporal.box.max.y - temporal.box.min.y) * 0.4);
    return posterior.clone().add(anterior).multiplyScalar(0.5);
  }, {
    type: 'derived', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'midpoint between the posterior tip of the zygomatic bone and the anterior tip of the temporal zygomatic process, the two halves of the arch',
    sources: [sidedName(side, 'zygomatic bone'), sidedName(side, 'temporal bone')],
  });

  point('mastoid_process_tip', '유양돌기 첨', side, () => {
    const temporal = mesh(atlas, sidedName(side, 'temporal bone'));
    return extremeCluster(temporal, v(0, -1, -0.5), 0.01, frac(temporal, 2, 0, 0.5));
  }, {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'lowest posterior vertices of the temporal bone', sources: [sidedName(side, 'temporal bone')],
  });

  point('atlas_transverse_process', '환추 횡돌기', side, () => extremeCluster(mesh(atlas, 'Atlas'), v(sign, 0, 0), 0.03), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most lateral vertices of the atlas', sources: ['Atlas'],
  });

  point('acromion_lateral', '견봉 외측단', side, () => {
    const scapula = mesh(atlas, sidedName(side, 'scapula'));
    return extremeCluster(scapula, v(sign, 0, 0), 0.01, frac(scapula, 1, 0.75, 1));
  }, {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most lateral vertices in the upper quarter of the scapula, which is the acromion',
    sources: [sidedName(side, 'scapula')],
  });

  point('auricular_apex', '이개첨', side, () => {
    // Both sides must be selected by one identical criterion, otherwise small differences
    // between the two temporal bone meshes shift the window and the pair stops mirroring.
    const right = mesh(atlas, 'Right temporal bone'), left = mesh(atlas, 'Left temporal bone');
    const skullEdge = Math.max(Math.abs(extreme(right, v(-1, 0, 0)).x), Math.abs(extreme(left, v(1, 0, 0)).x));
    const low = Math.min(right.box.min.y, left.box.min.y), high = Math.max(right.box.max.y, left.box.max.y);
    const back = Math.min(right.box.min.z, left.box.min.z), front = Math.max(right.box.max.z, left.box.max.z);
    const skin = mesh(atlas, 'Skin');
    // The auricle is the only skin lying further out than the skull at this height.
    return extremeCluster(skin, v(0, 1, 0), 0.004, (p) =>
      Math.sign(p.x) === sign && Math.abs(p.x) > skullEdge
      && p.y > low && p.y < high + 0.05 && p.z > back && p.z < front);
  }, {
    type: 'estimated', anatomicalConfidence: 'medium', frameConfidence: 'medium',
    derivation: 'highest skin vertex lying further laterally than either temporal bone, inside the ear height and depth band. The auricle has no mesh of its own, and simplification leaves only about thirty skin vertices on each ear, so the two sides do not mirror closely',
    sources: ['Skin', 'Right temporal bone', 'Left temporal bone'],
  });
}

point('external_occipital_protuberance', '외후두융기', null, () => {
  const occipital = mesh(atlas, 'Occipital bone');
  return extremeCluster(occipital, v(0, 0, -1), 0.01, (p) => Math.abs(p.x) < 0.012);
}, {
  type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
  derivation: 'most posterior vertices of the occipital bone within 12 mm of the midline',
  sources: ['Occipital bone'],
});

for (const [id, korean, direction] of [['anterior_hairline_midpoint', '전발제 중점', 1], ['posterior_hairline_midpoint', '후발제 중점', -1]]) {
  point(id, korean, null, () => {
    const hair = mesh(atlas, 'Hair of head');
    return extremeCluster(hair, v(0, -1, 0), 0.02, (p) => Math.abs(p.x) < 0.012 && Math.sign(p.z) === direction);
  }, {
    type: 'derived', anatomicalConfidence: 'medium', frameConfidence: 'high',
    derivation: `lowest midline vertices of the hair mesh on the ${direction > 0 ? 'front' : 'back'} of the head; this mesh is the only representation of the hairline and it defines the 12 B-cun scalp axis`,
    sources: ['Hair of head'],
  });
}

// ---------------------------------------------------------------- vertebral spinous processes
const VERTEBRAE = [
  ['C7', 'Seventh cervical vertebra'], ['T1', 'First thoracic vertebra'], ['T2', 'Second thoracic vertebra'],
  ['T3', 'Third thoracic vertebra'], ['T4', 'Fourth thoracic vertebra'], ['T5', 'Fifth thoracic vertebra'],
  ['T6', 'Sixth thoracic vertebra'], ['T7', 'Seventh thoracic vertebra'], ['T8', 'Eighth thoracic vertebra'],
  ['T9', 'Ninth thoracic vertebra'], ['T10', 'Tenth thoracic vertebra'], ['T11', 'Eleventh thoracic vertebra'],
  ['T12', 'Twelfth thoracic vertebra'], ['L1', 'First lumbar vertebra'], ['L2', 'Second lumbar vertebra'],
  ['L3', 'Third lumbar vertebra'], ['L4', 'Fourth lumbar vertebra'], ['L5', 'Fifth lumbar vertebra'],
];
for (const [label, name] of VERTEBRAE) {
  if (!has(atlas, name)) { skipped.push({ id: `spinous_process_${label}`, reason: `${name} absent` }); continue; }
  const part = mesh(atlas, name);
  // The spinous process is the posterior blade of the arch; take the rearmost slice of it.
  const tipZ = extreme(part, v(0, 0, -1), (p) => Math.abs(p.x) < 0.014).z;
  const blade = (p) => Math.abs(p.x) < 0.014 && p.z < tipZ + 0.012;
  for (const [feature, direction, note] of [
    ['tip', v(0, 0, -1), 'rearmost'], ['inferior_border', v(0, -1, 0), 'lowest'], ['superior_border', v(0, 1, 0), 'highest'],
  ]) {
    point(`spinous_process_${label}.${feature}`, `${label} 극돌기 ${feature === 'tip' ? '첨' : feature === 'inferior_border' ? '하연' : '상연'}`, null,
      () => extremeCluster(part, direction, 0.06, blade), {
        type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
        derivation: `${note} vertices of the spinous process blade (within 14 mm of the midline and 12 mm of the rearmost point)`,
        sources: [name],
      });
  }
}

// ---------------------------------------------------------------- trunk
point('suprasternal_notch', '흉골상절흔', null, () => {
  const manubrium = mesh(atlas, 'Manubrium');
  return extremeCluster(manubrium, v(0, 1, 0), 0.05, (p) => Math.abs(p.x) < 0.012);
}, {
  type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
  derivation: 'highest midline vertices of the manubrium', sources: ['Manubrium'],
});

point('xiphisternal_junction', '검흉결합', null, () => {
  const xiphoid = mesh(atlas, 'Xiphoid process');
  return extremeCluster(xiphoid, v(0, 1, 0), 0.06, (p) => Math.abs(p.x) < 0.012);
}, {
  type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
  derivation: 'highest midline vertices of the xiphoid process, where it meets the sternal body',
  sources: ['Xiphoid process'],
});

point('pubic_symphysis_superior', '치골결합 상연', null, () => {
  const hip = mesh(atlas, 'Right hip bone');
  // The symphyseal surface is the medial-most face of the pubis; take its upper edge.
  const medial = Math.abs(extreme(hip, v(1, 0, 0), (p) => p.y < hip.box.min.y + (hip.box.max.y - hip.box.min.y) * 0.45).x);
  const point = extremeCluster(hip, v(0, 1, 0), 0.05, (p) => Math.abs(p.x) < medial + 0.004 && p.z > 0);
  return v(0, point.y, point.z);
}, {
  type: 'derived', anatomicalConfidence: 'high', frameConfidence: 'high',
  derivation: 'upper edge of the medial (symphyseal) face of the pubis, placed on the midline',
  sources: ['Right hip bone'],
});

point('umbilicus', '배꼽', null, () => {
  const xiphi = landmarks.find((l) => l.id === 'xiphisternal_junction');
  const pubis = landmarks.find((l) => l.id === 'pubic_symphysis_superior');
  if (!xiphi || !pubis) throw new Error('needs xiphisternal_junction and pubic_symphysis_superior');
  const a = v(...xiphi.point), b = v(...pubis.point);
  return a.clone().lerp(b, 8 / 13);
}, {
  type: 'estimated', anatomicalConfidence: 'low', frameConfidence: 'high',
  derivation: 'the 8:5 division of the xiphisternal-to-pubic axis. WHO defines that axis as 8 B-cun above and 5 B-cun below the umbilicus, so this point is the scale origin by definition even though a real navel sits several centimetres away from it',
  sources: ['Xiphoid process', 'Right hip bone'],
});

for (const side of SIDES) {
  const sign = sideSign(side);
  const hip = mesh(atlas, sidedName(side, 'hip bone'));
  point('asis', '전상장골극', side, () => extremeCluster(hip, v(0, 0, 1), 0.01, frac(hip, 1, 0.55, 1)), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most anterior vertices of the upper half of the hip bone', sources: [sidedName(side, 'hip bone')],
  });
  point('iliac_crest_apex', '장골능 최고점', side, () => extremeCluster(hip, v(0, 1, 0), 0.01), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'highest vertices of the hip bone', sources: [sidedName(side, 'hip bone')],
  });

  for (const rib of ['eleventh', 'twelfth']) {
    const name = sidedName(side, `${rib} rib`);
    point(`rib_${rib}_free_end`, `제${rib === 'eleventh' ? 11 : 12}늑골 자유단`, side, () => {
      const part = mesh(atlas, name);
      // Start from the vertebral end, then take the vertices furthest from it along the shaft.
      const head = extreme(part, v(-sign, 0, -1));
      let best = -Infinity, found = null;
      for (let i = 0; i < part.vertexCount; i++) {
        const p = v(part.positions[i * 3], part.positions[i * 3 + 1], part.positions[i * 3 + 2]);
        const distance = p.distanceTo(head);
        if (distance > best) { best = distance; found = p; }
      }
      return found;
    }, {
      type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
      derivation: 'the vertex furthest along the shaft from the vertebral end of the rib', sources: [name],
    });
  }
}

point('sacral_hiatus', '천골열공', null, () => {
  const sacrum = mesh(atlas, 'Sacrum');
  return extremeCluster(sacrum, v(0, -1, -0.6), 0.02, (p) => Math.abs(p.x) < 0.014);
}, {
  type: 'anatomical', anatomicalConfidence: 'medium', frameConfidence: 'high',
  derivation: 'lowest posterior midline vertices of the sacrum; the hiatus is the opening they surround',
  sources: ['Sacrum'],
});

// ---------------------------------------------------------------- lower limb
for (const side of SIDES) {
  const sign = sideSign(side);
  const femur = mesh(atlas, sidedName(side, 'femur'));
  const fibula = mesh(atlas, sidedName(side, 'fibula'));
  const tibia = mesh(atlas, sidedName(side, 'tibia'));

  point('greater_trochanter', '대전자', side, () => extremeCluster(femur, v(sign, 0, 0), 0.01, frac(femur, 1, 0.8, 1)), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most lateral vertices of the upper fifth of the femur', sources: [sidedName(side, 'femur')],
  });
  point('lateral_femoral_epicondyle', '대퇴골 외측상과', side, () => extremeCluster(femur, v(sign, 0, 0), 0.01, frac(femur, 1, 0, 0.12)), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most lateral vertices of the lower eighth of the femur', sources: [sidedName(side, 'femur')],
  });
  point('patella_base', '슬개골저', side, () => extremeCluster(mesh(atlas, sidedName(side, 'patella')), v(0, 1, 0), 0.06), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'highest vertices of the patella', sources: [sidedName(side, 'patella')],
  });
  point('knee_joint_line', '슬관절 관절선', side, () => {
    const centre = (femur.box.min.y + tibia.box.max.y) / 2;
    return v(extreme(femur, v(sign, 0, 0), frac(femur, 1, 0, 0.12)).x * 0.5, centre, 0);
  }, {
    type: 'derived', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'mid-height between the distal end of the femur and the proximal end of the tibia',
    sources: [sidedName(side, 'femur'), sidedName(side, 'tibia')],
  });
  point('popliteal_crease', '슬와횡문', side, () => {
    const joint = (femur.box.min.y + tibia.box.max.y) / 2;
    const skin = mesh(atlas, 'Skin');
    return extremeCluster(skin, v(0, 0, -1), 0.02, (p) =>
      Math.sign(p.x) === sign && Math.abs(p.y - joint) < 0.008 && Math.abs(p.x - femur.box.getCenter(new T.Vector3()).x) < 0.07);
  }, {
    type: 'derived', anatomicalConfidence: 'medium', frameConfidence: 'high',
    derivation: 'most posterior skin at knee joint height; the flexion crease itself is not modelled in this standing pose, and it anchors the 19 and 16 B-cun leg axes',
    sources: ['Skin', sidedName(side, 'femur'), sidedName(side, 'tibia')],
  });

  point('fibular_head', '비골두', side, () => extremeCluster(fibula, v(0, 1, 0), 0.03), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'highest vertices of the fibula', sources: [sidedName(side, 'fibula')],
  });
  point('lateral_malleolus_prominence', '외과 융기', side, () => extremeCluster(fibula, v(sign, 0, 0), 0.01, frac(fibula, 1, 0, 0.12)), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most lateral vertices of the lower eighth of the fibula. WHO measures the leg axis from this prominence, not from the tip',
    sources: [sidedName(side, 'fibula')],
  });
  point('lateral_malleolus_tip', '외과 첨', side, () => extremeCluster(fibula, v(0, -1, 0), 0.03), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'lowest vertices of the fibula', sources: [sidedName(side, 'fibula')],
  });

  // Borders that a rule samples at a height, so they are stored as polylines.
  const sampleBorder = (part, direction, count = 24) => {
    const [lo, hi] = span(part, 1);
    const out = [];
    for (let i = 0; i <= count; i++) {
      const y = lo + ((hi - lo) * i) / count;
      const found = extremeInSection(part, 1, y, direction, { halfThickness: (hi - lo) / count / 2 });
      if (found) out.push(found.point);
    }
    return out;
  };
  curve('fibula_anterior_border', '비골 전연', side, () => sampleBorder(fibula, v(0, 0, 1)), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most anterior fibular vertex in each of 25 horizontal sections along the bone',
    sources: [sidedName(side, 'fibula')],
  });
  curve('fibula_posterior_border', '비골 후연', side, () => sampleBorder(fibula, v(0, 0, -1)), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most posterior fibular vertex in each of 25 horizontal sections along the bone',
    sources: [sidedName(side, 'fibula')],
  });
  curve('tibia_medial_border', '경골 내측연', side, () => sampleBorder(tibia, v(-sign, 0, 0)), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most medial tibial vertex in each of 25 horizontal sections along the bone',
    sources: [sidedName(side, 'tibia')],
  });
  if (has(atlas, sidedName(side, 'iliotibial tract'))) {
    const tract = mesh(atlas, sidedName(side, 'iliotibial tract'));
    curve('iliotibial_tract_posterior_border', '장경인대 후연', side, () => sampleBorder(tract, v(0, 0, -1)), {
      type: 'anatomical', anatomicalConfidence: 'medium', frameConfidence: 'high',
      derivation: 'most posterior vertex of the fascia lata sheet in each of 25 horizontal sections. BodyParts3D ships one mesh for the whole sheet and names it the iliotibial tract',
      sources: [sidedName(side, 'iliotibial tract')],
    });
  }
  if (has(atlas, `Long head of ${side} biceps femoris`)) {
    const biceps = mesh(atlas, `Long head of ${side} biceps femoris`);
    point('biceps_femoris_tendon_distal', '대퇴이두근건 원위단', side, () => extremeCluster(biceps, v(0, -1, 0), 0.02), {
      type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
      derivation: 'lowest vertices of the long head of biceps femoris, where its tendon reaches the fibular head',
      sources: [`Long head of ${side} biceps femoris`],
    });
  }
  if (has(atlas, sidedName(side, 'extensor digitorum longus'))) {
    const edl = mesh(atlas, sidedName(side, 'extensor digitorum longus'));
    curve('extensor_digitorum_longus_lateral_border', '장지신근 외측연', side, () => sampleBorder(edl, v(sign, 0, 0)), {
      type: 'anatomical', anatomicalConfidence: 'medium', frameConfidence: 'high',
      derivation: 'most lateral vertex of extensor digitorum longus in each of 25 horizontal sections',
      sources: [sidedName(side, 'extensor digitorum longus')],
    });
  }

  // ------------------------------------------------------------ foot
  const mt4 = mesh(atlas, sidedName(side, 'fourth metatarsal bone'));
  const mt5 = mesh(atlas, sidedName(side, 'fifth metatarsal bone'));
  const proximal = (part) => extremeCluster(part, v(0, 0, -1), 0.05);
  const distal = (part) => extremeCluster(part, v(0, 0, 1), 0.05);
  point('metatarsal_4_base', '제4중족골 저', side, () => proximal(mt4), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most proximal vertices of the fourth metatarsal', sources: [sidedName(side, 'fourth metatarsal bone')],
  });
  point('metatarsal_5_base', '제5중족골 저', side, () => proximal(mt5), {
    type: 'anatomical', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'most proximal vertices of the fifth metatarsal', sources: [sidedName(side, 'fifth metatarsal bone')],
  });
  point('metatarsal_45_base_junction', '제4·5중족골 저 연접부', side, () => proximal(mt4).add(proximal(mt5)).multiplyScalar(0.5), {
    type: 'derived', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'midpoint of the two metatarsal bases',
    sources: [sidedName(side, 'fourth metatarsal bone'), sidedName(side, 'fifth metatarsal bone')],
  });
  point('metatarsophalangeal_4', '제4중족지관절', side, () => {
    const head = distal(mt4);
    const phalanx = mesh(atlas, `Proximal phalanx of ${side} fourth toe`);
    return head.clone().add(extremeCluster(phalanx, v(0, 0, -1), 0.05)).multiplyScalar(0.5);
  }, {
    type: 'derived', anatomicalConfidence: 'high', frameConfidence: 'high',
    derivation: 'midpoint between the head of the fourth metatarsal and the base of the fourth proximal phalanx',
    sources: [sidedName(side, 'fourth metatarsal bone'), `Proximal phalanx of ${side} fourth toe`],
  });
  point('interdigital_web_4_5', '제4·5족지간 물갈퀴연', side, () => {
    const fourth = mesh(atlas, `Proximal phalanx of ${side} fourth toe`);
    const little = mesh(atlas, `Proximal phalanx of ${side} little toe`);
    const gap = fourth.box.getCenter(new T.Vector3()).add(little.box.getCenter(new T.Vector3())).multiplyScalar(0.5);
    const skin = mesh(atlas, 'Skin');
    // The cleft is the skin between the two toes that reaches furthest back toward the foot.
    return extremeCluster(skin, v(0, 0, -1), 0.03, (p) =>
      Math.abs(p.x - gap.x) < 0.008 && Math.abs(p.y - gap.y) < 0.012 && p.z > gap.z - 0.02 && p.z < gap.z + 0.03);
  }, {
    type: 'derived', anatomicalConfidence: 'medium', frameConfidence: 'high',
    derivation: 'most proximal skin between the fourth and little proximal phalanges',
    sources: ['Skin', `Proximal phalanx of ${side} fourth toe`, `Proximal phalanx of ${side} little toe`],
  });
  point('toenail_root_corner_4_lateral', '제4족지갑 외측 뿌리각', side, () => {
    const phalanx = mesh(atlas, `Distal phalanx of ${side} fourth toe`);
    const box = phalanx.box;
    return v(sign > 0 ? box.max.x : box.min.x, box.max.y, box.min.z + (box.max.z - box.min.z) * 0.2);
  }, {
    type: 'estimated', anatomicalConfidence: 'low', frameConfidence: 'medium',
    derivation: 'lateral-dorsal corner of the fourth distal phalanx at one fifth of its length; toenails are not modelled in BodyParts3D',
    sources: [`Distal phalanx of ${side} fourth toe`],
  });
}

// Record how closely each sided pair mirrors, so a rule can see the uncertainty it inherits.
for (const landmark of landmarks) {
  if (landmark.side !== 'right' || landmark.kind !== 'point') continue;
  const other = landmarks.find((l) => l.id === landmark.id && l.side === 'left');
  if (!other) continue;
  const offset = Math.max(
    Math.abs(landmark.point[0] + other.point[0]),
    Math.abs(landmark.point[1] - other.point[1]),
    Math.abs(landmark.point[2] - other.point[2]),
  );
  landmark.symmetryOffsetMm = other.symmetryOffsetMm = +(offset * 1000).toFixed(1);
}

// ---------------------------------------------------------------- output
const byQuality = (key) => {
  const counts = {};
  for (const l of landmarks) counts[l[key] ?? 'n/a'] = (counts[l[key] ?? 'n/a'] ?? 0) + 1;
  return counts;
};
const output = {
  source: 'atlas.json',
  generated: 'scripts/landmarks.mjs',
  note: 'anatomicalConfidence rates the match to a real structure; frameConfidence rates fitness as the origin of a WHO proportional axis',
  count: landmarks.length,
  landmarks,
  skipped,
};
fs.mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../data/landmarks.json', import.meta.url), JSON.stringify(output, null, 1));
console.log(`${landmarks.length} landmarks written, ${skipped.length} skipped`);
console.log('type:', JSON.stringify(byQuality('type')));
console.log('anatomical:', JSON.stringify(byQuality('anatomicalConfidence')));
console.log('frame:', JSON.stringify(byQuality('frameConfidence')));
if (skipped.length) console.log('skipped:', skipped.map((s) => `${s.id}${s.side ? `/${s.side}` : ''} (${s.reason})`).join('; '));
