import type { RoomPreview } from "./layout-preview";
import { toInches, type Unit } from "./units";

export type RectangleEstimateInput = {
  roomWidth: number;
  roomLength: number;
  unit: Unit;
  tileWidthIn: number;
  tileHeightIn: number;
  tileAreaSqFt?: number;
  pricePerSqFt: number;
  includePerimeterBorders?: boolean;
  tilesPerBox?: number;
};

export type RectangleEstimate = {
  roomWidthIn: number;
  roomLengthIn: number;
  areaSqFt: number;
  columns: number;
  rows: number;
  fullTiles: number;
  cutTiles: number;
  installTiles: number;
  billableAreaSqFt: number;
  materialPricePerSqFt: number;
  wasteTiles: number;
  wasteReserveTiles: number;
  totalTiles: number;
  tilesPerBox: number;
  boxesRequired: number;
  tileAreaSqFt: number;
  boxCoverageSqFt: number;
  orderedTileCoverageSqFt: number;
  orderedBoxCoverageSqFt: number;
  coverageOverageSqFt: number;
  boxOverageTiles: number;
  layoutEfficiencyPercent: number;
  complexityScore: number;
  complexityLabel: string;
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
  const fullColumns = Math.floor(roomWidthIn / input.tileWidthIn);
  const fullRows = Math.floor(roomLengthIn / input.tileHeightIn);
  const fullTiles = fullColumns * fullRows;
  const installTiles = columns * rows;
  const cutTiles = Math.max(installTiles - fullTiles, 0);
  const areaSqFt = (roomWidthIn * roomLengthIn) / 144;
  const borderLinearFeet = input.includePerimeterBorders
    ? (2 * (roomWidthIn + roomLengthIn)) / 12
    : 0;
  const commercialMetrics = buildCommercialMetrics({
    areaSqFt,
    fullTiles,
    cutTiles,
    tileWidthIn: input.tileWidthIn,
    tileHeightIn: input.tileHeightIn,
    tileAreaSqFt: input.tileAreaSqFt,
    tilesPerBox: input.tilesPerBox,
    obstacleCount: 0,
    garageDoorEnabled: false,
  });
  const tileSubtotal = roundCurrency(
    commercialMetrics.billableAreaSqFt * input.pricePerSqFt,
  );
  const borderEstimate = 0;
  const totalEstimate = tileSubtotal + borderEstimate;

  return {
    roomWidthIn,
    roomLengthIn,
    areaSqFt,
    columns,
    rows,
    fullTiles,
    cutTiles,
    installTiles,
    billableAreaSqFt: commercialMetrics.billableAreaSqFt,
    materialPricePerSqFt: input.pricePerSqFt,
    wasteTiles: 0,
    wasteReserveTiles: 0,
    totalTiles: commercialMetrics.totalTiles,
    tilesPerBox: commercialMetrics.tilesPerBox,
    boxesRequired: commercialMetrics.boxesRequired,
    tileAreaSqFt: commercialMetrics.tileAreaSqFt,
    boxCoverageSqFt: commercialMetrics.boxCoverageSqFt,
    orderedTileCoverageSqFt: commercialMetrics.orderedTileCoverageSqFt,
    orderedBoxCoverageSqFt: commercialMetrics.orderedBoxCoverageSqFt,
    coverageOverageSqFt: commercialMetrics.coverageOverageSqFt,
    boxOverageTiles: commercialMetrics.boxOverageTiles,
    layoutEfficiencyPercent: commercialMetrics.layoutEfficiencyPercent,
    complexityScore: commercialMetrics.complexityScore,
    complexityLabel: commercialMetrics.complexityLabel,
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
  tileAreaSqFt?: number;
  pricePerSqFt: number;
  includePerimeterBorders?: boolean;
  tilesPerBox?: number;
}): RectangleEstimate {
  const additionalGarageDoorEdgePieces = input.preview.exteriorDoors
    .filter((door) => door.kind === "garage")
    .reduce((total, door) => total + door.totalEdgePieces, 0);
  const activeCells = input.preview.cells.filter((cell) => !cell.fullyExcluded);
  const fullTiles = activeCells.filter((cell) => !cell.isCut).length;
  const cutTiles = activeCells.filter((cell) => cell.isCut).length;
  const installTiles = activeCells.length;
  const borderLinearFeet = input.includePerimeterBorders
    ? (2 * (input.preview.roomWidthIn + input.preview.roomLengthIn)) / 12
    : 0;
  const commercialMetrics = buildCommercialMetrics({
    areaSqFt: input.preview.usableAreaSqFt,
    fullTiles,
    cutTiles,
    tileWidthIn: input.preview.tileWidthIn,
    tileHeightIn: input.preview.tileHeightIn,
    tileAreaSqFt: input.tileAreaSqFt,
    tilesPerBox: input.tilesPerBox,
    obstacleCount: input.preview.obstacles.length,
    garageDoorEnabled: input.preview.garageDoor.enabled,
  });
  const tileSubtotal = roundCurrency(
    commercialMetrics.billableAreaSqFt * input.pricePerSqFt,
  );
  const borderEstimate = 0;
  const totalEstimate = tileSubtotal + borderEstimate;

  return {
    roomWidthIn: input.preview.roomWidthIn,
    roomLengthIn: input.preview.roomLengthIn,
    areaSqFt: input.preview.usableAreaSqFt,
    columns: input.preview.columns,
    rows: input.preview.rows,
    fullTiles,
    cutTiles,
    installTiles,
    billableAreaSqFt: commercialMetrics.billableAreaSqFt,
    materialPricePerSqFt: input.pricePerSqFt,
    wasteTiles: 0,
    wasteReserveTiles: 0,
    totalTiles: commercialMetrics.totalTiles,
    tilesPerBox: commercialMetrics.tilesPerBox,
    boxesRequired: commercialMetrics.boxesRequired,
    tileAreaSqFt: commercialMetrics.tileAreaSqFt,
    boxCoverageSqFt: commercialMetrics.boxCoverageSqFt,
    orderedTileCoverageSqFt: commercialMetrics.orderedTileCoverageSqFt,
    orderedBoxCoverageSqFt: commercialMetrics.orderedBoxCoverageSqFt,
    coverageOverageSqFt: commercialMetrics.coverageOverageSqFt,
    boxOverageTiles: commercialMetrics.boxOverageTiles,
    layoutEfficiencyPercent: commercialMetrics.layoutEfficiencyPercent,
    complexityScore: commercialMetrics.complexityScore,
    complexityLabel: commercialMetrics.complexityLabel,
    borderLinearFeet,
    garageDoorEdgeFullPieces:
      input.preview.garageDoor.fullEdgePieces + additionalGarageDoorEdgePieces,
    garageDoorEdgeCutPieces: input.preview.garageDoor.cutEdgePieces,
    garageDoorEdgeTotalPieces:
      input.preview.garageDoor.totalEdgePieces + additionalGarageDoorEdgePieces,
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

function buildCommercialMetrics(input: {
  areaSqFt: number;
  fullTiles: number;
  cutTiles: number;
  tileWidthIn: number;
  tileHeightIn: number;
  tileAreaSqFt?: number;
  tilesPerBox?: number;
  obstacleCount: number;
  garageDoorEnabled: boolean;
}) {
  const installTiles = Math.max(input.fullTiles + input.cutTiles, 0);
  const tileAreaSqFt =
    input.tileAreaSqFt ?? (input.tileWidthIn * input.tileHeightIn) / 144;
  const layoutEfficiencyPercent =
    installTiles > 0 && tileAreaSqFt > 0
      ? roundToOneDecimal(
          Math.min(100, (input.areaSqFt / (installTiles * tileAreaSqFt)) * 100),
        )
      : 100;
  const cutRatio = installTiles > 0 ? input.cutTiles / installTiles : 0;
  const complexityScore = roundToOneDecimal(
    cutRatio * 10 +
      Math.min(input.obstacleCount * 1, 4) +
      (input.garageDoorEnabled ? 1.5 : 0),
  );
  const billableAreaSqFt = installTiles * tileAreaSqFt;
  const totalTiles = installTiles;
  const tilesPerBox = Math.max(1, Math.floor(input.tilesPerBox ?? 1));
  const boxesRequired =
    totalTiles > 0 ? Math.max(1, Math.ceil(totalTiles / tilesPerBox)) : 0;
  const boxCoverageSqFt = tileAreaSqFt * tilesPerBox;
  const orderedTileCoverageSqFt = totalTiles * tileAreaSqFt;
  const orderedBoxCoverageSqFt = boxesRequired * boxCoverageSqFt;
  const coverageOverageSqFt = Math.max(
    0,
    roundToOneDecimal(orderedBoxCoverageSqFt - input.areaSqFt),
  );
  const boxOverageTiles =
    boxesRequired > 0 ? boxesRequired * tilesPerBox - totalTiles : 0;

  return {
    billableAreaSqFt: roundToOneDecimal(billableAreaSqFt),
    totalTiles,
    tilesPerBox,
    boxesRequired,
    tileAreaSqFt: roundToThreeDecimals(tileAreaSqFt),
    boxCoverageSqFt: roundToOneDecimal(boxCoverageSqFt),
    orderedTileCoverageSqFt: roundToOneDecimal(orderedTileCoverageSqFt),
    orderedBoxCoverageSqFt: roundToOneDecimal(orderedBoxCoverageSqFt),
    coverageOverageSqFt,
    boxOverageTiles,
    layoutEfficiencyPercent,
    complexityScore,
    complexityLabel: getComplexityLabel(complexityScore),
  };
}

function getComplexityLabel(score: number): string {
  if (score >= 7.5) {
    return "Tres technique";
  }

  if (score >= 5) {
    return "Complexe";
  }

  if (score >= 2.5) {
    return "Standard";
  }

  return "Simple";
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundToThreeDecimals(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
