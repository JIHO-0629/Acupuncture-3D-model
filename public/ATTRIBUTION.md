# Anatomy data attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimeters/Z-up to meters/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colors. The 4.0 source contains 2,234 individual OBJ meshes; all remain represented, alongside 65 meshes recovered from release 3.0 (see below). The combined hierarchy contains 3,492 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

Source OBJ comments mention an older CC BY-SA 2.1 Japan license. The official current database license linked above supersedes that legacy text and explicitly permits redistribution and adaptation under CC BY 4.0.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## Structures recovered from BodyParts3D 3.0

Release 4.0 does not ship the muscles of facial expression, the muscles of mastication, the epicranial aponeurosis, lung surfaces, latissimus dorsi, rectus abdominis, or the deep trunk wall. Release 3.0 still carries them, so 65 meshes are taken from there. The higher-detail masseter replacement is registered to the 4.0 skeleton with a similarity fit derived from the release-3.0 and release-4.0 mandible and bilateral zygomatic bones; the other recovered structures retain the legacy placement.

- Source geometry: `BodyParts3D_3.0_obj_99.zip`, BodyParts3D 3.0 (2011-09-15 release).
- Masseter refinement: the left/right superficial and deep masseter meshes use the higher-detail `BodyParts3D_3.0_obj_95.zip` geometry without further simplification.
- Archive: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/
- English names: `parts_list_e.txt` from the same release.
- Script: [`scripts/add-bp3-structures.mjs`](../scripts/add-bp3-structures.mjs), which lists every recovered structure.
- Trunk wall script: [`scripts/restore-bp3-trunk-wall.mjs`](../scripts/restore-bp3-trunk-wall.mjs).
- Masseter replacement script: [`scripts/replace-bp3-masseter.mjs`](../scripts/replace-bp3-masseter.mjs).

Recovered: temporalis, masseter (superficial and deep parts), medial and lateral pterygoid, epicranial aponeurosis, orbicularis oculi (orbital and palpebral parts), orbicularis oris, corrugator supercilii, procerus, nasalis, depressor septi nasi, buccinator, levator labii superioris, levator labii superioris alaeque nasi, levator anguli oris, depressor anguli oris, depressor labii inferioris, zygomaticus major and minor, risorius, mentalis, latissimus dorsi, rectus abdominis, and the five lung lobes.

Also recovered, because a needle through the trunk passes them: internal oblique, transversus abdominis, quadratus lumborum, multifidus, and the inguinal ligament. These ten meshes use the same axis transform as the rest of the 3.0 recovery and need no registration: quadratus lumborum and multifidus reach within 0.6 mm of the 4.0 twelfth rib, hip bone and lumbar vertebrae, every vertex of all ten lies inside the 4.0 skin, and an anterior ray through the flank meets external oblique, internal oblique and transversus abdominis in that order. The inguinal ligament arrived floating: release 3.0 models it as the rolled free edge of the external oblique aponeurosis, and on this pelvis both ends hung about 12 mm anterior to the bone, 20-23 mm short of the ASIS. Its chord was within 3 mm of the ASIS-to-tubercle distance on this body, so [`scripts/fit-inguinal-ligament.mjs`](../scripts/fit-inguinal-ligament.mjs) seats it with a similarity transform - a 5-6 degree rotation and a 1-3% scale, no reshaping - onto the ASIS and the pubic tubercle. Both attachments now sit within 1.2 mm of the bone, and [`scripts/validate-landmarks.mjs`](../scripts/validate-landmarks.mjs) fails if either end drifts more than 4 mm.

The 3.0 OBJ files carry the same legacy CC BY-SA 2.1 Japan comment as the 4.0 files. The current dataset license linked above covers the BodyParts3D database as distributed by DBCLS, including the archived releases.

Still absent from every BodyParts3D release, and therefore not represented here: the pleura, the parietal peritoneum, the spinal ligaments including the ligamentum flavum, the joint capsules and bursae, peripheral nerves outside the orbit (including the sciatic, common fibular, tibial, femoral, and intercostal nerves), the crural, thoracolumbar and gluteal fasciae, and the parotid gland. With no peritoneum in the model, transversus abdominis is the innermost surface the abdominal wall has. Lung surfaces stand in for the pleural boundary; they are not pleura.

## Historical assets (not included in the current release)

Earlier repository revisions included female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: translated native meter/Y-up coordinates onto the stage, coincident vertices welded and source normals averaged, geometry simplified with a 0.2% per-structure relative error bound, and normals quantized. Colors and display systems are curated for this interface. All 888 source meshes are represented, with 1,073 source nodes available as selectable individual or compound concepts.

This is a reference assembly with whole-body surface and selected organs, including female reproductive anatomy. Its skeleton and muscle coverage is partial. It is not a complete model of every human structure or a single-person scan. Eight placenta/umbilical structures are classified under Pregnancy reference and hidden by default.

## Peripheral nerves and pleura from Z-Anatomy (separate license)

BodyParts3D 3.0 and 4.0 contain no peripheral nerves and no pleura, so these come from
Z-Anatomy instead. They live in their own folder, [`models/zanatomy/`](models/zanatomy/LICENSE.md),
under **CC BY-SA 4.0**, and are not packed into the BodyParts3D chunks above.

- Z-Anatomy, https://github.com/LluisV/Z-Anatomy, licensed CC BY-SA 4.0.
- Adaptations: registered onto the BodyParts3D skeleton per bone segment, simplified, and renamed.
  The full list of changes and the residual error are in `models/zanatomy/LICENSE.md`.
