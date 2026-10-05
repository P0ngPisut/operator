export const MOCK_INCIDENTS = [
  {
    id: 'INC-9042',
    title: 'Home Intrusion (บุกรุกเคหสถาน)',
    severity: 7, // SEV 7 (วิกฤต/จิตวิทยา)
    channel: 'CH-01',
    callerName: 'สมชาย',
    riskLevel: 'HIGH (ARMED)',
    incidentType: 'HOME INTRUSION',
    targetCoords: ['019', '241', '303'],
    streetRestriction: 'ถนนแคบ 2.4m (เฉพาะรถเล็ก)',
    initialTimeLimit: 4.5, // เวลาตอบ 4.5 วินาทีต่อช้อยส์
    dialogueTree: [
      {
        id: 'step-1',
        callerText: 'ช่วยด้วยครับ! มีคนพยายามงัดประตูบ้านเข้ามา ผมหลบอยู่ในห้องน้ำ...',
        choices: [
          {
            id: 'c1',
            text: '1. "ตั้งสติไว้ครับ ล็อคประตูหรือยัง? บอกสัญลักษณ์/บ้านเลขที่รอบๆ ได้ไหม?"',
            tag: '[เก็บข้อมูล]',
            ipTraceGain: 25,
            panicChange: -10,
            nextStep: 'step-2a',
            revealCoords: true, // ปลดล็อกพิกัดอัตโนมัติ
          },
          {
            id: 'c2',
            text: '2. "เปิดสายทิ้งไว้ไม่ต้องพูด ให้ผมถือสายประวิงเวลาดักสัญญาณ IP"',
            tag: '[ประวิงเวลา]',
            ipTraceGain: 50,
            panicChange: 5,
            nextStep: 'step-2b',
            revealCoords: false,
          },
          {
            id: 'c3',
            text: '3. "คุณมีอาวุธไว้สู้ไหม? คว้าอะไรใกล้มือไว้ก่อนเลย!"',
            tag: '[เสี่ยงสูง]',
            ipTraceGain: 10,
            panicChange: 35, // Panic พุ่งสูง
            nextStep: 'step-lost',
            triggerLost: true,
          }
        ]
      },
      {
        id: 'step-2a',
        callerText: 'ผมอยู่บ้านเลขที่ 19 ซอย 241 ยูนิต 303... ได้ยินเสียงกระจกแตกแล้ว!',
        choices: [
          {
            id: 'c2a-1',
            text: '1. "เงียบไว้ครับ ตำรวจกำลังไป พิกัดถูกยืนยันแล้ว"',
            tag: '[ตั้งรับ]',
            ipTraceGain: 35,
            panicChange: -15,
            nextStep: 'step-complete',
          }
        ]
      },
      {
        id: 'step-2b',
        callerText: '(เสียงหายใจติดขัด)... มันเดินเข้ามาในบ้านแล้ว... (เสียงก้าวเท้า)',
        choices: [
          {
            id: 'c2b-1',
            text: '1. "จับสัญญาณสำเร็จแล้ว! หมอบลงต่ำ อย่าส่งเสียงเด็ดขาด"',
            tag: '[ประวิงเวลา]',
            ipTraceGain: 50,
            panicChange: -5,
            nextStep: 'step-complete',
          }
        ]
      }
    ],
    fieldBriefings: [
      {
        id: 'b1',
        text: '1. เข้าทางหลังอาคารแบบเงียบ ไม่เปิดไซเรน',
        outcome: 'SUCCESS',
        injuryRisk: 0.1,
      },
      {
        id: 'b2',
        text: '2. บุกเข้าประตูหน้า ประกาศตัวด้วยลำโพง',
        outcome: 'CASUALTY_RISK',
        injuryRisk: 0.4,
      },
      {
        id: 'b3',
        text: '3. ปิดล้อมทางเข้าออก แล้วรอหน่วย SWAT เสริม',
        outcome: 'DELAY',
        injuryRisk: 0.2,
      }
    ]
  }
];