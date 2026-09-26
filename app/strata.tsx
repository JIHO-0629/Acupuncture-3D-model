/** The needle's path drawn as a stratigraphic section.
 *
 * Depth in millimetres is a single reference body's geometry, and the layer thicknesses
 * that make it up vary enormously between people. What does not vary is the order: at
 * GB34 extensor digitorum longus always precedes the interosseous membrane. So the column
 * leads with sequence and scales its axis to the documented range in the reference
 * model. Hazard intersections remain visible as warnings, not insertion limits.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { bilingualPartName, varianceOf, VARIANCE_LABEL, type NeedleHit, type NeedleReport, type Variance } from './anatomy';
import { needleProfile, needlePathOf, type AcupointCode, type NeedlePathHazard, type NeedlePathLayer } from './acupoints';
import { reviewMode } from './review-mode';
import { focusTargetProps, type FocusHandlers, type StructureFocus } from './focus-channel';

const HEIGHT = 280, LABEL_GAP = 8;
const SKIN = { id: '__skin', name: '피부·피하조직', english: 'Skin & subcutis', distanceMm: 0, variance: 2 as Variance };

type Entry = {
  id: string; english: string; korean: string; at: number;
  variance: Variance | null; kind: 'layer' | 'boundary' | 'beyond' | 'hazard'; risk?: boolean;
  /** Reviewed paths: how the layer is known. Hazards carry their own depth text. */
  source?: 'model' | 'concept' | 'reordered' | 'void' | 'bone';
  hazard?: NeedlePathHazard; below?: boolean;
};
/** Reviewer tags (?review only). The public column keeps the dashed concept styling without the words. */
const SOURCE_TAG: Record<string, string> = {
  concept: '개념층 · 모델 없음', reordered: '순서 보정 · 모델 위치가 다름', void: '모델 없음 · 빈 구간',
};
const layerName = (english: string) => (reviewMode ? english : english.replace(/\s*\(not modelled\)$/, ''));

/** Depths for layers the reviewed path lists without one: spread them evenly between the
 *  neighbouring known depths, and 2 mm apart past the last one. */
function spread(layers: NeedlePathLayer[], floor: number): number[] {
  const out = layers.map((l) => l.mm);
  let prev = 0;
  for (let i = 0; i < out.length; i++) {
    if (out[i] != null) { out[i] = Math.max(prev, out[i]!); prev = out[i]!; continue; }
    let j = i; while (j < out.length && out[j] == null) j++;
    const next = j < out.length ? Math.max(out[j]!, prev) : Math.min(prev + 2 * (j - i + 1), floor);
    for (let k = i; k < j; k++) out[k] = prev + ((next - prev) * (k - i + 1)) / (j - i + 1);
    prev = out[j - 1]!; i = j - 1;
  }
  return out as number[];
}
function hazardDepthText(h: NeedlePathHazard, limitMm: number) {
  if (h.mm == null && h.literatureMm == null) return '깊이 표시 없음 · 개념';
  const mm = h.literatureMm ?? h.mm!;
  const where = h.literatureMm != null ? `문헌 약 ${Math.round(mm)} mm` : h.source === 'literature' ? `문헌 약 ${Math.round(mm)} mm` : `모델 ${Math.round(mm)} mm`;
  return mm > limitMm ? `${where} · 자침 상한 너머` : where;
}

/** Split "우측 비골 (Right fibula)" so the Korean leads at a readable size. */
function split(hit: NeedleHit) {
  const label = bilingualPartName(hit.name);
  return { english: hit.name, korean: label.endsWith(` (${hit.name})`) ? label.slice(0,-hit.name.length-3) : '' };
}

interface Props {
  report: NeedleReport;
  ratio: number;
  onRatio: (ratio: number) => void;
  disabled?: boolean;
  /** Incremented when a control outside the column tries to go past the limit. */
  refuseSignal?: number;
  /** Rows name structures: hovering or tapping one picks it out in the scene (focus-channel.ts). */
  focus?: FocusHandlers;
}

export default function StrataColumn({ report, ratio, onRatio, disabled, refuseSignal, focus }: Props) {
  const partCache = useRef(new Map<string, string[]>());
  const coreRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [tops, setTops] = useState<number[]>([]);
  const [labelsHeight, setLabelsHeight] = useState(HEIGHT);
  const [refusing, setRefusing] = useState(false);
  const [crossing, setCrossing] = useState(0);
  const lastLayer = useRef(-1);
  const refuseTimer = useRef<number | null>(null);

  const allHits = report.allHits ?? [];
  const depthRangeCun = needleProfile(report.code as AcupointCode).depthRangeCun;
  const boundaryMm = report.boundaryMm ?? 0;
  const limitMm = report.limitMm ?? 0;
  const riskIds = new Set(report.hazardHits.map((hit) => hit.id));

  const reviewed = needlePathOf(report.code);
  const curated = !!reviewed?.layers;
  const entries: Entry[] = [];
  const viewOf = (b: number) => (report.sourceRangeBoundary ? Math.max(b * 1.45, b + 5) : b * 1.45);
  if (curated && boundaryMm > 0) {
    // Reviewed path: anatomical layer order from data/needling-paths.json. Hazards are
    // listed in their own lane and never become a band the needle passes through.
    const layers = reviewed!.layers!;
    const bone = reviewed!.bone;
    const view0 = viewOf(boundaryMm);
    const at = spread(layers, Math.min(bone?.mm ?? view0, view0) * 0.98);
    entries.push({ id: SKIN.id, english: SKIN.english, korean: SKIN.name, at: 0, variance: SKIN.variance, kind: 'layer', source: 'model' });
    const cells: Entry[] = layers.map((layer, index) => ({
      id: `L${index}-${layer.en}`, english: layer.atlas ? split({ id: '', name: layer.atlas, system: 'muscular', distanceMm: 0 }).english : layerName(layer.en),
      korean: layer.ko, at: Math.round(at[index] * 10) / 10, variance: layer.kind === 'model' ? 2 : null, kind: 'layer', source: layer.kind,
    }));
    if (bone) cells.push({ id: `bone-${bone.en}`, english: bone.en, korean: bone.ko, at: bone.mm, variance: 1, kind: 'layer', source: 'bone' });
    for (const cell of cells) {
      if (cell.at < boundaryMm) entries.push(cell);
    }
    entries.push({ id: '__boundary', english: report.boundaryLabel, korean: '', at: boundaryMm, variance: null, kind: 'boundary' });
    for (const cell of cells) if (cell.at >= boundaryMm && cell.at <= view0) entries.push({ ...cell, kind: 'beyond' });
    (reviewed!.hazards ?? []).forEach((hazard, index) => {
      const depth = hazard.literatureMm ?? hazard.mm;
      const placed = depth == null ? view0 : Math.min(depth, view0);
      entries.push({ id: `H${index}-${hazard.ko}`, english: hazard.en, korean: hazard.ko, at: placed, variance: 3, kind: 'hazard', hazard, below: depth == null || depth > view0 });
    });
    entries.sort((a, b) => a.at - b.at || (a.kind === 'hazard' ? 1 : 0) - (b.kind === 'hazard' ? 1 : 0));
  } else if (boundaryMm > 0) {
    entries.push({ id: SKIN.id, english: SKIN.english, korean: SKIN.name, at: 0, variance: SKIN.variance, kind: 'layer' });
    for (const hit of allHits) {
      if (hit.distanceMm >= boundaryMm) continue;
      const { english, korean } = split(hit);
      entries.push({ id: hit.id, english, korean, at: hit.distanceMm, variance: varianceOf(hit.name, hit.system), kind: 'layer', risk: riskIds.has(hit.id) });
    }
    const boundaryHit = allHits.find((hit) => hit.id === report.boundaryId);
    const boundaryName = boundaryHit ? split(boundaryHit) : { english: report.boundaryLabel, korean: '' };
    entries.push({
      id: report.boundaryId ?? '__boundary', english: boundaryName.english, korean: boundaryName.korean,
      at: boundaryMm, variance: boundaryHit ? varianceOf(boundaryHit.name, boundaryHit.system) : null, kind: 'boundary',
    });
  }
  const view = viewOf(boundaryMm);
  if (!curated) for (const hit of allHits) {
    if (hit.distanceMm <= boundaryMm || hit.distanceMm > view) continue;
    const { english, korean } = split(hit);
    entries.push({ id: hit.id, english, korean, at: hit.distanceMm, variance: varianceOf(hit.name, hit.system), kind: 'beyond' });
  }

  const y = (mm: number) => (view > 0 ? (mm / view) * HEIGHT : 0);
  const pct = (mm: number) => (boundaryMm > 0 ? Math.round((mm / boundaryMm) * 100) : 0);
  const needleMm = (limitMm * ratio) / 100;
  const reachedIndex = needleMm <= 0 ? 0 : entries.reduce((found, entry, index) => (entry.kind !== 'beyond' && entry.kind !== 'hazard' && needleMm >= entry.at ? index : found), 0);
  const current = entries[reachedIndex];

  // Which atlas meshes a row stands for. Model rows carry their hit; reviewed rows and hazards
  // only a name. Concept and empty layers have no mesh: the scene marks their depth on the shaft.
  const hitIds = new Set(allHits.map((hit) => hit.id));
  const partsOf = (entry: Entry): string[] => {
    if (entry.id === SKIN.id || entry.source === 'concept' || entry.source === 'void') return [];
    if (hitIds.has(entry.id)) return [entry.id];
    const cacheKey = `${report.code}:${entry.english}`;
    const cached = partCache.current.get(cacheKey);
    if (cached) return cached;
    const named = allHits.find((hit) => hit.name.toLowerCase() === entry.english.toLowerCase());
    const found = named ? [named.id] : focus?.partIdsFor(entry.english) ?? [];
    partCache.current.set(cacheKey, found);
    return found;
  };
  const focusOf = (entry: Entry, pinned: boolean): StructureFocus => ({
    key: `strata:${report.code}:${entry.id}`,
    label: entry.korean || entry.english,
    partIds: partsOf(entry),
    depthMm: entry.kind === 'hazard' ? entry.hazard?.mm ?? entry.hazard?.literatureMm ?? null : entry.at,
    tone: entry.kind === 'hazard' || entry.kind === 'boundary' || entry.risk ? 'hazard' : 'layer',
    source: 'strata',
    pinned,
  });
  const pinned = focus?.pinned ?? null;
  const isFocused = (entry: Entry) => !!pinned && (pinned.key === `strata:${report.code}:${entry.id}`
    || (pinned.source !== 'strata' && pinned.partIds.length > 0 && partsOf(entry).some((id) => pinned.partIds.includes(id))));
  const focusedIndex = entries.findIndex(isFocused);
  // A structure picked in the scene brings its row into view.
  useEffect(() => {
    if (pinned?.source !== 'scene' || focusedIndex < 0) return;
    labelRefs.current[focusedIndex]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [pinned, focusedIndex]);

  /** Measure each label and stack them apart, so a name that wraps to three lines in a
   *  narrow panel still cannot collide with its neighbour. */
  const place = useCallback(() => {
    const heights = labelRefs.current.map((node) => node?.offsetHeight ?? 0);
    const next: number[] = [];
    let cursor = 0;
    entries.forEach((entry, index) => {
      const top = Math.max(y(entry.at) - heights[index] / 2, cursor);
      next[index] = top;
      cursor = top + heights[index] + LABEL_GAP;
    });
    setTops(next);
    setLabelsHeight(Math.max(HEIGHT, cursor - LABEL_GAP));
  }, [report, view]);

  useLayoutEffect(() => { place(); }, [place, entries.length]);
  useEffect(() => {
    const node = labelsRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => place());
    observer.observe(node);
    return () => observer.disconnect();
  }, [place]);

  const refuse = useCallback(() => {
    if (refuseTimer.current !== null) return;
    setRefusing(true);
    if (navigator.vibrate) navigator.vibrate(18);
    refuseTimer.current = window.setTimeout(() => { setRefusing(false); refuseTimer.current = null; }, 620);
  }, []);
  useEffect(() => () => { if (refuseTimer.current !== null) clearTimeout(refuseTimer.current); }, []);
  // A push past the limit from elsewhere (the Needle's-eye compass) refuses here too, where the limit lives.
  useEffect(() => { if (refuseSignal) refuse(); }, [refuseSignal, refuse]);

  // Entering a layer nudges only the readout text. Shaking the panel for an ordinary
  // crossing would read as an error and drown out the boundary's own signal.
  useEffect(() => {
    if (lastLayer.current >= 0 && lastLayer.current !== reachedIndex) {
      setCrossing((n) => n + 1);
      if (navigator.vibrate) navigator.vibrate(5);
    }
    lastLayer.current = reachedIndex;
  }, [reachedIndex]);

  // Values compress near every boundary, so the control resists where tissue does.
  const resist = (raw: number) => {
    const width = 1.2, curve = 2.8;
    for (const entry of entries) {
      if (entry.kind === 'hazard' || entry.at <= 0 || entry.at > limitMm) continue;
      const delta = raw - entry.at;
      if (Math.abs(delta) < width) return entry.at + Math.sign(delta) * Math.pow(Math.abs(delta) / width, curve) * width;
    }
    return raw;
  };

  const setFromPointer = (clientY: number) => {
    const box = columnRef.current?.getBoundingClientRect();
    if (!box || !limitMm) return;
    const raw = resist(((clientY - box.top) / box.height) * view);
    if (raw > limitMm + 0.15) refuse();
    onRatio(Math.max(0, Math.min(100, (Math.min(raw, limitMm) / limitMm) * 100)));
  };
  const dragging = useRef(false);

  if (!report.available || boundaryMm <= 0) {
    return <p className="strata-empty">이 경로에서는 검증 가능한 위험 경계를 찾지 못해 깊이 탐색을 잠갔습니다.</p>;
  }

  const step = 100 / 40;
  return (
    <div className="strata">
      <div
        className={`strata-core${refusing ? ' refuse' : ''}`}
        ref={coreRef}
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-label="자침 진행"
        aria-valuemin={0}
        aria-valuemax={report.sourceRangeBoundary ? 100 : 90}
        aria-valuenow={Math.round(pct(needleMm))}
        aria-valuetext={`${Math.round(pct(needleMm))}퍼센트, ${current.korean || current.english}`}
        onPointerDown={(event) => { if (disabled) return; dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); setFromPointer(event.clientY); }}
        onPointerMove={(event) => { if (dragging.current) setFromPointer(event.clientY); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
        onKeyDown={(event) => {
          const size = event.shiftKey ? step * 4 : step;
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { if (ratio >= 100) refuse(); onRatio(Math.min(100, ratio + size)); event.preventDefault(); }
          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { onRatio(Math.max(0, ratio - size)); event.preventDefault(); }
          if (event.key === 'Home') { onRatio(0); event.preventDefault(); }
          if (event.key === 'End') { onRatio(100); event.preventDefault(); }
        }}
      >
        <div className="strata-scale" style={{ height: HEIGHT }}>
          {[0, 25, 50, 75, 100].map((mark) => {
            const at = (boundaryMm * mark) / 100;
            if (at > view) return null;
            return (
              <span key={mark} style={{ top: y(at) }}>
                <i className={mark % 50 === 0 ? 'major' : ''} />
                <b>{mark}</b>
              </span>
            );
          })}
        </div>

        <div className={`strata-column${refusing ? ' flare' : ''}`} ref={columnRef} style={{ height: HEIGHT }}>
          {entries.map((entry, index) => {
            // Hazards are not tissue the needle passes: no band, only a tick on the column edge.
            if (entry.kind === 'hazard') return <div key={`${entry.id}-${index}`} className={`strata-hazard-tick${entry.hazard?.emph ? ' emph' : ''}`} style={{ top: y(entry.at) }} />;
            const next = entries.slice(index + 1).find((candidate) => candidate.kind !== 'hazard');
            return (
              <div
                key={`${entry.id}-${index}`}
                className={`strata-band${entry.kind !== 'layer' ? ' beyond' : ''}${entry.source === 'concept' || entry.source === 'reordered' ? ' concept' : ''}${entry.source === 'void' ? ' void' : ''}${index === reachedIndex && entry.kind === 'layer' ? ' active' : ''}${index < reachedIndex ? ' passed' : ''}`}
                style={{ top: y(entry.at), height: Math.max(0, (next ? y(next.at) : HEIGHT) - y(entry.at)) }}
              />
            );
          })}
          <div className={`strata-stop${refusing ? ' flare' : ''}`} style={{ top: y(boundaryMm) }} />
          <div className="strata-limit" style={{ top: y(limitMm) }} />
          <div className="strata-needle" style={{ top: y(needleMm) }} />
        </div>

        <div className="strata-labels" ref={labelsRef} style={{ height: labelsHeight }}>
          <svg className="strata-leaders" viewBox={`0 0 28 ${labelsHeight}`} height={labelsHeight} aria-hidden="true">
            {entries.map((entry, index) => (
              <path
                key={`${entry.id}-${index}`}
                d={`M0 ${y(entry.at)} H9 L19 ${(tops[index] ?? 0) + ((labelRefs.current[index]?.offsetHeight ?? 0) / 2)} H28`}
                fill="none" strokeWidth="1"
                strokeDasharray={entry.kind === 'hazard' ? '2 2' : undefined}
                stroke={entry.risk || entry.kind === 'boundary' || entry.kind === 'hazard' ? 'var(--strata-critical)' : index <= reachedIndex && entry.kind === 'layer' ? 'var(--strata-accent)' : 'var(--strata-rule)'}
              />
            ))}
          </svg>
          {entries.map((entry, index) => (
            <div
              key={`${entry.id}-${index}`}
              ref={(node) => { labelRefs.current[index] = node; }}
              className={`strata-label${entry.kind === 'boundary' ? ' stop' : ''}${entry.kind === 'beyond' ? ' beyond' : ''}${entry.risk ? ' risk' : ''}${entry.kind === 'hazard' ? ` hazard${entry.hazard?.emph ? ' emph' : ''}` : ''}${entry.source && SOURCE_TAG[entry.source] ? ' concept' : ''}${index <= reachedIndex && entry.kind === 'layer' ? ' on' : ''}${index === focusedIndex ? ' focused' : ''}${focus ? ' pickable' : ''}`}
              title={entry.hazard?.basis ?? (focus ? '3D에서 보기 · 한 번 더 누르면 해제' : undefined)}
              {...focusTargetProps(focus, (isPinned) => focusOf(entry, isPinned))}
              style={{ top: tops[index] ?? y(entry.at) }}
            >
              {entry.korean && <span className="ko">{entry.korean}</span>}
              <span className="en">{entry.korean ? `(${entry.english})` : entry.english}</span>
              <span className="meta">
                {entry.variance && (
                  <span className={`vari v${entry.variance}`} title={VARIANCE_LABEL[entry.variance]}>
                    {[1, 2, 3].map((dot) => <s key={dot} className={dot <= entry.variance! ? 'f' : ''} />)}
                  </span>
                )}
                {entry.kind === 'hazard' ? (
                  <span className="strata-risk-tag">위험 구조 · 통과하지 않음 · {hazardDepthText(entry.hazard!, limitMm)}</span>
                ) : (
                  <span className="pct">{entry.kind === 'beyond' ? '범위 밖 · 미통과' : `${pct(entry.at)}%`}{reviewMode && entry.source && SOURCE_TAG[entry.source] ? ` · ${SOURCE_TAG[entry.source]}` : ''}</span>
                )}
                {entry.risk && <span className="strata-risk-tag">위험 구조 · 모델 교차</span>}
              </span>
              {entry.hazard?.note && <span className="note">{entry.hazard.note}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="strata-foot">
        <div className="strata-now" key={crossing}>
          <span className="k">현재 층</span>
          {current.korean && <span className="ko">{current.korean}</span>}
          <span className="en">{current.korean ? `(${current.english})` : current.english}</span>
        </div>
        <div className="strata-read">
          <span className="big">{Math.round(pct(needleMm))}</span><span className="u">%</span>
          <span className="of">{entries.filter((e) => e.kind === 'layer').length - 1}개 중 {entries.filter((e, i) => e.kind === 'layer' && i > 0 && i <= reachedIndex).length}개 통과</span>
        </div>
      </div>
      <p className="strata-denom">
        {depthRangeCun && <>문헌 직자 범위 <b>{depthRangeCun[0]}–{depthRangeCun[1]}촌</b>. </>}
        {report.sourceRangeBoundary ? (
          <>100% = 문헌 범위 상한을 참조 모델의 국소 비례로 환산한 지점. 위험 구조가 없음을 뜻하지 않습니다.</>
        ) : (
          <>눈금 100% = <b>{entries.find((e) => e.kind === 'boundary')?.korean || entries.find((e) => e.kind === 'boundary')?.english}</b>
            {entries.find((e) => e.kind === 'boundary')?.korean ? ` (${entries.find((e) => e.kind === 'boundary')!.english})` : ''}까지의 거리.
            조작 상한은 경계의 90%입니다. 참조 모델의 값이며 환자에게 그대로 적용되지 않습니다.</>
        )}
      </p>
      {curated && !!reviewed!.hazards?.length && <p className="strata-risk-summary">위험 구조 {reviewed!.hazards.length}개는 바늘이 지나는 층이 아닙니다. 경로 주변이나 더 깊은 곳에 있어 피해야 하는 구조입니다.</p>}
      {curated && reviewed!.zone && <p className="strata-zone">{reviewed!.zone}: 신경과 혈관이 모이는 부위입니다. 얕게, 천천히 자입합니다.</p>}
      {reviewMode && curated && reviewed!.dropped && <p className="strata-denom">경로에서 뺀 모델 구조: {reviewed!.dropped.names.join(', ')}{reviewed!.dropped.why ? ` (${reviewed!.dropped.why})` : ''}</p>}
      {reviewMode && curated && reviewed!.directionBasis && reviewed!.direction && <p className="strata-denom">자입 방향: {reviewed!.directionBasis}</p>}
      {!curated && report.hazardHits.length > 0 && <p className="strata-risk-summary">위험 구조 {report.hazardHits.length}개 모델 경로 교차. 원본 깊이까지 표시하지만 안전 자침 경로를 뜻하지 않습니다.</p>}
      <p className={`strata-halt${ratio >= 99.5 ? ' on' : ''}${refusing ? ' flare' : ''}`}>모델 표시 범위의 끝입니다 — 더 들어가지 않습니다.</p>
    </div>
  );
}
