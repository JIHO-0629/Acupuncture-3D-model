/** The needle's path drawn as a stratigraphic section.
 *
 * Depth in millimetres is a single reference body's geometry, and the layer thicknesses
 * that make it up vary enormously between people. What does not vary is the order: at
 * GB34 extensor digitorum longus always precedes the interosseous membrane. So the column
 * leads with sequence, scales its axis as a share of the distance to the first risk
 * structure, and names that denominator on screen rather than implying a clinical depth.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { bilingualPartName, varianceOf, VARIANCE_LABEL, type NeedleHit, type NeedleReport, type Variance } from './anatomy';

const HEIGHT = 280, LABEL_GAP = 8;
const SKIN = { id: '__skin', name: '피부·피하조직', english: 'Skin & subcutis', distanceMm: 0, variance: 2 as Variance };

type Entry = {
  id: string; english: string; korean: string; at: number;
  variance: Variance | null; kind: 'layer' | 'boundary' | 'beyond';
};

/** Split "Right fibula (우측 비골)" back into its two halves so the Korean can be styled
 *  on its own line at a readable size instead of trailing the English in parentheses. */
function split(hit: NeedleHit) {
  const label = bilingualPartName(hit.name);
  const match = /^(.*?)\s*\(([^)]*)\)$/.exec(label);
  return { english: match ? match[1] : label, korean: match ? match[2] : '' };
}

interface Props {
  report: NeedleReport;
  ratio: number;
  onRatio: (ratio: number) => void;
  disabled?: boolean;
}

export default function StrataColumn({ report, ratio, onRatio, disabled }: Props) {
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
  const boundaryMm = report.boundaryMm ?? 0;
  const limitMm = report.limitMm ?? 0;

  const entries: Entry[] = [];
  if (boundaryMm > 0) {
    entries.push({ id: SKIN.id, english: SKIN.english, korean: SKIN.name, at: 0, variance: SKIN.variance, kind: 'layer' });
    for (const hit of allHits) {
      if (hit.distanceMm >= boundaryMm) continue;
      const { english, korean } = split(hit);
      entries.push({ id: hit.id, english, korean, at: hit.distanceMm, variance: varianceOf(hit.name, hit.system), kind: 'layer' });
    }
    const boundaryHit = allHits.find((hit) => hit.id === report.boundaryId);
    const boundaryName = boundaryHit ? split(boundaryHit) : { english: report.boundaryLabel, korean: '' };
    entries.push({
      id: report.boundaryId ?? '__boundary', english: boundaryName.english, korean: boundaryName.korean,
      at: boundaryMm, variance: boundaryHit ? varianceOf(boundaryHit.name, boundaryHit.system) : null, kind: 'boundary',
    });
  }
  const view = boundaryMm * 1.45;
  for (const hit of allHits) {
    if (hit.distanceMm <= boundaryMm || hit.distanceMm > view) continue;
    const { english, korean } = split(hit);
    entries.push({ id: hit.id, english, korean, at: hit.distanceMm, variance: varianceOf(hit.name, hit.system), kind: 'beyond' });
  }

  const y = (mm: number) => (view > 0 ? (mm / view) * HEIGHT : 0);
  const pct = (mm: number) => (boundaryMm > 0 ? Math.round((mm / boundaryMm) * 100) : 0);
  const needleMm = (limitMm * ratio) / 100;
  const reachedIndex = entries.reduce((found, entry, index) => (entry.kind !== 'beyond' && needleMm >= entry.at ? index : found), 0);
  const current = entries[reachedIndex];

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
      if (entry.at <= 0 || entry.at > limitMm) continue;
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
        aria-valuemax={90}
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
            const next = entries[index + 1];
            return (
              <div
                key={`${entry.id}-${index}`}
                className={`strata-band${entry.kind !== 'layer' ? ' beyond' : ''}${index === reachedIndex && entry.kind === 'layer' ? ' active' : ''}${index < reachedIndex ? ' passed' : ''}`}
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
                stroke={entry.kind === 'boundary' ? 'var(--strata-critical)' : index <= reachedIndex && entry.kind === 'layer' ? 'var(--strata-accent)' : 'var(--strata-rule)'}
              />
            ))}
          </svg>
          {entries.map((entry, index) => (
            <div
              key={`${entry.id}-${index}`}
              ref={(node) => { labelRefs.current[index] = node; }}
              className={`strata-label${entry.kind === 'boundary' ? ' stop' : ''}${entry.kind === 'beyond' ? ' beyond' : ''}${index <= reachedIndex && entry.kind === 'layer' ? ' on' : ''}`}
              style={{ top: tops[index] ?? y(entry.at) }}
            >
              <span className="en">{entry.english}</span>
              {entry.korean && <span className="ko">{entry.korean}</span>}
              <span className="meta">
                {entry.variance && (
                  <span className={`vari v${entry.variance}`} title={VARIANCE_LABEL[entry.variance]}>
                    {[1, 2, 3].map((dot) => <s key={dot} className={dot <= entry.variance! ? 'f' : ''} />)}
                  </span>
                )}
                <span className="pct">{pct(entry.at)}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="strata-foot">
        <div className="strata-now" key={crossing}>
          <span className="k">현재 층</span>
          <span className="en">{current.english}</span>
          {current.korean && <span className="ko">{current.korean}</span>}
        </div>
        <div className="strata-read">
          <span className="big">{Math.round(pct(needleMm))}</span><span className="u">%</span>
          <span className="of">{entries.filter((e) => e.kind !== 'beyond').length - 1}개 중 {reachedIndex}개 통과</span>
        </div>
      </div>
      <p className="strata-denom">
        100% = <b>{entries.find((e) => e.kind === 'boundary')?.english}</b>
        {entries.find((e) => e.kind === 'boundary')?.korean ? ` (${entries.find((e) => e.kind === 'boundary')!.korean})` : ''}까지의 거리.
        이 참조 모델 한 사람의 값이며 환자에게 그대로 적용되지 않습니다. 안전 여유 10%를 남기고 정지합니다.
      </p>
      <p className={`strata-halt${ratio >= 99.5 ? ' on' : ''}${refusing ? ' flare' : ''}`}>정지 상한에 닿았습니다 — 더 들어가지 않습니다.</p>
    </div>
  );
}
