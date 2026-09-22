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
    if (row.en === "scapula" && (code === "SI12" || code === "SI13")) continue;
    const localized = row.en === "spine of scapula" && code === "SI12"
      ? { ...item, ko: "견갑극 중점", kind: "derived sub-landmark", status: "부분 가능" as const,
          note: "견갑극 내측단과 견봉각 사이에서 추정한 중점; 독립된 3D 구조 아님" }
      : row.en === "spine of scapula" && code === "SI13"
        ? { ...item, ko: "견갑극 내측단" }
        : item;
    const group = byCode.get(code) ?? [];
    group.push(localized);
    byCode.set(code, group);
  }
}

export function locatorItems(code: string): LocatorItem[] {
  return byCode.get(code) ?? [];
}

export function hasLocatorItems(code: string): boolean {
  return !!byCode.get(code)?.length;
}
