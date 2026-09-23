"""Read-only audit of every straight-needle path in the primary workbook.

The audit compares the model's intersected layers with the model-scaled upper
depth from the same workbook. An absent muscle is a review candidate, not proof
that a needle crosses it; missing geometry cannot establish an entry depth.
"""

import collections
import sys

from openpyxl import load_workbook


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    book = load_workbook(sys.argv[1], read_only=True, data_only=True)
    direct = {}
    for row in list(book["자침법"].values)[1:]:
        if row[4] == "perpendicular" and row[1] not in direct:
            direct[row[1]] = row
    paths = collections.defaultdict(list)
    technique_ids = {r[0] for r in direct.values()}
    for row in list(book["모델경로"].values)[1:]:
        if row[5] in technique_ids:
            paths[row[5]].append(row)

    counted = 0
    no_muscle = []
    no_layer = []
    first_muscle_beyond = []
    no_muscle_in_model = 0
    for code, tech in direct.items():
        rows = paths[tech[0]]
        if not rows or not rows[0][13]:
            continue
        max_mm = float(str(rows[0][13]).split("|")[0].strip())
        if max_mm <= 0:
            continue
        crossed = [r for r in rows if isinstance(r[13], str) and isinstance(r[14], int)
                   and isinstance(r[18], (int, float)) and r[18] <= max_mm]
        counted += 1
        if not crossed:
            no_layer.append((code, tech[0], round(max_mm, 1)))
        if not any(r[17] == "muscular" for r in crossed):
            deeper_muscles = sorted(r[18] for r in rows if isinstance(r[14], int)
                                    and r[17] == "muscular" and isinstance(r[18], (int, float)))
            if deeper_muscles:
                first_muscle_beyond.append(deeper_muscles[0] - max_mm)
            else:
                no_muscle_in_model += 1
            no_muscle.append((code, tech[0], round(max_mm, 1),
                              [r[16] for r in crossed][:4]))
    print("직자 혈자리", len(direct), "깊이·모델경로 존재", counted)
    print("표시 깊이 내 근육 교차 없음", len(no_muscle))
    print("표시 깊이 내 교차 구조 없음", len(no_layer))
    print("첫 근육이 표시 상한 밖에 있음", len(first_muscle_beyond),
          "(2mm 이내:", sum(0 < gap <= 2 for gap in first_muscle_beyond),
          "5mm 이내:", sum(0 < gap <= 5 for gap in first_muscle_beyond), ")")
    print("모델 경로 150mm 안에 근육 없음", no_muscle_in_model)
    # The workbook's expected_anatomy column explicitly says these muscles are
    # traversed. Its other populated rows describe APPROACH/AVOID hazards, not
    # mandatory crossings. Check every source-explicit muscle against both the
    # atlas identity and the workbook's model-scaled upper insertion depth.
    required_intersections = {
        "PC6": ("flexor digitorum superficialis", "flexor digitorum profundus",
                "pronator quadratus"),
        "ST36": ("tibialis anterior",),
    }
    missing_explicit = []
    for code, names in required_intersections.items():
        tech = direct[code]
        rows = paths[tech[0]]
        max_mm = float(str(rows[0][13]).split("|")[0].strip())
        for name in names:
            if not any(name in str(row[16]).lower() and row[17] == "muscular"
                       and isinstance(row[18], (int, float)) and row[18] <= max_mm
                       for row in rows):
                missing_explicit.append((code, name))
    print("원본에 명시된 필수 근육 통과", sum(map(len, required_intersections.values())),
          "누락", len(missing_explicit))
    for code, name in missing_explicit:
        print("명시 통과 누락", code, name, sep="\t")
    for row in no_muscle:
        print(*row, sep="\t")


if __name__ == "__main__":
    main()
