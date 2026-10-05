import React, { useReducer, useEffect, useState } from 'react';
import { 
  ShieldAlert, Radio, DollarSign, Clock, Shield, Flame, Ambulance, Send, 
  AlertTriangle, Crosshair, Users, Navigation, ShoppingBag, Award, Lock, Zap
} from 'lucide-react';
import { gameReducer, initialState } from './context/gameReducer';
import { MOCK_INCIDENTS } from './constants/mockIncidents';
import { SoundController } from './utils/audio';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [inputFocused, setInputFocused] = useState(false);

  // 1. โหลด Incident สุ่มตัวอย่าง
  useEffect(() => {
    dispatch({ type: 'START_INCIDENT', payload: MOCK_INCIDENTS[0] });
  }, [state.shift]);

  // 2. Real-time Countdown Timer (0.1 วินาที)
  useEffect(() => {
    if (!state.isTimerActive || state.gamePhase !== 'ACTIVE_SHIFT') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 100);
    return () => clearInterval(interval);
  }, [state.isTimerActive, state.gamePhase]);

  // 3. จำลองการเดินทางของรถ (4 วินาที)
  useEffect(() => {
    if (state.dispatchedUnit?.status === 'EN_ROUTE') {
      const timer = setTimeout(() => {
        dispatch({ type: 'ARRIVE_ON_SCENE' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.dispatchedUnit?.status]);

  // 4. Keyboard Shortcuts (Q, W, E, A, S, D)
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
  const currentStep = activeIncident?.dialogueTree.find(s => s.id === state.currentStepId);

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-200 font-mono overflow-hidden">
      
      {/* GAME OVER OVERLAY */}
      {state.isGameOver && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center border-4 border-red-600">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-bounce mb-4" />
          <h1 className="text-3xl font-bold text-red-500 tracking-widest mb-2">AGENCY TERMINATED // GAME OVER</h1>
          <p className="text-neutral-400 mb-6">
            {state.gameOverReason === 'BANKRUPTCY' 
              ? 'สาเหตุ: องค์กรล้มละลาย (Operating Funds ติดลบ)' 
              : 'สาเหตุ: ความน่าเชื่อถือล่มสลาย (Lost Case สะสมเกินกำหนด)'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-700 hover:bg-red-600 text-white px-6 py-2 rounded font-bold transition"
          >
            REBOOT SYSTEM (RETRY)
          </button>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="h-12 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="font-bold text-cyan-400 tracking-wider">NIGHTWATCH // DISPATCH 04</span>
          <span className="bg-cyan-950 text-cyan-400 px-2 py-0.5 border border-cyan-800 rounded">SHIFT #{state.shift}</span>
        </div>

        {/* Level XP Bar & Funds Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold">LVL {state.level}</span>
            <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden ml-1">
              <div 
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${(state.xp / state.xpToNextLevel) * 100}%` }}
              ></div>
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

      {/* PHASE 1: PRE-SHIFT SHOP SCREEN */}
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

            {/* Shop Item Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Item 1: Patrol Sedan */}
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded flex flex-col justify-between">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold text-neutral-200">PATROL SEDAN (POLICE)</span>
                    <span className="text-amber-400 font-bold">$1,200</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-3">รถตรวจการณ์สายตรวจ บรรจุตำรวจได้ 2-3 นาย</p>
                </div>
                <button 
                  onClick={() => dispatch({ 
                    type: 'BUY_SHOP_ITEM', 
                    payload: { id: 'PATROL_SEDAN', cost: 1200, category: 'vehicle', itemKey: 'policeVehicles' } 
                  })}
                  disabled={state.funds < 1200}
                  className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-bold py-2 rounded transition"
                >
                  PURCHASE VEHICLE
                </button>
              </div>

              {/* Item 2: SWAT Heavy Carrier (Lv 4 Unlock) */}
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded flex flex-col justify-between relative overflow-hidden">
                {state.level < 4 && (
                  <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center text-xs text-amber-400 font-bold">
                    <Lock className="w-5 h-5 mb-1" /> UNLOCKS AT LEVEL 4
                  </div>
                )}
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold text-neutral-200">SWAT CARRIER (POLICE)</span>
                    <span className="text-amber-400 font-bold">$2,800</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-3">รถหุ้มเกราะหนา บรรจุเจ้าหน้าที่ SWAT 6 นาย สำหรับเหตุ SEV 6-8</p>
                </div>
                <button 
                  onClick={() => dispatch({ 
                    type: 'BUY_SHOP_ITEM', 
                    payload: { id: 'SWAT_CARRIER', cost: 2800, category: 'vehicle', itemKey: 'policeVehicles' } 
                  })}
                  disabled={state.funds < 2800}
                  className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-bold py-2 rounded transition"
                >
                  PURCHASE VEHICLE
                </button>
              </div>

              {/* Item 3: Heavy Duty Tactical Armor */}
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded flex flex-col justify-between">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold text-neutral-200">TACTICAL VEST UPGRADE</span>
                    <span className="text-amber-400 font-bold">$800</span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-3">ลดอัตราการบาดเจ็บของเจ้าหน้าที่ตำรวจลง 15%</p>
                </div>
                <button 
                  onClick={() => dispatch({ 
                    type: 'BUY_SHOP_ITEM', 
                    payload: { id: 'HEAVY_VEST', cost: 800, category: 'armor', itemKey: 'hasArmorVest' } 
                  })}
                  disabled={state.funds < 800 || state.inventory.hasArmorVest}
                  className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-bold py-2 rounded transition"
                >
                  {state.inventory.hasArmorVest ? 'PURCHASED' : 'PURCHASE UPGRADE'}
                </button>
              </div>
            </div>
          </div>

          {/* Start Shift Action */}
          <div className="border-t border-neutral-800 pt-4 flex justify-between items-center">
            <span className="text-xs text-neutral-400">SHIFT READY: 15-20 INCIDENTS SCHEDULED</span>
            <button 
              onClick={() => dispatch({ type: 'START_SHIFT' })}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-2.5 rounded text-xs tracking-wider flex items-center gap-2 transition"
            >
              <Zap className="w-4 h-4 fill-current" /> START SHIFT #{state.shift}
            </button>
          </div>
        </main>
      ) : (
        /* PHASE 2: ACTIVE SHIFT MAIN SCREEN */
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANEL [25%]: LIVE CHAT & CALLER LOG */}
          <section className="w-[28%] bg-neutral-900/60 border-r border-neutral-800 flex flex-col">
            <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80">
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold animate-pulse">● LIVE</span>
                <span className="text-neutral-400">{activeIncident?.id || 'INCIDENT'}</span>
              </div>
              <span className="bg-red-950 text-red-400 px-2 py-0.5 text-xs border border-red-800 font-bold">
                SEV {activeIncident?.severity || 7}
              </span>
            </div>

            {/* Chat Logs Window */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {state.chatLogs.map((log, index) => (
                <div key={index} className={
                  log.sender === 'SYSTEM' ? 'border-l-2 border-dashed border-neutral-600 pl-2 text-neutral-500' :
                  log.sender === 'CALLER' ? 'border-l-2 border-amber-500 pl-2 bg-amber-950/20 p-2 rounded-r text-amber-100' :
                  'bg-cyan-950/40 border border-cyan-800/50 p-2 rounded text-cyan-200'
                }>
                  <span className="font-bold block mb-0.5 text-[10px] text-neutral-400">{log.sender}:</span>
                  {log.text}
                </div>
              ))}
            </div>

            {/* Choice Panel & Countdown Bar */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-amber-400">
                  <span>TIME REMAINING</span>
                  <span>{state.timer.toFixed(1)}s</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-100"
                    style={{ width: `${(state.timer / (activeIncident?.initialTimeLimit || 5)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                {currentStep?.choices?.map((choice) => (
                  <button 
                    key={choice.id}
                    onClick={() => dispatch({ 
                      type: 'SELECT_CHOICE', 
                      payload: { choice, soundController: SoundController } 
                    })}
                    className="w-full text-left p-2 rounded bg-neutral-800 hover:bg-cyan-950 hover:border-cyan-500 border border-neutral-700 text-xs transition flex justify-between items-center"
                  >
                    <span className="line-clamp-2">{choice.text}</span>
                    <span className="text-[10px] bg-neutral-900 text-cyan-400 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{choice.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Caller Data Panel */}
            <div className="p-3 border-t border-neutral-800 bg-black/40 text-[11px] grid grid-cols-2 gap-2 text-neutral-400">
              <div>NAME: <span className="text-neutral-200">{state.callerData.name}</span></div>
              <div>RISK: <span className="text-red-400">{state.callerData.risk}</span></div>
              <div className="col-span-2 flex justify-between">
                <span>TARGET COORD:</span>
                <span className="text-cyan-400 font-bold">
                  [{state.callerData.coords[0]}] [{state.callerData.coords[1]}] [{state.callerData.coords[2]}]
                </span>
              </div>
            </div>
          </section>

          {/* RIGHT PANELS */}
          <div className="flex-1 flex flex-col">
            
            {/* TACTICAL MAP & CONSOLE */}
            <section className="flex-1 bg-neutral-950 relative border-b border-neutral-800 flex flex-col">
              <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center">
                <div className="absolute w-72 h-72 border border-cyan-500/30 rounded-full animate-ping opacity-25"></div>
                <div className="absolute w-48 h-48 border border-cyan-400/50 rounded-full flex items-center justify-center">
                  <Crosshair className="w-6 h-6 text-cyan-400 opacity-60" />
                </div>

                <div 
                  onClick={() => state.coordStatus === 'VERIFIED' && dispatch({ type: 'DISPATCH_UNIT' })}
                  className="absolute top-1/3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-950/90 border border-red-500 text-red-200 px-3 py-1.5 rounded text-xs cursor-pointer hover:scale-105 transition shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="font-bold">INCIDENT SEV-7</div>
                    <div className="text-[9px] text-red-300">CLICK TO DISPATCH</div>
                  </div>
                </div>

                {state.dispatchedUnit && (
                  <div className={`absolute bottom-1/3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded text-xs border ${
                    state.dispatchedUnit.status === 'EN_ROUTE' 
                      ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
                      : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  }`}>
                    <Navigation className="w-4 h-4" />
                    <span>{state.dispatchedUnit.name} [{state.dispatchedUnit.status}]</span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 bg-neutral-900/90 border border-neutral-800 p-2 rounded text-[11px] text-amber-400">
                  ⚠️ RESTRICTION: {activeIncident?.streetRestriction}
                </div>
              </div>

              {state.radioBriefingActive ? (
                <div className="h-20 bg-amber-950/40 border-t-2 border-amber-500 px-4 flex flex-col justify-center gap-1.5">
                  <div className="text-xs text-amber-400 font-bold flex items-center gap-2">
                    <Radio className="w-4 h-4 animate-pulse" /> FIELD RADIO BRIEFING COMMAND (3 CHOICES):
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {activeIncident?.fieldBriefings?.map((brief) => (
                      <button
                        key={brief.id}
                        onClick={() => dispatch({ type: 'SELECT_RADIO_BRIEFING', payload: brief })}
                        className="bg-neutral-900 hover:bg-amber-900 border border-amber-700/60 hover:border-amber-400 text-amber-100 text-[11px] p-1.5 rounded text-left transition truncate"
                      >
                        {brief.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-16 bg-neutral-900/90 border-t border-neutral-800 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 font-bold">COORDINATE VERIFICATION:</span>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((idx) => (
                        <input 
                          key={idx}
                          type="text" 
                          maxLength={3} 
                          value={state.inputCoords[idx]}
                          onChange={(e) => dispatch({ 
                            type: 'SET_COORD_INPUT', 
                            payload: { index: idx, value: e.target.value } 
                          })}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          placeholder="000"
                          className="w-12 bg-black border border-neutral-700 text-center text-cyan-400 font-bold py-1 rounded focus:border-cyan-400 focus:outline-none text-xs" 
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => dispatch({ type: 'VERIFY_COORDINATES' })}
                      className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-3 py-1 rounded font-bold transition"
                    >
                      VERIFY
                    </button>
                  </div>

                  <div className="text-xs text-neutral-400">
                    IP TRACING: <span className="text-cyan-400 font-bold">{state.ipTraceProgress}%</span>
                  </div>
                </div>
              )}
            </section>

            {/* FLEET INVENTORY & DISPATCH FLOW */}
            <section className="h-56 bg-neutral-900 border-t border-neutral-800 flex flex-col">
              <div className="flex border-b border-neutral-800 text-xs">
                <button 
                  onClick={() => dispatch({ type: 'SELECT_DEPT_TAB', payload: 'police' })}
                  className={`flex-1 py-2 flex items-center justify-center gap-2 border-r border-neutral-800 ${
                    state.activeDeptTab === 'police' ? 'bg-neutral-800 text-cyan-400 font-bold border-b-2 border-b-cyan-400' : 'text-neutral-400'
                  }`}
                >
                  <Shield className="w-4 h-4" /> POLICE [Q]
                </button>
                <button 
                  onClick={() => dispatch({ type: 'SELECT_DEPT_TAB', payload: 'fire' })}
                  className={`flex-1 py-2 flex items-center justify-center gap-2 border-r border-neutral-800 ${
                    state.activeDeptTab === 'fire' ? 'bg-neutral-800 text-amber-400 font-bold border-b-2 border-b-amber-400' : 'text-neutral-400'
                  }`}
                >
                  <Flame className="w-4 h-4" /> FIRE [W]
                </button>
                <button 
                  onClick={() => dispatch({ type: 'SELECT_DEPT_TAB', payload: 'medical' })}
                  className={`flex-1 py-2 flex items-center justify-center gap-2 ${
                    state.activeDeptTab === 'medical' ? 'bg-neutral-800 text-emerald-400 font-bold border-b-2 border-b-emerald-400' : 'text-neutral-400'
                  }`}
                >
                  <Ambulance className="w-4 h-4" /> MEDICAL [E]
                </button>
              </div>

              <div className="flex-1 p-3 grid grid-cols-3 gap-3">
                {['A', 'S', 'D'].map((slotKey) => (
                  <div 
                    key={slotKey}
                    onClick={() => dispatch({ type: 'SELECT_VEHICLE_SLOT', payload: slotKey })}
                    className={`border p-2.5 rounded flex flex-col justify-between cursor-pointer transition ${
                      state.selectedVehicleSlot === slotKey 
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`font-bold ${state.selectedVehicleSlot === slotKey ? 'text-cyan-400' : 'text-neutral-200'}`}>
                          {slotKey === 'A' ? 'RAPID BIKE' : slotKey === 'S' ? 'PATROL SEDAN' : 'SWAT CARRIER'}
                        </span>
                        <span className="text-neutral-500">[{slotKey}]</span>
                      </div>
                      <p className="text-[10px] text-neutral-400">ยานพาหนะพร้อมเข้าปฏิบัติการ</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-neutral-400 pt-2 border-t border-neutral-800">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-cyan-400" />
                        <span>STAFF:</span>
                        <select 
                          value={state.selectedStaffCount}
                          onChange={(e) => dispatch({ type: 'SET_STAFF_COUNT', payload: Number(e.target.value) })}
                          className="bg-black border border-neutral-700 text-cyan-400 rounded px-1 focus:outline-none"
                        >
                          <option value={1}>1 คน</option>
                          <option value={2}>2 คน</option>
                          <option value={4}>4 คน</option>
                        </select>
                      </div>
                      <span className="text-emerald-400">READY</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-10 bg-neutral-950 border-t border-neutral-800 px-3 flex justify-between items-center text-xs">
                <span className="text-neutral-400 text-[11px]">
                  {state.coordStatus === 'VERIFIED' 
                    ? 'STEP 4-5: CLICK INCIDENT MARKER ON MAP TO DISPATCH' 
                    : 'STEP 1-3: VERIFY COORDINATES BEFORE DISPATCH'}
                </span>
                <button 
                  onClick={() => dispatch({ type: 'DISPATCH_UNIT' })}
                  disabled={state.coordStatus !== 'VERIFIED'}
                  className={`font-bold px-4 py-1 rounded flex items-center gap-1 text-xs transition ${
                    state.coordStatus === 'VERIFIED' 
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer' 
                      : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" /> DISPATCH TO TARGET
                </button>
              </div>
            </section>

          </div>
        </div>
      )}
    </div>
  );
}