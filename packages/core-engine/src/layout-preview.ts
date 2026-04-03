import { toInches, type Unit } from "./units";

export type LayoutPattern = "solid" | "checker" | "border" | "manual";
export type RoomShape = "rectangle" | "l-shape";
export type PreviewCellRole = "primary" | "secondary";

export type ObstacleInput = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExteriorDoorKind = "garage" | "man";
export type ExteriorDoorWall = "left" | "right" | "bottom";
export type ExteriorDoorInput = {
  id: string;
  kind: ExteriorDoorKind;
  wall: ExteriorDoorWall;
  width: number;
  offset: number;
};

export type PreviewObstacle = {
  id: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
};

export type PreviewExteriorDoor = {
  id: string;
  kind: ExteriorDoorKind;
  wall: ExteriorDoorWall;
  openingWidthIn: number;
  offsetFromOriginIn: number;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  setbackDepthIn: number;
  alignedStartIn: number;
  alignedEndIn: number;
  alignedSpanIn: number;
  fullEdgePieces: number;
  cutEdgePieces: number;
  totalEdgePieces: number;
  concreteGapAreaSqFt: number;
  excludedAreaSqFt: number;
};

export type PreviewCutout = {
  widthIn: number;
  lengthIn: number;
  areaSqFt: number;
};

export type PreviewGarageDoor = {
  enabled: boolean;
  openingWidthIn: number;
  offsetFromLeftIn: number;
  xIn: number;
  yIn: number;
  setbackDepthIn: number;
  edgeDepthIn: number;
  edgeWidthIn: number;
  doorThicknessIn: number;
  fullEdgePieces: number;
  cutEdgePieces: number;
  totalEdgePieces: number;
  cutEdgeWidthIn: number;
  sideLeftWidthIn: number;
  sideRightWidthIn: number;
  leftTileCutPieces: number;
  rightTileCutPieces: number;
  totalFrontTileCutPieces: number;
  sideTileCutsPerSide: number;
  tileCoverageAreaSqFt: number;
};

export type PreviewCell = {
  row: number;
  column: number;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  role: PreviewCellRole;
  isCut: boolean;
  overlapAreaIn2: number;
  usableAreaIn2: number;
  fullyExcluded: boolean;
};

export type RoomPreviewInput = {
  roomWidth: number;
  roomLength: number;
  unit: Unit;
  tileWidthIn: number;
  tileHeightIn: number;
  pattern: LayoutPattern;
  shape?: RoomShape;
  cutoutWidth?: number;
  cutoutLength?: number;
  garageDoorEnabled?: boolean;
  garageDoorWidth?: number;
  garageDoorOffset?: number;
  obstacles?: ObstacleInput[];
  exteriorDoors?: ExteriorDoorInput[];
};

export type RoomPreview = {
  shape: RoomShape;
  roomWidthIn: number;
  roomLengthIn: number;
  tileWidthIn: number;
  tileHeightIn: number;
  columns: number;
  rows: number;
  obstacles: PreviewObstacle[];
  exteriorDoors: PreviewExteriorDoor[];
  cells: PreviewCell[];
  cutout: PreviewCutout;
  garageDoor: PreviewGarageDoor;
  grossAreaSqFt: number;
  shapeAreaSqFt: number;
  excludedAreaSqFt: number;
  usableAreaSqFt: number;
  footprintPointsIn: number[];
};

export type RectanglePreviewInput = Omit<
  RoomPreviewInput,
  "shape" | "cutoutWidth" | "cutoutLength"
>;

export type RectanglePreview = RoomPreview;

type ExclusionRect = {
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
};

export function buildRoomPreview(input: RoomPreviewInput): RoomPreview {
  const roomWidthIn = toInches(input.roomWidth, input.unit);
  const roomLengthIn = toInches(input.roomLength, input.unit);
  const shape = input.shape ?? "rectangle";
  const cutout = normalizeCutout(
    shape,
    input.cutoutWidth ?? 0,
    input.cutoutLength ?? 0,
    input.unit,
    roomWidthIn,
    roomLengthIn,
  );
  const garageDoor = normalizeGarageDoor(
    input.garageDoorEnabled ?? false,
    input.garageDoorWidth ?? 0,
    input.garageDoorOffset,
    input.unit,
    roomWidthIn,
    input.tileWidthIn,
  );
  const exteriorDoors = normalizeExteriorDoors(
    input.exteriorDoors ?? [],
    input.unit,
    roomWidthIn,
    roomLengthIn,
    input.tileWidthIn,
    input.tileHeightIn,
    garageDoor.setbackDepthIn,
  );
  const obstacles = normalizeObstacles(
    input.obstacles ?? [],
    input.unit,
    roomWidthIn,
    roomLengthIn,
  );
  const columns = Math.max(1, Math.ceil(roomWidthIn / input.tileWidthIn));
  const lastColumnWidthIn =
    columns <= 1
      ? roomWidthIn
      : roomWidthIn - input.tileWidthIn * Math.max(columns - 1, 0);
  const leftOuterColumnCount = 1;
  const rightOuterColumnCount = 1;
  const rightSecondaryInsetColumns =
    lastColumnWidthIn < input.tileWidthIn - 0.001 ? 2 : 1;
  const mainStartYIn = garageDoor.enabled ? garageDoor.setbackDepthIn : 0;
  const mainRows = Math.max(
    0,
    Math.ceil(Math.max(roomLengthIn - mainStartYIn, 0) / input.tileHeightIn),
  );
  const rows = Math.max(mainRows + (garageDoor.enabled ? 1 : 0), 1);
  const cells: PreviewCell[] = [];
  let excludedAreaIn2 = garageDoor.enabled
    ? garageDoor.openingWidthIn * garageDoor.setbackDepthIn
    : 0;
  let usableAreaIn2 = 0;

  const exclusionRects: ExclusionRect[] = [
    ...(cutout.widthIn > 0 && cutout.lengthIn > 0
      ? [
          {
            xIn: roomWidthIn - cutout.widthIn,
            yIn: 0,
            widthIn: cutout.widthIn,
            heightIn: cutout.lengthIn,
          },
        ]
      : []),
    ...exteriorDoors
      .filter((door) => door.kind === "garage" && door.excludedAreaSqFt > 0)
      .map((door) => ({
        xIn: door.xIn,
        yIn: door.yIn,
        widthIn: door.widthIn,
        heightIn: door.heightIn,
      })),
    ...obstacles,
  ];

  if (garageDoor.enabled && garageDoor.setbackDepthIn > 0) {
    const frontSegments = [
      { startX: 0, endX: garageDoor.xIn },
      {
        startX: garageDoor.xIn + garageDoor.openingWidthIn,
        endX: roomWidthIn,
      },
    ].filter((segment) => segment.endX - segment.startX > 0.001);

    for (let column = 0; column < columns; column += 1) {
      const columnXIn = column * input.tileWidthIn;
      const columnWidthIn = Math.min(
        input.tileWidthIn,
        Math.max(roomWidthIn - columnXIn, 0),
      );

      frontSegments.forEach((segment) => {
        const frontCellXIn = Math.max(columnXIn, segment.startX);
        const frontCellEndXIn = Math.min(
          columnXIn + columnWidthIn,
          segment.endX,
        );
        const frontCellWidthIn = frontCellEndXIn - frontCellXIn;

        if (frontCellWidthIn <= 0.001) return;

        const excludedAreaIn2Ref = { value: excludedAreaIn2 };
        const usableAreaIn2Ref = { value: usableAreaIn2 };

        pushPreviewCell({
          cells,
          exclusionRects,
          roomWidthIn,
          roomLengthIn,
          totalColumns: columns,
          leftOuterColumnCount,
          rightOuterColumnCount,
          rightSecondaryInsetColumns,
          topSecondRow: 1,
          bottomOuterRow: Math.max(mainRows - 1, 0),
          bottomSecondRow: Math.max(mainRows - 2, 0),
          tileWidthIn: input.tileWidthIn,
          tileHeightIn: input.tileHeightIn,
          pattern: input.pattern,
          row: -1,
          patternRow: 0,
          column,
          xIn: frontCellXIn,
          yIn: 0,
          widthIn: frontCellWidthIn,
          heightIn: garageDoor.setbackDepthIn,
          excludedAreaIn2Ref,
          usableAreaIn2Ref,
        });

        excludedAreaIn2 = excludedAreaIn2Ref.value;
        usableAreaIn2 = usableAreaIn2Ref.value;
      });
    }
  }

  for (let row = 0; row < mainRows; row += 1) {
    const yIn = mainStartYIn + row * input.tileHeightIn;
    const remainingHeight = Math.max(roomLengthIn - yIn, 0);
    const heightIn = Math.min(input.tileHeightIn, remainingHeight);

    for (let column = 0; column < columns; column += 1) {
      const xIn = column * input.tileWidthIn;
      const remainingWidth = Math.max(roomWidthIn - xIn, 0);
      const widthIn = Math.min(input.tileWidthIn, remainingWidth);
      const excludedAreaIn2Ref = { value: excludedAreaIn2 };
      const usableAreaIn2Ref = { value: usableAreaIn2 };

      pushPreviewCell({
        cells,
        exclusionRects,
        roomWidthIn,
        roomLengthIn,
        totalColumns: columns,
        leftOuterColumnCount,
        rightOuterColumnCount,
        rightSecondaryInsetColumns,
        topSecondRow: 1,
        bottomOuterRow: Math.max(mainRows - 1, 0),
        bottomSecondRow: Math.max(mainRows - 2, 0),
        tileWidthIn: input.tileWidthIn,
        tileHeightIn: input.tileHeightIn,
        pattern: input.pattern,
        row,
        patternRow: row,
        column,
        xIn,
        yIn,
        widthIn,
        heightIn,
        excludedAreaIn2Ref,
        usableAreaIn2Ref,
      });

      excludedAreaIn2 = excludedAreaIn2Ref.value;
      usableAreaIn2 = usableAreaIn2Ref.value;
    }
  }

  return {
    shape,
    roomWidthIn,
    roomLengthIn,
    tileWidthIn: input.tileWidthIn,
    tileHeightIn: input.tileHeightIn,
    columns,
    rows,
    obstacles,
    exteriorDoors,
    cells,
    cutout,
    garageDoor,
    grossAreaSqFt: (roomWidthIn * roomLengthIn) / 144,
    shapeAreaSqFt: (roomWidthIn * roomLengthIn) / 144 - cutout.areaSqFt,
    excludedAreaSqFt: excludedAreaIn2 / 144,
    usableAreaSqFt: usableAreaIn2 / 144,
    footprintPointsIn: buildFootprintPoints(shape, roomWidthIn, roomLengthIn, cutout),
  };
}

export function buildRectanglePreview(
  input: RectanglePreviewInput,
): RectanglePreview {
  return buildRoomPreview({
    ...input,
    shape: "rectangle",
    cutoutWidth: 0,
    cutoutLength: 0,
  });
}

function normalizeCutout(
  shape: RoomShape,
  cutoutWidth: number,
  cutoutLength: number,
  unit: Unit,
  roomWidthIn: number,
  roomLengthIn: number,
): PreviewCutout {
  if (shape !== "l-shape") {
    return {
      widthIn: 0,
      lengthIn: 0,
      areaSqFt: 0,
    };
  }

  const widthIn = clamp(
    toInches(Math.max(cutoutWidth, 0), unit),
    0,
    Math.max(roomWidthIn - 1, 0),
  );
  const lengthIn = clamp(
    toInches(Math.max(cutoutLength, 0), unit),
    0,
    Math.max(roomLengthIn - 1, 0),
  );

  if (widthIn <= 0 || lengthIn <= 0) {
    return {
      widthIn: 0,
      lengthIn: 0,
      areaSqFt: 0,
    };
  }

  return {
    widthIn,
    lengthIn,
    areaSqFt: (widthIn * lengthIn) / 144,
  };
}

function normalizeGarageDoor(
  enabled: boolean,
  garageDoorWidth: number,
  garageDoorOffset: number | undefined,
  unit: Unit,
  roomWidthIn: number,
  tileWidthIn: number,
): PreviewGarageDoor {
  const edgeDepthIn = 2.5;
  const doorThicknessIn = 2;
  const setbackDepthIn = edgeDepthIn + doorThicknessIn;
  const edgeWidthIn = 15.75;
  const openingWidthIn = enabled
    ? clamp(toInches(Math.max(garageDoorWidth, 0), unit), 0, roomWidthIn)
    : 0;
  const maxOffsetIn = Math.max(roomWidthIn - openingWidthIn, 0);
  const requestedOffsetIn =
    garageDoorOffset === undefined
      ? (roomWidthIn - openingWidthIn) / 2
      : toInches(Math.max(garageDoorOffset, 0), unit);
  const xIn = clamp(requestedOffsetIn, 0, maxOffsetIn);
  const fullEdgePieces = Math.floor(openingWidthIn / edgeWidthIn);
  const remainder = Math.max(openingWidthIn - fullEdgePieces * edgeWidthIn, 0);
  const cutEdgePieces = remainder > 0.01 ? 1 : 0;
  const leftWidthIn = xIn;
  const rightWidthIn = Math.max(roomWidthIn - (xIn + openingWidthIn), 0);
  const leftTileCutPieces = countIntersectingTileColumns(
    0,
    leftWidthIn,
    tileWidthIn,
    roomWidthIn,
  );
  const rightTileCutPieces = countIntersectingTileColumns(
    xIn + openingWidthIn,
    roomWidthIn,
    tileWidthIn,
    roomWidthIn,
  );

  return {
    enabled: enabled && openingWidthIn > 0,
    openingWidthIn,
    offsetFromLeftIn: xIn,
    xIn,
    yIn: 0,
    setbackDepthIn,
    edgeDepthIn,
    edgeWidthIn,
    doorThicknessIn,
    fullEdgePieces,
    cutEdgePieces,
    totalEdgePieces: fullEdgePieces + cutEdgePieces,
    cutEdgeWidthIn: cutEdgePieces === 1 ? remainder : 0,
    sideLeftWidthIn: leftWidthIn,
    sideRightWidthIn: rightWidthIn,
    leftTileCutPieces,
    rightTileCutPieces,
    totalFrontTileCutPieces: leftTileCutPieces + rightTileCutPieces,
    sideTileCutsPerSide: Math.max(leftTileCutPieces, rightTileCutPieces),
    tileCoverageAreaSqFt: (openingWidthIn * setbackDepthIn) / 144,
  };
}

function normalizeExteriorDoors(
  doors: ExteriorDoorInput[],
  unit: Unit,
  roomWidthIn: number,
  roomLengthIn: number,
  tileWidthIn: number,
  tileHeightIn: number,
  frontGarageSetbackIn: number,
): PreviewExteriorDoor[] {
  const setbackDepthIn = 4.5;
  const edgeWidthIn = 15.75;

  return doors
    .map((door) => {
      const spanLimitIn = door.wall === "bottom" ? roomWidthIn : roomLengthIn;
      const openingWidthIn = clamp(
        toInches(Math.max(door.width, 0), unit),
        0,
        spanLimitIn,
      );

      if (openingWidthIn <= 0.001) {
        return null;
      }

      const offsetFromOriginIn = clamp(
        toInches(Math.max(door.offset, 0), unit),
        0,
        Math.max(spanLimitIn - openingWidthIn, 0),
      );

      if (door.kind === "man") {
        return buildPreviewManDoor({
          door,
          openingWidthIn,
          offsetFromOriginIn,
          roomWidthIn,
          roomLengthIn,
        });
      }

      return buildPreviewGarageSideDoor({
        door,
        openingWidthIn,
        offsetFromOriginIn,
        roomWidthIn,
        roomLengthIn,
        tileWidthIn,
        tileHeightIn,
        frontGarageSetbackIn,
        setbackDepthIn,
        edgeWidthIn,
      });
    })
    .filter((door): door is PreviewExteriorDoor => door !== null);
}

function buildPreviewManDoor(input: {
  door: ExteriorDoorInput;
  openingWidthIn: number;
  offsetFromOriginIn: number;
  roomWidthIn: number;
  roomLengthIn: number;
}): PreviewExteriorDoor {
  const visualDepthIn = 2;
  const { xIn, yIn, widthIn, heightIn } = getDoorWallRect({
    wall: input.door.wall,
    startIn: input.offsetFromOriginIn,
    spanIn: input.openingWidthIn,
    roomWidthIn: input.roomWidthIn,
    roomLengthIn: input.roomLengthIn,
    depthIn: visualDepthIn,
  });

  return {
    id: input.door.id,
    kind: "man",
    wall: input.door.wall,
    openingWidthIn: input.openingWidthIn,
    offsetFromOriginIn: input.offsetFromOriginIn,
    xIn,
    yIn,
    widthIn,
    heightIn,
    setbackDepthIn: 0,
    alignedStartIn: input.offsetFromOriginIn,
    alignedEndIn: input.offsetFromOriginIn + input.openingWidthIn,
    alignedSpanIn: input.openingWidthIn,
    fullEdgePieces: 0,
    cutEdgePieces: 0,
    totalEdgePieces: 0,
    concreteGapAreaSqFt: 0,
    excludedAreaSqFt: 0,
  };
}

function buildPreviewGarageSideDoor(input: {
  door: ExteriorDoorInput;
  openingWidthIn: number;
  offsetFromOriginIn: number;
  roomWidthIn: number;
  roomLengthIn: number;
  tileWidthIn: number;
  tileHeightIn: number;
  frontGarageSetbackIn: number;
  setbackDepthIn: number;
  edgeWidthIn: number;
}): PreviewExteriorDoor {
  const axisStepIn = input.door.wall === "bottom" ? input.tileWidthIn : input.tileHeightIn;
  const axisLimitIn = input.door.wall === "bottom" ? input.roomWidthIn : input.roomLengthIn;
  const snapOriginIn =
    input.door.wall === "bottom" ? 0 : Math.max(input.frontGarageSetbackIn, 0);
  const alignedStartIn = snapDownToGrid(
    input.offsetFromOriginIn,
    axisStepIn,
    snapOriginIn,
  );
  const alignedEndIn = snapUpToGrid(
    input.offsetFromOriginIn + input.openingWidthIn,
    axisStepIn,
    axisLimitIn,
    snapOriginIn,
  );
  const alignedSpanIn = Math.max(alignedEndIn - alignedStartIn, 0);
  const { xIn, yIn, widthIn, heightIn } = getDoorWallRect({
    wall: input.door.wall,
    startIn: alignedStartIn,
    spanIn: alignedSpanIn,
    roomWidthIn: input.roomWidthIn,
    roomLengthIn: input.roomLengthIn,
    depthIn: input.setbackDepthIn,
  });
  const totalEdgePieces =
    alignedSpanIn > 0 ? Math.ceil(alignedSpanIn / input.edgeWidthIn) : 0;

  return {
    id: input.door.id,
    kind: "garage",
    wall: input.door.wall,
    openingWidthIn: input.openingWidthIn,
    offsetFromOriginIn: input.offsetFromOriginIn,
    xIn,
    yIn,
    widthIn,
    heightIn,
    setbackDepthIn: input.setbackDepthIn,
    alignedStartIn,
    alignedEndIn,
    alignedSpanIn,
    fullEdgePieces: totalEdgePieces,
    cutEdgePieces: 0,
    totalEdgePieces,
    concreteGapAreaSqFt: Math.max(
      0,
      ((alignedSpanIn - input.openingWidthIn) * input.setbackDepthIn) / 144,
    ),
    excludedAreaSqFt: (widthIn * heightIn) / 144,
  };
}

function getDoorWallRect(input: {
  wall: ExteriorDoorWall;
  startIn: number;
  spanIn: number;
  roomWidthIn: number;
  roomLengthIn: number;
  depthIn: number;
}) {
  switch (input.wall) {
    case "left":
      return {
        xIn: 0,
        yIn: input.startIn,
        widthIn: input.depthIn,
        heightIn: input.spanIn,
      };
    case "right":
      return {
        xIn: Math.max(input.roomWidthIn - input.depthIn, 0),
        yIn: input.startIn,
        widthIn: input.depthIn,
        heightIn: input.spanIn,
      };
    case "bottom":
    default:
      return {
        xIn: input.startIn,
        yIn: Math.max(input.roomLengthIn - input.depthIn, 0),
        widthIn: input.spanIn,
        heightIn: input.depthIn,
      };
  }
}

function pushPreviewCell(input: {
  cells: PreviewCell[];
  exclusionRects: ExclusionRect[];
  roomWidthIn: number;
  roomLengthIn: number;
  totalColumns: number;
  leftOuterColumnCount: number;
  rightOuterColumnCount: number;
  rightSecondaryInsetColumns: number;
  topSecondRow: number;
  bottomOuterRow: number;
  bottomSecondRow: number;
  tileWidthIn: number;
  tileHeightIn: number;
  pattern: LayoutPattern;
  row: number;
  patternRow: number;
  column: number;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  excludedAreaIn2Ref: { value: number };
  usableAreaIn2Ref: { value: number };
}): void {
  const onPerimeter =
    input.yIn <= 0.001 ||
    input.xIn <= 0.001 ||
    input.xIn + input.widthIn >= input.roomWidthIn - 0.001 ||
    input.yIn + input.heightIn >= input.roomLengthIn - 0.001;

  let role: PreviewCellRole = "primary";

  if (input.pattern === "checker") {
    role = (input.patternRow + input.column) % 2 === 0 ? "primary" : "secondary";
  }

  if (input.pattern === "border") {
    const lastColumn = Math.max(input.totalColumns - 1, 0);
    const secondaryRightColumn = Math.max(
      input.leftOuterColumnCount,
      lastColumn - input.rightSecondaryInsetColumns,
    );
    const onOuterRing =
      input.row < 0 ||
      input.row === 0 ||
      input.row === input.bottomOuterRow ||
      input.column < input.leftOuterColumnCount ||
      input.column > lastColumn - (input.rightOuterColumnCount - 1) ||
      onPerimeter;
    const onSecondaryRing =
      !onOuterRing &&
      ((input.row === input.topSecondRow &&
        input.column >= input.leftOuterColumnCount &&
        input.column <= secondaryRightColumn) ||
        (input.row === input.bottomSecondRow &&
          input.column >= input.leftOuterColumnCount &&
          input.column <= secondaryRightColumn) ||
        input.column === input.leftOuterColumnCount ||
        input.column === secondaryRightColumn);

    role = onSecondaryRing ? "secondary" : "primary";
  }

  if (input.pattern === "manual") {
    role = "primary";
  }

  const cellAreaIn2 = input.widthIn * input.heightIn;
  const overlapAreaIn2 = getCombinedExcludedArea(
    input.xIn,
    input.yIn,
    input.widthIn,
    input.heightIn,
    input.exclusionRects,
  );
  const nextUsableAreaIn2 = Math.max(0, cellAreaIn2 - overlapAreaIn2);
  const fullyExcluded = nextUsableAreaIn2 <= 0.001;

  input.excludedAreaIn2Ref.value += overlapAreaIn2;
  input.usableAreaIn2Ref.value += nextUsableAreaIn2;

  input.cells.push({
    row: input.row,
    column: input.column,
    xIn: input.xIn,
    yIn: input.yIn,
    widthIn: input.widthIn,
    heightIn: input.heightIn,
    role,
    isCut:
      input.widthIn !== input.tileWidthIn ||
      input.heightIn !== input.tileHeightIn ||
      (overlapAreaIn2 > 0 && !fullyExcluded),
    overlapAreaIn2,
    usableAreaIn2: nextUsableAreaIn2,
    fullyExcluded,
  });
}

function countIntersectingTileColumns(
  startXIn: number,
  endXIn: number,
  tileWidthIn: number,
  roomWidthIn: number,
): number {
  if (endXIn - startXIn <= 0.001 || tileWidthIn <= 0) {
    return 0;
  }

  const columns = Math.max(1, Math.ceil(roomWidthIn / tileWidthIn));
  let count = 0;

  for (let column = 0; column < columns; column += 1) {
    const columnXIn = column * tileWidthIn;
    const columnEndXIn = Math.min(columnXIn + tileWidthIn, roomWidthIn);
    const overlapWidthIn =
      Math.min(columnEndXIn, endXIn) - Math.max(columnXIn, startXIn);

    if (overlapWidthIn > 0.001) {
      count += 1;
    }
  }

  return count;
}

function normalizeObstacles(
  obstacles: ObstacleInput[],
  unit: Unit,
  roomWidthIn: number,
  roomLengthIn: number,
): PreviewObstacle[] {
  return obstacles
    .map((obstacle) => {
      const widthIn = Math.max(0, toInches(obstacle.width, unit));
      const heightIn = Math.max(0, toInches(obstacle.height, unit));
      const maxX = Math.max(roomWidthIn - widthIn, 0);
      const maxY = Math.max(roomLengthIn - heightIn, 0);
      const xIn = clamp(toInches(obstacle.x, unit), 0, maxX);
      const yIn = clamp(toInches(obstacle.y, unit), 0, maxY);

      return {
        id: obstacle.id,
        xIn,
        yIn,
        widthIn,
        heightIn,
      };
    })
    .filter((obstacle) => obstacle.widthIn > 0 && obstacle.heightIn > 0);
}

function buildFootprintPoints(
  shape: RoomShape,
  roomWidthIn: number,
  roomLengthIn: number,
  cutout: PreviewCutout,
): number[] {
  if (shape !== "l-shape" || cutout.widthIn <= 0 || cutout.lengthIn <= 0) {
    return [0, 0, roomWidthIn, 0, roomWidthIn, roomLengthIn, 0, roomLengthIn];
  }

  return [
    0,
    0,
    roomWidthIn - cutout.widthIn,
    0,
    roomWidthIn - cutout.widthIn,
    cutout.lengthIn,
    roomWidthIn,
    cutout.lengthIn,
    roomWidthIn,
    roomLengthIn,
    0,
    roomLengthIn,
  ];
}

function getCombinedExcludedArea(
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  rectangles: ExclusionRect[],
): number {
  const intersections = rectangles
    .map((rectangle) => intersectRect(
      cellX,
      cellY,
      cellWidth,
      cellHeight,
      rectangle.xIn,
      rectangle.yIn,
      rectangle.widthIn,
      rectangle.heightIn,
    ))
    .filter((rectangle): rectangle is ExclusionRect => rectangle !== null);

  if (intersections.length === 0) {
    return 0;
  }

  const xCuts = uniqueSorted([
    cellX,
    cellX + cellWidth,
    ...intersections.flatMap((rectangle) => [
      rectangle.xIn,
      rectangle.xIn + rectangle.widthIn,
    ]),
  ]);
  const yCuts = uniqueSorted([
    cellY,
    cellY + cellHeight,
    ...intersections.flatMap((rectangle) => [
      rectangle.yIn,
      rectangle.yIn + rectangle.heightIn,
    ]),
  ]);

  let area = 0;

  for (let xIndex = 0; xIndex < xCuts.length - 1; xIndex += 1) {
    for (let yIndex = 0; yIndex < yCuts.length - 1; yIndex += 1) {
      const left = xCuts[xIndex] ?? 0;
      const right = xCuts[xIndex + 1] ?? left;
      const top = yCuts[yIndex] ?? 0;
      const bottom = yCuts[yIndex + 1] ?? top;

      if (right <= left || bottom <= top) {
        continue;
      }

      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;

      if (
        intersections.some((rectangle) =>
          containsPoint(rectangle, centerX, centerY),
        )
      ) {
        area += (right - left) * (bottom - top);
      }
    }
  }

  return Math.min(area, cellWidth * cellHeight);
}

function intersectRect(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): ExclusionRect | null {
  const left = Math.max(ax, bx);
  const top = Math.max(ay, by);
  const right = Math.min(ax + aw, bx + bw);
  const bottom = Math.min(ay + ah, by + bh);

  if (right <= left || bottom <= top) {
    return null;
  }

  return {
    xIn: left,
    yIn: top,
    widthIn: right - left,
    heightIn: bottom - top,
  };
}

function containsPoint(rectangle: ExclusionRect, x: number, y: number): boolean {
  return (
    x >= rectangle.xIn &&
    x <= rectangle.xIn + rectangle.widthIn &&
    y >= rectangle.yIn &&
    y <= rectangle.yIn + rectangle.heightIn
  );
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}

function snapDownToGrid(value: number, step: number, origin = 0): number {
  if (step <= 0) {
    return value;
  }

  const normalized = value - origin;
  return Math.max(origin, origin + Math.floor(normalized / step) * step);
}

function snapUpToGrid(
  value: number,
  step: number,
  max: number,
  origin = 0,
): number {
  if (step <= 0) {
    return clamp(value, origin, max);
  }

  const normalized = value - origin;
  return clamp(origin + Math.ceil(normalized / step) * step, origin, max);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
