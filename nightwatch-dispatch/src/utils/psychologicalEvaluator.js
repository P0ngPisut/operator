const COORDINATE_LABELS = ['BLOCK', 'SECTOR', 'UNIT'];

const TONE_RULES = [
  {
    tone: 'PRESSURING',
    pattern: /บอกพิกัด(?:มา|เดี๋ยวนี้|ตอนนี้|ให้ได้)|บอกตำแหน่ง(?:มา|เดี๋ยวนี้|ตอนนี้|ให้ได้)|บอกมา|ตอบมา|ทำไมไม่|ถ้าไม่|อย่าชักช้า|เร็วเข้า|รีบ(?:บอก|ทำ|ตอบ)|ต้องบอก|หุบปาก|กวนประสาท|เร็วๆ สิ/,
    panicDelta: 20,
  },
  {
    tone: 'ASKING_LOCATION',
    pattern: /อยู่(?:ที่ไหน|ตรงไหน|แถวไหน)|ที่อยู่|พิกัด|บอกตำแหน่ง|ตำแหน่ง|จุดเกิดเหตุ|ซอยไหน|ถนนอะไร|บ้านเลขที่|สังเกตเห็นอะไร|มองเห็นป้าย|รอบตัวมีอะไร/,
    panicDelta: 5,
  },
  {
    tone: 'EMPATHETIC',
    pattern: /หายใจ|ใจเย็น|ปลอดภัย|ผมอยู่|ฉันอยู่|เข้าใจ|ไม่เป็นไร|ตั้งสติ|อยู่กับคุณ|ไม่ต้องกลัว|จะช่วย|อยู่ตรงนี้|ฟังผม|ฟังสิ|ปลอดภัยแล้ว|ช่วยเหลืออยู่/,
    panicDelta: -25,
  },
  {
    tone: 'FIRM_INSTRUCTION',
    pattern: /ล็อกประตู|กดแผล|ปิดไฟ|หมอบ|ถอย|อย่าขยับ|ออกจาก|ไปที่|เปิดประตู|ปิดประตู|ทำตาม|ห้ามเคลื่อนย้าย|กั้นพื้นที่|อยู่ห่าง|ปิดแก๊ส|หาที่หลบ|คลุมผ้า/,
    panicDelta: -18,
  },
];

export function evaluateDispatcherInput({ callerState, dispatcherInput }) {
  const input = String(dispatcherInput || '').trim();
  const matchedRule = TONE_RULES.find(({ pattern }) => pattern.test(input));
  const toneEvaluated = matchedRule?.tone || 'VAGUE';
  const panicDelta = matchedRule?.panicDelta ?? 5;
  const severity = callerState.severity || 1;

  // Panic threshold to reveal location depends on severity (SEV 1-8)
  // Higher severity callers panic more easily and need lower panic to articulate their address
  const panicThreshold = Math.max(40, 70 - (severity * 3));

  const newPanic = Math.max(0, Math.min(100, callerState.currentPanic + panicDelta));
  const isAskingLocation = toneEvaluated === 'ASKING_LOCATION' || /ที่อยู่|พิกัด|ตำแหน่ง|ตรงไหน|ที่ไหน/.test(input);

  let revealedCoords = [...callerState.revealedCoords];
  let locationDiscovered = callerState.coordsUnlocked || false;
  let callerResponse = '';

  if (newPanic >= 100) {
    callerResponse = 'ฉัน...ทนไม่ไหวแล้ว! ช่วยฉันด้วย!! [เสียงโทรศัพท์ตกกระแทกพื้น]';
  } else if (newPanic >= 80) {
    callerResponse = severity >= 6
      ? 'ฮือ... ฉันกลัวมาก! เสียงระเบิดกับเปลวไฟมันล้อมไว้หมดแล้ว ฉันมองอะไรไม่เห็นเลย!'
      : 'ฉันกลัวจนตัวสั่นไปหมดแล้ว... ทำไมยังไม่มีใครมา ช่วยด้วยเถอะ!';
  } else if (isAskingLocation) {
    if (newPanic <= panicThreshold) {
      locationDiscovered = true;
      revealedCoords = [...callerState.targetCoords];
      callerResponse = `ฉันเห็นป้ายบอกพิกัดแถวนี้แล้วค่ะ! อยู่ที่ [BLOCK ${callerState.targetCoords[0]}] [SECTOR ${callerState.targetCoords[1]}] [UNIT ${callerState.targetCoords[2]}] รีบส่งคนมาช่วยด้วยนะคะ!`;
    } else {
      callerResponse = severity >= 5
        ? 'ฉันมองไม่ชัดเลย... ควันกับความมืดมันบังไปหมด ขอตั้งสติสักครู่ค่ะ...'
        : 'รอบข้างมันวุ่นวายมาก... ฉันพยายามนึกอยู่ ใจมันสั่นไปหมด!';
    }
  } else {
    const responses = {
      EMPATHETIC: 'ขอบคุณค่ะ... ฉันจะพยายามหายใจลึกๆ และหลบอยู่ในจุดที่ปลอดภัย',
      FIRM_INSTRUCTION: 'เข้าใจแล้วค่ะ ฉันทำตามที่บอกแล้วและจะไม่ขยับออกไปไหน',
      PRESSURING: 'อย่าเพิ่งตะคอกได้ไหมคะ! ฉันก็กำลังกลัวจนทำอะไรไม่ถูกเหมือนกัน!',
      VAGUE: 'ขอโทษนะคะ ฉันฟังไม่ค่อยถนัด ช่วยบอกอีกทีได้ไหมคะ',
    };
    callerResponse = responses[toneEvaluated] || responses.VAGUE;

    // If panic is low enough after calming words, caller might volunteer location info
    if (newPanic <= 35 && !locationDiscovered) {
      locationDiscovered = true;
      revealedCoords = [...callerState.targetCoords];
      callerResponse += ` อ้อ! ฉันเห็นเสาบอกเลขพิกัดแล้วค่ะ อยู่ที่ [BLOCK ${callerState.targetCoords[0]}] [SECTOR ${callerState.targetCoords[1]}] [UNIT ${callerState.targetCoords[2]}]`;
    }
  }

  const isLostCase = newPanic >= 100;
  const systemLog = `[PSYCH EVAL] ${toneEvaluated} (SEV ${severity}) | PANIC ${callerState.currentPanic}% -> ${newPanic}% | ${locationDiscovered ? 'LOCATION REVEALED!' : 'LOCATION LOCKED'}`;

  return {
    panicDelta,
    ipTraceAdd: 10,
    newPanic,
    toneEvaluated,
    callerResponse,
    revealedCoords,
    locationDiscovered,
    isLostCase,
    systemLog,
  };
}