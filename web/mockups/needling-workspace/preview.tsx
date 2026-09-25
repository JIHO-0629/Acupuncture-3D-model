import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import Home from '../../../app/page';

type PreviewState = 'normal' | 'analysis' | 'workspace' | 'memo';

function readPreviewState(): PreviewState {
  const value = new URLSearchParams(window.location.search).get('state');
  return value === 'analysis' || value === 'workspace' || value === 'memo' ? value : 'normal';
}

function structureOpacity(depth: number, target: number, reach: number) {
  return Math.max(0.2, 1 - Math.abs(depth - target) / reach);
}

function NeedleEyeCompass({ depth }: { depth: number }) {
  const structures = useMemo(
    () => ({
      nerve: structureOpacity(depth, 38, 35),
      artery: structureOpacity(depth, 55, 34),
      boundary: structureOpacity(depth, 72, 30),
    }),
    [depth],
  );

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
          <text className="direction direction-front" x="150" y="18">앞</text>
          <path className="direction-mark" d="M150 31v20m0-20-5 7m5-7 5 7" />
          <text className="direction direction-lateral" x="279" y="159">가쪽</text>
          <path className="direction-mark" d="M249 150h19m0 0-7-5m7 5-7 5" />

          <circle className="range-ring range-ring-outer" cx="150" cy="150" r="105" />
          <circle className="range-ring range-ring-inner" cx="150" cy="150" r="62" />
          <text className="ring-label" x="150" y="82">주변권</text>
          <text className="ring-label" x="150" y="118">근접권</text>

          <g className="structure nerve" style={{ opacity: structures.nerve }}>
            <circle cx="119" cy="180" r="10" />
            <text x="84" y="205">신경</text>
          </g>
          <g className="structure artery" style={{ opacity: structures.artery }}>
            <circle cx="207" cy="139" r="14" />
            <text x="225" y="143">동맥</text>
          </g>
          <g className="structure boundary" style={{ opacity: structures.boundary }}>
            <path d="M239 82c21 17 32 39 34 68s-9 56-31 77" />
            <path className="boundary-soft" d="M248 72c25 20 39 46 41 77s-11 64-38 90" />
            <text x="219" y="65">넓은 경계</text>
          </g>

          <circle className="needle-axis-halo" cx="150" cy="150" r="17" />
          <circle className="needle-axis" cx="150" cy="150" r="4" />
          <text className="axis-label" x="150" y="177">침 축</text>
        </svg>
      </div>

      <div className="compass-reading" aria-live="polite">
        <span><i className="legend nerve-legend" />신경</span>
        <span><i className="legend artery-legend" />혈관</span>
        <span><i className="legend boundary-legend" />경계면</span>
        <small>링은 실제 mm가 아닌 상대 거리 구역입니다.</small>
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
      {!expanded && <NeedleEyeCompass depth={depth} />}
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
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <nav className="needle-eye-launcher" aria-label="관찰 모드와 보조 도구">
      <button type="button" className={active ? 'is-active' : ''} aria-label="Needle’s Eye" aria-pressed={active} onClick={onToggle}>
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
          depthMm={depthMm}
          pointCode={pointCode}
          pointName={pointName}
          expanded={workspaceOpen}
          onExpand={() => setWorkspaceOpen((value) => !value)}
        />
      ) : null}
      {workspaceOpen && needleTarget ? createPortal(<NeedleEyeCompass depth={depth} />, needleTarget) : null}
      {panelTarget ? createPortal(
        <StudyMemo open={memoOpen} onOpenChange={setMemoOpen} pointCode={pointCode} />,
        panelTarget,
      ) : null}
    </div>
  );
}
