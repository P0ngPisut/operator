import MapViewport from './MapViewport';

export default function MapPanel({ activeIncident, state, onSetCoord, onVerify, onSetMapViewport, onSetMapSelection, onBriefing }) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0e1215]">
      <MapViewport
        activeIncident={activeIncident}
        state={state}
        onViewportChange={onSetMapViewport}
        onSelectionChange={onSetMapSelection}
      />

      <div className="map-panel-card trace-card">
        <div className="trace-header">
          <span className="cy">SIGNAL TRACE</span>
          <b>{state.ipTraceProgress >= 100 ? '500 m' : `${Math.max(0, 150 - state.traceElapsed).toFixed(0)}s`}</b>
        </div>
        <div className="bar"><i style={{ width: `${state.ipTraceProgress}%`, background: '#35c3d8' }} /></div>
        <div className="mu muni-mono">RADIUS ≈ {(2 - state.ipTraceProgress / 100 * 1.5).toFixed(1)} km · AUTO TRACE</div>
      </div>

      {state.radioBriefingActive ? (
        <div className="map-panel-card radio-card">
          <h4 className="or">FIELD RADIO BRIEFING · {activeIncident?.title}</h4>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
            {activeIncident?.fieldBriefings?.map((briefing) => (
              <button
                key={briefing.id}
                type="button"
                onClick={() => onBriefing?.(briefing)}
                className="border border-amber-800 bg-neutral-950 px-2 py-1.5 text-left text-[10px] text-neutral-200 hover:border-amber-400 hover:bg-amber-950/40"
              >
                <span className="mb-1 block font-mono text-[9px] text-amber-400">RISK {briefing.risk || briefing.outcome}</span>
                {briefing.text}
              </button>
            ))}
          </div>
        </div>
      ) : state.callerData.coordsUnlocked && state.coordStatus !== 'VERIFIED' ? (
        <div className="map-panel-card coord-card">
          <h4 className="cy flex items-center justify-between gap-2">
            <span>COORDINATE CONSOLE</span>
            {activeIncident?.severity <= 5 && <span className="text-amber-300">{Math.max(0, 20 - state.addressElapsedSec).toFixed(1)}s</span>}
          </h4>
          <div className="coord-row">
            {[0, 1, 2].map((idx) => (
              <label key={idx}>
                {['BLOCK', 'SECTOR', 'UNIT'][idx]}
                <input
                  value={state.inputCoords[idx]}
                  maxLength={3}
                  disabled={!state.callerData.coordsUnlocked || state.coordStatus === 'VERIFIED'}
                  onChange={(e) => onSetCoord?.(idx, e.target.value.replace(/\D/g, '').slice(0, 3))}
                />
              </label>
            ))}
            <button type="button" onClick={onVerify} className="btn" disabled={!state.callerData.coordsUnlocked || state.coordStatus === 'VERIFIED'}>
              VERIFY
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

