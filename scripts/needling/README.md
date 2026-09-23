# Needling simulation scripts

Offline pipeline behind the acupuncture-point needling data. Nothing here runs in the
browser; each script writes files that are reviewed by hand before anything is used.

| Script | What it does |
| --- | --- |
| `scrape_kcmric.mjs` | Collects the KCMRIC 침구법 text for a meridian into `kcmric-raw/kcmric_raw_<MER>.json`. Cited as a source; the raw text is kept verbatim. |
| `build_data.mjs` | Parses that raw text into one row per point × technique, plus evidence rows, and writes `sheet_data.json`. |
| `evidence.mjs` | Measured depths from imaging and cadaver studies, and the hazard priority seed. Only values read from a paper's full text or abstract. |
| `points_all.mjs` | Collects seeds, outward vectors and projection modes for all 361 standard points from `data/meridians/*.json`, `data/li-landmarks.json` and `app/gb-points.ts`. |
| `raycast_all.mjs` | Projects each point onto skin the way the viewer does, builds a needle vector per technique, and records every tissue layer it meets plus the nearest approach to nerves, arteries, pleura and lung. |
| `raycast_prototype.mjs` | The same for GB21, GB30 and GB38 only, with more printout. Used while designing the schema. |
| `make_config.mjs` / `write_workbook.ps1` | Write the sheets into the reviewer's .xlsm through Excel. |
| `verify_placement.mjs`, `depth_order.mjs`, `qa_all.mjs`, `verify_workbook.mjs` | Checks: structures poking outside the skin, layer order at a few probes, and sanity of the generated rows. |

Rules the data follows:

- The cun in KCMRIC is kept as written. Millimetres only ever appear as a derived
  estimate with the conversion method and version recorded next to it.
- The model's distances are for display. No script prints a safe or unsafe verdict.
- Paths inside the scripts are absolute; adjust `REPO` if the checkout moves.
