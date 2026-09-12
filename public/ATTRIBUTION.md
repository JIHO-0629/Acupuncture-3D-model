# Anatomy data attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimeters/Z-up to meters/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colors. The 4.0 source contains 2,234 individual OBJ meshes; all remain represented, alongside 55 meshes recovered from release 3.0 (see below). The combined hierarchy contains 3,482 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

Source OBJ comments mention an older CC BY-SA 2.1 Japan license. The official current database license linked above supersedes that legacy text and explicitly permits redistribution and adaptation under CC BY 4.0.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## Structures recovered from BodyParts3D 3.0

Release 4.0 does not ship the muscles of facial expression, the muscles of mastication, the epicranial aponeurosis, lung surfaces, latissimus dorsi, or rectus abdominis. Release 3.0 still carries them, in the same coordinate frame, so 55 meshes are taken from there and placed on the 4.0 skeleton without any registration or reshaping.

- Source geometry: `BodyParts3D_3.0_obj_99.zip`, BodyParts3D 3.0 (2011-09-15 release).
- Archive: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/
- English names: `parts_list_e.txt` from the same release.
- Script: [`scripts/add-bp3-structures.mjs`](../scripts/add-bp3-structures.mjs), which lists every recovered structure.

Recovered: temporalis, masseter (superficial and deep parts), medial and lateral pterygoid, epicranial aponeurosis, orbicularis oculi (orbital and palpebral parts), orbicularis oris, corrugator supercilii, procerus, nasalis, depressor septi nasi, buccinator, levator labii superioris, levator labii superioris alaeque nasi, levator anguli oris, depressor anguli oris, depressor labii inferioris, zygomaticus major and minor, risorius, mentalis, latissimus dorsi, rectus abdominis, and the five lung lobes.

The 3.0 OBJ files carry the same legacy CC BY-SA 2.1 Japan comment as the 4.0 files. The current dataset license linked above covers the BodyParts3D database as distributed by DBCLS, including the archived releases.

Still absent from every BodyParts3D release, and therefore not represented here: the pleura, the parietal peritoneum, peripheral nerves outside the orbit (including the sciatic, common fibular, tibial, femoral, and intercostal nerves), the crural, thoracolumbar and gluteal fasciae, and the parotid gland. Lung surfaces stand in for the pleural boundary; they are not pleura.

## Historical assets (not included in the current release)

Earlier repository revisions included female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: translated native meter/Y-up coordinates onto the stage, coincident vertices welded and source normals averaged, geometry simplified with a 0.2% per-structure relative error bound, and normals quantized. Colors and display systems are curated for this interface. All 888 source meshes are represented, with 1,073 source nodes available as selectable individual or compound concepts.

This is a reference assembly with whole-body surface and selected organs, including female reproductive anatomy. Its skeleton and muscle coverage is partial. It is not a complete model of every human structure or a single-person scan. Eight placenta/umbilical structures are classified under Pregnancy reference and hidden by default.
