import { evaluateDispatcherInput } from '../utils/psychologicalEvaluator.js';
import { findRouteBetweenWorldPoints } from '../pathfinding/astar.js';
import { BASE_LOCATIONS, VEHICLE_CATALOG } from '../data/vehicles.js';
import { CITY } from '../data/map/city.js';

const SIMULATION_SPEED = 60;

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
  staffInjuredCount: 0,
  casesCompleted: 0,
  successfulCases: 0,
  incidentQueue: [],
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
  mapViewport: { x: CITY.widthM / 2, y: CITY.heightM / 2, zoom: 1.3 },
  mapSelection: { districtId: null, sectorId: null, blockId: null, incidentId: null, unitId: null },
  chatLogs: [],
  callerConversationActive: false,
  ipTraceProgress: 0,
  traceElapsed: 0,
  pendingCallerReply: null,
  currentPanic: 45,
  callerData: {
    name: 'UNVERIFIED',
    risk: 'UNKNOWN',
    type: 'PENDING',
    coordsUnlocked: false,
    locationSource: null,
    coords: ['???', '???', '???'],
  },

  inputCoords: ['', '', ''],
  coordStatus: 'IDLE',
  addressElapsedSec: 0,
  travelElapsedSec: 0,
  coordTargetPosition: null,
  unitPosition: null,
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
      const { id, cost, category, itemKey, minLevel = 1 } = action.payload;
      if (state.funds < cost || state.level < minLevel) return state;

      const newFunds = state.funds - cost;
      const updatedInv = { ...state.inventory };

      if (category === 'vehicle') {
        if (updatedInv[itemKey]?.includes(id)) return state;
        updatedInv[itemKey] = [...updatedInv[itemKey], id];
      } else if (category === 'staff') {
        if (updatedInv[itemKey] >= (action.payload.limit || 12)) return state;
        updatedInv[itemKey] += 1;
      } else if (category === 'armor') {
        if (updatedInv.hasArmorVest) return state;
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
        lostCasesCount: 0,
        isGameOver: false,
        gameOverReason: null,
        incidentQueue: action.payload?.incidents || [],
        activeIncident: null,
        dispatchedUnit: null,
        radioBriefingActive: false,
        callerConversationActive: false,
        casesCompleted: 0,
        successfulCases: 0,
        staffInjuredCount: 0,
      };
    }

    case 'PREPARE_NEXT_SHIFT':
      return {
        ...state,
        shift: state.shift + 1,
        gamePhase: 'PRE_SHIFT_SHOP',
        activeIncident: null,
        incidentQueue: [],
        dispatchedUnit: null,
        radioBriefingActive: false,
        callerConversationActive: false,
      };

    // ---------------- Active Shift Core Actions ----------------
    case 'START_INCIDENT': {
      return startIncident(state, action.payload);
    }

    case 'LOAD_NEXT_INCIDENT': {
      if (state.isGameOver || state.activeIncident) return state;
      const incidentQueue = state.incidentQueue || [];
      if (incidentQueue.length === 0) {
        return { ...state, gamePhase: 'SHIFT_SUMMARY' };
      }

      const [nextIncident, ...remainingIncidents] = incidentQueue;
      return startIncident({ ...state, incidentQueue: remainingIncidents }, nextIncident);
    }

    case 'SUBMIT_DISPATCHER_INPUT': {
      const dispatcherMessage = typeof action.payload === 'string' ? action.payload : action.payload.message;
      if (!state.activeIncident || !state.callerConversationActive || state.pendingCallerReply || !dispatcherMessage?.trim()) return state;

      const evaluation = evaluateDispatcherInput({
        callerState: {
          name: state.callerData.name,
          incidentType: state.callerData.type,
          severity: state.activeIncident.severity,
          currentPanic: state.currentPanic,
          targetCoords: state.activeIncident.targetCoords,
          revealedCoords: state.callerData.coords,
          history: state.chatLogs,
        },
        dispatcherInput: dispatcherMessage,
      });
      const evaluatedState = {
        ...state,
        currentPanic: evaluation.newPanic,
        ipTraceProgress: state.ipTraceProgress,
        callerData: {
          ...state.callerData,
          coords: evaluation.revealedCoords,
          coordsUnlocked: evaluation.revealedCoords.every((coordinate, index) => (
            coordinate === state.activeIncident.targetCoords[index]
          )) || state.callerData.coordsUnlocked,
          locationSource: evaluation.locationDiscovered && !state.callerData.coordsUnlocked
            ? 'CALLER'
            : state.callerData.locationSource,
        },
        chatLogs: [
          ...state.chatLogs,
          { sender: 'DISPATCHER', text: dispatcherMessage },
          { sender: 'SYSTEM', text: evaluation.systemLog },
        ],
        pendingCallerReply: typeof action.payload === 'string' ? evaluation.callerResponse : action.payload.callerResponse || evaluation.callerResponse,
        callerConversationActive: false,
      };

      return evaluation.isLostCase
        ? handleLostCase(evaluatedState, 'PANIC OVERFLOW: ผู้แจ้งเหตุช็อกและตัดสายทิ้ง')
        : evaluatedState;
    }

    case 'REVEAL_CALLER_REPLY':
      if (!state.pendingCallerReply) return state;
      return { ...state, pendingCallerReply: null, callerConversationActive: true,
        chatLogs: [...state.chatLogs, { sender: 'CALLER', text: state.pendingCallerReply }] };

    case 'OVERRIDE_CALLER_REPLY':
      return state.pendingCallerReply ? { ...state, pendingCallerReply: action.payload } : state;

    case 'ADVANCE_SIGNAL_TRACE': {
      if (!state.activeIncident || state.ipTraceProgress >= 100 || !state.callerConversationActive || state.callerData.coordsUnlocked) return state;
      const traceElapsed = Math.min(150, state.traceElapsed + action.payload);
      const ipTraceProgress = Math.floor(traceElapsed / 150 * 100);
      if (traceElapsed < 150) return { ...state, traceElapsed, ipTraceProgress };
      const coords = [...(state.activeIncident.traceCoords || state.activeIncident.targetCoords)];
      return { ...state, traceElapsed, ipTraceProgress, callerData: { ...state.callerData, coords, coordsUnlocked: true, locationSource: 'IP_TRACE' },
        chatLogs: [...state.chatLogs, { sender: 'SYSTEM', text: '[SIGNAL TRACE] Approximate coordinates randomized within a 500 m radius. Enter all three coordinates.' }] };
    }

    case 'SELECT_DEPT_TAB': {
      const department = action.payload;
      const vehicle = VEHICLE_CATALOG[department]?.A;
      const availableStaff = state.inventory[`${department}StaffCount`] || 0;
      return {
        ...state,
        activeDeptTab: department,
        selectedVehicleSlot: 'A',
        selectedStaffCount: Math.min(vehicle?.crewMin || 1, availableStaff || 1),
      };
    }

    case 'SELECT_VEHICLE_SLOT': {
      const vehicle = VEHICLE_CATALOG[state.activeDeptTab]?.[action.payload];
      const availableStaff = state.inventory[`${state.activeDeptTab}StaffCount`] || 0;
      return {
        ...state,
        selectedVehicleSlot: action.payload,
        selectedStaffCount: Math.min(vehicle?.crewMin || 1, availableStaff || 1),
      };
    }

    case 'SET_STAFF_COUNT': {
      const vehicle = VEHICLE_CATALOG[state.activeDeptTab]?.[state.selectedVehicleSlot];
      const availableStaff = state.inventory[`${state.activeDeptTab}StaffCount`] || 0;
      const maximumStaff = Math.min(vehicle?.crewMax || 1, availableStaff);
      if (maximumStaff < (vehicle?.crewMin || 1)) return state;
      return {
        ...state,
        selectedStaffCount: Math.max(vehicle.crewMin, Math.min(action.payload, maximumStaff)),
      };
    }

    case 'SET_MAP_VIEWPORT':
      return { ...state, mapViewport: { ...state.mapViewport, ...action.payload } };

    case 'SET_MAP_SELECTION':
      return { ...state, mapSelection: { ...state.mapSelection, ...action.payload } };

    case 'SET_COORD_INPUT': {
      const newCoords = [...state.inputCoords];
      newCoords[action.payload.index] = action.payload.value;
      return { ...state, inputCoords: newCoords };
    }

    case 'ADVANCE_ADDRESS_TIMER': {
      if (!state.activeIncident || state.activeIncident.severity > 5 || !state.callerData.coordsUnlocked || state.coordStatus === 'VERIFIED') return state;
      const addressElapsedSec = state.addressElapsedSec + action.payload;
      if (addressElapsedSec < 20) return { ...state, addressElapsedSec };
      return handleLostCase({ ...state, addressElapsedSec: 20 }, 'ADDRESS ENTRY TIMEOUT: COORDINATES NOT VERIFIED WITHIN 20 SECONDS');
    }

    case 'VERIFY_COORDINATES': {
      if (!state.callerData.coordsUnlocked) return state;
      const { targetCoords } = state.activeIncident;
      const [b, s, u] = state.inputCoords;
      const expectedCoords = state.callerData.locationSource === 'IP_TRACE'
        ? (state.activeIncident.traceCoords || targetCoords)
        : targetCoords;
      const isExactMatch = b === expectedCoords[0] && s === expectedCoords[1] && u === expectedCoords[2];
      const wrongAddressPosition = coordinateAddressToWorld(state.inputCoords);
      const coordTargetPosition = isExactMatch
        ? (state.callerData.locationSource === 'IP_TRACE'
          ? (state.activeIncident.tracePosition || state.activeIncident.worldPosition)
          : state.activeIncident.worldPosition)
        : wrongAddressPosition;
      const fine = isExactMatch ? 0 : 300;
      const updatedFunds = state.funds - fine;
      const bankruptcy = updatedFunds < 0;
      return {
        ...state,
        funds: updatedFunds,
        isGameOver: bankruptcy,
        gameOverReason: bankruptcy ? 'BANKRUPTCY' : state.gameOverReason,
        coordStatus: 'VERIFIED',
        coordTargetPosition,
        verifiedAddressMatch: isExactMatch,
        ipTraceProgress: 100,
        chatLogs: [
          ...state.chatLogs,
          { sender: 'SYSTEM', text: isExactMatch
            ? `[SYSTEM] COORDINATES VERIFIED: [${b}] [${s}] [${u}]`
            : `[ERROR] ADDRESS DOES NOT MATCH. UNIT WILL SEARCH ENTERED COORDINATES [${b}] [${s}] [${u}]. PENALTY FINE: -$${fine}` }
        ]
      };
    }

    case 'DISPATCH_UNIT': {
      if (state.coordStatus !== 'VERIFIED' || !state.activeIncident || (state.dispatchedUnit && state.dispatchedUnit.status !== 'SEARCHING_RELOCATION')) return state;

      const unitName = `${state.activeDeptTab.toUpperCase()} (${state.selectedVehicleSlot})`;
      const vehicle = action.payload?.vehicle || VEHICLE_CATALOG[state.activeDeptTab]?.[state.selectedVehicleSlot];
      const inventoryKey = `${state.activeDeptTab}Vehicles`;
      const availableStaff = state.inventory[`${state.activeDeptTab}StaffCount`] || 0;
      const missingRequirements = !vehicle
        || !state.inventory[inventoryKey]?.includes(vehicle.id)
        || state.level < vehicle.minLevel
        || state.selectedStaffCount < vehicle.crewMin
        || state.selectedStaffCount > vehicle.crewMax
        || state.selectedStaffCount > availableStaff
        || (state.activeIncident.deptCategory && state.activeIncident.deptCategory !== state.activeDeptTab);

      if (missingRequirements) {
        return {
          ...state,
          chatLogs: [
            ...state.chatLogs,
            { sender: 'SYSTEM', text: `[DISPATCH BLOCKED] ตรวจสอบแผนก รถที่เป็นเจ้าของ Level และจำนวนเจ้าหน้าที่ก่อนส่ง` }
          ]
        };
      }

      const route = findRouteBetweenWorldPoints({
        start: state.unitPosition || BASE_LOCATIONS[state.activeDeptTab],
        target: state.coordTargetPosition || state.activeIncident.worldPosition,
        vehicle,
        department: state.activeDeptTab,
      });

      if (!route) {
        return {
          ...state,
          chatLogs: [
            ...state.chatLogs,
            { sender: 'SYSTEM', text: `[DISPATCH FAILED] ไม่พบเส้นทางที่รถ ${vehicle.name} ผ่านได้` }
          ]
        };
      }

      return {
        ...state,
        dispatchedUnit: {
          dept: state.activeDeptTab,
          slot: state.selectedVehicleSlot,
          staffCount: state.selectedStaffCount,
          status: 'EN_ROUTE',
          name: vehicle.name || unitName,
          vehicleId: vehicle.id,
          route,
          targetPosition: state.coordTargetPosition || state.activeIncident.worldPosition,
          elapsedSec: 0,
          progress: 0,
          travelTimeSec: route.travelTimeSec,
        },
        chatLogs: [
          ...state.chatLogs,
          { sender: 'SYSTEM', text: `[DISPATCH] ${vehicle.name} EN ROUTE · ${(route.distanceM / 1000).toFixed(1)} KM · ETA ${Math.ceil(route.travelTimeSec / 60)} MIN` }
        ]
      };
    }

    case 'ADVANCE_UNIT': {
      if (state.dispatchedUnit?.status !== 'EN_ROUTE') return state;
      const elapsedSec = state.dispatchedUnit.elapsedSec + action.payload * SIMULATION_SPEED;
      const travelElapsedSec = (state.travelElapsedSec || 0) + action.payload;
      const progress = Math.min(1, elapsedSec / Math.max(1, state.dispatchedUnit.travelTimeSec));

      if (travelElapsedSec > 30 || (travelElapsedSec >= 30 && progress < 1)) {
        return handleLostCase({ ...state, travelElapsedSec: 30 }, 'DISPATCH ARRIVED TOO LATE: 30-SECOND RESPONSE LIMIT EXCEEDED');
      }

      if (progress < 1) {
        return {
          ...state,
          dispatchedUnit: { ...state.dispatchedUnit, elapsedSec, progress },
        };
      }

      const targetPosition = state.dispatchedUnit.targetPosition || state.activeIncident.worldPosition;
      const targetErrorM = Math.hypot(
        targetPosition.x - state.activeIncident.worldPosition.x,
        targetPosition.y - state.activeIncident.worldPosition.y,
      );
      if (targetErrorM > 100) {
        const callerData = {
          ...state.callerData,
          coords: [...state.activeIncident.targetCoords],
          coordsUnlocked: true,
          locationSource: 'CALLER',
        };
        return {
          ...state,
          travelElapsedSec,
          unitPosition: targetPosition,
          dispatchedUnit: { ...state.dispatchedUnit, status: 'SEARCHING_RELOCATION', progress: 1 },
          coordStatus: 'NEEDS_RELOCATION',
          coordTargetPosition: null,
          verifiedAddressMatch: false,
          inputCoords: ['', '', ''],
          callerData,
          radioBriefingActive: false,
          callerConversationActive: false,
          chatLogs: [
            ...state.chatLogs,
            { sender: 'SYSTEM', text: `[FIELD RADIO] คลาดเป้าหมาย ${Math.round(targetErrorM)} m เกิน 100 m — แจ้งพิกัดใหม่: ${callerData.coords.join('-')}. กรอกและยืนยันพิกัดเพื่อส่งหน่วยอีกครั้ง.` }
          ]
        };
      }

      return {
        ...state,
        travelElapsedSec,
        unitPosition: targetPosition,
        dispatchedUnit: { ...state.dispatchedUnit, status: 'ON_SCENE', elapsedSec, progress: 1 },
        radioBriefingActive: true,
        callerConversationActive: false,
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
      const injuryOccurred = !isSuccess && Math.random() < (briefing.injuryRisk || 0);
      const reward = isSuccess ? 1000 : 400;
      const treatmentCost = injuryOccurred ? 1800 : 0;
      const updatedFunds = state.funds + reward - treatmentCost;
      const bankruptcy = updatedFunds < 0;
      const shiftFinished = (state.incidentQueue || []).length === 0;
      
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
        isGameOver: bankruptcy,
        gameOverReason: bankruptcy ? 'BANKRUPTCY' : state.gameOverReason,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        livesSaved: state.livesSaved + (isSuccess ? 1 : 0),
        staffInjuredCount: state.staffInjuredCount + (injuryOccurred ? 1 : 0),
        casesCompleted: state.casesCompleted + 1,
        successfulCases: state.successfulCases + (isSuccess ? 1 : 0),
        activeIncident: null,
        dispatchedUnit: null,
        coordStatus: 'IDLE',
        radioBriefingActive: false,
        briefingCompleted: true,
        callerConversationActive: false,
        gamePhase: bankruptcy ? 'GAME_OVER' : shiftFinished ? 'SHIFT_SUMMARY' : 'ACTIVE_SHIFT',
        chatLogs: [
          ...state.chatLogs,
          { sender: 'DISPATCHER', text: `[RADIO BRIEFING] ${briefing.text}` },
          { sender: 'SYSTEM', text: isSuccess
            ? `[MISSION SUCCESS] +$${reward} | Earned +${earnedXP} XP | CIVILIANS SAFE`
            : injuryOccurred
              ? `[MISSION CASUALTY] +$${reward} | MEDICAL COST -$${treatmentCost} | +${earnedXP} XP`
              : `[MISSION DELAY] +$${reward} | Earned +${earnedXP} XP` }
        ]
      };
    }

    case 'TRIGGER_LOST_CASE':
      return handleLostCase(state, action.payload.reason);

    default:
      return state;
  }
}

function startIncident(state, incident) {
  const firstStep = incident.dialogueTree?.[0];
  const conversationRequired = incident.severity >= 6;
  const locationAvailable = !conversationRequired;
  const activeDeptTab = incident.deptCategory || state.activeDeptTab;
  const startingVehicle = VEHICLE_CATALOG[activeDeptTab]?.A;
  const availableStaff = state.inventory[`${activeDeptTab}StaffCount`] || 1;

  return {
    ...state,
    activeIncident: incident,
    activeDeptTab,
    selectedVehicleSlot: 'A',
    selectedStaffCount: Math.min(startingVehicle?.crewMin || 1, availableStaff),
    mapViewport: incident.worldPosition
      ? { ...state.mapViewport, x: incident.worldPosition.x, y: incident.worldPosition.y }
      : state.mapViewport,
    mapSelection: { ...state.mapSelection, incidentId: incident.id },
    callerConversationActive: conversationRequired,
    ipTraceProgress: 0,
    traceElapsed: 0,
    pendingCallerReply: null,
    currentPanic: incident.initialPanic || 45,
    coordStatus: 'IDLE',
    addressElapsedSec: 0,
    travelElapsedSec: 0,
    coordTargetPosition: null,
    verifiedAddressMatch: false,
    unitPosition: null,
    inputCoords: ['', '', ''],
    dispatchedUnit: null,
    radioBriefingActive: false,
    briefingCompleted: false,
    callerData: {
      name: incident.callerName,
      risk: incident.riskLevel,
      type: incident.incidentType,
      coordsUnlocked: locationAvailable,
      locationSource: locationAvailable ? 'AUTO' : null,
      coords: locationAvailable ? [...incident.targetCoords] : ['???', '???', '???'],
    },
    chatLogs: [
      { sender: 'SYSTEM', text: `[SYSTEM] CALL INCOMING... SIGNAL TRACED TO CHANNEL ${incident.channel}` },
      ...(conversationRequired
        ? [{ sender: 'CALLER', text: firstStep?.callerText || incident.openingText || 'ขอความช่วยเหลือค่ะ/ครับ เกิดเหตุฉุกเฉินขึ้นที่นี่' }]
        : [{ sender: 'SYSTEM', text: '[LOW SEVERITY] Location available. Verify coordinates and dispatch the appropriate unit.' }]),
    ],
  };
}

function coordinateAddressToWorld(coords) {
  const block = Math.min(CITY.gridColumns - 1, Math.max(0, Number.parseInt(coords[0], 10) || 0));
  const sector = Math.min(CITY.gridRows - 1, Math.max(0, Number.parseInt(coords[1], 10) || 0));
  const unit = Math.min(999, Math.max(0, Number.parseInt(coords[2], 10) || 0));
  const withinX = (unit % 10) * 40 + 20;
  const withinY = (Math.floor(unit / 10) % 10) * 40 + 20;
  return {
    x: Math.min(CITY.widthM - 1, block * CITY.cellSizeM + withinX),
    y: Math.min(CITY.heightM - 1, sector * CITY.cellSizeM + withinY),
  };
}

function handleLostCase(state, reason) {
  const penaltyFine = 500;
  const newFunds = state.funds - penaltyFine;
  const newReputation = Math.max(0, state.reputation - 25);
  const newLostCount = state.lostCasesCount + 1;

  const bankruptcy = newFunds < 0;
  const reputationCollapse = newReputation <= 0 || newLostCount >= 3;
  const isGameOver = bankruptcy || reputationCollapse;
  const shiftFinished = (state.incidentQueue || []).length === 0;

  return {
    ...state,
    funds: newFunds,
    reputation: newReputation,
    lostCasesCount: newLostCount,
    casesCompleted: state.casesCompleted + 1,
    activeIncident: null,
    dispatchedUnit: null,
    radioBriefingActive: false,
    coordStatus: 'IDLE',
    callerConversationActive: false,
    isGameOver,
    gamePhase: isGameOver ? 'GAME_OVER' : shiftFinished ? 'SHIFT_SUMMARY' : 'ACTIVE_SHIFT',
    gameOverReason: bankruptcy ? 'BANKRUPTCY' : (reputationCollapse ? 'REPUTATION_COLLAPSE' : null),
    chatLogs: [
      ...state.chatLogs,
      { sender: 'SYSTEM', text: `[LOST CASE] ${reason} | FINE: -$${penaltyFine} | REPUTATION -25%` }
    ]
  };
}
