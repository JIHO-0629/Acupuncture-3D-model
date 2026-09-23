"""Reproduce the viewer's depth cap against the primary workbook's model rays.

This is a read-only source audit: the workbook is never modified. Its raycast
was recorded at repo 2d4aa8e, so the resulting caps are *estimates* for the
current browser scene, not an independent live-mesh raycast or clinical advice.
"""

import collections
import json
import re
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[2]
MERIDIANS = ("LU", "LI", "ST", "SP", "HT", "SI", "BL", "KI", "PC", "TE", "GB", "LR", "CV", "GV")
BASE_HAZARDS = {"skeletal", "arterial", "venous", "nervous"}


def region_for(code, regions):
    if code.startswith("GB"):
        number = int(code[2:])
        if number <= 19:
            return "face-scalp"
        if number == 20:
            return "neck"
        if number <= 24:
            return "thorax"
        if number <= 28:
            return "flank-abdomen"
        if number <= 30:
            return "pelvis-gluteal"
        if number <= 34:
            return "thigh-knee"
        if number <= 39:
            return "leg"
        if number <= 43:
            return "ankle-foot"
        return "toe"
    if code.startswith("LI"):
        number = int(code[2:])
        return "face-scalp" if number >= 19 else "neck" if number >= 17 else "upper-limb"
    skin_region = regions.get(code, "")
    for pattern, result in (("thorax|shoulder", "thorax"), ("face|head|oral", "face-scalp"),
                            ("neck", "neck"), ("lumbar|pelvis", "flank-abdomen"),
                            ("thigh|knee", "thigh-knee"), ("leg", "leg"),
                            ("foot", "ankle-foot")):
        if re.search(pattern, skin_region):
            return result
    return "upper-limb"


def hazards_for(region):
    if region == "face-scalp":
        return BASE_HAZARDS | {"sensory"}
    if region == "thorax":
        return BASE_HAZARDS | {"respiratory"}
    if region == "flank-abdomen":
        return BASE_HAZARDS | {"digestive", "urinary", "reproductive"} - {"nervous"}
    if region == "pelvis-gluteal":
        return BASE_HAZARDS | {"digestive", "urinary", "reproductive"}
    return BASE_HAZARDS


def gb_probe(code):
    number = int(code[2:])
    if number <= 19:
        return 45
    if number == 20:
        return 80
    if number <= 24:
        return 100
    if number <= 28:
        return 100
    if number <= 30:
        return 120
    if number <= 34:
        return 100
    if number <= 39:
        return 80
    if number <= 43:
        return 12
    return 4


def js_tenth(value):
    return float(Decimal(str(value)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def cell(value):
    if value is None or value == "":
        return "—"
    return str(value).replace("|", "\\|").replace("\n", " ")


def conversion_basis(code, origin):
    """Mirror localCun in raycast_all.mjs; this is provenance, not a new conversion."""
    if not origin:
        return None
    x, y, _ = origin
    if re.match(r"^(LU|LI|HT|SI|PC|TE)\d", code) and abs(x) > 0.14:
        return "전완 12 B-cun"
    if y > 1.54:
        return "두부 12 B-cun"
    if y > 1.24:
        return "흉부 9 B-cun"
    if y > 1.09:
        return "상복부 8 B-cun"
    if y > 0.9:
        return "하복부 5 B-cun"
    if y > 0.44:
        return "대퇴 19 B-cun"
    if y > 0.06:
        return "하퇴 16 B-cun"
    return "복사뼈-발바닥 3 B-cun"


def conversion_review(skin_region, basis):
    """Flag clear *region-to-reference* conflicts, not clinically wrong depths."""
    if not skin_region or not basis:
        return False
    region = skin_region.lower()
    if "upper-arm" in region and basis == "전완 12 B-cun":
        return True
    if ("hand" in region or "finger" in region or "mcp" in region) and basis == "전완 12 B-cun":
        return True
    if "shoulder" in region and basis in {"전완 12 B-cun", "두부 12 B-cun"}:
        return True
    if ("face" in region or "head" in region or "neck" in region or "oral" in region) and basis == "흉부 9 B-cun":
        return True
    if "thorax" in region and basis == "두부 12 B-cun":
        return True
    return False


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    book = load_workbook(sys.argv[1], read_only=True, data_only=True)
    output = Path(sys.argv[2])
    app = json.loads((ROOT / "data/needling-direct.json").read_text(encoding="utf-8"))
    current_path = output.with_suffix(".current.json")
    current = json.loads(current_path.read_text(encoding="utf-8")) if current_path.exists() else {}
    regions = {}
    for meridian in MERIDIANS:
        path = ROOT / "data/meridians" / f"{meridian}.json"
        if path.exists():
            for point in json.loads(path.read_text(encoding="utf-8"))["points"]:
                regions[point["code"]] = point.get("region", "")
    for point in json.loads((ROOT / "data/li-source.json").read_text(encoding="utf-8"))["points"]:
        regions[point["code"]] = point.get("region", "")

    direct = {}
    all_codes = set()
    for row in list(book["자침법"].values)[1:]:
        all_codes.add(row[1])
        if row[4] == "perpendicular" and row[1] not in direct:
            direct[row[1]] = row
    paths = collections.defaultdict(list)
    selected_techniques = {row[0] for row in direct.values()}
    for row in list(book["모델경로"].values)[1:]:
        if row[5] in selected_techniques:
            paths[row[5]].append(row)

    results = []
    for meridian in MERIDIANS:
        codes = sorted((code for code in all_codes if code.startswith(meridian)), key=lambda code: int(code[len(meridian):]))
        for code in codes:
            if code not in direct:
                results.append(dict(code=code, technique=None, source_min=None, source_max_cun=None,
                    source_max_mm=None, probe=None, cap=None, region=region_for(code, regions),
                    hazard=None, muscle=None, first_layer=None, hidden=[], muscle_in_source=[], layers=[],
                    mismatch=False, category="원본 직자 기법 없음", enabled=False, is_gb=code.startswith("GB"),
                    current=False))
                continue
            source = direct[code]
            technique = source[0]
            model_rows = paths[technique]
            source_max = None
            if model_rows and model_rows[0][13]:
                source_max = float(str(model_rows[0][13]).split("|")[0].strip())
            workbook_layers = sorted((row for row in model_rows if isinstance(row[14], int)
                                      and isinstance(row[18], (float, int))), key=lambda row: row[18])
            if code in current:
                layers = []
                for index, hit in enumerate(current[code]["hits"], 1):
                    row = [None] * 22
                    row[14], row[15], row[16], row[17], row[18] = (index, hit["id"],
                        hit["name"], hit["system"], hit["distanceMm"])
                    layers.append(row)
                layers.sort(key=lambda row: row[18])
            else:
                layers = workbook_layers
            is_gb = code.startswith("GB")
            app_profile = app.get(code)
            enabled = is_gb or app_profile is not None
            region = region_for(code, regions)
            probe = gb_probe(code) if is_gb else app_profile["modelMaxMm"] if app_profile else None
            source_mismatch = False
            if app_profile and source_max is not None:
                source_mismatch = (abs(app_profile["modelMaxMm"] - source_max) > 0.05
                    or app_profile["techniqueId"] != technique
                    or app_profile["minCun"] != source[7]
                    or app_profile["maxCun"] != source[8])
            hazards = hazards_for(region)
            first_hazard = next((row for row in layers if probe is not None
                                 and row[18] <= probe and row[17] in hazards), None)
            cap = js_tenth(first_hazard[18] * 0.9) if first_hazard else (
                js_tenth(probe * 0.9) if is_gb and probe is not None else probe)
            muscle_in_source = [row for row in layers if source_max is not None and row[17] == "muscular"
                                and row[18] <= source_max]
            hidden = [row for row in muscle_in_source if cap is not None and row[18] > cap]
            first_muscle = next((row for row in layers if row[17] == "muscular"), None)
            first_named_layer = layers[0] if layers else None
            basis = conversion_basis(code, current.get(code, {}).get("origin"))
            basis_review = conversion_review(regions.get(code, ""), basis)

            if not enabled:
                category = "직자 시뮬레이션 잠금"
            elif is_gb:
                category = "담경: 문헌 깊이 미반영"
            elif source_mismatch:
                category = "앱-원본 깊이 불일치"
            elif first_hazard and first_hazard[17] in {"venous", "arterial", "nervous"}:
                category = "혈관·신경 메시 조기정지"
            elif first_hazard:
                category = "뼈·장기 등 메시 조기정지"
            else:
                category = "원본 깊이 상한"

            results.append(dict(code=code, technique=technique, source_min=source[7], source_max_cun=source[8],
                source_max_mm=source_max, probe=probe, cap=cap, region=region,
                hazard=first_hazard, muscle=first_muscle, first_layer=first_named_layer,
                hidden=hidden, muscle_in_source=muscle_in_source, layers=layers,
                current=code in current, basis=basis, basis_review=basis_review,
                mismatch=source_mismatch, category=category, enabled=enabled, is_gb=is_gb))

    counts = collections.Counter(row["category"] for row in results)
    enabled = [row for row in results if row["enabled"]]
    non_gb = [row for row in enabled if not row["is_gb"]]
    hidden = [row for row in enabled if row["hidden"]]
    shallow = [row for row in non_gb if row["hazard"] and row["cap"] < row["source_max_mm"]]
    no_muscle = [row for row in enabled if not row["muscle_in_source"]]
    no_layer = [row for row in enabled if row["source_max_mm"] is not None and
                not any(layer[18] <= row["source_max_mm"] for layer in row["layers"])]
    gb = [row for row in enabled if row["is_gb"] and row["source_max_mm"] is not None]
    gb_over = [row for row in gb if row["cap"] - row["source_max_mm"] > 0.05]
    gb_under = [row for row in gb if row["source_max_mm"] - row["cap"] > 0.05]
    basis_review = [row for row in enabled if row["basis_review"]]
    if current and set(current) != {row["code"] for row in enabled}:
        raise ValueError("current-atlas ray audit does not cover exactly the enabled points")
    stop_systems = collections.Counter(row["hazard"][17] for row in shallow)
    hidden_by_system = collections.Counter(row["hazard"][17] if row["hazard"] else "none" for row in hidden)
    vascular_stops = [row for row in shallow if row["hazard"][17] in {"venous", "arterial", "nervous"}]
    other_stops = [row for row in shallow if row["hazard"][17] not in {"venous", "arterial", "nervous"}]

    lines = ["# 자침 깊이·조기 정지 전수 검사", "",
        "- 원본: [경혈_데이터_405_WHO_해부학검수.xlsm](https://drive.google.com/file/d/1SkFk0rVxpHHMo2ID1oTLy1yjKvAgl-YD/view) (`자침법`, `모델경로`), 수정하지 않음. 확인한 Drive 수정 시각: 2026-09-23 01:59 UTC.",
        "- 비교 대상: 현재 앱 `data/needling-direct.json`, `app/gb-points.ts`, `app/scene.tsx`.",
        f"- 해석 주의: {'현재 atlas 메시와 앱의 5개 샤프트 광선으로 재계산' if current else '원본 모델경로 기록(repo 2d4aa8e)으로 현행 코드 규칙을 재현'}한 값입니다. 브라우저와 동일한 참조 모델의 예상 정지값이지만 개인별 조직 위치·안전심도를 뜻하지 않습니다. 혈관·신경 개인차를 정량 판정하지 않습니다.",
        "- 원본 깊이는 비율로 환산한 모델 mm이며 임상 안전심도가 아닙니다. 위험 구조는 통과 허용으로 바꾸지 않았습니다.", "",
        "- 혈관·신경 조기정지는 **이 참조 모델의 메시 교차** 판정입니다. 개인차 자체를 증명하거나 안전하게 통과할 수 있음을 뜻하지 않습니다. 비담경의 '불일치 0'은 원본 촌·환산 mm 값의 일치만 확인한 것이며, 그 비율과 해부 구조의 임상적 타당성은 별도 검증 대상입니다.", "",
        "## 집계", "",
        f"- 원본 전체 혈자리: {len(results)}개. 직자 기법 기록: {len(direct)}개, 직자 기법 없음: {len(results)-len(direct)}개. 앱 직자 시뮬레이션 활성: {len(enabled)}개, 잠금: {len(results)-len(enabled)}개.",
        f"- 비담경 앱-원본 촌·모델 mm 불일치: {sum(row['mismatch'] for row in non_gb)}개.",
        f"- 원본 모델 mm의 **비율 환산 참조 구간**이 혈자리 부위와 명백히 다른 검토 후보: {len(basis_review)}개. 원본 생성기 `raycast_all.mjs`의 구간 선택을 점검한 것으로, mm 오차량이나 임상적으로 잘못된 깊이를 확정한 값은 아닙니다.",
        f"- 비담경 원본 상한 전 조기 정지: {len(shallow)}개. 이 중 혈관·신경: {sum(row['hazard'][17] in {'venous','arterial','nervous'} for row in shallow)}개, 기타: {sum(row['hazard'][17] not in {'venous','arterial','nervous'} for row in shallow)}개.",
        f"- 원본 깊이 안에 있는 근육이 앱 정지상한 때문에 미표시: {len(hidden)}개(담경 포함).",
        f"- 원본 깊이 안 근육 교차 없음: {len(no_muscle)}개; 구조물 교차 전혀 없음: {len(no_layer)}개. 이는 깊이 오류의 확증이 아니라 좌표·방향·메시 재검토 대상입니다.",
        f"- 담경 고정 탐색 길이(문헌 촌 깊이 미반영): {counts['담경: 문헌 깊이 미반영']}개.", "",
        f"- 담경 앱 정지상한이 원본 환산 상한 초과: {len(gb_over)}개; 미달: {len(gb_under)}개; 같음: {len(gb)-len(gb_over)-len(gb_under)}개. 초과는 문헌 범위를 넘어 모델 바늘이 진행될 수 있다는 뜻입니다.",
        f"- 현행 메시에서 피부 투영 실패: {sum(bool(value.get('missedSkin')) for value in current.values()) if current else '미검사'}개.",
        "- 비담경 조기정지 메시 종류: " + ", ".join(f"{system} {count}" for system, count in sorted(stop_systems.items())) + ".",
        "- 근육 미표시의 첫 정지 메시 종류: " + ", ".join(f"{system} {count}" for system, count in sorted(hidden_by_system.items())) + ".", "",
        "## 조기 정지로 원본 범위 내 근육이 가려진 혈자리", "",
        ", ".join(row["code"] for row in hidden) or "없음", "",
        "## 비율 환산 구간 검토 후보", "",
        ", ".join(f"{row['code']} ({regions.get(row['code'], '부위 미기록')} → {row['basis']})" for row in basis_review) or "없음", "",
        "## 혈관·신경 메시 때문에 원본 상한 전에 정지한 혈자리", "",
        ", ".join(f"{row['code']} ({row['hazard'][16]} @{row['hazard'][18]:.1f}mm → 정지 {row['cap']:.1f}mm)" for row in vascular_stops) or "없음", "",
        "## 기타 메시 때문에 원본 상한 전에 정지한 혈자리", "",
        ", ".join(f"{row['code']} ({row['hazard'][16]} @{row['hazard'][18]:.1f}mm → 정지 {row['cap']:.1f}mm)" for row in other_stops) or "없음", "",
        "## 담경 원본 상한 초과 혈자리", "",
        ", ".join(f"{row['code']} (+{row['cap']-row['source_max_mm']:.1f}mm)" for row in gb_over) or "없음", "",
        "## 담경 원본 상한 미달 혈자리", "",
        ", ".join(f"{row['code']} ({row['cap']-row['source_max_mm']:.1f}mm)" for row in gb_under) or "없음", "",
        "## 전 혈자리 상세", "",
        "`앱 상한(mm)`는 현행 모델 메시 경로에 앱의 정지 규칙을 적용한 값입니다. `앱-원본(mm)`이 양수면 문헌 상한 초과입니다. `상한 내 첫 근육`은 원본 깊이까지 보면 메시가 교차하는 첫 근육입니다. `미표시`는 그 근육이 앱 정지 상한 뒤에 있음을 뜻합니다.", "",
        "| 혈자리 | 원본 기법 | 원본 직자 | 원본 환산상한 mm | 앱 설정탐색 mm | 앱 상한 mm | 앱-원본 mm | 분류 | 첫 위험 메시 @mm | 상한 내 첫 근육 @mm | 근육 미표시 |",
        "|---|---|---:|---:|---:|---:|---:|---|---|---|---|",]
    for row in results:
        hazard = row["hazard"]
        muscle = row["muscle_in_source"][0] if row["muscle_in_source"] else None
        hazard_label = f"{hazard[16]} ({hazard[17]}) @{hazard[18]:.1f}" if hazard else "—"
        muscle_label = f"{muscle[16]} @{muscle[18]:.1f}" if muscle else "—"
        lines.append("| " + " | ".join(map(cell, (row["code"], row["technique"],
            f"{row['source_min']}–{row['source_max_cun']}촌" if row["source_min"] is not None else "원본 범위 없음",
            f"{row['source_max_mm']:.1f}" if row["source_max_mm"] is not None else None,
            f"{row['probe']:.1f}" if row["probe"] is not None else None,
            f"{row['cap']:.1f}" if row["cap"] is not None else None,
            f"{row['cap']-row['source_max_mm']:+.1f}" if row["cap"] is not None and row["source_max_mm"] is not None else None,
            row["category"], hazard_label, muscle_label,
            ", ".join(f"{hit[16]} @{hit[18]:.1f}" for hit in row["hidden"]) or "—"))) + " |")

    output.parent.mkdir(parents=True, exist_ok=True)
    output.with_suffix(".input.json").write_text(json.dumps([
        {"code": row["code"], "sourceMaxMm": row["source_max_mm"], "probeMm": row["probe"], "region": row["region"]}
        for row in results if row["enabled"]], ensure_ascii=False), encoding="utf-8")
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"report={output}")
    print(f"source_points={len(results)} source_direct={len(direct)} enabled={len(enabled)} locked={len(results)-len(enabled)}")
    print(f"early_stop_non_gb={len(shallow)} vascular_nervous={sum(r['hazard'][17] in {'venous','arterial','nervous'} for r in shallow)} other={sum(r['hazard'][17] not in {'venous','arterial','nervous'} for r in shallow)}")
    print(f"hidden_muscle={len(hidden)} no_muscle_in_source={len(no_muscle)} no_layer_in_source={len(no_layer)} depth_mismatch={sum(r['mismatch'] for r in non_gb)} basis_review={len(basis_review)} gb_fixed={counts['담경: 문헌 깊이 미반영']} gb_over={len(gb_over)} gb_under={len(gb_under)}")
    print("stop_systems", dict(stop_systems), "hidden_by_system", dict(hidden_by_system))
    for category, count in counts.items():
        print(category, count)
    for code in ("LU6", "PC6", "ST36", "GB21", "CV8"):
        row = next((r for r in results if r["code"] == code), None)
        if row:
            print(code, "source", row["source_max_mm"], "cap", row["cap"],
                  "hazard", row["hazard"][16:19] if row["hazard"] else None,
                  "hidden", [(r[16], r[18]) for r in row["hidden"]])


if __name__ == "__main__":
    main()
