import { prng } from './prng';

export const getBaseColor = (worldX, worldZ, tileData, filters) => {
  const tileY = -worldZ;
  // Base Procedural Grass Color
  const rand = prng(worldX, tileY);
  let r = 0.15 + (rand * 0.05);
  let g = 0.65 + (rand * 0.20);
  let b = 0.30 + (rand * 0.15);

  // FOW (Age of Empires Style): Unexplored tiles are the same terrain, just unlit/darkened
  if (!tileData) {
    return { r: r * 0.1, g: g * 0.1, b: b * 0.1 };
  }

  // Phase 8: Dynamic Highlighting (Overrides all other colors)
  if (filters && filters.highlightAlliance && tileData.allianceName) {
    if (tileData.allianceName.toUpperCase() === filters.highlightAlliance.toUpperCase()) {
      return { r: 1.0, g: 0.0, b: 0.33 }; // #ff0055 Neon Red
    }
  }
  if (filters && filters.showOnly15Croppers) {
    // Mock logic for 15-croppers: in this fakeData we will highlight Crop Oasis for now
    if (tileData.isOasis && tileData.oasisType && tileData.oasisType.toLowerCase().includes('crop')) {
      return { r: 0.98, g: 1.0, b: 0.0 }; // #fbff00 Neon Yellow
    }
  }

  // Tactical & Terrain Overrides
  if (tileData.isOasis || tileData.oasisType) {
    // Oasis (Yellowish/Brownish tints depending on type, simplified)
    const type = (tileData.oasisType || "").toLowerCase();
    if (type.includes("wood")) { r += 0.2; g -= 0.1; b -= 0.2; } // Brownish
    else if (type.includes("crop") || type.includes("wheat")) { r += 0.3; g += 0.3; b -= 0.1; } // Yellowish
    else if (type.includes("iron")) { r += 0.1; g -= 0.2; b += 0.1; } // Darker
    else if (type.includes("clay")) { r += 0.3; g += 0.1; b -= 0.1; } // Orangeish
    else { r += 0.1; g += 0.1; b += 0.2; } // Water/Generic Oasis
  } else if (tileData.villageId || tileData.playerId) {
    // Village Tactical Borders (Placeholder implementation)
    const alliance = (tileData.allianceName || "").toUpperCase();
    if (alliance === "NULL" || alliance === "TRINITIUM") { // Assume confederation
      r = 0.1; g = 0.3; b = 0.9; // Blue for allies
    } else if (alliance !== "") {
      r = 0.9; g = 0.2; b = 0.2; // Red for enemies/others
    } else {
      r = 0.5; g = 0.5; b = 0.5; // Grey for no-alliance/abandoned
    }
  }

  // Clamp values
  return {
    r: Math.min(1, Math.max(0, r)),
    g: Math.min(1, Math.max(0, g)),
    b: Math.min(1, Math.max(0, b))
  };
};
