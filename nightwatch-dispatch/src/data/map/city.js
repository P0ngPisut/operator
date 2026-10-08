// World definition for the painted city map in public/nightwatch-city-map.jpg.
// World origin is the top-left pixel of the image; 1 image pixel ≈ 3.63 m.
export const CITY = Object.freeze({
  id: 'BKK',
  name: 'BANGKOK',
  widthM: 10000,
  heightM: 5580,
  cellSizeM: 100,
  gridColumns: 100,
  gridRows: 56,
  baseMapUrl: '/nightwatch-city-map.jpg',
});

const DISTRICT_WIDTH_M = 2500;
const DISTRICT_HEIGHT_M = 1395;
const SECTOR_COLUMNS = 5;
const SECTOR_ROWS = 3;

// Fictional planning districts laid over the painted map (4 columns × 4 rows).
const DISTRICT_LAYOUT = [
  { id: 'D01', name: 'NORTH FARMLAND', column: 0, row: 0, type: 'RURAL' },
  { id: 'D02', name: 'RIVER NORTHWEST', column: 1, row: 0, type: 'CURVY_GRID' },
  { id: 'D03', name: 'NORTH GATE', column: 2, row: 0, type: 'SUPER_GRID' },
  { id: 'D04', name: 'NORTHEAST HILLS', column: 3, row: 0, type: 'SUBURBAN' },
  { id: 'D05', name: 'WEST INDUSTRIAL', column: 0, row: 1, type: 'INDUSTRIAL' },
  { id: 'D06', name: 'OLD TOWN WEST', column: 1, row: 1, type: 'HISTORIC_CORE' },
  { id: 'D07', name: 'OLD TOWN · RADIAL CORE', column: 2, row: 1, type: 'HISTORIC_CORE' },
  { id: 'D08', name: 'EAST RIVERSIDE', column: 3, row: 1, type: 'MIXED_URBAN' },
  { id: 'D09', name: 'SOUTHWEST LOGISTICS', column: 0, row: 2, type: 'INDUSTRIAL' },
  { id: 'D10', name: 'RING SOUTHWEST', column: 1, row: 2, type: 'MIXED_URBAN' },
  { id: 'D11', name: 'SOUTH CROSSING', column: 2, row: 2, type: 'MIXED_URBAN' },
  { id: 'D12', name: 'EAST GARDENS', column: 3, row: 2, type: 'CITY_IN_A_GARDEN' },
  { id: 'D13', name: 'HIGHWAY SOUTHWEST', column: 0, row: 3, type: 'RURAL' },
  { id: 'D14', name: 'SOUTH GRID', column: 1, row: 3, type: 'SUPER_GRID' },
  { id: 'D15', name: 'SOUTH PARKS', column: 2, row: 3, type: 'CITY_IN_A_GARDEN' },
  { id: 'D16', name: 'SOUTHEAST SUBURBS', column: 3, row: 3, type: 'SUBURBAN' },
];

export const DISTRICTS = DISTRICT_LAYOUT.map(({ column, row, ...district }) => {
  const minX = column * DISTRICT_WIDTH_M;
  const minY = row * DISTRICT_HEIGHT_M;
  const maxX = Math.min(CITY.widthM, minX + DISTRICT_WIDTH_M);
  const maxY = Math.min(CITY.heightM, minY + DISTRICT_HEIGHT_M);
  const sectorWidth = (maxX - minX) / SECTOR_COLUMNS;
  const sectorHeight = (maxY - minY) / SECTOR_ROWS;
  return {
    ...district,
    cityId: CITY.id,
    minX,
    minY,
    maxX,
    maxY,
    sectors: Array.from({ length: SECTOR_COLUMNS * SECTOR_ROWS }, (_, index) => {
      const sectorColumn = index % SECTOR_COLUMNS;
      const sectorRow = Math.floor(index / SECTOR_COLUMNS);
      const sectorMinX = minX + sectorColumn * sectorWidth;
      const sectorMinY = minY + sectorRow * sectorHeight;
      return {
        id: `${district.id}-S${String(index + 1).padStart(2, '0')}`,
        districtId: district.id,
        name: `SECTOR-${String(index + 1).padStart(2, '0')}`,
        minX: sectorMinX,
        minY: sectorMinY,
        maxX: sectorMinX + sectorWidth,
        maxY: sectorMinY + sectorHeight,
      };
    }),
  };
});

export function findDistrict(worldX, worldY) {
  return DISTRICTS.find(({ minX, minY, maxX, maxY }) => worldX >= minX && worldX < maxX && worldY >= minY && worldY < maxY) || null;
}

export function getMapLocation(worldX, worldY) {
  const x = Math.min(CITY.widthM - 1, Math.max(0, worldX));
  const y = Math.min(CITY.heightM - 1, Math.max(0, worldY));
  const district = findDistrict(x, y);
  const sector = district?.sectors?.find(({ minX, minY, maxX, maxY }) => x >= minX && x < maxX && y >= minY && y < maxY) || district?.sectors?.[0];
  const cellColumn = Math.floor(x / CITY.cellSizeM);
  const cellRow = Math.floor(y / CITY.cellSizeM);
  return {
    district,
    sector,
    blockId: `B-${String(cellColumn).padStart(3, '0')}-${String(cellRow).padStart(3, '0')}`,
    cellColumn,
    cellRow,
  };
}
