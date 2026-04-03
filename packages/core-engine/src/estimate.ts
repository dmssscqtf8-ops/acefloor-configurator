import type { RoomPreview } from "./layout-preview";
import { toInches, type Unit } from "./units";

export type RectangleEstimateInput = {
  roomWidth: number;
  roomLength: number;
  unit: Unit;
  tileWidthIn: number;
  tileHeightIn: number;
  wastePercent: number;
  pricePerTile: number;
  includePerimeterBorders?: boolean;
};

export type RectangleEstimate = {
  roomWidthIn: number;
  roomLengthIn: number;
  areaSqFt: number;
  columns: number;
  rows: number;
  fullTiles: number;
  wasteTiles: number;
  totalTiles: number;
  borderLinearFeet: number;
  garageDoorEdgeFullPieces: number;
  garageDoorEdgeCutPieces: number;
  garageDoorEdgeTotalPieces: number;
  garageDoorOffsetIn: number;
  garageDoorLeftTileCuts: number;
  garageDoorRightTileCuts: number;
  garageDoorFrontTileCutsTotal: number;
  garageDoorSideTileCutsPerSide: number;
  garageDoorOpeningWidthIn: number;
  garageDoorTileCoverageSqFt: number;
  tileSubtotal: number;
  borderEstimate: number;
  totalEstimate: number;
};

export function computeRectangleEstimate(
  input: RectangleEstimateInput,
): RectangleEstimate {
  const roomWidthIn = toInches(input.roomWidth, input.unit);
  const roomLengthIn = toInches(input.roomLength, input.unit);

  const columns = Math.ceil(roomWidthIn / input.tileWidthIn);
  const rows = Math.ceil(roomLengthIn / input.tileHeightIn);
  const fullTiles = columns * rows;
  const wasteTiles = Math.ceil(fullTiles * (input.wastePercent / 100));
  const totalTiles = fullTiles + wasteTiles;
  const areaSqFt = (roomWidthIn * roomLengthIn) / 144;
  const borderLinearFeet = input.includePerimeterBorders
    ? (2 * (roomWidthIn + roomLengthIn)) / 12
    : 0;
  const tileSubtotal = totalTiles * input.pricePerTile;
  const borderEstimate = input.includePerimeterBorders
    ? borderLinearFeet * 4.5
    : 0;
  const totalEstimate = tileSubtotal + borderEstimate;

  return {
    roomWidthIn,
    roomLengthIn,
    areaSqFt,
    columns,
    rows,
    fullTiles,
    wasteTiles,
    totalTiles,
    borderLinearFeet,
    garageDoorEdgeFullPieces: 0,
    garageDoorEdgeCutPieces: 0,
    garageDoorEdgeTotalPieces: 0,
    garageDoorOffsetIn: 0,
    garageDoorLeftTileCuts: 0,
    garageDoorRightTileCuts: 0,
    garageDoorFrontTileCutsTotal: 0,
    garageDoorSideTileCutsPerSide: 0,
    garageDoorOpeningWidthIn: 0,
    garageDoorTileCoverageSqFt: 0,
    tileSubtotal,
    borderEstimate,
    totalEstimate,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function computeEstimateFromPreview(input: {
  preview: RoomPreview;
  wastePercent: number;
  pricePerTile: number;
  includePerimeterBorders?: boolean;
}): RectangleEstimate {
  const activeCells = input.preview.cells.filter((cell) => !cell.fullyExcluded);
  const fullTiles = activeCells.filter((cell) => !cell.isCut).length;
  const cutTiles = activeCells.filter((cell) => cell.isCut).length;
  const wasteTiles = Math.ceil(activeCells.length * (input.wastePercent / 100));
  const totalTiles = activeCells.length + wasteTiles;
  const borderLinearFeet = input.includePerimeterBorders
    ? (2 * (input.preview.roomWidthIn + input.preview.roomLengthIn)) / 12
    : 0;
  const tileSubtotal = totalTiles * input.pricePerTile;
  const borderEstimate = input.includePerimeterBorders
    ? borderLinearFeet * 4.5
    : 0;
  const totalEstimate = tileSubtotal + borderEstimate;

  return {
    roomWidthIn: input.preview.roomWidthIn,
    roomLengthIn: input.preview.roomLengthIn,
    areaSqFt: input.preview.usableAreaSqFt,
    columns: input.preview.columns,
    rows: input.preview.rows,
    fullTiles,
    wasteTiles: wasteTiles + cutTiles,
    totalTiles,
    borderLinearFeet,
    garageDoorEdgeFullPieces: input.preview.garageDoor.fullEdgePieces,
    garageDoorEdgeCutPieces: input.preview.garageDoor.cutEdgePieces,
    garageDoorEdgeTotalPieces: input.preview.garageDoor.totalEdgePieces,
    garageDoorOffsetIn: input.preview.garageDoor.offsetFromLeftIn,
    garageDoorLeftTileCuts: input.preview.garageDoor.leftTileCutPieces,
    garageDoorRightTileCuts: input.preview.garageDoor.rightTileCutPieces,
    garageDoorFrontTileCutsTotal: input.preview.garageDoor.totalFrontTileCutPieces,
    garageDoorSideTileCutsPerSide: input.preview.garageDoor.sideTileCutsPerSide,
    garageDoorOpeningWidthIn: input.preview.garageDoor.openingWidthIn,
    garageDoorTileCoverageSqFt: input.preview.garageDoor.tileCoverageAreaSqFt,
    tileSubtotal,
    borderEstimate,
    totalEstimate,
  };
}
