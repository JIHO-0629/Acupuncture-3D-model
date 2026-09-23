# Z-Anatomy import and legacy refit

Builds `public/models/zanatomy/` (CC BY-SA 4.0, see its own LICENSE.md) and re-registers
the meshes recovered from BodyParts3D 3.0.

| Script | What it does |
| --- | --- |
| `inspect_fbx.mjs` | Loads a Z-Anatomy FBX and lists its meshes. |
| `register.mjs` | Global similarity fit from shared organs and cranial nerves. |
| `segment_register.mjs` | Per bone segment fits (cervical, thorax, lumbar, pelvis, femur, lower leg) by ICP; writes `segment_registration.json`. |
| `export_zanatomy.mjs` | Moves the nerves, pleura and spine joints into the atlas frame, simplifies them and writes the separate chunk. |
| `refit_legacy.mjs` | Fits the 65 BodyParts3D 3.0 meshes to the 4.0 skeleton per region and rewrites their vertices in place. Back up `public/models/` first. |
| `validate_*.mjs`, `check_cord.mjs`, `verify_new.mjs`, `survey.mjs` | Checks: nerves inside bone, distance to landmarks, discs against neighbouring vertebrae, and what else Z-Anatomy carries. |

The FBX sources and the BodyParts3D 3.0 archive are not in the repository. Download them
from the links in `public/ATTRIBUTION.md` and point the scripts at them.
