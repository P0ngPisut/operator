export const initialState = {
  // Progression & Economy System (Level 1-10)
  level: 1,
  xp: 0,
  xpToNextLevel: 300,
  funds: 3500,
  shift: 1,
  reputation: 100,
  lostCasesCount: 0,
  livesSaved: 0,
  livesLost: 0,
  isGameOver: false,
  gameOverReason: null,

  // Game Phases: 'PRE_SHIFT_SHOP' | 'ACTIVE_SHIFT' | 'SHIFT_SUMMARY'
  gamePhase: 'PRE_SHIFT_SHOP',

  // Shop Inventory & Purchased Items
  inventory: {
    policeVehicles: ['RAPID_BIKE'], // ได้เริ่มต้น 1 คัน
    fireVehicles: ['MINI_PUMPER'],
    medicalVehicles: ['RAPID_AMBULANCE'],
    policeStaffCount: 2,
    fireStaffCount: 2,
    medicalStaffCount: 2,
    hasArmorVest: false
  },

  // Current Active Shift Incident State
  activeIncident: null,
  currentStepId: null,
  chatLogs: [],
  timer: 0,
  isTimerActive: false,
  ipTraceProgress: 0,
  callerData: {
    name: 'UNVERIFIED',
    risk: 'UNKNOWN',
    type: 'PENDING',
    coordsUnlocked: false,
    coords: ['---', '---', '---'],
  },

  inputCoords: ['', '', ''],
  coordStatus: 'IDLE',
  activeDeptTab: 'police',
  selectedVehicleSlot: 'A',
  selectedStaffCount: 1,
  dispatchedUnit: null,
  radioBriefingActive: false,
  briefingCompleted: false,
};

export function gameReducer(state, action) {
  switch (action.type) {
    // ---------------- Pre-Shift Shop Actions ----------------
    case 'BUY_SHOP_ITEM': {
      const { id, cost, category, itemKey } = action.payload;
      if (state.funds < cost) return state;

      const newFunds = state.funds - cost;
      const updatedInv = { ...state.inventory };

      if (category === 'vehicle') {
        updatedInv[itemKey] = [...updatedInv[itemKey], id];
      } else if (category === 'staff') {
        updatedInv[itemKey] += 1;
      } else if (category === 'armor') {
        updatedInv.hasArmorVest = true;
      }

      return {
        ...state,
        funds: newFunds,
        inventory: updatedInv
      };
    }

    case 'START_SHIFT': {
      return {
        ...state,
        gamePhase: 'ACTIVE_SHIFT',
        reputation: 100,
        lostCasesCount: 0
      };
    }

    // ---------------- Active Shift Core Actions ----------------
    case 'START_INCIDENT': {
      const inc = action.payload;
      const firstStep = inc.dialogueTree[0];
      return {
        ...state,
        activeIncident: inc,
        currentStepId: firstStep.id,
        timer: inc.initialTimeLimit,
        isTimerActive: true,
        ipTraceProgress: 0,
        coordStatus: 'IDLE',
        inputCoords: ['', '', ''],
        dispatchedUnit: null,
        radioBriefingActive: false,
        briefingCompleted: false,
        callerData: {
          name: inc.callerName,
          risk: inc.riskLevel,
          type: inc.incidentType,
          coordsUnlocked: false,
          coords: ['---', '---', '---'],
        },
        chatLogs: [
          { sender: 'SYSTEM', text: `[SYSTEM] CALL INCOMING... SIGNAL TRACED TO CHANNEL ${inc.channel}` },
          { sender: 'CALLER', text: firstStep.callerText }
        ]
      };
    }

    case 'TICK_TIMER': {
      if (!state.isTimerActive || state.timer <= 0) return state;
      const nextTime = Math.max(0, state.timer - 0.1);
      if (nextTime === 0) {
        return handleLostCase(state, 'TIMEOUT: ผู้แจ้งตัดสายเนื่องจากตอบสนองช้าเกินไป');
      }
      return { ...state, timer: parseFloat(nextTime.toFixed(1)) };
    }

    case 'SELECT_DEPT_TAB':
      return { ...state, activeDeptTab: action.payload };

    case 'SELECT_VEHICLE_SLOT':
      return { ...state, selectedVehicleSlot: action.payload };

    case 'SET_STAFF_COUNT':
      return { ...state, selectedStaffCount: action.payload };

    case 'SELECT_CHOICE': {
      const { choice, soundController } = action.payload;
      const inc = state.activeIncident;

      if (soundController) {
        soundController.playRadioBeep();
        soundController.playRadioStatic();
      }

      const newIpProgress = Math.min(100, state.ipTraceProgress + choice.ipTraceGain);
      const coordsUnlocked = state.callerData.coordsUnlocked || choice.revealCoords || newIpProgress >= 100;
      const updatedCoords = coordsUnlocked ? inc.targetCoords : ['---', '---', '---'];

      if (choice.triggerLost) {
        return handleLostCase(state, 'PANIC OVERFLOW: ผู้แจ้งเหตุสติแตกและตัดสายทิ้ง');
      }

      const newLogs = [...state.chatLogs, { sender: 'DISPATCHER', text: choice.text }];
      const nextStep = inc.dialogueTree.find(s => s.id === choice.nextStep);
      if (nextStep) {
        newLogs.push({ sender: 'CALLER', text: nextStep.callerText });
      }

      return {
        ...state,
        ipTraceProgress: newIpProgress,
        currentStepId: choice.nextStep,
        timer: inc.initialTimeLimit,
        chatLogs: newLogs,
        callerData: {
          ...state.callerData,
          coordsUnlocked,
          coords: updatedCoords,
        },
        inputCoords: coordsUnlocked ? inc.targetCoords : state.inputCoords,
      };
    }

    case 'SET_COORD_INPUT': {
      const newCoords = [...state.inputCoords];
      newCoords[action.payload.index] = action.payload.value;
      return { ...state, inputCoords: newCoords };
    }

    case 'VERIFY_COORDINATES': {
      const { targetCoords } = state.activeIncident;
      const [b, s, u] = state.inputCoords;
      const isExactMatch = b === targetCoords[0] && s === targetCoords[1] && u === targetCoords[2];

      if (isExactMatch) {
        return {
          ...state,
          coordStatus: 'VERIFIED',
          chatLogs: [
            ...state.chatLogs,
            { sender: 'SYSTEM', text: `[SYSTEM] COORDINATES VERIFIED: [${b}] [${s}] [${u}]` }
          ]
        };
      } else {
        const fine = 300;
        const updatedFunds = state.funds - fine;
        const bankruptcy = updatedFunds < 0;

        return {
          ...state,
          funds: updatedFunds,
          coordStatus: 'FAILED_NEAR',
          isGameOver: bankruptcy,
          gameOverReason: bankruptcy ? 'BANKRUPTCY' : state.gameOverReason,
          chatLogs: [
            ...state.chatLogs,
            { sender: 'SYSTEM', text: `[ERROR] INVALID COORDINATES! PENALTY FINE: -$${fine}` }
          ]
        };
      }
    }

    case 'DISPATCH_UNIT': {
      if (state.coordStatus !== 'VERIFIED') return state;

      const unitName = `${state.activeDeptTab.toUpperCase()} (${state.selectedVehicleSlot})`;
      return {
        ...state,
        dispatchedUnit: {
          dept: state.activeDeptTab,
          slot: state.selectedVehicleSlot,
          staffCount: state.selectedStaffCount,
          status: 'EN_ROUTE',
          name: unitName
        },
        chatLogs: [
          ...state.chatLogs,
          { sender: 'SYSTEM', text: `[DISPATCH] UNIT ${unitName} EN ROUTE TO TARGET LOCATION...` }
        ]
      };
    }

    case 'ARRIVE_ON_SCENE': {
      return {
        ...state,
        dispatchedUnit: { ...state.dispatchedUnit, status: 'ON_SCENE' },
        radioBriefingActive: true,
        chatLogs: [
          ...state.chatLogs,
          { sender: 'SYSTEM', text: `[RADIO] UNIT ARRIVED AT SCENE. AWAITING FIELD BRIEFING COMMAND...` }
        ]
      };
    }

    // ---------------- XP Formula & End Shift Calculations ----------------
    case 'SELECT_RADIO_BRIEFING': {
      const briefing = action.payload;
      const isSuccess = briefing.outcome === 'SUCCESS';
      const reward = isSuccess ? 1000 : 400;
      const updatedFunds = state.funds + reward;
      
      // XP Formula Calculation: Success Rate % * 100 + Lives Saved * 50
      const earnedXP = isSuccess ? 150 : 50;
      let newXp = state.xp + earnedXP;
      let newLevel = state.level;
      let newXpToNext = state.xpToNextLevel;

      // Level Up Logic (Max Level 10)
      if (newXp >= state.xpToNextLevel && state.level < 10) {
        newLevel += 1;
        newXp -= state.xpToNextLevel;
        newXpToNext = Math.floor(state.xpToNextLevel * 1.5);
      }

      return {
        ...state,
        funds: updatedFunds,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        livesSaved: state.livesSaved + 1,
        radioBriefingActive: false,
        briefingCompleted: true,
        isTimerActive: false,
        chatLogs: [
          ...state.chatLogs,
          { sender: 'DISPATCHER', text: `[RADIO BRIEFING] ${briefing.text}` },
          { sender: 'SYSTEM', text: `[BRIEFING SUCCESS] ภารกิจเสร็จสิ้น! +$${reward} | Earned +${earnedXP} XP` }
        ]
      };
    }

    case 'TRIGGER_LOST_CASE':
      return handleLostCase(state, action.payload.reason);

    default:
      return state;
  }
}

function handleLostCase(state, reason) {
  const penaltyFine = 500;
  const newFunds = state.funds - penaltyFine;
  const newReputation = Math.max(0, state.reputation - 25);
  const newLostCount = state.lostCasesCount + 1;

  const bankruptcy = newFunds < 0;
  const reputationCollapse = newReputation <= 0 || newLostCount >= 3;

  return {
    ...state,
    funds: newFunds,
    reputation: newReputation,
    lostCasesCount: newLostCount,
    isTimerActive: false,
    isGameOver: bankruptcy || reputationCollapse,
    gameOverReason: bankruptcy ? 'BANKRUPTCY' : (reputationCollapse ? 'REPUTATION_COLLAPSE' : null),
    chatLogs: [
      ...state.chatLogs,
      { sender: 'SYSTEM', text: `[LOST CASE] ${reason} | FINE: -$${penaltyFine} | REPUTATION -25%` }
    ]
  };
}