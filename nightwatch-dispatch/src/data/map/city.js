export const CITY = Object.freeze({
  id: 'BKK',
  name: 'BANGKOK',
  widthM: 20000,
  heightM: 20000,
  cellSizeM: 400,
  gridColumns: 50,
  gridRows: 50,
});

const DISTRICT_LAYOUT = [
  { id: 'D01', name: 'BANGKOK NORTHWEST', minX: 0, minY: 0 },
  { id: 'D02', name: 'BANGKOK NORTHEAST', minX: 10000, minY: 0 },
  { id: 'D03', name: 'BANGKOK SOUTHWEST', minX: 0, minY: 10000 },
  { id: 'D04', name: 'BANGKOK SOUTHEAST', minX: 10000, minY: 10000 },
];

export const DISTRICTS = DISTRICT_LAYOUT.map((district) => ({
  ...district,
  cityId: CITY.id,
  maxX: district.minX + 10000,
  maxY: district.minY + 10000,
  sectors: Array.from({ length: 25 }, (_, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    const minX = district.minX + column * 2000;
    const minY = district.minY + row * 2000;

    return {
      id: `${district.id}-S${String(index + 1).padStart(2, '0')}`,
      districtId: district.id,
      name: `SECTOR-${String(index + 1).padStart(2, '0')}`,
      minX,
      minY,
      maxX: minX + 2000,
      maxY: minY + 2000,
    };
  }),
}));

export function getMapLocation(worldX, worldY) {
  const x = Math.min(CITY.widthM - 1, Math.max(0, worldX));
  const y = Math.min(CITY.heightM - 1, Math.max(0, worldY));
  const district = DISTRICTS.find(({ minX, minY, maxX, maxY }) => (
    x >= minX && x < maxX && y >= minY && y < maxY
  ));
  const sector = district?.sectors?.find(({ minX, minY, maxX, maxY }) => (
    x >= minX && x < maxX && y >= minY && y < maxY
  )) || district?.sectors?.[0];

  return {
    district,
    sector,
    blockId: `B-${String(Math.floor(x / CITY.cellSizeM)).padStart(3, '0')}-${String(Math.floor(y / CITY.cellSizeM)).padStart(3, '0')}`,
    cellColumn: Math.floor(x / CITY.cellSizeM),
    cellRow: Math.floor(y / CITY.cellSizeM),
  };
}
