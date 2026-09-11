"""Migrate GB1–GB44 to the agreed S:W evidence layout without rebuilding XLSM.

Only worksheet XML cells S:W are changed, so drawings and other package members stay byte-for-byte intact.
"""

from __future__ import annotations

import argparse
import html
import re
import shutil
import tempfile
import zipfile
from pathlib import Path

import openpyxl


TARA_SOURCE = "https://github.com/SciCrunch/TARA-Ontology-Repository"
MISSING_RAW = {
    "GB21": "직자 0.3~0.5촌",
    "GB22": "사자 0.3~0.5촌",
    "GB23": "사자 0.3~0.5촌",
    "GB24": "사자 0.3~0.5촌",
    "GB25": "직자 0.3~0.5촌",
    "GB30": "직자 1.5~2.5촌",
    "GB34": "직자 0.8~1.2촌",
    "GB38": "직자 0.5~0.7촌",
    "GB41": "직자 0.3~0.5촌",
    "GB43": "직자 0.5촌",
    "GB44": "얕게 약 0.1촌",
}
PARTIAL = {
    "GB2", "GB14", "GB20", "GB21", "GB22", "GB23", "GB24", "GB25",
    "GB30", "GB38", "GB41", "GB43", "GB44",
}
HEADERS = {
    "S": "자침법 RAW",
    "T": "자침깊이 검증 상태",
    "U": "검증 출처",
    "V": "영상/해부학 검증",
    "W": "근거등급",
}


def validation_status(code: str) -> str:
    if code == "GB29":
        return "불일치 · 수동검수 필요"
    if code in PARTIAL:
        return "부분일치 · 접근법/범위 차이"
    return "KMCRIC 범위 일치"


def xml_cell(ref: str, value: str | None, style: str | None) -> str:
    style_attr = f' s="{style}"' if style else ""
    if value is None or value == "":
        return f'<c r="{ref}"{style_attr}/>'
    escaped = html.escape(str(value), quote=False)
    return f'<c r="{ref}"{style_attr} t="inlineStr"><is><t xml:space="preserve">{escaped}</t></is></c>'


def get_style(row_xml: str, ref: str) -> str | None:
    match = re.search(rf'<c\b[^>]*\br="{re.escape(ref)}"[^>]*', row_xml)
    if not match:
        return None
    style = re.search(r'\bs="([^"]+)"', match.group(0))
    return style.group(1) if style else None


def set_cell(row_xml: str, ref: str, value: str | None, fallback_style: str | None = None) -> str:
    style = get_style(row_xml, ref) or fallback_style
    replacement = xml_cell(ref, value, style)
    pattern = rf'<c\b[^>]*\br="{re.escape(ref)}"[^>]*(?:/>|>.*?</c>)'
    if re.search(pattern, row_xml, flags=re.DOTALL):
        return re.sub(pattern, replacement, row_xml, count=1, flags=re.DOTALL)
    return row_xml.replace("</row>", replacement + "</row>")


def migrate(input_path: Path, output_path: Path) -> None:
    workbook = openpyxl.load_workbook(input_path, read_only=True, data_only=False)
    sheet = workbook["경혈 405"]
    rows: dict[int, tuple[str, str | None, str | None, str | None]] = {}
    for row_number, values in enumerate(sheet.iter_rows(min_row=2, max_col=21, values_only=True), 2):
        code = values[9]
        if isinstance(code, str) and re.fullmatch(r"GB(?:[1-9]|[1-3][0-9]|4[0-4])", code.replace(" ", "").upper()):
            rows[row_number] = (code.replace(" ", "").upper(), values[18], values[19], values[20])
    workbook.close()
    if len(rows) != 44:
        raise RuntimeError(f"Expected 44 GB rows, found {len(rows)}")

    with zipfile.ZipFile(input_path, "r") as source:
        sheet_xml = source.read("xl/worksheets/sheet1.xml").decode("utf-8")
        sheet_xml = re.sub(r'(<dimension\b[^>]*\bref=")([^"]+)(")', lambda m: m.group(1) + re.sub(r":U(\d+)$", r":W\1", m.group(2)) + m.group(3), sheet_xml, count=1)
        if "</cols>" in sheet_xml and 'min="22"' not in sheet_xml:
            sheet_xml = sheet_xml.replace("</cols>", '<col min="22" max="22" width="65" customWidth="1"/><col min="23" max="23" width="14" customWidth="1"/></cols>', 1)

        target_rows = {1, *rows.keys()}
        row_pattern = re.compile(r'<row\b[^>]*\br="(\d+)"[^>]*>.*?</row>', re.DOTALL)

        def update_row(match: re.Match[str]) -> str:
            row_number = int(match.group(1))
            if row_number not in target_rows:
                return match.group(0)
            row_xml = match.group(0)
            s_style = get_style(row_xml, f"S{row_number}")
            t_style = get_style(row_xml, f"T{row_number}")
            u_style = get_style(row_xml, f"U{row_number}")
            if row_number == 1:
                for column, value in HEADERS.items():
                    fallback = s_style if column in {"S", "V"} else t_style or u_style
                    row_xml = set_cell(row_xml, f"{column}1", value, fallback)
                return row_xml

            code, old_s, old_t, old_u = rows[row_number]
            evidence = None
            source_needling = old_s
            evidence_match = re.search(r"\n(?=\[(?:공개근거|근거등급))", old_s or "")
            if old_s and evidence_match:
                source_needling = old_s[: evidence_match.start()].rstrip() or MISSING_RAW.get(code)
                evidence = old_s[evidence_match.end() :]
            elif code in MISSING_RAW:
                evidence = old_s
                source_needling = MISSING_RAW[code]
            if evidence and old_u:
                evidence = f"{evidence}\n근거: {old_u}"

            validation_source = f"https://m.kmcric.com/knowledge/acupoint/GB/{code}"
            if code in MISSING_RAW:
                validation_source = f"{TARA_SOURCE} | {validation_source}"
            values = {
                "S": source_needling,
                "T": validation_status(code),
                "U": validation_source,
                "V": evidence,
                "W": old_t if evidence else None,
            }
            for column, value in values.items():
                fallback = s_style if column in {"S", "V"} else t_style or u_style
                row_xml = set_cell(row_xml, f"{column}{row_number}", value, fallback)
            return row_xml

        sheet_xml = row_pattern.sub(update_row, sheet_xml)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsm") as temp_file:
            temp_path = Path(temp_file.name)
        try:
            with zipfile.ZipFile(temp_path, "w") as target:
                for member in source.infolist():
                    payload = sheet_xml.encode("utf-8") if member.filename == "xl/worksheets/sheet1.xml" else source.read(member.filename)
                    target.writestr(member, payload)
            shutil.move(temp_path, output_path)
        finally:
            temp_path.unlink(missing_ok=True)

    check = openpyxl.load_workbook(output_path, read_only=True, data_only=False)
    check_sheet = check["경혈 405"]
    assert [check_sheet.cell(1, column).value for column in range(19, 24)] == list(HEADERS.values())
    assert sum(1 for row in rows if check_sheet.cell(row, 19).value) == 44
    assert check_sheet["T332"].value == "불일치 · 수동검수 필요"
    check.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    arguments = parser.parse_args()
    migrate(arguments.input, arguments.output)
