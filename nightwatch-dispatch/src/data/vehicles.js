export const BASE_LOCATIONS = Object.freeze({
  police: { x: 3500, y: 13124, label: 'POLICE HQ' },
  fire: { x: 7500, y: 13374, label: 'FIRE HQ' },
  medical: { x: 15500, y: 7374, label: 'EMS HQ' },
});

export const VEHICLE_CATALOG = Object.freeze({
  police: {
    A: { id: 'RAPID_BIKE', name: 'INTERCEPTOR BIKE', desc: 'มอเตอร์ไซค์ตรวจการณ์คล่องตัว', speedKph: 82, widthM: 1.1, crewMin: 1, crewMax: 2, capacity: 1, purchaseCost: 800, minLevel: 1 },
    S: { id: 'PATROL_SEDAN', name: 'PATROL SEDAN', desc: 'รถสายตรวจเกราะบาง', speedKph: 65, widthM: 1.9, crewMin: 2, crewMax: 2, capacity: 2, purchaseCost: 4500, minLevel: 1 },
    D: { id: 'SWAT_CARRIER', name: 'SWAT CARRIER', desc: 'รถหุ้มเกราะและขนย้ายผู้ต้องหา', speedKph: 42, widthM: 2.8, crewMin: 4, crewMax: 6, capacity: 10, purchaseCost: 30000, minLevel: 4 },
  },
  fire: {
    A: { id: 'MINI_PUMPER', name: 'MINI PUMPER', desc: 'รถดับเพลิงขนาดเล็ก เข้าถนนแคบ', speedKph: 58, widthM: 2.2, crewMin: 2, crewMax: 5, capacity: 3, purchaseCost: 6000, minLevel: 1 },
    S: { id: 'TYPE1_PUMPER', name: 'TYPE 1 PUMPER', desc: 'รถดับเพลิงมาตรฐาน น้ำ 800 gal', speedKph: 48, widthM: 2.5, crewMin: 4, crewMax: 6, capacity: 5, purchaseCost: 10000, minLevel: 2 },
    D: { id: 'WATER_TANKER_12000', name: 'WATER TANKER', desc: 'รถบรรทุกน้ำ 12,000 gal', speedKph: 36, widthM: 3.2, crewMin: 2, crewMax: 4, capacity: 2, purchaseCost: 18000, minLevel: 3 },
  },
  medical: {
    A: { id: 'RAPID_AMBULANCE', name: 'RAPID AMBULANCE', desc: 'รถพยาบาลฉุกเฉิน เข้าถึงเหตุเร็ว', speedKph: 76, widthM: 2, crewMin: 1, crewMax: 2, capacity: 2, purchaseCost: 7000, minLevel: 1 },
    S: { id: 'RESPONSE_VAN', name: 'RESPONSE VAN', desc: 'รถแพทย์ตอบสนองเร็ว', speedKph: 59, widthM: 2.3, crewMin: 1, crewMax: 4, capacity: 2, purchaseCost: 10000, minLevel: 2 },
    D: { id: 'MASS_CASUALTY_UNIT', name: 'MASS CASUALTY UNIT', desc: 'หน่วยแพทย์รองรับผู้ป่วย 4 คน', speedKph: 42, widthM: 2.8, crewMin: 1, crewMax: 6, capacity: 4, purchaseCost: 18000, minLevel: 3 },
  },
});