import test from 'node:test';
import assert from 'node:assert/strict';
import { generateIncidents } from '../src/data/incidents.js';
import { VEHICLE_CATALOG } from '../src/data/vehicles.js';
import { gameReducer, initialState } from '../src/context/gameReducer.js';

test('a level-one shift only generates incidents within the unlocked severity range', () => {
  const incidents = generateIncidents(15, 1);

  assert.equal(incidents.length, 15);
  assert.ok(incidents.every((incident) => incident.severity <= 5));
  assert.ok(incidents.every((incident) => incident.minLevel === 1));
  assert.ok(incidents.every((incident) => (
    incident.worldPosition.x >= 0
    && incident.worldPosition.x <= 10000
    && incident.worldPosition.y >= 0
    && incident.worldPosition.y <= 10000
  )));
});

test('a verified incident dispatches by A*, arrives, resolves, and ends the shift', () => {
  const incident = generateIncidents(1, 1)[0];
  let state = gameReducer(initialState, {
    type: 'START_SHIFT',
    payload: { incidents: [incident] },
  });
  state = gameReducer(state, { type: 'LOAD_NEXT_INCIDENT' });

  incident.targetCoords.forEach((value, index) => {
    state = gameReducer(state, { type: 'SET_COORD_INPUT', payload: { index, value } });
  });
  state = gameReducer(state, { type: 'VERIFY_COORDINATES' });
  assert.equal(state.coordStatus, 'VERIFIED');
  state = gameReducer(state, { type: 'SELECT_DEPT_TAB', payload: incident.deptCategory });

  state = gameReducer(state, {
    type: 'DISPATCH_UNIT',
    payload: { vehicle: VEHICLE_CATALOG[incident.deptCategory].A },
  });
  assert.equal(state.dispatchedUnit.status, 'EN_ROUTE');
  assert.ok(state.dispatchedUnit.route.points.length > 1);
  assert.ok(state.dispatchedUnit.travelTimeSec > 0);

  state = gameReducer(state, {
    type: 'ADVANCE_UNIT',
    payload: state.dispatchedUnit.travelTimeSec / 60,
  });
  assert.equal(state.dispatchedUnit.status, 'ON_SCENE');
  assert.equal(state.radioBriefingActive, true);

  state = gameReducer(state, {
    type: 'SELECT_RADIO_BRIEFING',
    payload: incident.fieldBriefings.find((briefing) => briefing.outcome === 'SUCCESS'),
  });
  assert.equal(state.casesCompleted, 1);
  assert.equal(state.successfulCases, 1);
  assert.equal(state.livesSaved, 1);
  assert.equal(state.gamePhase, 'SHIFT_SUMMARY');
});

test('a lost case advances to the next queued incident without leaving conversation open', () => {
  const [firstIncident, secondIncident] = generateIncidents(2, 1);
  let state = gameReducer(initialState, {
    type: 'START_SHIFT',
    payload: { incidents: [firstIncident, secondIncident] },
  });
  state = gameReducer(state, { type: 'LOAD_NEXT_INCIDENT' });
  state = gameReducer(state, { type: 'TRIGGER_LOST_CASE', payload: { reason: 'TEST LOSS' } });

  assert.equal(state.activeIncident, null);
  assert.equal(state.callerConversationActive, false);
  assert.equal(state.casesCompleted, 1);
  assert.equal(state.incidentQueue.length, 1);
  state = gameReducer(state, { type: 'LOAD_NEXT_INCIDENT' });
  assert.equal(state.activeIncident.id, secondIncident.id);
});

test('reassuring the caller to stay on the line advances signal trace', () => {
  const incident = generateIncidents(1, 1)[0];
  let state = gameReducer(initialState, { type: 'START_INCIDENT', payload: incident });
  state = gameReducer(state, {
    type: 'SUBMIT_DISPATCHER_INPUT',
    payload: 'หายใจช้า ๆ ผมอยู่กับคุณ อย่าเพิ่งวางสาย ระบบกำลังติดตามสัญญาณ',
  });

  assert.equal(state.currentPanic, 25);
  assert.equal(state.ipTraceProgress, 35);
  assert.ok(state.chatLogs.at(-1).text.includes('TRACE +35%'));
});