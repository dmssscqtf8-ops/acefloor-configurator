"use client";

import type { RoomShape } from "@acefloor/core-engine";
import { create } from "zustand";

export type Unit = "ft" | "in" | "cm" | "m";
export type PaintTool = "paint" | "erase";
export type Obstacle = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ConfiguratorState = {
  roomWidth: number;
  roomLength: number;
  roomShape: RoomShape;
  cutoutWidth: number;
  cutoutLength: number;
  garageDoorEnabled: boolean;
  garageDoorWidth: number;
  garageDoorOffset: number;
  unit: Unit;
  obstacles: Obstacle[];
  selectedProductId: string;
  primaryColor: string;
  secondaryColor: string;
  layoutMode: "solid" | "checker" | "border" | "manual";
  activePaintColor: string;
  activePaintTool: PaintTool;
  paintedTileColors: Record<string, string>;
  setRoomWidth: (value: number) => void;
  setRoomLength: (value: number) => void;
  setRoomShape: (value: RoomShape) => void;
  setCutoutWidth: (value: number) => void;
  setCutoutLength: (value: number) => void;
  setGarageDoorEnabled: (value: boolean) => void;
  setGarageDoorWidth: (value: number) => void;
  setGarageDoorOffset: (value: number) => void;
  setUnit: (value: Unit) => void;
  setSelectedProductId: (value: string) => void;
  setPrimaryColor: (value: string) => void;
  setSecondaryColor: (value: string) => void;
  setLayoutMode: (value: "solid" | "checker" | "border" | "manual") => void;
  setActivePaintColor: (value: string) => void;
  setActivePaintTool: (value: PaintTool) => void;
  paintTile: (tileKey: string, color: string) => void;
  eraseTile: (tileKey: string) => void;
  clearPaintedTiles: () => void;
  prunePaintedTiles: (allowedColors: string[]) => void;
  addObstacle: () => void;
  clearObstacles: () => void;
  removeObstacle: (id: string) => void;
  updateObstacle: (
    id: string,
    patch: Partial<Omit<Obstacle, "id">>,
  ) => void;
};

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  roomWidth: 24,
  roomLength: 24,
  roomShape: "rectangle",
  cutoutWidth: 8,
  cutoutLength: 10,
  garageDoorEnabled: true,
  garageDoorWidth: 16,
  garageDoorOffset: 4,
  unit: "ft",
  obstacles: [],
  selectedProductId: "crown-series",
  primaryColor: "Noir",
  secondaryColor: "Charcoal",
  layoutMode: "checker",
  activePaintColor: "Noir",
  activePaintTool: "paint",
  paintedTileColors: {},
  setRoomWidth: (value) =>
    set((state) =>
      normalizeRoomGeometry({
        ...state,
        roomWidth: Math.max(value, 1),
      }),
    ),
  setRoomLength: (value) =>
    set((state) =>
      normalizeRoomGeometry({
        ...state,
        roomLength: Math.max(value, 1),
      }),
    ),
  setRoomShape: (value) => set({ roomShape: value }),
  setCutoutWidth: (value) =>
    set((state) =>
      normalizeRoomGeometry({
        ...state,
        cutoutWidth: Math.max(value, 0),
      }),
    ),
  setCutoutLength: (value) =>
    set((state) =>
      normalizeRoomGeometry({
        ...state,
        cutoutLength: Math.max(value, 0),
      }),
    ),
  setGarageDoorEnabled: (value) => set({ garageDoorEnabled: value }),
  setGarageDoorWidth: (value) =>
    set((state) =>
      normalizeRoomGeometry({
        ...state,
        garageDoorWidth: Math.max(value, 0),
      }),
    ),
  setGarageDoorOffset: (value) =>
    set((state) =>
      normalizeRoomGeometry({
        ...state,
        garageDoorOffset: Math.max(value, 0),
      }),
    ),
  setUnit: (value) => set({ unit: value }),
  setSelectedProductId: (value) => set({ selectedProductId: value, paintedTileColors: {} }),
  setPrimaryColor: (value) => set({ primaryColor: value, activePaintColor: value }),
  setSecondaryColor: (value) => set({ secondaryColor: value }),
  setLayoutMode: (value) => set({ layoutMode: value }),
  setActivePaintColor: (value) => set({ activePaintColor: value, activePaintTool: "paint" }),
  setActivePaintTool: (value) => set({ activePaintTool: value }),
  paintTile: (tileKey, color) =>
    set((state) => ({
      paintedTileColors: {
        ...state.paintedTileColors,
        [tileKey]: color,
      },
    })),
  eraseTile: (tileKey) =>
    set((state) => {
      const nextPaintedTileColors = { ...state.paintedTileColors };
      delete nextPaintedTileColors[tileKey];

      return { paintedTileColors: nextPaintedTileColors };
    }),
  clearPaintedTiles: () => set({ paintedTileColors: {} }),
  prunePaintedTiles: (allowedColors) =>
    set((state) => {
      const nextPaintedTileColors = Object.fromEntries(
        Object.entries(state.paintedTileColors).filter(([, color]) =>
          allowedColors.includes(color),
        ),
      );

      return { paintedTileColors: nextPaintedTileColors };
    }),
  addObstacle: () => {
    const state = get();
    const width = clamp(roundToTenth(state.roomWidth * 0.18), 1, state.roomWidth);
    const height = clamp(roundToTenth(state.roomLength * 0.16), 1, state.roomLength);
    const obstacle: Obstacle = {
      id: globalThis.crypto?.randomUUID?.() ?? `obs-${Date.now()}`,
      width,
      height,
      x: roundToTenth(Math.max((state.roomWidth - width) / 2, 0)),
      y: roundToTenth(Math.max((state.roomLength - height) / 2, 0)),
    };

    set({ obstacles: [...state.obstacles, obstacle] });
  },
  clearObstacles: () => set({ obstacles: [] }),
  removeObstacle: (id) =>
    set((state) => ({
      obstacles: state.obstacles.filter((obstacle) => obstacle.id !== id),
    })),
  updateObstacle: (id, patch) =>
    set((state) => ({
      obstacles: state.obstacles.map((obstacle) => {
        if (obstacle.id !== id) return obstacle;

        const nextWidth = clamp(
          roundToTenth(patch.width ?? obstacle.width),
          0.5,
          state.roomWidth,
        );
        const nextHeight = clamp(
          roundToTenth(patch.height ?? obstacle.height),
          0.5,
          state.roomLength,
        );
        const nextX = clamp(
          roundToTenth(patch.x ?? obstacle.x),
          0,
          Math.max(state.roomWidth - nextWidth, 0),
        );
        const nextY = clamp(
          roundToTenth(patch.y ?? obstacle.y),
          0,
          Math.max(state.roomLength - nextHeight, 0),
        );

        return {
          ...obstacle,
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        };
      }),
    })),
}));

function normalizeRoomGeometry(
  state: Pick<
    ConfiguratorState,
    "roomWidth" | "roomLength" | "cutoutWidth" | "cutoutLength"
    | "garageDoorWidth" | "garageDoorOffset"
  >,
): Pick<
  ConfiguratorState,
  | "roomWidth"
  | "roomLength"
  | "cutoutWidth"
  | "cutoutLength"
  | "garageDoorWidth"
  | "garageDoorOffset"
> {
  const roomWidth = Math.max(roundToTenth(state.roomWidth), 1);
  const roomLength = Math.max(roundToTenth(state.roomLength), 1);
  const garageDoorWidth = clamp(roundToTenth(state.garageDoorWidth), 0, roomWidth);
  const garageDoorOffset = clamp(
    roundToTenth(state.garageDoorOffset),
    0,
    Math.max(roomWidth - garageDoorWidth, 0),
  );

  return {
    roomWidth,
    roomLength,
    cutoutWidth: clamp(roundToTenth(state.cutoutWidth), 0, Math.max(roomWidth - 1, 0)),
    cutoutLength: clamp(
      roundToTenth(state.cutoutLength),
      0,
      Math.max(roomLength - 1, 0),
    ),
    garageDoorWidth,
    garageDoorOffset,
  };
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
