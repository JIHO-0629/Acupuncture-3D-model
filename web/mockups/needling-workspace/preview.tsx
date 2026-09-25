import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import Home from '../../../app/page';
import needleEyeData from '../../../data/needle-eye.json';

type PreviewState = 'normal' | 'analysis' | 'workspace' | 'memo';

function readPreviewState(): PreviewState {
  const value = new URLSearchParams(window.location.search).get('state');
  return value === 'analysis' || value === 'workspace' || value === 'memo' ? value : 'normal';
}

type NeedleEyeStructure = {
  id: string;
  label: string;
  english: string;
  kind: 'nerve' | 'artery' | 'vein' | 'boundary';
  relation: 'cross' | 'near' | 'concept';
  depthMm: number | null;
  literatureReferenceMm: number | null;
  depthSource: '참조 모델' | '문헌값' | '해부 개념';
  emph: boolean;
  note: string | null;
  basis: string | null;
  bearing: null | {
    status: 'axis-crossing' | 'model-nearest';
    xMm: number;
    yMm: number;
    distanceMm: number;
  };
};

type NeedleEyeProfile = {
  region: string;
  modelMaxMm: number | null;
  orientation: { up: string; right: string };
  structures: NeedleEyeStructure[];
};

const needleEyeProfiles = needleEyeData.points as Record<string, NeedleEyeProfile>;

function structureOpacity(currentMm: number, progress: number, structure: NeedleEyeStructure) {
  if (structure.depthMm == null) return structure.kind === 'boundary' ? .14 + progress * .007 : .18;
  const delta = Math.abs(currentMm - structure.depthMm);
  if (delta <= 3) return 1;
  if (delta <= 9) return .55 - (delta - 3) * .055;
  return 0;
}

function structurePosition(structure: NeedleEyeStructure, index: number) {
  if (!structure.bearing) return null;
  if (structure.bearing.status === 'axis-crossing') {
    return { x: 150, y: 150, radius: 12 + index * 3 };
  }
  const { xMm, yMm, distanceMm } = structure.bearing;
  const length = Math.hypot(xMm, yMm) || 1;
  const radius = Math.max(28, Math.min(94, 28 + distanceMm * 2.7));
  return {
    x: 150 + (xMm / length) * radius,
    y: 150 - (yMm / length) * radius,
    radius: structure.kind === 'nerve' ? 8 : 11,
  };
}

function depthLabel(structure: NeedleEyeStructure) {
  if (structure.depthSource === '문헌값') return '문헌 근거 · 개인차 큼';
  if (structure.depthMm == null) return `${structure.depthSource} · 깊이 미확정`;
  return `${structure.depthSource} 해당 깊이 ${structure.depthMm} mm`;
}

function NeedleEyeCompass({ depth, depthMm, pointCode }: { depth: number; depthMm: string; pointCode: string }) {
  const profile = needleEyeProfiles[pointCode];
  const currentMm = profile?.modelMaxMm != null ? profile.modelMaxMm * depth / 100 : Number.parseFloat(depthMm) || 0;
  const visibleStructures = useMemo(() => {
    if (!profile) return [];
    return profile.structures
      .map((structure, index) => ({ structure, index, opacity: structureOpacity(currentMm, depth, structure) }))
      .filter((item) => item.opacity > .04);
  }, [currentMm, depth, profile]);

  if (!profile) return null;

  return (
    <section className="needle-eye-compass" aria-label="현재 자침 단면의 주변 구조">
      <div className="compass-heading">
        <div>
          <b>Needle’s-eye Compass</b>
          <span>현재 자침 단면 · 재생 연동</span>
        </div>
        <em>모델 기준 · 비척도</em>
      </div>

      <div className="compass-plot-wrap">
        <svg className="compass-plot" viewBox="0 0 300 300" role="img" aria-labelledby="compass-title compass-desc">
          <title id="compass-title">침 축을 중심으로 본 주변 위험 구조</title>
          <desc id="compass-desc">앞쪽이 위, 가쪽이 오른쪽이며 신경, 동맥, 넓은 경계 구조의 상대 위치를 표시합니다.</desc>
          <text className="direction direction-front" x="150" y="18">{profile.orientation.up}</text>
          <path className="direction-mark" d="M150 31v20m0-20-5 7m5-7 5 7" />
          <text className="direction direction-lateral" x="279" y="159">{profile.orientation.right}</text>
          <path className="direction-mark" d="M249 150h19m0 0-7-5m7 5-7 5" />

          <circle className="range-ring range-ring-outer" cx="150" cy="150" r="105" />
          <circle className="range-ring range-ring-inner" cx="150" cy="150" r="62" />
          <text className="ring-label" x="150" y="82">주변권</text>
          <text className="ring-label" x="150" y="118">근접권</text>

          {visibleStructures.filter(({ structure }) => structure.kind === 'boundary').map(({ structure, opacity }) => (
            <g key={structure.id} className="structure boundary" style={{ opacity }}>
              <circle className="boundary-band" cx="150" cy="150" r="113" />
              <text x="241" y="75">{structure.label.replace(/\s*\(.+\)$/, '')}</text>
            </g>
          ))}

          {visibleStructures.filter(({ structure }) => structure.kind !== 'boundary').slice(0, 4).map(({ structure, index, opacity }) => {
            const position = structurePosition(structure, index);
            if (!position) return null;
            const labelX = position.x < 150 ? position.x - 12 : position.x + 12;
            const labelAnchor = position.x < 150 ? 'end' : 'start';
            return (
              <g key={structure.id} className={`structure ${structure.kind} ${structure.relation === 'cross' ? 'is-crossing' : ''}`} style={{ opacity }}>
                <circle cx={position.x} cy={position.y} r={position.radius} />
                <text x={labelX} y={position.y + 4} textAnchor={labelAnchor}>{structure.label}</text>
              </g>
            );
          })}

          <circle className="needle-axis-halo" cx="150" cy="150" r="17" />
          <circle className="needle-axis" cx="150" cy="150" r="4" />
          <text className="axis-label" x="150" y="177">침 축</text>
        </svg>
      </div>

      <div className="compass-reading" aria-live="polite">
        <div className="compass-structure-list">
          {profile.structures.map((structure) => (
            <span key={structure.id} style={{ opacity: Math.max(.34, structureOpacity(currentMm, depth, structure)) }}>
              <i className={`legend ${structure.kind}-legend`} />
              <b>{structure.label}</b>
              <em>{structure.relation === 'cross' ? '경로 교차 · ' : ''}{depthLabel(structure)}</em>
            </span>
          ))}
        </div>
        <small>링은 상대 거리 구역입니다. 수치는 환자 안전거리가 아니라 출처가 표시된 모델·문헌 깊이입니다.</small>
      </div>
    </section>
  );
}

function NeedleEyeHud({
  depth,
  depthMm,
  pointCode,
  pointName,
  expanded,
  onExpand,
}: {
  depth: number;
  depthMm: string;
  pointCode: string;
  pointName: string;
  expanded: boolean;
  onExpand: () => void;
}) {
  return (
    <aside className={`needle-eye-hud ${expanded ? 'is-expanded' : ''}`} aria-label="Needle's Eye 관찰 모드">
      <header>
        <div>
          <span>NEEDLE’S EYE</span>
          <b>{pointCode} · {pointName}</b>
        </div>
        <button type="button" aria-label={expanded ? 'Needle’s Eye 축소' : 'Needle’s Eye 확대'} onClick={onExpand}>
          {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </header>
      {!expanded && <NeedleEyeCompass depth={depth} depthMm={depthMm} pointCode={pointCode} />}
      <div className="hud-depth">
        <div><span>MODEL {depthMm} mm</span><small>재생 연동</small></div>
        <div className="hud-depth-track" aria-label={`모델 자침 진행 ${depth}%`}>
          <i style={{ width: `${Math.max(0, Math.min(100, depth))}%` }} />
          <b style={{ left: `${Math.max(0, Math.min(100, depth))}%` }} />
        </div>
      </div>
    </aside>
  );
}

function NeedleEyeLauncher({
  active,
  available,
  onToggle,
}: {
  active: boolean;
  available: boolean;
  onToggle: () => void;
}) {
  return (
    <nav className="needle-eye-launcher" aria-label="관찰 모드와 보조 도구">
      <button type="button" className={active ? 'is-active' : ''} aria-label={available ? 'Needle’s Eye' : '이 혈자리는 주요 위험구조 Needle’s Eye 대상이 아닙니다'} aria-pressed={active} disabled={!available} onClick={onToggle}>
        <i /><span className="sr-only">Needle’s Eye</span>
      </button>
    </nav>
  );
}

function StudyMemo({ open, onOpenChange, pointCode }: { open: boolean; onOpenChange: (next: boolean) => void; pointCode: string }) {
  const storageKey = `needling-study-note:${pointCode || 'point'}`;
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setNote(window.localStorage.getItem(storageKey) ?? '');
    setSaved(true);
  }, [storageKey]);

  useEffect(() => {
    if (saved) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, note);
      setSaved(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [note, saved, storageKey]);

  return (
    <section className={`study-memo ${open ? 'is-open' : ''}`}>
      <button className="study-memo-toggle" type="button" aria-expanded={open} onClick={() => onOpenChange(!open)}>
        <span><b>학습 메모</b><small>{note.trim() ? `${pointCode}에 작성된 메모` : '관찰한 층서와 암기 포인트 기록'}</small></span>
        <span className="study-memo-state">{open ? (saved ? '자동 저장됨' : '저장 중…') : '열기'} {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</span>
      </button>
      {open && (
        <label className="study-memo-editor">
          <span className="sr-only">{pointCode} 학습 메모</span>
          <textarea
            value={note}
            onChange={(event) => { setNote(event.target.value); setSaved(false); }}
            placeholder="관찰한 층서, 구조 변이, 암기 포인트를 기록하세요."
          />
          <small>개인 학습 기록 · 시술 판단용 정보가 아닙니다.</small>
        </label>
      )}
    </section>
  );
}

export default function NeedlingWorkspacePreview() {
  const initialState = useMemo(readPreviewState, []);
  const [analysisOpen, setAnalysisOpen] = useState(initialState === 'analysis' || initialState === 'workspace');
  const [workspaceOpen, setWorkspaceOpen] = useState(initialState === 'workspace');
  const [memoOpen, setMemoOpen] = useState(initialState === 'memo');
  const [panelTarget, setPanelTarget] = useState<HTMLElement | null>(null);
  const [needleTarget, setNeedleTarget] = useState<HTMLElement | null>(null);
  const [auxTarget, setAuxTarget] = useState<HTMLElement | null>(null);
  const [depth, setDepth] = useState(0);
  const [depthMm, setDepthMm] = useState('0');
  const [pointCode, setPointCode] = useState('GB34');
  const [pointName, setPointName] = useState('양릉천');
  const [sceneShift, setSceneShift] = useState(0);
  const needleEyeAvailable = Boolean(needleEyeProfiles[pointCode]);
  const needleEyeDepthMm = useMemo(() => {
    const max = needleEyeProfiles[pointCode]?.modelMaxMm;
    if (max == null) return depthMm;
    return (max * depth / 100).toFixed(1).replace(/\.0$/, '');
  }, [depth, depthMm, pointCode]);

  useEffect(() => {
    let timer = 0;
    const locate = () => {
      const panel = document.querySelector<HTMLElement>('.acupuncture-panel');
      const needlePanel = document.querySelector<HTMLElement>('.needle-panel');
      const auxiliaryTools = document.querySelector<HTMLElement>('.auxiliary-tools');
      if (panel && needlePanel && auxiliaryTools) {
        setPanelTarget(panel);
        setNeedleTarget(needlePanel);
        setAuxTarget(auxiliaryTools);
        return;
      }
      timer = window.setTimeout(locate, 60);
    };
    locate();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!panelTarget) return;

    const readCurrentState = () => {
      const slider = panelTarget.querySelector<HTMLElement>('[role="slider"][aria-label="자침 진행"]');
      const value = Number(slider?.getAttribute('aria-valuenow'));
      if (Number.isFinite(value)) setDepth(value);

      const modelDepth = panelTarget.querySelector<HTMLElement>('.strata-read .big')?.textContent?.trim();
      if (modelDepth) setDepthMm(modelDepth);

      const title = panelTarget.querySelector('h2')?.textContent?.trim();
      const point = title?.match(/^([A-Z]+\d+)\s+(.+)$/);
      if (point) {
        setPointCode(point[1]);
        setPointName(point[2]);
      }
    };

    const handleClick = (event: Event) => {
      const button = (event.target as Element | null)?.closest('button');
      if (button?.textContent?.trim().startsWith('주변 구조만')) {
        setAnalysisOpen((value) => {
          if (value) setWorkspaceOpen(false);
          return !value;
        });
      }
    };

    readCurrentState();
    panelTarget.addEventListener('click', handleClick, true);
    const observer = new MutationObserver(readCurrentState);
    observer.observe(panelTarget, { subtree: true, attributes: true, childList: true, characterData: true });
    return () => {
      panelTarget.removeEventListener('click', handleClick, true);
      observer.disconnect();
    };
  }, [panelTarget]);

  useEffect(() => {
    if (!auxTarget) return;
    const buttons = Array.from(auxTarget.querySelectorAll<HTMLButtonElement>('button'));
    const guideButton = buttons[0];
    const layersButton = buttons[1];

    const handleAuxiliaryClick = (event: Event) => {
      const button = (event.target as Element | null)?.closest('button');
      if (!button) return;

      if (button === guideButton && guideButton.getAttribute('aria-pressed') !== 'true') {
        if (layersButton.getAttribute('aria-expanded') === 'true') layersButton.click();
        setAnalysisOpen(false);
        setWorkspaceOpen(false);
      }

      if (button === layersButton && layersButton.getAttribute('aria-expanded') !== 'true') {
        if (guideButton.getAttribute('aria-pressed') === 'true') guideButton.click();
        setAnalysisOpen(false);
        setWorkspaceOpen(false);
      }
    };

    auxTarget.addEventListener('click', handleAuxiliaryClick, true);
    return () => auxTarget.removeEventListener('click', handleAuxiliaryClick, true);
  }, [auxTarget]);

  useEffect(() => {
    if (!panelTarget) return;

    const updateScenePosition = () => {
      if (!analysisOpen || window.innerWidth < 768) {
        setSceneShift(0);
        return;
      }

      const panelRect = panelTarget.getBoundingClientRect();
      const leftReserve = workspaceOpen ? 300 : 350;
      const rightReserve = Math.max(0, window.innerWidth - panelRect.left + 22);
      const availableWidth = window.innerWidth - leftReserve - rightReserve;
      if (availableWidth < 360) {
        setSceneShift(0);
        return;
      }

      const availableCenter = leftReserve + availableWidth / 2;
      const nextShift = Math.max(-window.innerWidth * .22, Math.min(window.innerWidth * .12, availableCenter - window.innerWidth / 2));
      setSceneShift(Math.round(nextShift));
    };

    updateScenePosition();
    const mutationObserver = new MutationObserver(updateScenePosition);
    mutationObserver.observe(panelTarget, { attributes: true, attributeFilter: ['class', 'style'] });
    const resizeObserver = new ResizeObserver(updateScenePosition);
    resizeObserver.observe(panelTarget);
    window.addEventListener('resize', updateScenePosition);
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScenePosition);
    };
  }, [panelTarget, analysisOpen, workspaceOpen]);

  useEffect(() => {
    if (needleEyeAvailable) return;
    setAnalysisOpen(false);
    setWorkspaceOpen(false);
  }, [needleEyeAvailable]);

  const closeAuxiliaryModes = () => {
    if (!auxTarget) return;
    const buttons = Array.from(auxTarget.querySelectorAll<HTMLButtonElement>('button'));
    if (buttons[0]?.getAttribute('aria-pressed') === 'true') buttons[0].click();
    if (buttons[1]?.getAttribute('aria-expanded') === 'true') buttons[1].click();
  };

  return (
    <div
      className={`needling-workspace-preview ${analysisOpen ? 'preview-analysis' : ''} ${workspaceOpen ? 'preview-workspace' : ''} ${memoOpen ? 'preview-memo' : ''}`}
      style={{ '--preview-scene-shift': `${sceneShift}px` } as CSSProperties}
    >
      <Home />
      <NeedleEyeLauncher
        active={analysisOpen}
        available={needleEyeAvailable}
        onToggle={() => {
          if (!analysisOpen) closeAuxiliaryModes();
          setAnalysisOpen((value) => {
            if (value) setWorkspaceOpen(false);
            return !value;
          });
        }}
      />
      {analysisOpen ? (
        <NeedleEyeHud
          depth={depth}
          depthMm={needleEyeDepthMm}
          pointCode={pointCode}
          pointName={pointName}
          expanded={workspaceOpen}
          onExpand={() => setWorkspaceOpen((value) => !value)}
        />
      ) : null}
      {workspaceOpen && needleTarget ? createPortal(<NeedleEyeCompass depth={depth} depthMm={needleEyeDepthMm} pointCode={pointCode} />, needleTarget) : null}
      {panelTarget ? createPortal(
        <StudyMemo open={memoOpen} onOpenChange={setMemoOpen} pointCode={pointCode} />,
        panelTarget,
      ) : null}
    </div>
  );
}
