# Z-Anatomy peripheral nerves and pleura — CC BY-SA 4.0

Everything in this folder (`zanatomy.json` and `zanatomy-*.bin`) is an adaptation of
Z-Anatomy and is licensed under the **Creative Commons Attribution-ShareAlike 4.0
International License**: https://creativecommons.org/licenses/by-sa/4.0/

This license applies to this folder only. The BodyParts3D geometry in `public/models/`
remains CC BY 4.0, and the application code remains MIT. Those works are only placed
alongside this folder, which makes them a collection rather than an adaptation.

## Source

- Z-Anatomy by Lluís Vinent Moragues and contributors, https://github.com/LluisV/Z-Anatomy
  (branch `PC-Version`), licensed CC BY-SA 4.0.
- Files used: `Resources/Models/FBX/NervousSystem100.fbx` (peripheral nerves) and
  `Resources/Models/FBX/VisceralSystem100.fbx` (the `Pleura` mesh), downloaded 2026-09-22.
- `SkeletalSystem100.fbx` was used only to compute the registration. None of its geometry is redistributed.

## Changes made

1. Selection: only nerve meshes that extend below the head (the atlas already carries
   BodyParts3D cranial structures) plus the `Pleura` mesh. Empty 36-vertex group meshes are dropped.
2. Registration to the BodyParts3D 4.0 frame (metres, Y-up):
   - First, a global similarity fit on shared organs and cranial nerves.
   - Then per-bone-segment fits: the thorax as a similarity fit, pelvis as a similarity fit,
     and femur and tibia/fibula as affine fits, each run with ICP against the atlas bones.
   - Each vertex is moved by a distance-weighted blend of the nearby segment transforms.
   - Bone-surface residual after the fit: median 2–4 mm, 90th percentile 4–10 mm.
     Nerve positions therefore carry roughly ±5–10 mm uncertainty in the limbs.
3. Duplicate vertices were welded and the geometry simplified with meshoptimizer
   (22 % index budget, 0.2 % error limit). Normals were recomputed and quantised to 16-bit.
4. Names were rewritten from Z-Anatomy's `Name_of_nerver/l` convention to "Right/Left name of nerve".
   The original name is kept in each part's `sourceName`.

The scripts that produced this folder are kept with the project's needling-simulation work.
They are `inspect_fbx.mjs`, `register.mjs`, `segment_register.mjs` and `export_zanatomy.mjs`.

## Use

Educational reference geometry only. Nerve courses vary between people, and this model
must not be used to judge where a real patient's nerve lies.
