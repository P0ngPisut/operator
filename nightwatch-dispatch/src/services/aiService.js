import { CITY, getMapLocation } from '../data/map/city.js';

export function getGeminiApiKey() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('nightwatch_gemini_api_key') || import.meta.env?.VITE_GEMINI_API_KEY || '';
}

export function setGeminiApiKey(key) {
  if (typeof window === 'undefined') return;
  if (!key) {
    localStorage.removeItem('nightwatch_gemini_api_key');
  } else {
    localStorage.setItem('nightwatch_gemini_api_key', key.trim());
  }
}

// Procedural Scenario Generators for SEV 1 to 8
const FIRST_NAMES = ['สมชาย', 'วิภาดา', 'กิตติพงษ์', 'อารียา', 'ธนพล', 'ชลธิชา', 'ณัฐวุฒิ', 'ศิริพร', 'ปกรณ์', 'กัญญา', 'เอกชัย', 'มณีรัตน์', 'ธีรเดช', 'พัชรี'];
const LAST_NAMES = ['ใจดี', 'แสงทอง', 'รัตนโกสินทร์', 'พูนทรัพย์', 'คำแก้ว', 'วัฒนชัย', 'บุญมี', 'สุขสมบูรณ์', 'อินทร์รักษา', 'ภักดีโภคิน'];

const SCENARIO_TEMPLATES = {
  police: {
    1: [
      { title: 'ร้องเรียนเสียงดังยามวิกาล', type: 'NOISE COMPLAINT', text: 'ข้างบ้านเปิดเพลงเสียงดังมากจนลูกนอนไม่ได้เลยครับ ตะโกนบอกแล้วเขาไม่ยอมปิด' },
      { title: 'พบกระเป๋าต้องสงสัยลืมไว้', type: 'LOST PROPERTY', text: 'มีกระเป๋าเป้วางทิ้งไว้ตรงป้ายรถเมล์นานกว่าสองชั่วโมงแล้วค่ะ กลัวมีของอันตราย' }
    ],
    2: [
      { title: 'สงสัยคนด้อมมองหน้าบ้าน', type: 'SUSPICIOUS PERSON', text: 'มีชายสวมฮู้ดเดินวนเวียนหน้าบ้านฉันหลายรอบแล้วค่ะ ส่องไฟฉายเข้ามาในรั้วด้วย' },
      { title: 'รถยนต์ถูกกรีดสีรอบคัน', type: 'VANDALISM', text: 'รถที่จอดหน้าตึกโดนคนกรีดสีรอบคันครับ เพิ่งได้ยินเสียงคนวิ่งหนีไปเมื่อกี้' }
    ],
    3: [
      { title: 'ทะเลาะวิวาทหน้าร้านค้า', type: 'PUBLIC BRAWL', text: 'มีกลุ่มวัยรุ่นมีปากเสียงแล้วเริ่มชกต่อยกันหน้าร้านสะดวกซื้อครับ มีขวดแก้วแตกเกลื่อน' },
      { title: 'คนเมาสุราบุกรุกรั้วบ้าน', type: 'TRESPASSING', text: 'มีคนเมาปีนรั้วเข้ามาในสวนหลังบ้านค่ะ เขานั่งโวยวายไม่ยอมออกไป ฉันกลัวมาก' }
    ],
    4: [
      { title: 'งัดแงะบ้านพักอาศัย', type: 'HOME INTRUSION', text: 'มีคนพยายามงัดประตูบ้านผมครับ ได้ยินเสียงชะแลงงัดชัดเจน ผมกับครอบครัวหลบอยู่ในห้องนอน' },
      { title: 'วิ่งราวทรัพย์ริมถนน', type: 'SNATCH THEFT', text: 'มีมอเตอร์ไซค์กระชากกระเป๋าฉันล้มลงกับพื้นค่ะ คนร้ายขับหนีมุ่งหน้าไปทางซอยเปลี่ยว' }
    ],
    5: [
      { title: 'ปล้นร้านค้ามีอาวุธมีด', type: 'ARMED ROBBERY', text: 'คนร้ายถือมีดยาวเข้ามาจี้ชิงเงินในเคาน์เตอร์ครับ บังคับให้ทุกคนนอนคว่ำหน้าลง' },
      { title: 'สะกดรอยตามข่มขู่ในลานจอดรถ', type: 'STALKING & THREAT', text: 'มีรถขับตามฉันในลานจอดรถชั้นใต้ดิน แล้วมีคนถือท่อนเหล็กลงมาดักที่ทางออกค่ะ' }
    ],
    6: [
      { title: 'คนร้ายมีอาวุธปืนบุกร้านทอง', type: 'FIREARM ROBBERY', text: 'มีคนยิงปืนขู่ขึ้นฟ้าหน้าร้านทองครับ! คนร้ายมีปืนสองคน กำลังกวาดทองใส่กระเป๋า!' },
      { title: 'ดักยิงคู่อริกลางชุมชน', type: 'DRIVE-BY SHOOTING', text: 'มีเสียงปืนดังขึ้น 4-5 นัดกลางชุมชนครับ มีคนโดนลูกหลงนอนบาดเจ็บอยู่บนฟุตบาท!' }
    ],
    7: [
      { title: 'จับตัวประกันในอาคารสำนักงาน', type: 'HOSTAGE CRISIS', text: 'คนร้ายคุ้มคลั่งมีอาวุธปืนจับพนักงานไว้ในห้องประชุมชั้น 3 ครับ เขาขู่จะยิงถ้าตำรวจเข้ามา!' },
      { title: 'แก๊งอาชญากรปิดล้อมปล้นรถขนเงิน', type: 'ARMORED TRUCK ATTACK', text: 'มีกลุ่มคนปิดหัวยิงสกัดรถขนเงินครับ มีเสียงระเบิดยางรถและยิงปะทะกันดุเดือดมาก!' }
    ],
    8: [
      { title: 'เหตุกราดยิงในศูนย์การค้า', type: 'ACTIVE SHOOTER', text: 'มีคนร้ายกราดยิงในห้างครับ! คนวิ่งหนีเหยียบกันอลหม่าน ผมซ่อนตัวอยู่หลังตู้เสื้อผ้า ได้ยินเสียงปืนกลใกล้เข้ามาเรื่อยๆ!' },
      { title: 'ก่อการร้ายขู่วางระเบิดหลายจุด', type: 'MASS TERROR THREAT', text: 'มีวัตถุระเบิดเวลานับถอยหลังอยู่ในโถงสถานีรถไฟครับ คนร้ายบอกว่ามีอีกสามจุดในเมือง ช่วยด้วยครับ!' }
    ]
  },
  fire: {
    1: [
      { title: 'ไฟไหม้กองขยะข้างทาง', type: 'TRASH FIRE', text: 'มีควันไฟลอยมาจากกองใบไม้และขยะข้างทางครับ เปลวไฟเริ่มลามเข้าใกล้เสาไฟ' },
      { title: 'ไฟฟ้าลัดวงจรหม้อแปลงระเบิด', type: 'TRANSFORMER SPARK', text: 'หม้อแปลงไฟฟ้าหน้าปากซอยมีประกายไฟวาบและเสียงดังเปรี๊ยะตลอดเวลาค่ะ' }
    ],
    2: [
      { title: 'ควันไหม้จากท่อระบายน้ำ', type: 'UNDERGROUND CONDUIT', text: 'มีควันดำหนาทึบพวยพุ่งขึ้นมาจากตะแกรงท่อระบายน้ำ กลิ่นเหม็นไหม้พลาสติกแรงมาก' },
      { title: 'เพลิงไหม้พงหญ้าริมรั้วหมู่บ้าน', type: 'BRUSH FIRE', text: 'ไฟไหม้หญ้าแห้งลามเร็วมากครับ ลมพัดเข้าหากำแพงบ้านผมแล้ว' }
    ],
    3: [
      { title: 'ไฟไหม้ห้องเครื่องรถยนต์', type: 'VEHICLE FIRE', text: 'รถกระบะจอดอยู่หน้าบ้านเกิดไฟลุกพรึ่บที่ห้องเครื่องครับ ดับเพลิงเคมีเอาไม่อยู่แล้ว' },
      { title: 'กระทะน้ำมันทอดติดไฟในครัว', type: 'KITCHEN GREASE FIRE', text: 'ไฟลุกไหม้จากเตาแก๊สลามขึ้นฮู้ดดูดควันค่ะ ควันเริ่มกระจายเต็มบ้าน' }
    ],
    4: [
      { title: 'เพลิงไหม้ห้องแถวชั้นล่าง', type: 'RESIDENTIAL FIRE', text: 'มีควันดำทะลักออกมาจากชั้นล่างของห้องแถวสองชั้นค่ะ คนชั้นบนกำลังปีนระเบียงหนี' },
      { title: 'ไฟไหม้โกดังเก็บเฟอร์นิเจอร์', type: 'STORAGE FIRE', text: 'ไฟลุกไหม้กองไม้พาเลทในโกดังด้านหลัง มีควันพวยพุ่งสูงเห็นได้จากระยะไกล' }
    ],
    5: [
      { title: 'ไฟไหม้อพาร์ตเมนต์คนติดในห้อง', type: 'APARTMENT FIRE', text: 'ไฟไหม้ชั้น 4 ของหอพักครับ ทางเดินบันไดหนีไฟเต็มไปด้วยควัน มีคนร้องขอความช่วยเหลือที่ระเบียง!' },
      { title: 'เพลิงไหม้ร้านอาหารก๊าซหุงต้มรั่ว', type: 'GAS EXPLOSION FIRE', text: 'ถังแก๊สร้านอาหารเกิดการระเบิดและไฟลุกท่วมทั้งร้าน มีเศษกระจกกระเด็นเต็มถนน' }
    ],
    6: [
      { title: 'ไฟไหม้โรงงานรีไซเคิลพลาสติก', type: 'PLASTIC FACTORY FIRE', text: 'เพลิงโหมกระหน่ำโรงงานพลาสติก เปลวไฟสูงท่วมหลังคา ควันพิษสีดำลอยคลุมชุมชนด้านข้าง!' },
      { title: 'ไฟไหม้เรือโดยสารเทียบท่า', type: 'BOAT PIER FIRE', text: 'เรือโดยสารติดไฟลามไปยังเรือข้างเคียงที่ท่าเทียบเรือ น้ำมันรั่วลงผิวน้ำไฟลุกบนน้ำครับ!' }
    ],
    7: [
      { title: 'ไฟไหม้คลังเก็บสารเคมีอันตราย', type: 'CHEMICAL HAZMAT FIRE', text: 'คลังสารเคมีเกิดเพลิงไหม้และมีเสียงระเบิดเป็นระยะ! เจ้าหน้าที่โรงงานบอกว่าห้ามใช้น้ำฉีดเพราะสารจะทำปฏิกิริยา!' },
      { title: 'เพลิงไหม้ตึกสูงระฟ้า ลิฟต์หยุดทำงาน', type: 'HIGH-RISE TOWER FIRE', text: 'ไฟไหม้ชั้น 18 ของอาคารสำนักงานขนาดใหญ่ ระบบสปริงเกลอร์ไม่ทำงาน มีคนติดอยู่ชั้น 19-20 หลายสิบคน!' }
    ],
    8: [
      { title: 'เพลิงไหม้โรงกลั่นน้ำมันระเบิดรุนแรง', type: 'REFINERY INFERNO', text: 'ถังบรรจุน้ำมันดิบขนาดใหญ่ระเบิดไฟลุกเป็นลูกไฟยักษ์! แรงอัดทำให้อาคารรอบข้างกระจกแตก มีผู้บาดเจ็บจำนวนมาก!' },
      { title: 'ไฟไหม้ชุมชนแออัดวงกว้างลุกลามข้ามซอย', type: 'URBAN CONFLAGRATION', text: 'ไฟไหม้บ้านไม้ในชุมชนแออัดลามไปแล้วกว่าสามสิบหลัง ลมแรงมาก รถดับเพลิงเข้าซอยไม่ได้ ช่วยด้วยเถอะครับ!!' }
    ]
  },
  medical: {
    1: [
      { title: 'ลื่นล้มข้อเท้าพลิกในบ้าน', type: 'MINOR FALL', text: 'คุณยายลื่นล้มในห้องน้ำ ข้อเท้าบวมมาก ลุกเดินไม่ได้ แต่ยังพูดคุยรู้เรื่องดีค่ะ' },
      { title: 'บาดแผลมีดบาดลึกเลือดไหลไม่หยุด', type: 'LACERATION', text: 'ทำครัวแล้วมีดปังตอสับโดนนิ้วมือแผลลึก เลือดไหลหยดไม่ยอมหยุดเลยครับ' }
    ],
    2: [
      { title: 'อาการแพ้อาหารผื่นขึ้นแน่นคอ', type: 'ALLERGIC REACTION', text: 'กินกุ้งแล้วเริ่มมีผื่นคันขึ้นเต็มตัว หายใจเริ่มติดขัดเสียงแหบค่ะ' },
      { title: 'เป็นลมแดดหมดสติชั่วคราว', type: 'HEAT EXHAUSTION', text: 'คนงานก่อสร้างวูบหมดสติกลางแดด ตอนนี้รู้สึกตัวแล้วแต่ตัวร้อนจัดและเพ้อ' }
    ],
    3: [
      { title: 'หกล้มศีรษะกระแทกมีรอยแตก', type: 'HEAD TRAUMA', text: 'เด็กตกจากชิงช้าหัวฟาดขอบปูน เลือดไหลอาบหน้าและเริ่มอาเจียนครับ' },
      { title: 'ผู้ป่วยเบาหวานช็อกน้ำตาลต่ำ', type: 'HYPOGLYCEMIC SHOCK', text: 'พ่อเหงื่อแตกตัวเย็นเฉียบ มือสั่นและตอบสนองช้ามาก เรียกไม่ค่อยตอบค่ะ' }
    ],
    4: [
      { title: 'อุบัติเหตุมอเตอร์ไซค์ล้มบาดเจ็บกระดูกหัก', type: 'MOTORCYCLE CRASH', text: 'มีมอเตอร์ไซค์แหกโค้งล้ม ขาคนขับผิดรูปและมีกระดูกโผล่ เขาร้องโอดโอยด้วยความเจ็บปวด' },
      { title: 'ชักเกร็งหมดสติตาค้าง', type: 'SEIZURE EMERGENCY', text: 'ผู้ป่วยมีอาการชักเกร็ง กัดลิ้น และหมดสติไปเกือบสามนาทีแล้วค่ะ' }
    ],
    5: [
      { title: 'แน่นหน้าอกเฉียบพลัน หายใจไม่ออก', type: 'CARDIAC ARREST RISK', text: 'คุณลุงเจ็บหน้าอกเหมือนมีช้างมาเหยียบ ปวดร้าวขึ้นกรามและแขนซ้าย หายใจหอบเหนื่อยมาก!' },
      { title: 'สำลักอาหารติดหลอดลมอุดกั้น', type: 'CHOKING ASPHYXIA', text: 'มีคนสำลักลูกชิ้นติดคอ หน้าเริ่มเขียวคล้ำ เอามือกุมคอ พูดไม่ได้แล้ว ช่วยด้วย!' }
    ],
    6: [
      { title: 'รถกระบะชนคนเดินเท้ากระเด็นหมดสติ', type: 'PEDESTRIAN STRUCK', text: 'รถกระบะชนคนข้ามถนนลอยไปไกลกว่าสิบเมตร! ผู้บาดเจ็บนอนนิ่งจมกองเลือด ชีพจรเบามาก!' },
      { title: 'พลัดตกจากนั่งร้านสูง 3 ชั้น', type: 'FALL FROM HEIGHT', text: 'คนงานตกจากนั่งร้านก่อสร้างลงมากระแทกพื้นคอนกรีต มีเลือดออกทางหูและจมูก ไม่ได้สติเลยครับ!' }
    ],
    7: [
      { title: 'ผู้ป่วยหมดสติไม่หายใจ กำลัง CPR', type: 'OUT-OF-HOSPITAL CPR', text: 'พ่อหัวใจหยุดเต้นไปแล้วครับ! ผมกำลังปั๊มหัวใจตามที่ฟังจากวิทยุ ตัวพ่อเริ่มเย็นลงทุกที รีบส่งรถพยาบาลมาที!' },
      { title: 'รถตู้โดยสารชนประสานงา เจ็บหลายราย', type: 'MASS CASUALTY CRASH', text: 'รถตู้ชนกับรถบรรทุกอย่างจัง! มีคนติดในซากรถ 6 คน ร้องขอความช่วยเหลือ มีคนกระเด็นออกนอกรถสองคน!' }
    ],
    8: [
      { title: 'ตึกทรุดถล่มทับคนงานจำนวนมาก', type: 'STRUCTURAL COLLAPSE', text: 'คานสะพานก่อสร้างถล่มทับรถและคนงานด้านล่าง! มีคนติดอยู่ใต้ซากหลายสิบคน เสียงหวีดร้องดังลั่นไปหมด!' },
      { title: 'สารเคมีพิษรั่วไหล คนหมดสติเป็นกลุ่ม', type: 'TOXIC GAS MASS POISON', text: 'มีไอระเหยกรดรั่วออกจากโรงงาน คนในซอยสูดดมแล้วล้มฟุบชักหมดสติไปแล้วเกือบสิบคนครับ ช่วยด่วนที่สุด!!' }
    ]
  }
};

const CALLER_PERSONALITIES = [
  { tone: 'PANICKED', panicStart: 75, style: 'ตื่นตระหนก พูดเร็ว เสียงสั่นสะอื้น' },
  { tone: 'TERRIFIED_WHISPER', panicStart: 60, style: 'กระซิบ กลัวคนร้ายได้ยิน พูดขาดๆ หายๆ' },
  { tone: 'ANXIOUS_CRYING', panicStart: 70, style: 'ร้องไห้ ขอร้องให้ช่วยซ้ำๆ' },
  { tone: 'SHOCKED_CONFUSED', panicStart: 50, style: 'มึนงง สับสน ตอบคำถามช้า' },
  { tone: 'DISTRESSED_TRYING', panicStart: 45, style: 'พยายามคุมสติ แต่เสียงสั่นเครือ' },
];

export function generateDynamicIncident(playerLevel = 1, fixedSeverity = null) {
  const departments = ['police', 'fire', 'medical'];
  const dept = departments[Math.floor(Math.random() * departments.length)];

  // SEV 1-8
  const severity = fixedSeverity || Math.min(8, Math.max(1, Math.floor(Math.random() * 8) + 1));
  const templates = SCENARIO_TEMPLATES[dept][severity] || SCENARIO_TEMPLATES[dept][1];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const personality = CALLER_PERSONALITIES[Math.floor(Math.random() * CALLER_PERSONALITIES.length)];

  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const callerName = `${firstName} ${lastName}`;

  // Random coordinates in 20km x 20km
  const worldX = Math.floor(Math.random() * (CITY.widthM * 0.75)) + Math.floor(CITY.widthM * 0.12);
  const worldY = Math.floor(Math.random() * (CITY.heightM * 0.75)) + Math.floor(CITY.heightM * 0.12);
  const mapLoc = getMapLocation(worldX, worldY);

  const blockPart = String(mapLoc.cellColumn).padStart(3, '0');
  const sectorPart = String(mapLoc.cellRow).padStart(3, '0');
  const unitPart = String(Math.floor(Math.random() * 900) + 100);
  const targetCoords = [blockPart, sectorPart, unitPart];
  const traceAngle = Math.random() * Math.PI * 2;
  const traceDistance = Math.sqrt(Math.random()) * 500;
  const traceX = Math.min(CITY.widthM - 1, Math.max(0, worldX + Math.cos(traceAngle) * traceDistance));
  const traceY = Math.min(CITY.heightM - 1, Math.max(0, worldY + Math.sin(traceAngle) * traceDistance));
  const traceLocation = getMapLocation(traceX, traceY);
  const traceCoords = [
    String(traceLocation.cellColumn).padStart(3, '0'),
    String(traceLocation.cellRow).padStart(3, '0'),
    unitPart,
  ];

  const numericId = String(Math.floor(Math.random() * 9000) + 1000);

  return {
    id: `INC-${numericId}`,
    title: `${template.title} (SEV ${severity})`,
    deptCategory: dept,
    severity,
    minLevel: 1,
    channel: `CH-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
    callerName,
    riskLevel: severity >= 7 ? 'CRITICAL' : severity >= 5 ? 'HIGH' : severity >= 3 ? 'MEDIUM' : 'LOW',
    incidentType: template.type,
    streetRestriction: severity >= 6 ? 'พื้นที่วิกฤตความเสี่ยงสูง' : severity >= 4 ? 'ถนนแคบมีสิ่งกีดขวาง' : 'ปกติ',
    targetCoords,
    traceCoords,
    tracePosition: { x: traceX, y: traceY },
    worldPosition: { x: worldX, y: worldY },
    initialTimeLimit: 5.0,
    openingText: template.text,
    personality,
    initialPanic: Math.min(95, personality.panicStart + (severity * 3)),
    fieldBriefings: [
      { id: 'b1', text: `ประเมินพื้นที่และเข้าช่วยเหลือตามขั้นตอน: ${template.title}`, risk: 'LOW', outcome: 'SUCCESS', injuryRisk: 0.05 },
      { id: 'b2', text: 'เร่งเข้าประชิดจุดเกิดเหตุทันทีเพื่อช่วยชีวิตฉุกเฉิน', risk: 'HIGH', outcome: 'CASUALTY_RISK', injuryRisk: 0.35 },
      { id: 'b3', text: 'ตั้งแนวป้องกันรอบนอกและรอหน่วยสนับสนุนสมทบ', risk: 'MEDIUM', outcome: 'DELAY', injuryRisk: 0.15 },
    ]
  };
}

// Let Gemini author each call's story while the game keeps its generated coordinates,
// department, severity, and IDs as the authoritative gameplay data.
export async function generateGeminiScenarioNarratives({ apiKey, incidents }) {
  if (!apiKey || !Array.isArray(incidents) || incidents.length === 0) return null;

  try {
    const scenarioBriefs = incidents.map(({ id, deptCategory, severity, callerName }) => ({
      id,
      department: deptCategory,
      severity,
      caller: callerName,
    }));
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are a creative scenario writer for a Thai emergency-dispatch simulation. For every supplied incident, invent a distinct, coherent, vivid, original emergency and caller voice. You have broad creative freedom over the story, setting, people, complications, and dialogue. Keep the supplied ID, department, and severity unchanged. Do not include coordinates, block/sector/unit numbers, or reveal the caller location. Write natural Thai. Return only JSON: {"incidents":[{"id":"...","title":"...","incidentType":"...","openingText":"...","detail":"...","followUp":"...","confirmed":"...","panic":"...","callerStyle":"...","streetRestriction":"..."}]}.' }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(scenarioBriefs) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 1.2, maxOutputTokens: 6000 },
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;
    const narratives = JSON.parse(raw).incidents;
    if (!Array.isArray(narratives)) return null;
    const byId = new Map(narratives.filter((entry) => entry && typeof entry.id === 'string').map((entry) => [entry.id, entry]));
    return incidents.map((incident) => {
      const story = byId.get(incident.id);
      if (!story || typeof story.openingText !== 'string') return incident;
      const clean = (value, fallback, max = 700) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;
      return {
        ...incident,
        title: `${clean(story.title, incident.title, 100)} (SEV ${incident.severity})`,
        incidentType: clean(story.incidentType, incident.incidentType, 80),
        openingText: clean(story.openingText, incident.openingText),
        detail: clean(story.detail, ''),
        followUp: clean(story.followUp, ''),
        confirmed: clean(story.confirmed, ''),
        panic: clean(story.panic, ''),
        streetRestriction: clean(story.streetRestriction, incident.streetRestriction, 160),
        personality: { ...incident.personality, style: clean(story.callerStyle, incident.personality?.style, 160) },
      };
    });
  } catch (err) {
    console.warn('Gemini scenario generation failed, using procedural scenarios:', err);
    return null;
  }
}

// Call Google Gemini API if key is present
export async function callGeminiForDialogue({ apiKey, scenario, history, playerMessage, currentPanic }) {
  if (!apiKey) return null;

  const systemInstruction = `คุณคือตัวละครผู้แจ้งเหตุฉุกเฉินทางโทรศัพท์ในเกม tactical emergency dispatch ของไทย
บทบาทของคุณคือผู้ประสบเหตุหรือผู้พบเห็นเหตุการณ์:
- ชื่อ: ${scenario.callerName}
- เหตุการณ์: ${scenario.title} (ระดับความรุนแรง SEV ${scenario.severity}/8)
- ประเภท: ${scenario.incidentType} (${scenario.deptCategory})
- สภาพอารมณ์: ${scenario.personality.style}
- ระดับความตื่นตระหนก (Panic): ${currentPanic}% (จาก 100%)
- ที่อยู่พิกัดจริงของคุณคือ: BLOCK ${scenario.targetCoords[0]}, SECTOR ${scenario.targetCoords[1]}, UNIT ${scenario.targetCoords[2]}

กฎการตอบ:
1. ตอบเป็นภาษาไทยที่เป็นธรรมชาติ เลือกความยาวและน้ำเสียงให้เหมาะกับข้อความของผู้เล่นและสถานการณ์ได้อย่างอิสระ สลับรูปแบบการพูดให้เป็นธรรมชาติ และตอบรับวิธีช่วยเหลือที่ผู้เล่นพิมพ์มาได้หลากหลาย ไม่ต้องยึดบทสนทนาตัวอย่าง
2. ห้ามเปิดเผยพิกัด หาก Panic ยังสูงกว่า 60% หรือผู้เล่นยังไม่ได้ถามถึงตำแหน่ง/ที่อยู่ หรือผู้เล่นตะคอก/กดดัน
3. หากผู้เล่นถามหาตำแหน่ง/ที่อยู่ ("อยู่ที่ไหน", "พิกัด", "อยู่ตรงไหน", "บอกตำแหน่ง") และผู้เล่นพูดจาปลอบประโลมหรือให้คำแนะนำที่ปลอดภัยจน Panic ต่ำกว่า 60%: ให้บอกพิกัดชัดเจน เช่น "ฉันอยู่ตรงบล็อก ${scenario.targetCoords[0]} เซกเตอร์ ${scenario.targetCoords[1]} ยูนิต ${scenario.targetCoords[2]} ค่ะ!"
4. ตอบกลับด้วย JSON รูปแบบ:
{
  "callerResponse": "ข้อความคำตอบของผู้แจ้งเหตุ",
  "panicDelta": -10 ถึง +15,
  "revealsLocation": true หรือ false
}`;

  try {
    const contents = [
      {
        role: 'user',
        parts: [{ text: `ประวัติการคุย:\n${history.map(m => `${m.sender}: ${m.text}`).join('\n')}\n\nคำพูดล่าสุดจาก Dispatcher (ผู้เล่น): "${playerMessage}"` }]
      }
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 1.1,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    return JSON.parse(candidateText);
  } catch (err) {
    console.warn('Gemini API call failed, falling back to procedural engine:', err);
    return null;
  }
}

