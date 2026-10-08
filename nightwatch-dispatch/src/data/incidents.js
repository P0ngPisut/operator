import { CITY } from './map/city.js';
import { snapWorldPointToRoad } from '../pathfinding/graph.js';
import { generateDynamicIncident } from '../services/aiService.js';

const DEPARTMENTS = ['police', 'fire', 'medical'];
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CALLER_NAMES = [
  'สมชาย ใจดี',
  'สุภาวดี แสงทอง',
  'ธนกร วัฒนชัย',
  'พิมพ์ชนก ศรีสุข',
  'กิตติพงษ์ บุญมี',
  'อรทัย พูนทรัพย์',
  'ณัฐวุฒิ คำแก้ว',
  'ชลธิชา ภักดี',
  'ปกรณ์ อินทร์รักษา',
];

const STREET_RESTRICTIONS = [
  'ถนนแคบ 2.1m',
  'พื้นที่ชุมชนแออัด',
  'ซอยตันมีน้ำท่วมขัง',
  'สะพานรับน้ำหนักได้จำกัด',
  'ทางเข้าอาคารสูงไม่รองรับรถใหญ่',
  'ถนนลื่นและมีเศษวัสดุกีดขวาง',
];

const INCIDENT_SCENARIOS = {
  police: [
    {
      title: 'บุกรุกเคหสถาน',
      type: 'HOME INTRUSION',
      opening: 'มีคนพยายามงัดประตูบ้านครับ ผมกับแม่หลบอยู่ในห้องด้านใน ได้ยินเสียงอยู่ใกล้มาก',
      detail: 'ผมเห็นเงาคนอย่างน้อยหนึ่งคนที่หน้าต่าง แต่ไม่แน่ใจว่ามีอาวุธหรือเปล่า',
      followUp: 'เขาหยุดเดินแล้วครับ ผมได้ยินเสียงเหมือนกำลังลองลูกบิดประตู',
      confirmed: 'ผมล็อกประตูด้านในแล้วครับ จะอยู่เงียบ ๆ และรอเจ้าหน้าที่',
      panic: 'ผมเริ่มควบคุมตัวเองไม่ไหว เสียงข้างนอกใกล้เข้ามาแล้ว ช่วยผมด้วย!',
      restriction: 'พื้นที่ชุมชนแออัด',
    },
    {
      title: 'เหตุคุกคามในที่จอดรถ',
      type: 'PARKING LOT THREAT',
      opening: 'มีคนตามฉันมาจากลานจอดรถค่ะ ตอนนี้ฉันหลบอยู่หลังรถและไม่รู้ว่าเขายังอยู่ไหม',
      detail: 'เห็นรถกระบะสีเข้มจอดขวางทางออก มีคนอยู่ใกล้ประตูฝั่งคนขับค่ะ',
      followUp: 'เขาเดินวนอยู่แถวทางออก ฉันได้ยินเสียงรถติดเครื่องแล้วค่ะ',
      confirmed: 'ฉันอยู่หลังเสาคอนกรีตและไม่เข้าใกล้รถ จะรอในจุดที่ปลอดภัยค่ะ',
      panic: 'เขาเห็นฉันแล้วค่ะ ฉันกำลังจะวิ่งออกไป ไม่รู้จะไปทางไหน!',
      restriction: 'ซอยตันมีน้ำท่วมขัง',
    },
    {
      title: 'บุคคลต้องสงสัยในร้านค้า',
      type: 'ARMED ROBBERY',
      opening: 'มีคนสวมหมวกปิดหน้าเข้ามาในร้านค่ะ เขาตะโกนให้ทุกคนหมอบ ฉันอยู่หลังเคาน์เตอร์',
      detail: 'มีลูกค้าอีกสองคนอยู่ในร้าน และฉันเห็นวัตถุคล้ายอาวุธในมือเขาค่ะ',
      followUp: 'คนร้ายกำลังมองไปทางประตูหลัง ฉันได้ยินเสียงลูกค้าร้องไห้ค่ะ',
      confirmed: 'ฉันจะไม่ขยับตัวหรือสบตาเขา และจะบอกตำแหน่งให้เจ้าหน้าที่ค่ะ',
      panic: 'ลูกค้าคนหนึ่งกำลังลุกขึ้นค่ะ ทุกอย่างกำลังวุ่นวาย ฉันควรทำยังไง!',
      restriction: 'ถนนแคบ 2.1m',
    },
  ],
  fire: [
    {
      title: 'เพลิงไหม้ห้องแถว',
      type: 'RESIDENTIAL FIRE',
      opening: 'มีควันดำออกมาจากชั้นล่างของห้องแถวค่ะ ฉันอยู่ชั้นสองและมีเพื่อนบ้านอยู่ติดกัน',
      detail: 'ไฟน่าจะเริ่มจากห้องครัว มีคนแก่ติดอยู่ในห้องด้านหลังหนึ่งคนค่ะ',
      followUp: 'ควันเริ่มลอยขึ้นบันไดแล้วค่ะ ประตูหน้าร้อนมาก',
      confirmed: 'ฉันปิดประตูห้อง เอาผ้าปิดช่องใต้ประตู และอยู่ใกล้หน้าต่างค่ะ',
      panic: 'ควันเข้ามาในห้องแล้วค่ะ ฉันหายใจลำบากและเริ่มมองไม่เห็นทาง!',
      restriction: 'พื้นที่ชุมชนแออัด',
    },
    {
      title: 'กลุ่มควันจากโรงงาน',
      type: 'INDUSTRIAL FIRE',
      opening: 'มีควันกับกลิ่นสารเคมีออกมาจากโกดังค่ะ คนงานกำลังออกมาแต่ยังมีคนอยู่ข้างใน',
      detail: 'หัวหน้างานบอกว่ามีถังแก๊สอยู่ใกล้จุดเกิดเหตุ และยังหาคนงานได้ไม่ครบค่ะ',
      followUp: 'ลมพัดควันไปทางชุมชนแล้วค่ะ มีคนเริ่มไออยู่หน้าประตูโรงงาน',
      confirmed: 'ฉันกำลังพาคนออกไปทางเหนือลมและจะไม่กลับเข้าไปในโกดังค่ะ',
      panic: 'มีเสียงระเบิดดังขึ้นหนึ่งครั้ง ทุกคนกำลังวิ่งกันคนละทางค่ะ!',
      restriction: 'สะพานรับน้ำหนักได้จำกัด',
    },
    {
      title: 'ไฟไหม้แผงวงจรอาคาร',
      type: 'ELECTRICAL FIRE',
      opening: 'เกิดประกายไฟและควันจากตู้ไฟของอาคารสำนักงานค่ะ คนในชั้นนี้ยังออกมาไม่หมด',
      detail: 'ลิฟต์หยุดทำงาน มีพนักงานติดอยู่ในห้องประชุมด้านในสามคนค่ะ',
      followUp: 'ไฟสำรองติด ๆ ดับ ๆ และควันเริ่มบังป้ายทางออกแล้วค่ะ',
      confirmed: 'ฉันจะไม่แตะตู้ไฟและจะพาคนที่อยู่ใกล้บันไดหนีไฟออกไปค่ะ',
      panic: 'มีคนกำลังจะใช้ลิฟต์หนีค่ะ ฉันห้ามเขาไม่อยู่แล้ว!',
      restriction: 'ทางเข้าอาคารสูงไม่รองรับรถใหญ่',
    },
  ],
  medical: [
    {
      title: 'ผู้ป่วยหมดสติในบ้าน',
      type: 'UNCONSCIOUS PATIENT',
      opening: 'พ่อฉันหมดสติและหายใจแผ่วมากค่ะ เราอยู่ในบ้านชั้นเดียว ประตูรั้วล็อกอยู่',
      detail: 'ผู้ป่วยอายุประมาณเจ็ดสิบปี ไม่ตอบสนอง แต่ยังรู้สึกว่ามีลมหายใจค่ะ',
      followUp: 'ฉันเปิดประตูรั้วแล้วค่ะ แต่ไม่แน่ใจว่าควรขยับตัวพ่อหรือไม่',
      confirmed: 'ฉันจะทำตามคำแนะนำทางโทรศัพท์และคอยสังเกตการหายใจค่ะ',
      panic: 'พ่อหยุดหายใจไปชั่วครู่ค่ะ ฉันทำอะไรไม่ถูกแล้ว ช่วยด้วย!',
      restriction: 'ถนนแคบ 2.1m',
    },
    {
      title: 'อุบัติเหตุรถจักรยานยนต์',
      type: 'ROAD TRAFFIC INJURY',
      opening: 'มีคนขี่มอเตอร์ไซค์ล้มกลางถนนค่ะ เขายังรู้สึกตัวแต่มีเลือดออกมาก',
      detail: 'มีผู้บาดเจ็บหนึ่งคน สวมหมวกกันน็อก และรถที่ล้มยังขวางช่องทางจราจรค่ะ',
      followUp: 'เขาบอกว่าปวดคอมาก ฉันยังไม่ได้ถอดหมวกให้ค่ะ',
      confirmed: 'ฉันจะกันคนออกจากถนนและไม่เคลื่อนย้ายผู้บาดเจ็บค่ะ',
      panic: 'รถคันอื่นเกือบชนซ้ำค่ะ ฉันกำลังจะลากเขาออกจากถนน!',
      restriction: 'ถนนลื่นและมีเศษวัสดุกีดขวาง',
    },
    {
      title: 'ผู้ป่วยเจ็บหน้าอกในตลาด',
      type: 'CARDIAC EMERGENCY',
      opening: 'มีผู้ชายเจ็บหน้าอกและทรุดลงที่ตลาดค่ะ ตอนนี้เขายังพอตอบคำถามได้',
      detail: 'คนเจ็บอายุประมาณห้าสิบปี เหงื่อออกมากและหายใจสั้น มีคนมุงอยู่หลายคนค่ะ',
      followUp: 'เขาบอกว่าอาการปวดร้าวไปที่แขนซ้ายค่ะ มีพื้นที่ว่างข้างแผงผลไม้',
      confirmed: 'ฉันขอให้คนมุงถอยออกและจะอยู่ข้างผู้ป่วยจนกว่าทีมแพทย์จะมาค่ะ',
      panic: 'เขาทรุดลงอีกครั้งค่ะ คนรอบข้างเริ่มตะโกนและไม่มีใครฟังฉันเลย!',
      restriction: 'พื้นที่ชุมชนแออัด',
    },
  ],
};

const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomCoordinates = () => Array.from({ length: 3 }, () => String(randomInt(0, 999)).padStart(3, '0'));
const randomWorldPosition = () => {
  const { x, y } = snapWorldPointToRoad({
    x: randomInt(Math.round(CITY.widthM * 0.15), Math.round(CITY.widthM * 0.85)),
    y: randomInt(Math.round(CITY.heightM * 0.15), Math.round(CITY.heightM * 0.85)),
  });
  return { x, y };
};

function createChoice({ id, text, tag, nextStep, ipTraceAdd = 0, panicChange = 0, revealCoords = false, triggerLost = false }) {
  return {
    id,
    text,
    tag,
    ipTraceAdd,
    ipTraceGain: ipTraceAdd,
    panicChange,
    nextStep,
    revealCoords,
    triggerLost,
  };
}

function createDialogueTree(scenario) {
  const delayChoice = (id, text, nextStep) => createChoice({
    id,
    text,
    tag: '[ประวิงเวลา]',
    nextStep,
    ipTraceAdd: randomInt(30, 50),
    panicChange: 5,
  });

  const dataChoice = (id, text, nextStep) => createChoice({
    id,
    text,
    tag: '[เก็บข้อมูล]',
    nextStep,
    ipTraceAdd: 15,
    panicChange: -5,
    revealCoords: true,
  });

  const panicChoice = (id, text) => createChoice({
    id,
    text,
    tag: '[เสี่ยงสูง]',
    nextStep: 'step_failed_panic',
    panicChange: 35,
  });

  return [
    {
      id: 'step_1',
      callerText: scenario.opening,
      choices: [
        createChoice({
          id: 'c1',
          text: 'หายใจช้า ๆ ก่อนครับ/ค่ะ ถอยไปอยู่หลังประตูที่ล็อกได้ และอย่าออกไปตรวจสอบเอง',
          tag: '[ตั้งรับ]',
          nextStep: 'step_2_a',
          panicChange: -15,
        }),
        delayChoice('c2', 'ขอให้ถือสายไว้เงียบ ๆ สักครู่ ระบบกำลังติดตามตำแหน่งสัญญาณ', 'step_2_b'),
        panicChoice('c3', 'ลองเข้าไปดูใกล้ ๆ แล้วบอกผม/ฉันว่าเกิดอะไรขึ้น', 'step_failed_panic'),
      ],
    },
    {
      id: 'step_2_a',
      callerText: scenario.detail,
      choices: [
        dataChoice('c1', 'ช่วยบอกจำนวนคนและตำแหน่งล่าสุดของผู้ก่อเหตุ/ผู้บาดเจ็บ โดยไม่เข้าใกล้จุดนั้น', 'step_confirmed'),
        delayChoice('c2', 'อยู่ในจุดปลอดภัยและเปิดสายต่อไว้นะครับ/ค่ะ ระบบกำลังบีบวงตำแหน่ง', 'step_confirmed'),
        panicChoice('c3', 'รีบเดินเข้าไปใกล้ ๆ เพื่อยืนยันเหตุและเก็บรายละเอียดให้ชัดเจน', 'step_failed_panic'),
      ],
    },
    {
      id: 'step_2_b',
      callerText: scenario.followUp,
      choices: [
        dataChoice('c1', 'ยืนยันจำนวนคนและจุดที่คุณอยู่ให้ผม/ฉันทราบ โดยไม่ขยับเข้าใกล้อันตราย', 'step_confirmed'),
        createChoice({
          id: 'c2',
          text: 'ล็อกประตูหรือกั้นพื้นที่ไว้ครับ/ค่ะ แล้วรอเจ้าหน้าที่ในจุดที่ปลอดภัย',
          tag: '[ตั้งรับ]',
          nextStep: 'step_confirmed',
          panicChange: -10,
        }),
        panicChoice('c3', 'ตะโกนเรียกอีกฝ่ายหรือเข้าไปช่วยทันทีเพื่อให้ผม/ฉันเห็นสถานการณ์ชัดขึ้น', 'step_failed_panic'),
      ],
    },
    {
      id: 'step_confirmed',
      callerText: scenario.confirmed,
      choices: [
        createChoice({
          id: 'c1',
          text: 'รับทราบครับ/ค่ะ อยู่ในตำแหน่งเดิม หน่วยกำลังเดินทางไปหาคุณ',
          tag: '[ตั้งรับ]',
          nextStep: 'step_complete',
          panicChange: -10,
        }),
        dataChoice('c2', 'ขอยืนยันจุดสังเกตสุดท้ายอีกครั้ง เพื่อให้หน่วยเข้าถึงคุณได้ถูกทาง', 'step_complete'),
        delayChoice('c3', 'อยู่ในสายกับผม/ฉันต่ออีกนิด ตำแหน่งกำลังถูกยืนยัน', 'step_complete'),
      ],
    },
    {
      id: 'step_failed_panic',
      callerText: scenario.panic,
      choices: [
        createChoice({
          id: 'c1',
          text: 'ฟังเสียงผมนะครับ/ค่ะ หยุดขยับและทำตามคำสั่งทีละขั้น',
          tag: '[ตั้งรับ]',
          nextStep: 'step_failed_panic',
          triggerLost: true,
        }),
        createChoice({
          id: 'c2',
          text: 'บอกผม/ฉันว่าตอนนี้คุณอยู่ตรงไหนและมีใครอยู่ใกล้ตัวบ้าง',
          tag: '[เก็บข้อมูล]',
          nextStep: 'step_failed_panic',
          triggerLost: true,
        }),
        createChoice({
          id: 'c3',
          text: 'อย่าเพิ่งวางสาย ระบบกำลังติดตามสัญญาณอยู่',
          tag: '[ประวิงเวลา]',
          nextStep: 'step_failed_panic',
          ipTraceAdd: randomInt(30, 50),
          triggerLost: true,
        }),
      ],
    },
  ];
}

function createFieldBriefings(scenario) {
  return [
    {
      id: 'b1',
      text: `เข้าพื้นที่จากด้านปลอดภัย ประเมินสถานการณ์ก่อนช่วยเหลือ: ${scenario.title}`,
      risk: 'LOW',
      outcome: 'SUCCESS',
      injuryRisk: 0.1,
    },
    {
      id: 'b2',
      text: 'เร่งเข้าจุดเกิดเหตุทันทีโดยไม่รอการประเมินพื้นที่',
      risk: 'HIGH',
      outcome: 'CASUALTY_RISK',
      injuryRisk: 0.4,
    },
    {
      id: 'b3',
      text: 'ปิดกั้นพื้นที่เสี่ยงและรอหน่วยสนับสนุนเฉพาะทาง',
      risk: 'MEDIUM',
      outcome: 'DELAY',
      injuryRisk: 0.2,
    },
  ];
}

export function generateIncidents(count = 3, playerLevel = 10) {
  return Array.from({ length: count }, () => {
    const sev = Math.floor(Math.random() * 8) + 1;
    return generateDynamicIncident(playerLevel, sev);
  });
}

export const INCIDENTS = generateIncidents(3);