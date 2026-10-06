import { useReducer, useEffect, useState } from 'react';
import { 
  ShieldAlert, Radio, DollarSign, Clock, Shield, Flame, Ambulance, Send, 
  AlertTriangle, ShoppingBag, Award, Lock, Zap
} from 'lucide-react';
import { gameReducer, initialState } from './context/gameReducer';
import { generateIncidents } from './data/incidents';
import { BASE_LOCATIONS, VEHICLE_CATALOG } from './data/vehicles';
import MapPanel from './components/MapPanel';
import { callGeminiForDialogue, generateGeminiScenarioNarratives } from './services/aiService';

function TypedMessage({ text }) {
  const [visibleText, setVisibleText] = useState('');
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) clearInterval(timer);
    }, 22);
    return () => clearInterval(timer);
  }, [text]);
  return <>{visibleText}<span className="animate-pulse text-cyan-300">{visibleText.length < text.length ? '▍' : ''}</span></>;
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [inputFocused, setInputFocused] = useState(false);
  const [dispatcherInput, setDispatcherInput] = useState('');
  const [waitingForCaller, setWaitingForCaller] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('nightwatch_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load the next call only after the previous incident is resolved.
  useEffect(() => {
    if (state.gamePhase === 'ACTIVE_SHIFT' && !state.activeIncident && !state.isGameOver) {
      dispatch({ type: 'LOAD_NEXT_INCIDENT' });
    }
  }, [state.gamePhase, state.activeIncident, state.incidentQueue?.length, state.isGameOver]);

  useEffect(() => {
    if (!state.callerConversationActive || state.ipTraceProgress >= 100 || state.callerData.coordsUnlocked) return undefined;
    const timer = setInterval(() => dispatch({ type: 'ADVANCE_SIGNAL_TRACE', payload: 0.1 }), 100);
    return () => clearInterval(timer);
  }, [state.callerConversationActive, state.ipTraceProgress >= 100, state.callerData.coordsUnlocked]);

  useEffect(() => {
    if (!state.activeIncident || state.activeIncident.severity > 5 || !state.callerData.coordsUnlocked || state.coordStatus === 'VERIFIED') return undefined;
    const timer = setInterval(() => dispatch({ type: 'ADVANCE_ADDRESS_TIMER', payload: 0.1 }), 100);
    return () => clearInterval(timer);
  }, [state.activeIncident?.id, state.activeIncident?.severity, state.callerData.coordsUnlocked, state.coordStatus]);

  useEffect(() => {
    if (!state.pendingCallerReply) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'REVEAL_CALLER_REPLY' }), 700);
    return () => clearTimeout(timer);
  }, [state.pendingCallerReply]);

  useEffect(() => {
    if (geminiKey) localStorage.setItem('nightwatch_gemini_api_key', geminiKey);
    else localStorage.removeItem('nightwatch_gemini_api_key');
  }, [geminiKey]);

  // Advance the route using simulated time rather than a fixed arrival timeout.
  useEffect(() => {
    if (state.dispatchedUnit?.status === 'EN_ROUTE') {
      let previousTick = performance.now();
      const timer = setInterval(() => {
        const currentTick = performance.now();
        const deltaSec = (currentTick - previousTick) / 1000;
        previousTick = currentTick;
        dispatch({ type: 'ADVANCE_UNIT', payload: deltaSec });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [state.dispatchedUnit?.status]);

  // 3. Keyboard Shortcuts (Q, W, E, A, S, D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (inputFocused || state.gamePhase !== 'ACTIVE_SHIFT' || ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const key = e.key.toUpperCase();
      if (key === 'Q') dispatch({ type: 'SELECT_DEPT_TAB', payload: 'police' });
      if (key === 'W') dispatch({ type: 'SELECT_DEPT_TAB', payload: 'fire' });
      if (key === 'E') dispatch({ type: 'SELECT_DEPT_TAB', payload: 'medical' });
      if (key === 'A') dispatch({ type: 'SELECT_VEHICLE_SLOT', payload: 'A' });
      if (key === 'S') dispatch({ type: 'SELECT_VEHICLE_SLOT', payload: 'S' });
      if (key === 'D') dispatch({ type: 'SELECT_VEHICLE_SLOT', payload: 'D' });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputFocused, state.gamePhase]);

  const activeIncident = state.activeIncident;
  const currentVehicles = VEHICLE_CATALOG[state.activeDeptTab || 'police'];

  const startShift = async () => {
    const incidents = generateIncidents(15, state.level);
    const enhancedIncidents = await Promise.race([
      generateGeminiScenarioNarratives({ apiKey: geminiKey.trim(), incidents }),
      new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    dispatch({ type: 'START_SHIFT', payload: { incidents: enhancedIncidents || incidents } });
  };

  const handleDispatch = () => {
    dispatch({
      type: 'DISPATCH_UNIT',
      payload: { vehicle: currentVehicles[state.selectedVehicleSlot], basePosition: BASE_LOCATIONS[state.activeDeptTab] },
    });
  };

  const handleDispatcherSubmit = async (event) => {
    event.preventDefault();
    const message = dispatcherInput.trim();
    if (!message || waitingForCaller || state.pendingCallerReply) return;
    setWaitingForCaller(true);
    const incident = state.activeIncident;
    const apiKey = geminiKey.trim();
    let aiReply = null;
    if (apiKey && incident) {
      const result = await Promise.race([
        callGeminiForDialogue({ apiKey, scenario: incident, history: state.chatLogs, playerMessage: message, currentPanic: state.currentPanic }),
        new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);
      aiReply = result?.callerResponse ? String(result.callerResponse).slice(0, 1000) : null;
    }
    dispatch({ type: 'SUBMIT_DISPATCHER_INPUT', payload: { message, callerResponse: aiReply } });
    setDispatcherInput('');
    setWaitingForCaller(false);
  };

  return (
    <>
      <style>{`
        :root {
          --bg: #0b0d0f;
          --p: #13171b;
          --p2: #1a2025;
          --bd: #2a3138;
          --tx: #c9d1d6;
          --mu: #6f7b84;
          --cy: #35c3d8;
          --rd: #e5484d;
          --or: #f0932b;
          --gn: #3fb97a;
        }

        .nightwatch-shell {
          height: 100vh;
          width: 100vw;
          display: grid;
          grid-template-rows: 42px 1fr;
          gap: 6px;
          padding: 6px;
          background: var(--bg);
          color: var(--tx);
          font-family: 'IBM Plex Mono', 'Noto Sans Thai', monospace;
          overflow: hidden;
          min-width: 0;
        }

        .nightwatch-top {
          display: flex;
          align-items: center;
          gap: 18px;
          background: var(--p);
          border: 1px solid var(--bd);
          padding: 0 12px;
          font-size: 12px;
        }

        .nightwatch-strong {
          letter-spacing: 0.12em;
          font-weight: 700;
        }

        .nightwatch-spacer { flex: 1; }
        .cy { color: var(--cy); }
        .rd { color: var(--rd); }
        .or { color: var(--or); }
        .gn { color: var(--gn); }
        .mu { color: var(--mu); }

        .nightwatch-main {
          display: grid;
          grid-template-columns: 25% minmax(0, 1fr);
          gap: 6px;
          min-height: 0;
        }

        .nightwatch-main > .nightwatch-panel {
          position: static;
          width: auto;
        }

        .nightwatch-panel {
          background: var(--p);
          border: 1px solid var(--bd);
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .nightwatch-panel-header {
          padding: 8px 10px;
          border-bottom: 1px solid var(--bd);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .nightwatch-sev {
          background: var(--rd);
          color: #fff;
          padding: 1px 6px;
          font-weight: 600;
        }

        .nightwatch-chat {
          flex: 1;
          overflow: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 80px;
        }

        .msg {
          padding: 6px 8px;
          line-height: 1.45;
          font-size: 12px;
        }

        .msg.caller {
          border-left: 3px solid var(--or);
          background: var(--p2);
        }

        .msg.disp {
          background: #0f3a44;
          border: 1px solid #17566a;
          align-self: flex-end;
          max-width: 90%;
        }

        .msg.sys {
          border: 1px dashed var(--bd);
          color: var(--mu);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
        }

        .nightwatch-timebox {
          padding: 8px;
          border-top: 1px solid var(--bd);
        }

        .nightwatch-bar {
          height: 5px;
          background: #0b0d0f;
          border: 1px solid var(--bd);
          margin: 4px 0;
          overflow: hidden;
        }

        .nightwatch-bar i {
          display: block;
          height: 100%;
          background: var(--or);
          transition: width 0.12s ease;
        }

        .tab kbd,
        .coord-row label {
          font: 10px 'IBM Plex Mono', monospace;
          border: 1px solid var(--mu);
          padding: 0 4px;
          color: var(--mu);
          height: 16px;
          line-height: 16px;
          display: inline-block;
        }

        .nightwatch-data {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--bd);
          border-top: 1px solid var(--bd);
        }

        .nightwatch-data div {
          background: var(--p);
          padding: 6px 8px;
          font-size: 11px;
        }

        .nightwatch-data span {
          display: block;
          font: 10px 'IBM Plex Mono', monospace;
          color: var(--mu);
          margin-bottom: 3px;
        }

        .nightwatch-data .location-coords {
          font-size: 16px;
        }

        .right-shell {
          display: grid;
          grid-template-rows: minmax(0, 4fr) minmax(190px, 1.3fr);
          gap: 6px;
          min-height: 0;
        }

        .map-stage {
          position: relative;
          min-height: 0;
          overflow: hidden;
          background: #0e1215;
          border: 1px solid var(--bd);
        }

        .map-stage svg {
          width: 100%;
          height: 100%;
          display: block;
          background: #0e1215;
        }

        .map-panel-card {
          position: absolute;
          background: rgba(19, 23, 27, 0.95);
          border: 1px solid var(--bd);
          padding: 8px 10px;
        }

        .trace-card {
          top: 8px;
          right: 8px;
          width: 200px;
        }

        .trace-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 6px;
        }

        .muni-mono {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
        }

        .dispatch-badge {
          position: absolute;
          left: 50%;
          top: 30%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(17, 24, 39, 0.9);
          border: 1px solid var(--rd);
          color: #fee2e2;
          padding: 8px 12px;
          font-size: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 700;
          cursor: pointer;
          z-index: 3;
          box-shadow: 0 0 20px rgba(229,72,77,0.35);
        }

        .coord-card {
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: min(430px, calc(100% - 16px));
          max-width: calc(100% - 16px);
          box-sizing: border-box;
          border-color: var(--cy);
        }

        .coord-card h4 {
          font: 11px 'IBM Plex Mono', monospace;
          margin-bottom: 6px;
        }

        .coord-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
          gap: 6px;
          align-items: flex-end;
          width: 100%;
          min-width: 0;
        }

        .coord-row label {
          min-width: 0;
          height: auto;
          border: 0;
          padding: 0;
          font: 10px 'IBM Plex Mono', monospace;
          color: var(--mu);
          display: grid;
          gap: 3px;
          line-height: 1.35;
        }

        .coord-row input {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          background: #0b0d0f;
          border: 1px solid var(--bd);
          color: var(--cy);
          font: 600 18px 'IBM Plex Mono', monospace;
          text-align: center;
          padding: 3px;
          outline: 0;
          margin-top: 3px;
        }

        .coord-row input:focus {
          border-color: var(--cy);
        }

        .btn {
          background: var(--cy);
          color: #04181c;
          border: 0;
          padding: 8px 12px;
          font: 600 12px 'IBM Plex Mono', monospace;
          cursor: pointer;
        }

        .btn:disabled {
          background: var(--p2);
          color: var(--mu);
          cursor: not-allowed;
        }

        .fleet-shell {
          background: var(--p);
          border: 1px solid var(--bd);
          display: flex;
          flex-direction: column;
        }

        .fleet-tabs {
          display: flex;
          border-bottom: 1px solid var(--bd);
        }

        .tab {
          flex: 1;
          padding: 7px;
          background: none;
          border: 0;
          border-bottom: 2px solid transparent;
          color: var(--mu);
          cursor: pointer;
          font: 600 12px 'IBM Plex Mono', monospace;
          display: flex;
          gap: 6px;
          justify-content: center;
          align-items: center;
          text-transform: uppercase;
        }

        .tab.on {
          color: var(--cy);
          border-color: var(--cy);
          background: var(--p2);
        }

        .fleet-grid {
          display: grid;
          grid-template-columns:1.6fr 1fr;
          gap: 8px;
          padding: 8px;
          flex: 1;
          min-height: 0;
        }

        .vehicle-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
        }

        .vehicle-card {
          background: var(--p2);
          border: 1px solid var(--bd);
          padding: 7px;
          cursor: pointer;
          color: var(--tx);
          text-align: left;
          font: inherit;
          transition: 0.12s;
        }

        .vehicle-card.on {
          border-color: var(--cy);
          box-shadow: inset 0 0 0 1px var(--cy);
        }

        .vehicle-card .id {
          font: 10px 'IBM Plex Mono', monospace;
          color: var(--cy);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .vehicle-card b {
          display: block;
          margin-top: 4px;
        }

        .fleet-status-box {
          font: 11px 'IBM Plex Mono', monospace;
          line-height: 1.7;
        }

        .slots {
          display: flex;
          gap: 3px;
          margin: 4px 0;
        }

        .slots i {
          width: 14px;
          height: 8px;
          border: 1px solid var(--bd);
          display: inline-block;
        }

        .slots i.f { background: var(--cy); border-color: var(--cy); }

        .pill {
          display: inline-block;
          padding: 0 6px;
          border: 1px solid var(--bd);
          font: 10px 'IBM Plex Mono', monospace;
        }

        .fleet-footer {
          height: 40px;
          background: #0d1115;
          border-top: 1px solid var(--bd);
          padding: 0 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .dispatch-action {
          background: var(--cy);
          color: #04181c;
          border: 0;
          font: 700 12px 'IBM Plex Mono', monospace;
          padding: 6px 12px;
          cursor: pointer;
        }

        .dispatch-action:disabled {
          background: var(--p2);
          color: var(--mu);
          cursor: not-allowed;
        }

        .fleet-status {
          position: absolute;
          bottom: 14px;
          left: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid var(--bd);
          padding: 6px 8px;
          font-size: 10px;
          font-family: 'IBM Plex Mono', monospace;
          color: var(--tx);
        }
      `}</style>

      <div className="nightwatch-shell">
        {settingsOpen && <div className="absolute right-4 top-14 z-50 w-80 border border-neutral-700 bg-neutral-950 p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between"><b className="text-sm text-cyan-300">AI SETTINGS</b><button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button></div>
          <label className="block text-[10px] text-neutral-400">Google Gemini API key
            <input type="password" value={geminiKey} onChange={(event) => setGeminiKey(event.target.value)} placeholder="Paste API key" className="mt-1 w-full border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-cyan-500" />
          </label>
          <p className="mt-2 text-[9px] text-neutral-500">Uses VITE_GEMINI_API_KEY when set. Without a key or if Gemini fails, procedural dialogue is used.</p>
        </div>}
        {state.isGameOver && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center border-4 border-red-600">
            <AlertTriangle className="w-16 h-16 text-red-500 animate-bounce mb-4" />
            <h1 className="text-3xl font-bold text-red-500 tracking-widest mb-2">AGENCY TERMINATED // GAME OVER</h1>
            <p className="text-neutral-400 mb-6">
              {state.gameOverReason === 'BANKRUPTCY'
                ? 'สาเหตุ: องค์กรล้มละลาย (Operating Funds ติดลบ)'
                : 'สาเหตุ: ความน่าเชื่อถือล่มสลาย (Lost Case สะสมเกินกำหนด)'}
            </p>
            <button onClick={() => window.location.reload()} className="bg-red-700 hover:bg-red-600 text-white px-6 py-2 rounded font-bold transition">
              REBOOT SYSTEM (RETRY)
            </button>
          </div>
        )}

        <header className="nightwatch-top">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="nightwatch-strong cy">NIGHTWATCH // DISPATCH 04</span>
            <span className="bg-cyan-950 text-cyan-400 px-2 py-0.5 border border-cyan-800 rounded">SHIFT #{state.shift}</span>
          </div>

          <div className="nightwatch-spacer" />
          <button type="button" className="border border-neutral-700 px-2 py-1 text-xs text-cyan-300 hover:bg-neutral-800" onClick={() => setSettingsOpen(!settingsOpen)}>⚙ Settings</button>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-[#0b0d0f] border border-[#2a3138] px-2.5 py-1 rounded">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold">LVL {state.level}</span>
              <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden ml-1">
                <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${(state.xp / state.xpToNextLevel) * 100}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">REP: {state.reputation}%</span>
            </div>

            <div className="flex items-center gap-1 text-amber-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-bold">{state.funds.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 text-neutral-400 border-l border-neutral-800 pl-4">
              <Clock className="w-4 h-4" />
              <span>02:41:09 AM</span>
            </div>
          </div>
        </header>

        {state.gamePhase === 'PRE_SHIFT_SHOP' ? (
          <main className="flex-1 p-6 bg-neutral-950 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> PRE-SHIFT SHOP & TACTICAL UPGRADES
                  </h1>
                  <p className="text-xs text-neutral-400 mt-1">จัดซื้อยุทโธปกรณ์และจ้างกำลังพลเสริมก่อนเริ่มกะปฏิบัติการ</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-500 block">AVAILABLE FUNDS</span>
                  <span className="text-xl font-bold text-amber-400">${state.funds.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-bold text-neutral-200">PATROL SEDAN (POLICE)</span>
                      <span className="text-amber-400 font-bold">$4,500</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">รถตรวจการณ์สายตรวจ บรรจุตำรวจได้ 2-3 นาย</p>
                  </div>
                  <button
                    onClick={() => dispatch({
                      type: 'BUY_SHOP_ITEM',
                      payload: { id: 'PATROL_SEDAN', cost: 4500, category: 'vehicle', itemKey: 'policeVehicles' }
                    })}
                    disabled={state.funds < 4500 || state.inventory.policeVehicles.includes('PATROL_SEDAN')}
                    className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-bold py-2 rounded transition"
                  >
                    PURCHASE VEHICLE
                  </button>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded flex flex-col justify-between relative overflow-hidden">
                  {state.level < 4 && (
                    <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center text-xs text-amber-400 font-bold">
                      <Lock className="w-5 h-5 mb-1" /> UNLOCKS AT LEVEL 4
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-bold text-neutral-200">SWAT CARRIER (POLICE)</span>
                      <span className="text-amber-400 font-bold">$30,000</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">รถหุ้มเกราะหนา บรรจุเจ้าหน้าที่ SWAT 6 นาย สำหรับเหตุ SEV 6-8</p>
                  </div>
                  <button
                    onClick={() => dispatch({
                      type: 'BUY_SHOP_ITEM',
                      payload: { id: 'SWAT_CARRIER', cost: 30000, category: 'vehicle', itemKey: 'policeVehicles', minLevel: 4 }
                    })}
                    disabled={state.funds < 30000 || state.inventory.policeVehicles.includes('SWAT_CARRIER') || state.level < 4}
                    className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-bold py-2 rounded transition"
                  >
                    PURCHASE VEHICLE
                  </button>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-bold text-neutral-200">TACTICAL VEST UPGRADE</span>
                      <span className="text-amber-400 font-bold">$500</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">ลดอัตราการบาดเจ็บของเจ้าหน้าที่ตำรวจลง 15%</p>
                  </div>
                  <button
                    onClick={() => dispatch({
                      type: 'BUY_SHOP_ITEM',
                      payload: { id: 'STANDARD_ARMOR', cost: 500, category: 'armor', itemKey: 'hasArmorVest' }
                    })}
                    disabled={state.funds < 500 || state.inventory.hasArmorVest}
                    className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-bold py-2 rounded transition"
                  >
                    {state.inventory.hasArmorVest ? 'PURCHASED' : 'PURCHASE UPGRADE'}
                  </button>
                </div>

                {[
                  { id: 'POLICE_RECRUIT', label: 'HIRE POLICE OFFICER', itemKey: 'policeStaffCount', cost: 500 },
                  { id: 'FIRE_RECRUIT', label: 'HIRE FIREFIGHTER', itemKey: 'fireStaffCount', cost: 450 },
                  { id: 'MEDICAL_RECRUIT', label: 'HIRE PARAMEDIC', itemKey: 'medicalStaffCount', cost: 600 },
                ].map((hire) => (
                  <div key={hire.id} className="bg-neutral-900 border border-neutral-800 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-bold text-neutral-200">{hire.label}</span>
                        <span className="text-amber-400 font-bold">${hire.cost.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-neutral-400 mb-3">เพิ่มเจ้าหน้าที่ประจำหน่วย 1 คน · ปัจจุบัน {state.inventory[hire.itemKey]}/12</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'BUY_SHOP_ITEM', payload: { id: hire.id, cost: hire.cost, category: 'staff', itemKey: hire.itemKey, limit: 12 } })}
                      disabled={state.funds < hire.cost || state.inventory[hire.itemKey] >= 12}
                      className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-bold py-2 transition"
                    >
                      HIRE STAFF
                    </button>
                  </div>
                ))}

                {Object.entries(VEHICLE_CATALOG)
                  .filter(([department]) => department !== 'police')
                  .flatMap(([department, vehicles]) => Object.entries(vehicles)
                    .filter(([slot]) => slot !== 'A')
                    .map(([, vehicle]) => {
                      const itemKey = `${department}Vehicles`;
                      const owned = state.inventory[itemKey].includes(vehicle.id);
                      const locked = state.level < vehicle.minLevel;
                      return (
                        <div key={vehicle.id} className="bg-neutral-900 border border-neutral-800 p-4 flex flex-col justify-between relative overflow-hidden">
                          {locked && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/85 text-xs font-bold text-amber-400"><Lock className="mb-1 h-5 w-5" />UNLOCKS AT LEVEL {vehicle.minLevel}</div>}
                          <div>
                            <div className="mb-2 flex justify-between gap-2 text-xs">
                              <span className="font-bold text-neutral-200">{vehicle.name} · {department.toUpperCase()}</span>
                              <span className="whitespace-nowrap font-bold text-amber-400">${vehicle.purchaseCost.toLocaleString()}</span>
                            </div>
                            <p className="mb-3 text-xs text-neutral-400">{vehicle.desc} · {vehicle.speedKph} km/h · Crew {vehicle.crewMin}-{vehicle.crewMax}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => dispatch({ type: 'BUY_SHOP_ITEM', payload: { id: vehicle.id, cost: vehicle.purchaseCost, category: 'vehicle', itemKey, minLevel: vehicle.minLevel } })}
                            disabled={state.funds < vehicle.purchaseCost || owned || locked}
                            className="w-full bg-cyan-700 py-2 text-xs font-bold text-white transition hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600"
                          >
                            {owned ? 'OWNED' : 'PURCHASE VEHICLE'}
                          </button>
                        </div>
                      );
                    }))}
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-4 flex justify-between items-center">
              <span className="text-xs text-neutral-400">SHIFT READY: 15-20 INCIDENTS SCHEDULED</span>
              <button
                onClick={startShift}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-2.5 rounded text-xs tracking-wider flex items-center gap-2 transition"
              >
                <Zap className="w-4 h-4 fill-current" /> START SHIFT #{state.shift}
              </button>
            </div>
          </main>
        ) : state.gamePhase === 'SHIFT_SUMMARY' ? (
          <main className="flex-1 overflow-y-auto bg-neutral-950 p-8">
            <section className="mx-auto max-w-5xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="mb-6 flex items-start justify-between border-b border-neutral-800 pb-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.25em] text-cyan-400">NIGHTWATCH / SHIFT REPORT</p>
                  <h1 className="mt-2 text-2xl font-bold text-neutral-100">SHIFT #{state.shift} COMPLETE</h1>
                </div>
                <span className="font-mono text-xl text-emerald-400">{state.successfulCases}/{state.casesCompleted} SUCCESS</span>
              </div>

              <div className="grid grid-cols-2 gap-px bg-neutral-800 sm:grid-cols-4">
                <div className="bg-neutral-950 p-4"><span className="block text-[10px] text-neutral-500">CASES COMPLETED</span><b className="mt-1 block font-mono text-xl">{state.casesCompleted}</b></div>
                <div className="bg-neutral-950 p-4"><span className="block text-[10px] text-neutral-500">SUCCESS RATE</span><b className="mt-1 block font-mono text-xl text-cyan-300">{state.casesCompleted ? Math.round(state.successfulCases / state.casesCompleted * 100) : 0}%</b></div>
                <div className="bg-neutral-950 p-4"><span className="block text-[10px] text-neutral-500">LIVES SAVED</span><b className="mt-1 block font-mono text-xl text-emerald-400">{state.livesSaved}</b></div>
                <div className="bg-neutral-950 p-4"><span className="block text-[10px] text-neutral-500">STAFF INJURED</span><b className="mt-1 block font-mono text-xl text-amber-400">{state.staffInjuredCount}</b></div>
              </div>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-neutral-800 pt-4">
                <div className="font-mono text-xs text-neutral-400">
                  <div>FUNDS <span className="text-amber-400">${state.funds.toLocaleString()}</span></div>
                  <div className="mt-1">REPUTATION <span className="text-emerald-400">{state.reputation}%</span> · LEVEL <span className="text-cyan-300">{state.level}</span></div>
                </div>
                <button type="button" onClick={() => dispatch({ type: 'PREPARE_NEXT_SHIFT' })} className="border border-cyan-600 bg-cyan-950 px-5 py-2 font-mono text-xs font-bold text-cyan-200 hover:bg-cyan-900">
                  PREPARE SHIFT #{state.shift + 1}
                </button>
              </div>
            </section>
          </main>
        ) : (
          <div className="nightwatch-main">
            <section className="nightwatch-panel">
              <div className="nightwatch-panel-header">
                <span className="text-red-500 font-bold animate-pulse">● LIVE</span>
                <span className="text-neutral-400">{activeIncident?.id || 'INCIDENT'}</span>
                <span className="nightwatch-sev">SEV {activeIncident?.severity || 7}</span>
              </div>

              <div className="nightwatch-chat">
                {state.chatLogs.map((log, index) => (
                  <div key={index} className={`msg ${log.sender === 'SYSTEM' ? 'sys' : log.sender === 'CALLER' ? 'caller' : 'disp'}`}>
                    {log.sender === 'SYSTEM' ? null : <div className="text-[10px] text-neutral-400 font-bold mb-0.5">{log.sender}</div>}
                    {log.sender === 'CALLER' ? <TypedMessage text={log.text} /> : log.text}
                  </div>
                ))}
                {waitingForCaller && <div className="msg caller text-cyan-300"><span className="animate-pulse">CALLER IS RESPONDING ▍</span></div>}
              </div>

              <div className="nightwatch-timebox">
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <span>CALLER PANIC</span>
                  <span className={state.currentPanic >= 60 ? 'text-red-400' : 'text-emerald-400'}>{state.currentPanic}%</span>
                </div>
                <form onSubmit={handleDispatcherSubmit} className="flex gap-1 mb-2">
                  <input
                    type="text"
                    value={dispatcherInput}
                    onChange={(event) => setDispatcherInput(event.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="พิมพ์ตอบผู้แจ้งเหตุ..."
                    aria-label="ข้อความตอบผู้แจ้งเหตุ"
                    className="min-w-0 flex-1 bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-neutral-200 outline-none focus:border-cyan-500"
                    disabled={!state.callerConversationActive || waitingForCaller || Boolean(state.pendingCallerReply)}
                  />
                  <button
                    type="submit"
                    aria-label="ส่งข้อความ"
                    className="border border-cyan-700 bg-cyan-950 px-2 text-cyan-300 hover:bg-cyan-900 disabled:opacity-40"
                    disabled={!dispatcherInput.trim() || !state.callerConversationActive || waitingForCaller || Boolean(state.pendingCallerReply)}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

              <div className="nightwatch-data">
                <div><span>CALLER</span>{state.callerData.name}</div>
                <div><span>RISK</span><b className="rd">{state.callerData.risk}</b></div>
                <div className="col-span-2"><span>LOCATION</span><b className="cy location-coords">{state.callerData.coordsUnlocked ? `[${state.callerData.coords[0]}] [${state.callerData.coords[1]}] [${state.callerData.coords[2]}]` : 'LOCKED'}</b></div>
                <div><span>TYPE</span>{state.callerData.type}</div>
              </div>
            </section>

            <div className="right-shell" style={state.coordStatus === 'VERIFIED' && activeIncident ? undefined : { gridTemplateRows: 'minmax(0, 1fr)' }}>
              <section className="nightwatch-panel map-stage">
                <MapPanel
                  activeIncident={activeIncident}
                  state={state}
                  onSetCoord={(index, value) => dispatch({ type: 'SET_COORD_INPUT', payload: { index, value } })}
                  onVerify={() => dispatch({ type: 'VERIFY_COORDINATES' })}
                  onSetMapViewport={(payload) => dispatch({ type: 'SET_MAP_VIEWPORT', payload })}
                  onSetMapSelection={(payload) => dispatch({ type: 'SET_MAP_SELECTION', payload })}
                  onBriefing={(briefing) => dispatch({ type: 'SELECT_RADIO_BRIEFING', payload: briefing })}
                  onDispatch={handleDispatch}
                />
              </section>

              {state.coordStatus === 'VERIFIED' && activeIncident && <section className="fleet-shell">
                <div className="fleet-tabs">
                  {['police', 'fire', 'medical'].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => dispatch({ type: 'SELECT_DEPT_TAB', payload: dept })}
                      className={`tab ${state.activeDeptTab === dept ? 'on' : ''}`}
                    >
                      {dept === 'police' ? <Shield className="w-4 h-4" /> : dept === 'fire' ? <Flame className="w-4 h-4" /> : <Ambulance className="w-4 h-4" />}
                      {dept.toUpperCase()} <kbd>{dept === 'police' ? 'Q' : dept === 'fire' ? 'W' : 'E'}</kbd>
                    </button>
                  ))}
                </div>

                <div className="fleet-grid">
                  <div className="vehicle-list">
                    {['A', 'S', 'D'].map((slotKey) => {
                      const vehicle = currentVehicles[slotKey];
                      const owned = state.inventory[`${state.activeDeptTab}Vehicles`].includes(vehicle.id);
                      const staffAvailable = state.inventory[`${state.activeDeptTab}StaffCount`];
                      const locked = !owned || state.level < vehicle.minLevel || vehicle.crewMin > staffAvailable;
                      return (
                        <button key={slotKey} disabled={locked || Boolean(state.dispatchedUnit && state.dispatchedUnit.status !== 'SEARCHING_RELOCATION')} className={`vehicle-card ${state.selectedVehicleSlot === slotKey ? 'on' : ''} disabled:cursor-not-allowed disabled:opacity-45`} onClick={() => dispatch({ type: 'SELECT_VEHICLE_SLOT', payload: slotKey })}>
                          <div className="id"><span>{vehicle.name}</span><kbd>{slotKey}</kbd></div>
                          <b>{vehicle.name}</b>
                          <div className="mu" style={{ fontSize: '11px', marginTop: '4px' }}>{vehicle.desc}</div>
                          <div className="mt-1 font-mono text-[9px] text-neutral-500">{vehicle.speedKph} KM/H · CAP {vehicle.capacity} · {!owned ? 'SHOP' : state.level < vehicle.minLevel ? `LVL ${vehicle.minLevel}` : vehicle.crewMin > staffAvailable ? 'NEED CREW' : 'OWNED'}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="fleet-status-box">
                    <div className="mu" style={{ fontSize: '10px', marginBottom: 4 }}>STEP 2 · กำลังพล</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button className="btn" style={{ padding: '2px 9px' }} disabled={state.selectedStaffCount <= currentVehicles[state.selectedVehicleSlot].crewMin} onClick={() => dispatch({ type: 'SET_STAFF_COUNT', payload: state.selectedStaffCount - 1 })}>−</button>
                      <b>{state.selectedStaffCount}/{Math.min(currentVehicles[state.selectedVehicleSlot].crewMax, state.inventory[`${state.activeDeptTab}StaffCount`])}</b>
                      <button className="btn" style={{ padding: '2px 9px' }} disabled={state.selectedStaffCount >= Math.min(currentVehicles[state.selectedVehicleSlot].crewMax, state.inventory[`${state.activeDeptTab}StaffCount`])} onClick={() => dispatch({ type: 'SET_STAFF_COUNT', payload: state.selectedStaffCount + 1 })}>+</button>
                    </div>
                    <div className="slots">
                      {Array.from({ length: Math.min(currentVehicles[state.selectedVehicleSlot].crewMax, state.inventory[`${state.activeDeptTab}StaffCount`]) }, (_, i) => <i key={i} className={i < state.selectedStaffCount ? 'f' : ''} />)}
                    </div>
                    <div className="mt-2"><span className="pill">{state.dispatchedUnit ? state.dispatchedUnit.status : 'READY'}</span></div>
                    {state.dispatchedUnit?.status === 'EN_ROUTE' && (
                      <div className="mt-1 font-mono text-[10px] text-amber-300">RESPONSE TIME LEFT · {Math.max(0, 30 - state.travelElapsedSec).toFixed(1)}s</div>
                    )}
                    <div style={{ marginTop: 6 }}>
                      <button className="dispatch-action" onClick={handleDispatch} disabled={state.coordStatus !== 'VERIFIED' || Boolean(state.dispatchedUnit && state.dispatchedUnit.status !== 'SEARCHING_RELOCATION') || state.activeIncident?.deptCategory !== state.activeDeptTab}>DISPATCH</button>
                    </div>
                  </div>
                </div>

                <div className="fleet-footer">
                  <span className="text-neutral-400 text-[11px]">{state.coordStatus === 'VERIFIED' ? 'STEP 4-5: CLICK INCIDENT MARKER ON MAP TO DISPATCH' : 'STEP 1-3: VERIFY COORDINATES BEFORE DISPATCH'}</span>
                  <button className="dispatch-action" onClick={handleDispatch} disabled={state.coordStatus !== 'VERIFIED' || Boolean(state.dispatchedUnit && state.dispatchedUnit.status !== 'SEARCHING_RELOCATION') || state.activeIncident?.deptCategory !== state.activeDeptTab}>DISPATCH TO TARGET</button>
                </div>
              </section>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
