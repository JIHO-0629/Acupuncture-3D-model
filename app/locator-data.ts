import source from "../data/locator-structures.json";

export type LocatorSource = {
  key: number;
  en: string;
  ko: string;
  codes: string[];
  status: "가능" | "부분 가능" | "불가";
  kind: string;
  refs: string[];
  ids: string[];
  system: string;
  note: string;
};

export type LocatorItem = LocatorSource & { color: "bone" | "soft" };

const rows = source.entries as LocatorSource[];
const spinousSource = rows.find((row) => row.en === "spinous process");

// A single generic `spinous process` row cannot be resolved by proximity: its
// candidate set spans C7-L5, so several back points used to light up whichever
// of C7/T1/L1 happened to be nearest.  Keep the level attached to the point.
const SPINOUS_LEVEL_BY_CODE: Record<string, string> = {
  GB21: "C7",
  SI14: "T1", SI15: "C7",
  BL10: "C2",
  BL11: "T1", BL12: "T2", BL13: "T3", BL14: "T4", BL15: "T5", BL16: "T6", BL17: "T7",
  BL18: "T9", BL19: "T10", BL20: "T11", BL21: "T12", BL22: "L1", BL23: "L2", BL24: "L3",
  BL25: "L4", BL26: "L5",
  BL41: "T2", BL42: "T3", BL43: "T4", BL44: "T5", BL45: "T6", BL46: "T7", BL47: "T9",
  BL48: "T10", BL49: "T11", BL50: "T12", BL51: "L1", BL52: "L2",
  GV3: "L4", GV4: "L2", GV5: "L1", GV6: "T11", GV7: "T10", GV8: "T9", GV9: "T7",
  GV10: "T6", GV11: "T5", GV12: "T3", GV13: "T1", GV14: "C7", GV15: "C2",
};

const ORDINALS = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"];
const INTERCOSTAL_BY_CODE: Record<string, number> = {
  ST14: 1, ST15: 2, ST16: 3, ST17: 4, ST18: 5,
  SP17: 5, SP18: 4, SP19: 3, SP20: 2, SP21: 6,
  KI22: 5, KI23: 4, KI24: 3, KI25: 2, KI26: 1,
  GB22: 4, GB23: 4, GB24: 7,
  CV20: 1, CV19: 2, CV18: 3, CV17: 4,
};

export function spinousLevelOf(code: string): string | undefined {
  return SPINOUS_LEVEL_BY_CODE[code];
}

export function intercostalLevelOf(code: string): number | undefined {
  return INTERCOSTAL_BY_CODE[code];
}

export function vertebraMeshName(level: string): string {
  if (level === "C2") return "Axis";
  if (level === "C7") return "Seventh cervical vertebra";
  const match = /^([TL])(\d+)$/.exec(level);
  if (!match) return level;
  return `${ORDINALS[Number(match[2])]} ${match[1] === "T" ? "thoracic" : "lumbar"} vertebra`;
}

function levelledSpinous(item: LocatorItem, code: string): LocatorItem | undefined {
  const level = spinousLevelOf(code);
  if (!level) return undefined;
  return {
    ...item,
    ko: `${level} 극돌기`,
    refs: [vertebraMeshName(level)],
    ids: level === "C2" ? [] : [`spinous_process_${level}.tip`],
    kind: level === "C2" ? "parent mesh landmark" : "registered landmark",
    status: level === "C2" ? "부분 가능" : "가능",
    note: level === "C2" ? "C2(중쇠뼈) 메시의 극돌기 표면에서 표시" : "혈별 척추 분절에 고정",
  };
}

const byCode = new Map<string, LocatorItem[]>();
for (const row of rows) {
  if (row.status === "불가") continue;
  // A crease is useful in the source table, but it has no separately modelled
  // structure or trustworthy 3D anchor to highlight in the locator.
  if (["cubital crease", "dorsal wrist crease", "palmar wrist crease"].includes(row.en)) continue;
  const item: LocatorItem = {
    ...row,
    color: row.system.includes("skeletal") ? "bone" : "soft",
  };
  for (const code of row.codes) {
    if (row.en === "spinous process") {
      const localized = levelledSpinous(item, code);
      // GV18 is an external-occipital-protuberance point, not a vertebral
      // spinous-process point.  Do not preserve the bad generic fallback.
      if (!localized) continue;
      const group = byCode.get(code) ?? [];
      group.push(localized);
      byCode.set(code, group);
      continue;
    }
    if (row.en === "scapula" && (code === "SI12" || code === "SI13")) continue;
    const intercostal = row.en === "intercostal space" ? intercostalLevelOf(code) : undefined;
    const localized = intercostal
      ? { ...item, ko: `제${intercostal}갈비사이공간`, refs: [`Right ${ORDINALS[intercostal].toLowerCase()} rib`, `Right ${ORDINALS[intercostal + 1].toLowerCase()} rib`] }
      : row.en === "spine of scapula" && (code === "SI11" || code === "SI12")
      ? { ...item, ko: "견갑극 중점", kind: "derived sub-landmark", status: "부분 가능" as const,
          note: "견갑극 내측단과 견봉각 사이에서 추정한 중점; 독립된 3D 구조 아님" }
      : row.en === "spine of scapula" && code === "SI13"
        ? { ...item, ko: "견갑극 내측단" }
        : row.en === "thyroid cartilage"
          ? { ...item, ko: "방패연골" }
          : row.en === "cricoid cartilage"
            ? { ...item, ko: "반지연골" }
            // The source sheet writes the umbilicus as 제(臍); the guide showed a lone "제" (KI11 review).
            : row.en === "umbilicus"
              ? { ...item, ko: "배꼽" }
              : item;
    const group = byCode.get(code) ?? [];
    group.push(localized);
    byCode.set(code, group);
  }
}

// BL21 was omitted from the source row even though its definition is tied to
// the inferior border of T12.  Add the same levelled locator at runtime.
if (spinousSource) {
  for (const code of Object.keys(SPINOUS_LEVEL_BY_CODE)) {
    if (byCode.get(code)?.some((item) => item.en === "spinous process")) continue;
    const base: LocatorItem = { ...spinousSource, color: "bone" };
    const item = levelledSpinous(base, code);
    if (item) byCode.set(code, [...(byCode.get(code) ?? []), item]);
  }
}

function addItem(code: string, item: LocatorItem) {
  if (byCode.get(code)?.some((candidate) => candidate.en === item.en)) return;
  byCode.set(code, [...(byCode.get(code) ?? []), item]);
}

// LU2 is defined by the deltopectoral triangle.  Its three boundaries need
// separate guide entries instead of one opaque "infraclavicular fossa" label.
const clavicleSource = rows.find((row) => row.en === "clavicle");
if (clavicleSource) addItem("LU2", { ...clavicleSource, color: "bone" });
addItem("LU2", {
  key: -1, en: "pectoralis major", ko: "큰가슴근", codes: ["LU2"], status: "가능",
  kind: "BodyParts3D mesh", refs: ["Clavicular part of right pectoralis major", "Sternocostal part of right pectoralis major"],
  ids: [], system: "muscular", note: "세모가슴삼각의 안쪽 경계", color: "soft",
});

// The review asks that the manubrium be named explicitly at CV20/CV21.
for (const code of ["CV20", "CV21"]) addItem(code, {
  key: -2, en: "manubrium", ko: "복장뼈자루", codes: [code], status: "가능",
  kind: "BodyParts3D mesh", refs: ["Manubrium"], ids: ["FMA7486"], system: "skeletal", note: "", color: "bone",
});

// GB28 lies just above the inguinal ligament (review 2026-09-25); LR12 just below it.
for (const code of ["GB28", "LR12"]) addItem(code, {
  key: -3, en: "inguinal ligament", ko: "샅고랑인대", codes: [code], status: "가능",
  kind: "BodyParts3D mesh", refs: ["Right inguinal ligament"], ids: ["BP3_FMA21964"], system: "connective", note: "", color: "soft",
});

export function locatorItems(code: string): LocatorItem[] {
  return byCode.get(code) ?? [];
}

export function hasLocatorItems(code: string): boolean {
  return !!byCode.get(code)?.length;
}
