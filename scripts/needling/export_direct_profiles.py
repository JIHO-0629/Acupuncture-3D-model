"""Export the primary workbook's straight-needle ranges for the web viewer.

Run with the downloaded, read-only source workbook as the first argument. The mm
value is the workbook's local B-cun estimate for this reference model, not a
patient depth or a safety threshold. The original cun range stays intact.
"""

import json
import sys
from pathlib import Path

from openpyxl import load_workbook


def main() -> None:
    workbook = load_workbook(sys.argv[1], read_only=True, data_only=True)
    techniques = list(workbook["자침법"].values)
    paths = list(workbook["모델경로"].values)
    path_by_technique = {}
    for row in paths[1:]:
        if row[5] and row[5] not in path_by_technique:
            path_by_technique[row[5]] = row

    profiles = {}
    for row in techniques[1:]:
        technique_id, code = row[0], row[1]
        if row[4] != "perpendicular" or code in profiles:
            continue
        if not isinstance(row[7], (float, int)) or not isinstance(row[8], (float, int)):
            continue
        path = path_by_technique.get(technique_id)
        if not path or not path[13]:
            continue
        model_max_mm = float(str(path[13]).split("|")[0].strip())
        if not 0 < model_max_mm <= 150:
            continue
        profiles[code] = {
            "minCun": row[7],
            "maxCun": row[8],
            "modelMaxMm": model_max_mm,
            "raw": row[3],
            "caution": row[16] or row[6] or "",
            "techniqueId": technique_id,
        }

    destination = Path(__file__).resolve().parents[2] / "data" / "needling-direct.json"
    destination.write_text(
        json.dumps(profiles, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(f"Exported {len(profiles)} straight-needle profiles to {destination}")


if __name__ == "__main__":
    main()
