"use client";

import {
  buildRoomPreview,
  fromInches,
  type ExteriorDoorInput,
  type LayoutPattern,
  type ObstacleInput,
  type RoomShape,
  type Unit,
} from "@acefloor/core-engine";
import type Konva from "konva";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";

type RoomCanvasProps = {
  roomWidth: number;
  roomLength: number;
  roomShape: RoomShape;
  cutoutWidth: number;
  cutoutLength: number;
  garageDoorEnabled: boolean;
  garageDoorWidth: number;
  garageDoorOffset: number;
  unit: Unit;
  tileWidthIn: number;
  tileHeightIn: number;
  layoutMode: LayoutPattern;
  selectedProductId: string;
  selectedProductName: string;
  primaryColor: string;
  secondaryColor: string;
  interactionMode: "paint" | "measure";
  paintScope: "tile" | "area";
  activePaintColor: string;
  activePaintTool: "paint" | "erase";
  paintedTileColors: Record<string, string>;
  exportRequestId: number;
  clearMeasureRequestId: number;
  obstacles: ObstacleInput[];
  exteriorDoors: ExteriorDoorInput[];
  onPaintTile: (tileKey: string, color: string) => void;
  onEraseTile: (tileKey: string) => void;
  onExportReady: (dataUrl: string) => void;
  onGarageDoorOffsetChange: (value: number) => void;
  onObstaclePositionChange: (id: string, nextX: number, nextY: number) => void;
};

type SelectionRect = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

type MeasureLine = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type CanvasSize = {
  width: number;
  height: number;
};

const colorMap: Record<string, string> = {
  Noir: "#111216",
  Charcoal: "#34363c",
  Graphite: "#2f343c",
  Gris: "#7b838d",
  "Gris pale": "#c7ccd3",
  "Gris fonce": "#515760",
  "Gris clair": "#cdd2d8",
  Blanc: "#eceef1",
  Plomb: "#5a626d",
  Platine: "#b6b8be",
  Sable: "#ab8c66",
  Rouge: "#972b2b",
  Orange: "#d9651d",
  Jaune: "#d7b400",
  "Vert pomme": "#76d11f",
  Vert: "#1c9c4b",
  Turquoise: "#2bcac4",
  "Bleu poudre": "#4eb9ec",
  "Bleu royal": "#255fde",
  "Bleu pale": "#79d8ef",
  Bleu: "#2f4f80",
  Violet: "#7053d8",
  Mauve: "#7d5ce8",
  Rose: "#d85fa6",
  "Rose bonbon": "#f25eb7",
};

export function RoomCanvas(props: RoomCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const isPointerPaintingRef = useRef(false);
  const lastPaintedTileRef = useRef<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: 0,
    height: 0,
  });
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [draftMeasureLine, setDraftMeasureLine] = useState<MeasureLine | null>(null);
  const [measureLines, setMeasureLines] = useState<MeasureLine[]>([]);

  useEffect(() => {
    if (!hostRef.current) return;

    const node = hostRef.current;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;

      setCanvasSize({
        width: rect?.width ?? 0,
        height: rect?.height ?? 0,
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!props.exportRequestId || !stageRef.current) return;

    const dataUrl = stageRef.current.toDataURL({
      pixelRatio: 2,
      mimeType: "image/png",
    });

    props.onExportReady(dataUrl);
  }, [props.exportRequestId, props.onExportReady]);

  useEffect(() => {
    setDraftMeasureLine(null);
    setMeasureLines([]);
  }, [props.clearMeasureRequestId]);

  const stageWidth = Math.max(Math.floor(canvasSize.width), 0);
  const stageHeight = Math.max(Math.floor(canvasSize.height), 0);
  const isCompactCanvas = stageWidth < 720 || stageHeight < 520;
  const preview = buildRoomPreview({
    roomWidth: props.roomWidth,
    roomLength: props.roomLength,
    shape: props.roomShape,
    cutoutWidth: props.cutoutWidth,
    cutoutLength: props.cutoutLength,
    garageDoorEnabled: props.garageDoorEnabled,
    garageDoorWidth: props.garageDoorWidth,
    garageDoorOffset: props.garageDoorOffset,
    unit: props.unit,
    tileWidthIn: props.tileWidthIn,
    tileHeightIn: props.tileHeightIn,
    pattern: props.layoutMode,
    obstacles: props.obstacles,
    exteriorDoors: props.exteriorDoors,
  });

  const paddingX = isCompactCanvas ? 16 : 42;
  const paddingTop = isCompactCanvas ? 52 : 74;
  const paddingBottom = isCompactCanvas ? 18 : 42;
  const drawableWidth = Math.max(stageWidth - paddingX * 2, 1);
  const drawableHeight = Math.max(stageHeight - paddingTop - paddingBottom, 1);
  const scale = Math.min(
    drawableWidth / preview.roomWidthIn,
    drawableHeight / preview.roomLengthIn,
  );
  const roomWidthPx = preview.roomWidthIn * scale;
  const roomHeightPx = preview.roomLengthIn * scale;
  const offsetX = paddingX + (drawableWidth - roomWidthPx) / 2;
  const offsetY = paddingTop + (drawableHeight - roomHeightPx) / 2;
  const primaryFill = colorMap[props.primaryColor] ?? "#2f343c";
  const secondaryFill = colorMap[props.secondaryColor] ?? "#111216";
  const footprintPointsPx = preview.footprintPointsIn.map((value, index) =>
    index % 2 === 0 ? offsetX + value * scale : offsetY + value * scale,
  );
  const cutoutX = offsetX + (preview.roomWidthIn - preview.cutout.widthIn) * scale;
  const cutoutWidthPx = preview.cutout.widthIn * scale;
  const cutoutHeightPx = preview.cutout.lengthIn * scale;
  const garageDoorX = offsetX + preview.garageDoor.xIn * scale;
  const garageDoorY = offsetY + preview.garageDoor.yIn * scale;
  const garageDoorWidthPx = preview.garageDoor.openingWidthIn * scale;
  const garageDoorHeightPx = preview.garageDoor.setbackDepthIn * scale;
  const showLegend = stageWidth >= 760 && stageHeight >= 540;

  const applyTilePaint = (tileKey: string) => {
    if (lastPaintedTileRef.current === tileKey) return;

    if (props.activePaintTool === "erase") {
      props.onEraseTile(tileKey);
    } else {
      props.onPaintTile(tileKey, props.activePaintColor);
    }

    lastPaintedTileRef.current = tileKey;
  };

  const endPaintStroke = () => {
    isPointerPaintingRef.current = false;
    lastPaintedTileRef.current = null;
  };

  const getPointer = () => stageRef.current?.getPointerPosition() ?? null;

  const paintTileAtPointer = () => {
    const pointer = getPointer();

    if (!pointer) return;

    const hitCell = preview.cells.find((cell) => {
      if (cell.fullyExcluded) return false;

      const cellX = offsetX + cell.xIn * scale;
      const cellY = offsetY + cell.yIn * scale;
      const cellWidth = Math.max(cell.widthIn * scale, 1);
      const cellHeight = Math.max(cell.heightIn * scale, 1);

      return (
        pointer.x >= cellX &&
        pointer.x <= cellX + cellWidth &&
        pointer.y >= cellY &&
        pointer.y <= cellY + cellHeight
      );
    });

    if (!hitCell) return;

    applyTilePaint(getTileKey(hitCell.row, hitCell.column));
  };

  const paintTilesInArea = (rect: SelectionRect) => {
    const normalizedRect = normalizeRect(rect);

    preview.cells.forEach((cell) => {
      if (cell.fullyExcluded) return;

      const cellX = offsetX + cell.xIn * scale;
      const cellY = offsetY + cell.yIn * scale;
      const cellWidth = Math.max(cell.widthIn * scale, 1);
      const cellHeight = Math.max(cell.heightIn * scale, 1);

      const intersects =
        cellX < normalizedRect.x + normalizedRect.width &&
        cellX + cellWidth > normalizedRect.x &&
        cellY < normalizedRect.y + normalizedRect.height &&
        cellY + cellHeight > normalizedRect.y;

      if (!intersects) return;

      const tileKey = getTileKey(cell.row, cell.column);

      if (props.activePaintTool === "erase") {
        props.onEraseTile(tileKey);
      } else {
        props.onPaintTile(tileKey, props.activePaintColor);
      }
    });
  };

  const getMeasurementLabel = (line: MeasureLine) => {
    const deltaXIn = (line.endX - line.startX) / scale;
    const deltaYIn = (line.endY - line.startY) / scale;
    const distanceIn = Math.sqrt(deltaXIn ** 2 + deltaYIn ** 2);
    const distanceInUnit = fromInches(distanceIn, props.unit);

    return `${roundToTenth(distanceInUnit)} ${props.unit}`;
  };

  const commitMeasureLine = () => {
    if (!draftMeasureLine) return;

    const deltaX = draftMeasureLine.endX - draftMeasureLine.startX;
    const deltaY = draftMeasureLine.endY - draftMeasureLine.startY;
    const distancePx = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    if (distancePx >= 6) {
      setMeasureLines((current) => [...current, draftMeasureLine]);
    }

    setDraftMeasureLine(null);
  };

  return (
    <div ref={hostRef} className="room-canvas-root">
      {stageWidth > 0 && stageHeight > 0 ? (
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          onMouseDown={(event) => {
            if (isInteractiveNode(event.target)) return;
            if (props.interactionMode === "measure") {
              const pointer = getPointer();

              if (!pointer) return;

              setDraftMeasureLine({
                startX: pointer.x,
                startY: pointer.y,
                endX: pointer.x,
                endY: pointer.y,
              });
              return;
            }
            if (props.paintScope === "area") {
              const pointer = getPointer();

              if (!pointer) return;

              setSelectionRect({
                startX: pointer.x,
                startY: pointer.y,
                currentX: pointer.x,
                currentY: pointer.y,
              });
              return;
            }

            isPointerPaintingRef.current = true;
            paintTileAtPointer();
          }}
          onTouchStart={(event) => {
            if (isInteractiveNode(event.target)) return;
            if (props.interactionMode === "measure") {
              const pointer = getPointer();

              if (!pointer) return;

              setDraftMeasureLine({
                startX: pointer.x,
                startY: pointer.y,
                endX: pointer.x,
                endY: pointer.y,
              });
              return;
            }
            if (props.paintScope === "area") {
              const pointer = getPointer();

              if (!pointer) return;

              setSelectionRect({
                startX: pointer.x,
                startY: pointer.y,
                currentX: pointer.x,
                currentY: pointer.y,
              });
              return;
            }

            isPointerPaintingRef.current = true;
            paintTileAtPointer();
          }}
          onMouseMove={() => {
            if (props.interactionMode === "measure" && draftMeasureLine) {
              const pointer = getPointer();

              if (!pointer) return;

              setDraftMeasureLine((current) =>
                current
                  ? {
                      ...current,
                      endX: pointer.x,
                      endY: pointer.y,
                    }
                  : current,
              );
              return;
            }

            if (selectionRect) {
              const pointer = getPointer();

              if (!pointer) return;

              setSelectionRect((current) =>
                current
                  ? {
                      ...current,
                      currentX: pointer.x,
                      currentY: pointer.y,
                    }
                  : current,
              );
              return;
            }

            if (isPointerPaintingRef.current) {
              paintTileAtPointer();
            }
          }}
          onTouchMove={() => {
            if (props.interactionMode === "measure" && draftMeasureLine) {
              const pointer = getPointer();

              if (!pointer) return;

              setDraftMeasureLine((current) =>
                current
                  ? {
                      ...current,
                      endX: pointer.x,
                      endY: pointer.y,
                    }
                  : current,
              );
              return;
            }

            if (selectionRect) {
              const pointer = getPointer();

              if (!pointer) return;

              setSelectionRect((current) =>
                current
                  ? {
                      ...current,
                      currentX: pointer.x,
                      currentY: pointer.y,
                    }
                  : current,
              );
              return;
            }

            if (isPointerPaintingRef.current) {
              paintTileAtPointer();
            }
          }}
          onClick={(event) => {
            if (isInteractiveNode(event.target)) return;
            if (props.interactionMode === "measure") return;
            if (props.paintScope === "area") return;
            paintTileAtPointer();
          }}
          onTap={(event) => {
            if (isInteractiveNode(event.target)) return;
            if (props.interactionMode === "measure") return;
            if (props.paintScope === "area") return;
            paintTileAtPointer();
          }}
          onMouseUp={() => {
            if (props.interactionMode === "measure") {
              commitMeasureLine();
              return;
            }
            if (selectionRect) {
              paintTilesInArea(selectionRect);
              setSelectionRect(null);
            }
            endPaintStroke();
          }}
          onTouchEnd={() => {
            if (props.interactionMode === "measure") {
              commitMeasureLine();
              return;
            }
            if (selectionRect) {
              paintTilesInArea(selectionRect);
              setSelectionRect(null);
            }
            endPaintStroke();
          }}
          onMouseLeave={() => {
            if (props.interactionMode === "measure") {
              commitMeasureLine();
              return;
            }
            if (selectionRect) {
              paintTilesInArea(selectionRect);
              setSelectionRect(null);
            }
            endPaintStroke();
          }}
        >
          <Layer>
            <Line
              points={footprintPointsPx}
              closed
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
              lineJoin="round"
            />

            {preview.cells.map((cell, index) => {
              if (cell.fullyExcluded) return null;

              const cellX = offsetX + cell.xIn * scale;
              const cellY = offsetY + cell.yIn * scale;
              const cellWidth = Math.max(cell.widthIn * scale, 1);
              const cellHeight = Math.max(cell.heightIn * scale, 1);
              const tileKey = getTileKey(cell.row, cell.column);
              const cellColorName =
                props.paintedTileColors[tileKey] ??
                (cell.role === "primary"
                  ? props.primaryColor
                  : props.secondaryColor);
              const cellFill = colorMap[cellColorName] ?? primaryFill;

              return (
                <Group key={`${cell.xIn}-${cell.yIn}-${index}`}>
                  <Rect
                    x={cellX}
                    y={cellY}
                  width={cellWidth}
                  height={cellHeight}
                  fill={cellFill}
                    stroke={
                      cell.isCut
                        ? "rgba(210, 161, 58, 0.55)"
                        : getTileStroke(cellFill, props.selectedProductId)
                    }
                    strokeWidth={cell.isCut ? 1.5 : 1}
                    cornerRadius={getTileRadius(props.selectedProductId)}
                  />
                  {renderTileOverlay({
                    productId: props.selectedProductId,
                    x: cellX,
                    y: cellY,
                    width: cellWidth,
                    height: cellHeight,
                    stroke: getOverlayStroke(cellFill, cell.isCut),
                  })}
                </Group>
              );
            })}

            {selectionRect ? (
              <Rect
                {...normalizeRect(selectionRect)}
                fill="rgba(126, 208, 255, 0.12)"
                stroke="rgba(126, 208, 255, 0.95)"
                strokeWidth={1.5}
                dash={[10, 6]}
                cornerRadius={10}
              />
            ) : null}

            {measureLines.map((line, index) => (
              <MeasurementOverlay
                key={`${line.startX}-${line.startY}-${line.endX}-${line.endY}-${index}`}
                line={line}
                label={getMeasurementLabel(line)}
              />
            ))}

            {draftMeasureLine ? (
              <MeasurementOverlay
                line={draftMeasureLine}
                label={getMeasurementLabel(draftMeasureLine)}
                isDraft
              />
            ) : null}

            {preview.cutout.areaSqFt > 0 ? (
              <Group>
                <Rect
                  x={cutoutX}
                  y={offsetY}
                  width={Math.max(cutoutWidthPx, 1)}
                  height={Math.max(cutoutHeightPx, 1)}
                  fill="rgba(4,6,10,0.82)"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1}
                  dash={[10, 8]}
                />
                <Text
                  x={cutoutX + 12}
                  y={offsetY + 12}
                  text="Decoupe L"
                  fill="rgba(244,245,247,0.7)"
                  fontSize={12}
                />
              </Group>
            ) : null}

            {preview.garageDoor.enabled ? (
              <Group
                name="garage-door"
                x={garageDoorX}
                y={garageDoorY}
                draggable
                dragBoundFunc={(position) => ({
                  x: clamp(
                    position.x,
                    offsetX,
                    offsetX + roomWidthPx - garageDoorWidthPx,
                  ),
                  y: garageDoorY,
                })}
                onDragEnd={(event) => {
                  const nextOffsetIn = clamp(
                    (event.target.x() - offsetX) / scale,
                    0,
                    Math.max(preview.roomWidthIn - preview.garageDoor.openingWidthIn, 0),
                  );

                  props.onGarageDoorOffsetChange(
                    roundToTenth(fromInches(nextOffsetIn, props.unit)),
                  );
                }}
              >
                <GarageThresholdOverlay
                  width={Math.max(garageDoorWidthPx, 1)}
                  height={Math.max(garageDoorHeightPx, 1)}
                  label={`Edges porte • ${preview.garageDoor.totalEdgePieces} pcs`}
                />
              </Group>
            ) : null}

            {preview.exteriorDoors.map((door) => (
              <Group key={door.id} x={offsetX + door.xIn * scale} y={offsetY + door.yIn * scale}>
                {door.kind === "garage" && door.wall !== "bottom" ? (
                  <GarageRecessOverlay
                    wall={door.wall}
                    width={Math.max(door.widthIn * scale, 6)}
                    height={Math.max(door.heightIn * scale, 6)}
                    label={`Porte garage • ${door.totalEdgePieces} edges`}
                  />
                ) : door.kind === "garage" ? (
                  <GarageThresholdOverlay
                    width={Math.max(door.widthIn * scale, 6)}
                    height={Math.max(door.heightIn * scale, 6)}
                    label={`Porte garage • ${door.totalEdgePieces} edges`}
                  />
                ) : (
                  <>
                    <Rect
                      x={0}
                      y={0}
                      width={Math.max(door.widthIn * scale, 6)}
                      height={Math.max(door.heightIn * scale, 6)}
                      fill="rgba(126, 208, 255, 0.14)"
                      stroke="rgba(126, 208, 255, 0.95)"
                      strokeWidth={1.5}
                      dash={[6, 6]}
                      cornerRadius={10}
                    />
                    <Text
                      x={8}
                      y={8}
                      text="Porte d'homme"
                      fill="rgba(126, 208, 255, 0.96)"
                      fontSize={12}
                    />
                  </>
                )}
              </Group>
            ))}

            <Line
              points={footprintPointsPx}
              closed
              stroke="rgba(255,255,255,0.24)"
              strokeWidth={2}
              lineJoin="round"
            />

            {preview.obstacles.map((obstacle) => (
              <Group
                key={obstacle.id}
                name="obstacle"
                x={offsetX + obstacle.xIn * scale}
                y={offsetY + obstacle.yIn * scale}
                draggable
                onDragEnd={(event) => {
                  const nextXIn = clamp(
                    (event.target.x() - offsetX) / scale,
                    0,
                    Math.max(preview.roomWidthIn - obstacle.widthIn, 0),
                  );
                  const nextYIn = clamp(
                    (event.target.y() - offsetY) / scale,
                    0,
                    Math.max(preview.roomLengthIn - obstacle.heightIn, 0),
                  );

                  props.onObstaclePositionChange(
                    obstacle.id,
                    roundToTenth(fromInches(nextXIn, props.unit)),
                    roundToTenth(fromInches(nextYIn, props.unit)),
                  );
                }}
              >
                <Rect
                  width={Math.max(obstacle.widthIn * scale, 8)}
                  height={Math.max(obstacle.heightIn * scale, 8)}
                  fill="rgba(12,14,18,0.78)"
                  stroke="rgba(241, 204, 114, 0.85)"
                  strokeWidth={1.5}
                  dash={[8, 6]}
                  cornerRadius={12}
                />
                <Text
                  x={10}
                  y={10}
                  text="Découpe"
                  fill="#f1d28d"
                  fontSize={12}
                />
              </Group>
            ))}

            <Group x={offsetX} y={offsetY - 28}>
              <Line
                points={[0, 0, roomWidthPx, 0]}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={1}
              />
              <Text
                x={roomWidthPx / 2 - 54}
                y={-18}
                width={108}
                align="center"
                text={formatCanvasDimension(props.roomWidth, props.unit)}
                fill="rgba(244,245,247,0.82)"
                fontSize={13}
              />
            </Group>

            <Group x={offsetX - 28} y={offsetY}>
              <Line
                points={[0, 0, 0, roomHeightPx]}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={1}
              />
              <Text
                x={-22}
                y={roomHeightPx / 2 - 8}
                rotation={-90}
                width={90}
                align="center"
                text={formatCanvasDimension(props.roomLength, props.unit)}
                fill="rgba(244,245,247,0.82)"
                fontSize={13}
              />
            </Group>

            <Group x={18} y={18}>
              <Text
                text={`Apercu 2D • ${props.selectedProductName} • ${preview.columns} x ${preview.rows} tuiles`}
                fill="rgba(244,245,247,0.84)"
                fontSize={13}
              />
              {preview.cutout.areaSqFt > 0 ? (
                <Text
                  y={18}
                  text={`Piece en L • decoupe ${roundToTenth(
                    props.cutoutWidth,
                  )} x ${roundToTenth(props.cutoutLength)} ${props.unit}`}
                  fill="rgba(241,210,141,0.88)"
                  fontSize={12}
                />
              ) : null}
              {preview.garageDoor.enabled ? (
                <Text
                  y={preview.cutout.areaSqFt > 0 ? 36 : 18}
                  text={`Porte garage • seuil edge au bas • ${roundToTenth(
                    props.garageDoorWidth,
                  )} ${props.unit}`}
                  fill="rgba(241,210,141,0.88)"
                  fontSize={12}
                />
              ) : null}
              {preview.exteriorDoors.length > 0 ? (
                <Text
                  y={
                    preview.garageDoor.enabled
                      ? preview.cutout.areaSqFt > 0
                        ? 54
                        : 36
                      : preview.cutout.areaSqFt > 0
                        ? 36
                        : 18
                  }
                  text={`Portes additionnelles • ${preview.exteriorDoors.length}`}
                  fill="rgba(126, 208, 255, 0.9)"
                  fontSize={12}
                />
              ) : null}
              <Text
                y={
                  preview.exteriorDoors.length > 0
                    ? preview.garageDoor.enabled
                      ? preview.cutout.areaSqFt > 0
                        ? 72
                        : 54
                      : preview.cutout.areaSqFt > 0
                        ? 54
                        : 36
                    : preview.garageDoor.enabled
                      ? preview.cutout.areaSqFt > 0
                        ? 54
                        : 36
                      : preview.cutout.areaSqFt > 0
                        ? 36
                        : 18
                }
                text={`Outil • ${
                  props.interactionMode === "measure"
                    ? "Mesure"
                    : props.activePaintTool === "erase"
                      ? props.paintScope === "area"
                        ? "Effacer zone"
                        : "Effacer"
                      : props.paintScope === "area"
                        ? `Zone ${props.activePaintColor}`
                        : `Couleur ${props.activePaintColor}`
                }`}
                fill="rgba(126, 208, 255, 0.9)"
                fontSize={12}
              />
            </Group>

            {showLegend ? (
              <Group x={stageWidth - 198} y={stageHeight - 116}>
                <Rect
                  width={180}
                  height={98}
                  fill="rgba(6,8,12,0.82)"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                  cornerRadius={16}
                />
                <Rect
                  x={14}
                  y={16}
                  width={14}
                  height={14}
                  fill={primaryFill}
                  cornerRadius={999}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={1}
                />
                <Text
                  x={38}
                  y={15}
                  text={props.primaryColor}
                  fill="rgba(244,245,247,0.82)"
                  fontSize={13}
                />
                <Rect
                  x={14}
                  y={42}
                  width={14}
                  height={14}
                  fill={secondaryFill}
                  cornerRadius={999}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={1}
                />
                <Text
                  x={38}
                  y={41}
                  text={props.secondaryColor}
                  fill="rgba(244,245,247,0.82)"
                  fontSize={13}
                />
                <Rect
                  x={14}
                  y={68}
                  width={14}
                  height={14}
                  fill={
                    props.activePaintTool === "erase"
                      ? "rgba(241, 210, 141, 0.18)"
                      : colorMap[props.activePaintColor] ?? primaryFill
                  }
                  cornerRadius={999}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={1}
                />
                <Text
                  x={38}
                  y={67}
                  text={
                    props.activePaintTool === "erase"
                      ? "Effacer"
                      : `Brush • ${props.activePaintColor}`
                  }
                  fill="rgba(244,245,247,0.82)"
                  fontSize={12}
                />
              </Group>
            ) : null}
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatCanvasDimension(value: number, unit: Unit): string {
  if (unit !== "ft") {
    return `${roundToTenth(value)} ${unit}`;
  }

  const totalInches = Math.max(0, Math.round(value * 12));
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet} pi ${inches} po`;
}

function getTileKey(row: number, column: number): string {
  return `${row}:${column}`;
}

function normalizeRect(rect: SelectionRect): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: Math.min(rect.startX, rect.currentX),
    y: Math.min(rect.startY, rect.currentY),
    width: Math.max(Math.abs(rect.currentX - rect.startX), 1),
    height: Math.max(Math.abs(rect.currentY - rect.startY), 1),
  };
}

function isInteractiveNode(node: Konva.Node | null): boolean {
  let current: Konva.Node | null = node;

  while (current) {
    if (current.name() === "obstacle" || current.name() === "garage-door") {
      return true;
    }

    current = current.getParent();
  }

  return false;
}

function getTileRadius(productId: string): number {
  switch (productId) {
    case "crown-cubic":
      return 7;
    case "crown-grip":
      return 2;
    case "acetrax":
      return 4;
    default:
      return 5;
  }
}

function getTileStroke(fill: string, productId: string): string {
  const alpha = productId === "crown-grip" ? 0.18 : 0.12;
  return isLightColor(fill)
    ? `rgba(10, 12, 16, ${alpha})`
    : `rgba(255, 255, 255, ${alpha})`;
}

function getOverlayStroke(fill: string, isCut: boolean): string {
  if (isCut) {
    return "rgba(241, 210, 141, 0.42)";
  }

  return isLightColor(fill)
    ? "rgba(14, 16, 20, 0.2)"
    : "rgba(255, 255, 255, 0.22)";
}

function isLightColor(hex: string): boolean {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return false;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= 168;
}

type GarageRecessOverlayProps = {
  wall: "left" | "right" | "bottom";
  width: number;
  height: number;
  label: string;
};

function GarageRecessOverlay(props: GarageRecessOverlayProps) {
  const contourInset = clamp(Math.min(props.width, props.height) * 0.14, 4, 10);
  const labelWidth = Math.min(Math.max(props.width + 140, 140), 220);
  const labelX =
    props.wall === "right"
      ? Math.max(props.width - labelWidth - 8, 8)
      : 8;
  const labelY = Math.min(10, Math.max(props.height - 24, 8));
  const contourPoints = getGarageRecessContourPoints(
    props.wall,
    props.width,
    props.height,
    contourInset,
  );

  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={props.width}
        height={props.height}
        fill="rgba(112, 119, 113, 0.96)"
      />
      <Line
        points={contourPoints}
        stroke="rgba(241, 159, 56, 0.96)"
        strokeWidth={1.5}
        dash={[9, 6]}
        lineJoin="round"
        lineCap="round"
      />
      <Text
        x={labelX}
        y={labelY}
        width={labelWidth}
        text={props.label}
        fill="#f1d28d"
        fontSize={12}
        align={props.wall === "right" ? "right" : "left"}
      />
    </Group>
  );
}

type GarageThresholdOverlayProps = {
  width: number;
  height: number;
  label: string;
};

function GarageThresholdOverlay(props: GarageThresholdOverlayProps) {
  const labelWidth = Math.min(Math.max(props.width + 96, 132), 220);

  return (
    <Group>
      <Rect
        x={0}
        y={0}
        width={props.width}
        height={props.height}
        fill="rgba(210, 161, 58, 0.14)"
        stroke="rgba(241, 204, 114, 0.9)"
        strokeWidth={1.5}
        dash={[10, 6]}
      />
      <Text
        x={8}
        y={Math.min(10, Math.max(props.height - 24, 8))}
        width={labelWidth}
        text={props.label}
        fill="#f1d28d"
        fontSize={12}
      />
    </Group>
  );
}

function getGarageRecessContourPoints(
  wall: GarageRecessOverlayProps["wall"],
  width: number,
  height: number,
  inset: number,
): number[] {
  const safeWidth = Math.max(width, inset * 2 + 2);
  const safeHeight = Math.max(height, inset * 2 + 2);
  const leftX = wall === "right" ? inset : 0;
  const rightX = wall === "left" ? safeWidth - inset : safeWidth;
  const innerLeftX = inset;
  const innerRightX = safeWidth - inset;
  const topY = inset;
  const bottomY = safeHeight - inset;

  switch (wall) {
    case "left":
      return [leftX, topY, innerRightX, topY, innerRightX, bottomY, leftX, bottomY];
    case "right":
      return [rightX, topY, innerLeftX, topY, innerLeftX, bottomY, rightX, bottomY];
    case "bottom":
    default:
      return [innerLeftX, safeHeight, innerLeftX, topY, innerRightX, topY, innerRightX, safeHeight];
  }
}

type MeasurementOverlayProps = {
  line: MeasureLine;
  label: string;
  isDraft?: boolean;
};

function MeasurementOverlay(props: MeasurementOverlayProps) {
  const midX = (props.line.startX + props.line.endX) / 2;
  const midY = (props.line.startY + props.line.endY) / 2;
  const deltaX = props.line.endX - props.line.startX;
  const deltaY = props.line.endY - props.line.startY;
  const length = Math.sqrt(deltaX ** 2 + deltaY ** 2) || 1;
  const normalX = (-deltaY / length) * 12;
  const normalY = (deltaX / length) * 12;
  const labelX = midX + normalX - 54;
  const labelY = midY + normalY - 12;
  const stroke = props.isDraft ? "rgba(126, 208, 255, 0.95)" : "rgba(241, 204, 114, 0.95)";
  const fill = props.isDraft ? "#bde6ff" : "#f3d795";

  return (
    <Group listening={false}>
      <Line
        points={[props.line.startX, props.line.startY, props.line.endX, props.line.endY]}
        stroke={stroke}
        strokeWidth={2}
        dash={props.isDraft ? [10, 6] : undefined}
      />
      <Rect
        x={labelX}
        y={labelY}
        width={108}
        height={24}
        fill="rgba(6,8,12,0.9)"
        stroke={props.isDraft ? "rgba(126, 208, 255, 0.4)" : "rgba(241, 204, 114, 0.42)"}
        strokeWidth={1}
        cornerRadius={999}
      />
      <Text
        x={labelX}
        y={labelY + 6}
        width={108}
        align="center"
        text={props.label}
        fill={fill}
        fontSize={12}
      />
    </Group>
  );
}

type TileOverlayProps = {
  productId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: string;
};

function renderTileOverlay(props: TileOverlayProps): ReactNode {
  if (Math.min(props.width, props.height) < 14) {
    return null;
  }

  switch (props.productId) {
    case "crown-grip":
      return renderGripOverlay(props);
    case "crown-cubic":
      return renderCubicOverlay(props);
    case "acetrax":
      return renderSeriesOverlay(props, { ringCount: 3, innerStart: 0.2, innerStep: 0.12, seamOpacity: 0.18 });
    case "crown-series":
    default:
      return renderSeriesOverlay(props, { ringCount: 4, innerStart: 0.16, innerStep: 0.1, seamOpacity: 0.24 });
  }
}

function renderSeriesOverlay(
  props: TileOverlayProps,
  options: {
    ringCount: number;
    innerStart: number;
    innerStep: number;
    seamOpacity: number;
  },
): ReactNode {
  const minSide = Math.min(props.width, props.height);
  const strokeWidth = Math.max(0.65, minSide * 0.032);
  const seamStroke = props.stroke.replace(/rgba?\(([^)]+)\)/, (_match, values) => {
    const parts = values.split(",").map((part: string) => part.trim());

    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${options.seamOpacity})`;
    }

    return props.stroke;
  });

  return (
    <Group
      x={props.x}
      y={props.y}
      clipX={0}
      clipY={0}
      clipWidth={props.width}
      clipHeight={props.height}
      listening={false}
    >
      <Line
        points={[props.width * 0.5, 0, props.width * 0.5, props.height]}
        stroke={seamStroke}
        strokeWidth={Math.max(0.6, strokeWidth * 0.9)}
      />
      <Line
        points={[0, props.height * 0.5, props.width, props.height * 0.5]}
        stroke={seamStroke}
        strokeWidth={Math.max(0.6, strokeWidth * 0.9)}
      />
      {Array.from({ length: options.ringCount }, (_value, index) => {
        const inset = options.innerStart + options.innerStep * index;

        if (inset >= 0.49) return null;

        return (
          <Line
            key={`series-ring-${inset}`}
            points={buildDiamondPoints(props.width, props.height, inset)}
            closed
            stroke={props.stroke}
            strokeWidth={Math.max(0.55, strokeWidth * (1 - index * 0.12))}
            lineJoin="round"
          />
        );
      })}
    </Group>
  );
}

function renderGripOverlay(props: TileOverlayProps): ReactNode {
  const strokeWidth = Math.max(0.65, Math.min(props.width, props.height) * 0.032);
  const offsets = [-0.38, -0.1, 0.18, 0.46, 0.74];

  return (
    <Group
      x={props.x}
      y={props.y}
      clipX={0}
      clipY={0}
      clipWidth={props.width}
      clipHeight={props.height}
      listening={false}
    >
      {offsets.map((offset) => (
        <Line
          key={`diag-a-${offset}`}
          points={[
            props.width * offset,
            props.height,
            props.width * (offset + 0.72),
            0,
          ]}
          stroke={props.stroke}
          strokeWidth={strokeWidth}
          lineCap="round"
        />
      ))}
      {offsets.map((offset) => (
        <Line
          key={`diag-b-${offset}`}
          points={[
            props.width * offset,
            0,
            props.width * (offset + 0.72),
            props.height,
          ]}
          stroke={props.stroke}
          strokeWidth={Math.max(0.55, strokeWidth * 0.7)}
          lineCap="round"
          opacity={0.74}
        />
      ))}
      <Rect
        x={props.width * 0.2}
        y={props.height * 0.2}
        width={props.width * 0.6}
        height={props.height * 0.6}
        stroke={props.stroke}
        strokeWidth={Math.max(0.5, strokeWidth * 0.75)}
        dash={[Math.max(props.width * 0.06, 2), Math.max(props.width * 0.04, 2)]}
        opacity={0.4}
      />
    </Group>
  );
}

function renderCubicOverlay(props: TileOverlayProps): ReactNode {
  const strokeWidth = Math.max(0.65, Math.min(props.width, props.height) * 0.034);
  const topY = props.height * 0.24;
  const midY = props.height * 0.5;
  const bottomY = props.height * 0.76;
  const leftX = props.width * 0.18;
  const centerX = props.width * 0.5;
  const rightX = props.width * 0.82;

  return (
    <Group
      x={props.x}
      y={props.y}
      clipX={0}
      clipY={0}
      clipWidth={props.width}
      clipHeight={props.height}
      listening={false}
    >
      <Line
        points={[
          centerX,
          props.height * 0.12,
          rightX,
          topY,
          rightX,
          bottomY,
          centerX,
          props.height * 0.88,
          leftX,
          bottomY,
          leftX,
          topY,
          centerX,
          props.height * 0.12,
        ]}
        stroke={props.stroke}
        strokeWidth={strokeWidth}
        lineJoin="round"
      />
      <Line
        points={[leftX, topY, centerX, midY, leftX, bottomY]}
        stroke={props.stroke}
        strokeWidth={Math.max(0.6, strokeWidth * 0.8)}
        lineJoin="round"
      />
      <Line
        points={[rightX, topY, centerX, midY, rightX, bottomY]}
        stroke={props.stroke}
        strokeWidth={Math.max(0.6, strokeWidth * 0.8)}
        lineJoin="round"
      />
      <Line
        points={[centerX, props.height * 0.12, centerX, props.height * 0.88]}
        stroke={props.stroke}
        strokeWidth={Math.max(0.6, strokeWidth * 0.72)}
        lineJoin="round"
        opacity={0.85}
      />
      <Line
        points={[
          props.width * 0.3,
          props.height * 0.31,
          centerX,
          props.height * 0.22,
          props.width * 0.7,
          props.height * 0.31,
          props.width * 0.7,
          props.height * 0.69,
          centerX,
          props.height * 0.78,
          props.width * 0.3,
          props.height * 0.69,
          props.width * 0.3,
          props.height * 0.31,
        ]}
        stroke={props.stroke}
        strokeWidth={Math.max(0.5, strokeWidth * 0.72)}
        lineJoin="round"
        opacity={0.72}
      />
    </Group>
  );
}

function buildDiamondPoints(
  width: number,
  height: number,
  inset: number,
): number[] {
  return [
    width * 0.5,
    height * inset,
    width * (1 - inset),
    height * 0.5,
    width * 0.5,
    height * (1 - inset),
    width * inset,
    height * 0.5,
  ];
}
