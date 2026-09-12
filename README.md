# Human Atlas

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Take the BodyParts3D adult male reference apart into **2,289 individually selectable meshes**, explore **15 anatomical systems**, and search **3,482 named concepts**.

**[Explore the live demo](https://human-atlas-seven.vercel.app)**

## Explore

- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details.
- Use compact controls and detail panels on mobile.

## Run locally

Requires Node.js 22.13 or newer. No API keys or accounts are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3016. To build the static site, run `npm run build`; the output is in `dist/`.

## Validate

```sh
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
node scripts/validate-landmarks.mjs
node scripts/validate-skin-regions.mjs
npm run build
```

Validation covers mesh buffers, names and concept membership, nonoverlapping exploded layouts at desktop and mobile aspect ratios, search and inspection contracts, and tap-versus-drag handling. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, and 390×844, 320×568, and 844×390 layouts. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

The current viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**. It does not represent every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Geometry is simplified for browser performance while retaining every source mesh. The packaged model contains 2,416,144 triangles and downloads approximately 35 MB of compressed geometry. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

This is an educational explorer, not a diagnostic or surgical tool.

## How it works

Geometry is merged into batches. Per-structure GPU textures control translation, visibility, and selection, while component geometry supports accurate picking. Exploded layouts pack only the visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

The optional WebMCP tools expose anatomy search and inspection in compatible browsers. The visible interface works without them.

## Acupoint landmarks

Acupoint positions are being moved off hand-placed coordinates and onto rules that name
anatomical landmarks, because a fixed coordinate cannot follow a bone that tapers. The
first stage derives the landmarks themselves from the bundled geometry:

```sh
node scripts/landmarks.mjs        # data/landmarks.json
node scripts/skin-regions.mjs     # data/skin-regions.json
```

`landmarks.json` holds 130 records over 97 named landmarks: bony prominences, spinous
process features from C7 to L5, proportional-axis endpoints, and borders stored as
polylines so a rule can ask for the anterior edge of the fibula at a given height. Each
record names the meshes it came from and how it was found.

Quality is recorded on two separate axes because they genuinely differ. `anatomicalConfidence`
rates the match to the real structure; `frameConfidence` rates fitness as the origin of a WHO
proportional axis. The umbilicus is the clearest case: as anatomy it is an estimate, but WHO
defines the abdominal scale as 8 B-cun above and 5 below it, so the 8:5 division of the
xiphisternal-to-pubic axis *is* the scale origin. Sided pairs also carry the measured
left/right offset, so a rule can see the uncertainty it inherits.

`skin-regions.json` labels each of the 44,744 skin triangles with the body region beneath it,
found by casting the triangle's normal inward to the first skeletal structure. Projection has
to be able to target the chest wall rather than whatever surface a ray reaches first: with the
arms down, a lateral ray toward the mid-axillary line lands on the upper arm.

Two findings from the validators are worth knowing before writing rules. The `Skin` mesh's
stored normals are not consistently oriented, so outward is taken from the direction out of
the nearest bone. And at the fourth intercostal space the arm occludes the mid-axillary line
almost completely in this standing pose, leaving a single exposed chest wall triangle, so
points there cannot be projected straight outward.

## Rebuilding geometry

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure.

BodyParts3D 4.0 omits the muscles of facial expression and mastication, the epicranial aponeurosis, lung surfaces, latissimus dorsi, and rectus abdominis. Release 3.0 still ships them in the same coordinate frame. To append those 55 meshes to an existing build, unpack `BodyParts3D_3.0_obj_99.zip` and run:

```sh
node scripts/add-bp3-structures.mjs path/to/BodyParts3D_3.0_obj_99
node scripts/compress-models.mjs
```

The script only appends, so existing chunks and parts stay byte-for-byte unchanged. It refuses to run twice against the same manifest.

## Deploy

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, and the `dist` output directory. It can also be served by a static host.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own CC BY 4.0 license**; preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.
