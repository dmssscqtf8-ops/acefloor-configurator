"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  buildRoomPreview,
  computeEstimateFromPreview,
  formatCurrency,
  fromInches,
} from "@acefloor/core-engine";
import { catalogProducts } from "../data/mock-catalog";
import { useConfiguratorStore } from "../store/use-configurator-store";
import { RoomCanvas } from "./room-canvas";

const paintColorMap: Record<string, string> = {
  Noir: "#111216",
  Charcoal: "#34363c",
  "Gris pale": "#c7ccd3",
  Blanc: "#eceef1",
  Rouge: "#c13232",
  Orange: "#dd681f",
  Jaune: "#d7b400",
  "Vert pomme": "#76d11f",
  Vert: "#1c9c4b",
  Turquoise: "#2bcac4",
  "Bleu poudre": "#4eb9ec",
  "Bleu royal": "#255fde",
  "Bleu pale": "#79d8ef",
  Mauve: "#7d5ce8",
  Rose: "#d85fa6",
  "Rose bonbon": "#f25eb7",
  "Gris fonce": "#515760",
  "Gris clair": "#cdd2d8",
  Plomb: "#5a626d",
  Bleu: "#2f4f80",
  Violet: "#7053d8",
};

type ConfiguratorShellProps = {
  initialProductId?: string;
};

export function ConfiguratorShell({
  initialProductId,
}: ConfiguratorShellProps) {
  const effectiveRoomShape = "rectangle" as const;
  const [interactionMode, setInteractionMode] = useState<"paint" | "measure">("paint");
  const [paintScope, setPaintScope] = useState<"tile" | "area">("tile");
  const [activeToolPanel, setActiveToolPanel] = useState<"colors" | null>(null);
  const [colorPanelTarget, setColorPanelTarget] = useState<"primary" | "secondary" | "brush">("brush");
  const [exportRequestId, setExportRequestId] = useState(0);
  const [clearMeasureRequestId, setClearMeasureRequestId] = useState(0);
  const roomWidth = useConfiguratorStore((state) => state.roomWidth);
  const roomLength = useConfiguratorStore((state) => state.roomLength);
  const garageDoorEnabled = useConfiguratorStore((state) => state.garageDoorEnabled);
  const garageDoorWidth = useConfiguratorStore((state) => state.garageDoorWidth);
  const garageDoorOffset = useConfiguratorStore((state) => state.garageDoorOffset);
  const unit = useConfiguratorStore((state) => state.unit);
  const obstacles = useConfiguratorStore((state) => state.obstacles);
  const selectedProductId = useConfiguratorStore((state) => state.selectedProductId);
  const primaryColor = useConfiguratorStore((state) => state.primaryColor);
  const secondaryColor = useConfiguratorStore((state) => state.secondaryColor);
  const layoutMode = useConfiguratorStore((state) => state.layoutMode);
  const activePaintColor = useConfiguratorStore((state) => state.activePaintColor);
  const activePaintTool = useConfiguratorStore((state) => state.activePaintTool);
  const paintedTileColors = useConfiguratorStore((state) => state.paintedTileColors);

  const setRoomWidth = useConfiguratorStore((state) => state.setRoomWidth);
  const setRoomLength = useConfiguratorStore((state) => state.setRoomLength);
  const setGarageDoorEnabled = useConfiguratorStore((state) => state.setGarageDoorEnabled);
  const setGarageDoorWidth = useConfiguratorStore((state) => state.setGarageDoorWidth);
  const setGarageDoorOffset = useConfiguratorStore((state) => state.setGarageDoorOffset);
  const setUnit = useConfiguratorStore((state) => state.setUnit);
  const addObstacle = useConfiguratorStore((state) => state.addObstacle);
  const removeObstacle = useConfiguratorStore((state) => state.removeObstacle);
  const updateObstacle = useConfiguratorStore((state) => state.updateObstacle);
  const setSelectedProductId = useConfiguratorStore((state) => state.setSelectedProductId);
  const setPrimaryColor = useConfiguratorStore((state) => state.setPrimaryColor);
  const setSecondaryColor = useConfiguratorStore((state) => state.setSecondaryColor);
  const setLayoutMode = useConfiguratorStore((state) => state.setLayoutMode);
  const setActivePaintColor = useConfiguratorStore((state) => state.setActivePaintColor);
  const setActivePaintTool = useConfiguratorStore((state) => state.setActivePaintTool);
  const paintTile = useConfiguratorStore((state) => state.paintTile);
  const eraseTile = useConfiguratorStore((state) => state.eraseTile);
  const clearPaintedTiles = useConfiguratorStore((state) => state.clearPaintedTiles);
  const prunePaintedTiles = useConfiguratorStore((state) => state.prunePaintedTiles);

  const selectedProduct =
    catalogProducts.find((product) => product.id === selectedProductId) ??
    catalogProducts[0];
  const paintedTileCount = Object.keys(paintedTileColors).length;
  const productSelectionOrder = [
    "crown-series",
    "crown-cubic",
    "crown-grip",
    "acetrax",
  ] as const;
  const orderedProducts = productSelectionOrder
    .map((id) => catalogProducts.find((product) => product.id === id))
    .filter((product): product is (typeof catalogProducts)[number] => Boolean(product));
  const presets = [
    { value: "solid", label: "Uni" },
    { value: "checker", label: "Damier" },
    { value: "border", label: "Bordure" },
    { value: "manual", label: "Libre" },
  ] as const;

  useEffect(() => {
    if (!initialProductId) return;

    const initialProduct = catalogProducts.find(
      (product) => product.id === initialProductId,
    );

    if (!initialProduct) return;

    const firstColor = initialProduct.availableColors[0] ?? "Noir";
    const secondColor = initialProduct.availableColors[1] ?? firstColor;

    setSelectedProductId(initialProduct.id);
    setPrimaryColor(firstColor);
    setSecondaryColor(secondColor);
    setActivePaintColor(firstColor);
  }, [
    initialProductId,
    setActivePaintColor,
    setPrimaryColor,
    setSecondaryColor,
    setSelectedProductId,
  ]);

  useEffect(() => {
    const firstColor = selectedProduct.availableColors[0] ?? "Noir";
    const secondColor = selectedProduct.availableColors[1] ?? firstColor;

    if (!selectedProduct.availableColors.includes(primaryColor)) {
      setPrimaryColor(firstColor);
    }

    if (!selectedProduct.availableColors.includes(secondaryColor)) {
      setSecondaryColor(secondColor);
    }

    if (!selectedProduct.availableColors.includes(activePaintColor)) {
      setActivePaintColor(firstColor);
    }

    prunePaintedTiles(selectedProduct.availableColors);
  }, [
    activePaintColor,
    primaryColor,
    prunePaintedTiles,
    secondaryColor,
    selectedProduct,
    setActivePaintColor,
    setPrimaryColor,
    setSecondaryColor,
  ]);

  const preview = buildRoomPreview({
    roomWidth,
    roomLength,
    shape: effectiveRoomShape,
    garageDoorEnabled,
    garageDoorWidth,
    garageDoorOffset,
    unit,
    tileWidthIn: selectedProduct.tileWidthIn,
    tileHeightIn: selectedProduct.tileHeightIn,
    pattern: layoutMode,
    obstacles,
  });

  const estimate = computeEstimateFromPreview({
    preview,
    pricePerTile: selectedProduct.pricePerTile,
    wastePercent: selectedProduct.wastePercent,
    includePerimeterBorders: layoutMode === "border",
  });

  const handleExportReady = useCallback((dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `acefloor-plan-${selectedProduct.id}-${Date.now()}.png`;
    link.click();
  }, [selectedProduct.id]);

  return (
    <section
      className="page-shell page-shell--workspace"
      aria-labelledby="configurator-heading"
    >
      <section className="workspace-header">
        <div>
          <div className="eyebrow">Configurateur AceFloor</div>
          <h2 id="configurator-heading" className="workspace-title">
            Configurateur interactif de tuiles de garage modulaires
          </h2>
          <p className="workspace-copy">
            Dessine ton garage, showroom ou atelier directement sur le plan. Les
            presets servent de point de depart, puis tu peux personnaliser tuile
            par tuile pour comparer les gammes AceFloor et estimer plus vite ton projet.
          </p>
        </div>

        <div className="workspace-aside">
          <div className="workspace-brandmark">
            <img
              src="/media/branding/acefloor-gold-logo.png"
              alt="AceFloor"
              className="workspace-brandmark-image"
            />
          </div>

        </div>
      </section>

      <section className="main-grid main-grid--workspace">
        <aside className="control-panel control-panel--sticky">
          <div className="section-stack">
            <section>
              <h2 className="section-title">Dimensions</h2>
              <div className="field-grid two-up">
                <div className="field">
                  <label htmlFor="room-width">Largeur</label>
                  <input
                    id="room-width"
                    min={1}
                    type="number"
                    value={roomWidth}
                    onChange={(event) => setRoomWidth(Number(event.target.value) || 0)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="room-length">Longueur</label>
                  <input
                    id="room-length"
                    min={1}
                    type="number"
                    value={roomLength}
                    onChange={(event) => setRoomLength(Number(event.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="room-unit">Unité</label>
                <select
                  id="room-unit"
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value as "ft" | "in" | "cm" | "m")
                  }
                >
                  <option value="ft">Pieds</option>
                  <option value="in">Pouces</option>
                  <option value="cm">Centimètres</option>
                  <option value="m">Mètres</option>
                </select>
              </div>

            </section>

            <section>
              <h2 className="section-title">Seuil & edges</h2>
              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="garage-door-enabled">Porte de garage</label>
                <select
                  id="garage-door-enabled"
                  value={garageDoorEnabled ? "yes" : "no"}
                  onChange={(event) => setGarageDoorEnabled(event.target.value === "yes")}
                >
                  <option value="yes">Actif</option>
                  <option value="no">Inactif</option>
                </select>
              </div>

              {garageDoorEnabled ? (
                <>
                  <div className="field">
                    <label htmlFor="garage-door-width">Largeur ouverture ({unit})</label>
                    <input
                      id="garage-door-width"
                      min={0}
                      step="0.1"
                      max={roomWidth}
                      type="number"
                      value={garageDoorWidth}
                      onChange={(event) =>
                        setGarageDoorWidth(Number(event.target.value) || 0)
                      }
                    />
                  </div>

                  <div className="field" style={{ marginTop: 14 }}>
                    <label htmlFor="garage-door-offset">
                      Position porte depuis le mur gauche ({unit})
                    </label>
                    <input
                      id="garage-door-offset"
                      min={0}
                      step="0.1"
                      max={Math.max(roomWidth - garageDoorWidth, 0)}
                      type="number"
                      value={garageDoorOffset}
                      onChange={(event) =>
                        setGarageDoorOffset(Number(event.target.value) || 0)
                      }
                    />
                  </div>

                  <p className="muted-copy" style={{ margin: "10px 0 0" }}>
                    Tout le plan commence 4.5" plus bas. Devant la porte :
                    edges sur l'ouverture, coupes de 4.5" de chaque côté.
                  </p>
                </>
              ) : (
                <p className="muted-copy" style={{ margin: 0 }}>
                  Aucun seuil appliqué au calcul.
                </p>
              )}
            </section>

            <section>
              <div className="inline-header">
                <h2 className="section-title" style={{ margin: 0 }}>
                  Découpes
                </h2>
                <button type="button" className="button" onClick={addObstacle}>
                  Ajouter
                </button>
              </div>

              <div className="section-stack">
                {obstacles.length === 0 ? (
                  <p className="muted-copy" style={{ margin: 0 }}>
                    Aucune découpe.
                  </p>
                ) : (
                  obstacles.map((obstacle, index) => (
                    <div key={obstacle.id} className="step-item compact">
                      <div className="inline-header">
                        <strong>Découpe {index + 1}</strong>
                        <button
                          type="button"
                          className="button"
                          onClick={() => removeObstacle(obstacle.id)}
                        >
                          Supprimer
                        </button>
                      </div>

                      <div className="field-grid two-up">
                        <div className="field">
                          <label htmlFor={`obs-x-${obstacle.id}`}>X ({unit})</label>
                          <input
                            id={`obs-x-${obstacle.id}`}
                            min={0}
                            step="0.1"
                            type="number"
                            value={obstacle.x}
                            onChange={(event) =>
                              updateObstacle(obstacle.id, {
                                x: Number(event.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div className="field">
                          <label htmlFor={`obs-y-${obstacle.id}`}>Y ({unit})</label>
                          <input
                            id={`obs-y-${obstacle.id}`}
                            min={0}
                            step="0.1"
                            type="number"
                            value={obstacle.y}
                            onChange={(event) =>
                              updateObstacle(obstacle.id, {
                                y: Number(event.target.value) || 0,
                              })
                            }
                          />
                        </div>

                        <div className="field">
                          <label htmlFor={`obs-w-${obstacle.id}`}>Largeur ({unit})</label>
                          <input
                            id={`obs-w-${obstacle.id}`}
                            min={0.5}
                            step="0.1"
                            type="number"
                            value={obstacle.width}
                            onChange={(event) =>
                              updateObstacle(obstacle.id, {
                                width: Number(event.target.value) || 0.5,
                              })
                            }
                          />
                        </div>

                        <div className="field">
                          <label htmlFor={`obs-h-${obstacle.id}`}>Longueur ({unit})</label>
                          <input
                            id={`obs-h-${obstacle.id}`}
                            min={0.5}
                            step="0.1"
                            type="number"
                            value={obstacle.height}
                            onChange={(event) =>
                              updateObstacle(obstacle.id, {
                                height: Number(event.target.value) || 0.5,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </aside>

        <section className="canvas-panel canvas-panel--workspace">
          <div className="canvas-toolbar canvas-toolbar--workspace">
            <div>
              <h2 className="section-title" style={{ marginBottom: 6 }}>
                Plan de travail
              </h2>
              <p className="muted-copy" style={{ margin: 0 }}>
                Vue 2D active. Clique ou glisse pour dessiner sur les tuiles.
              </p>
            </div>

            <div className="mode-switch">
              <span className="mode-pill active">2D</span>
              <span className="mode-pill">3D</span>
            </div>
          </div>

          <div className="paint-workbench">
            <div className="workspace-card-head workspace-card-head--tight">
              <span className="workspace-card-kicker">Palette</span>
              <strong>Dessin libre et presets</strong>
            </div>

            <div className="preset-strip">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`preset-pill${
                    layoutMode === preset.value ? " active" : ""
                  }`}
                  onClick={() =>
                    setLayoutMode(
                      preset.value as "solid" | "checker" | "border" | "manual",
                    )
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="paint-meta">
              <span className="tag">Gamme: {selectedProduct.name}</span>
              <span className="tag">Surface: {estimate.areaSqFt.toFixed(1)} pi²</span>
              <span className="tag">Tuiles: {estimate.totalTiles}</span>
              <span className="tag">Plan: {paintedTileCount}</span>
              <span className="tag">Estimatif: {formatCurrency(estimate.totalEstimate)}</span>
            </div>

          </div>

          <div className="canvas-workspace-shell">
            <div className="canvas-surface">
              <RoomCanvas
              roomWidth={roomWidth}
              roomLength={roomLength}
              roomShape={effectiveRoomShape}
              cutoutWidth={0}
              cutoutLength={0}
                garageDoorEnabled={garageDoorEnabled}
                garageDoorWidth={garageDoorWidth}
                garageDoorOffset={garageDoorOffset}
                unit={unit}
                tileWidthIn={selectedProduct.tileWidthIn}
                tileHeightIn={selectedProduct.tileHeightIn}
                layoutMode={layoutMode}
                selectedProductId={selectedProduct.id}
                selectedProductName={selectedProduct.name}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                interactionMode={interactionMode}
                paintScope={paintScope}
                activePaintColor={activePaintColor}
                activePaintTool={activePaintTool}
                paintedTileColors={paintedTileColors}
                exportRequestId={exportRequestId}
                clearMeasureRequestId={clearMeasureRequestId}
                obstacles={obstacles}
                onPaintTile={(tileKey, color) => {
                  if (layoutMode !== "manual") {
                    setLayoutMode("manual");
                  }
                  paintTile(tileKey, color);
                }}
                onEraseTile={eraseTile}
                onExportReady={handleExportReady}
                onGarageDoorOffsetChange={setGarageDoorOffset}
                onObstaclePositionChange={(id, nextX, nextY) =>
                  updateObstacle(id, { x: nextX, y: nextY })
                }
              />
            </div>

            <aside className="tool-rail" aria-label="Outils du plan">
              <ToolRailButton
                label="Couleur"
                icon={renderToolIcon("paint")}
                isActive={
                  activeToolPanel === "colors"
                }
                onClick={() => {
                  setActiveToolPanel((current) =>
                    current === "colors" ? null : "colors",
                  );
                }}
              />
              {activeToolPanel === "colors" ? (
                <div className="tool-rail-panel">
                  <div className="tool-rail-tabs">
                    <button
                      type="button"
                      className={`tool-rail-tab${colorPanelTarget === "primary" ? " active" : ""}`}
                      onClick={() => setColorPanelTarget("primary")}
                    >
                      Principale
                    </button>
                    <button
                      type="button"
                      className={`tool-rail-tab${colorPanelTarget === "secondary" ? " active" : ""}`}
                      onClick={() => setColorPanelTarget("secondary")}
                    >
                      Secondaire
                    </button>
                    <button
                      type="button"
                      className={`tool-rail-tab${colorPanelTarget === "brush" ? " active" : ""}`}
                      onClick={() => setColorPanelTarget("brush")}
                    >
                      Tuile
                    </button>
                  </div>

                  <div className="tool-rail-swatches">
                    {selectedProduct.availableColors.map((color) => {
                      const isActive =
                        colorPanelTarget === "primary"
                          ? primaryColor === color
                          : colorPanelTarget === "secondary"
                            ? secondaryColor === color
                            : activePaintColor === color;

                      return (
                        <button
                          key={`tool-${color}`}
                          type="button"
                          className={`tool-rail-swatch${isActive ? " active" : ""}`}
                          title={color}
                          onClick={() => {
                            if (colorPanelTarget === "primary") {
                              setPrimaryColor(color);
                              return;
                            }

                            if (colorPanelTarget === "secondary") {
                              setSecondaryColor(color);
                              return;
                            }

                            setInteractionMode("paint");
                            setActivePaintColor(color);
                            setActivePaintTool("paint");
                          }}
                        >
                          <span
                            className="tool-rail-swatch-dot"
                            style={{ backgroundColor: getColorHex(color) }}
                          />
                          <span className="tool-rail-swatch-label">{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <ToolRailButton
                label="Effacer"
                icon={renderToolIcon("eraser")}
                isActive={interactionMode === "paint" && activePaintTool === "erase"}
                onClick={() => {
                  setInteractionMode("paint");
                  setActivePaintTool("erase");
                  setActiveToolPanel(null);
                }}
              />
              <ToolRailButton
                label="Tuile"
                icon={renderToolIcon("tile")}
                isActive={interactionMode === "paint" && paintScope === "tile"}
                onClick={() => {
                  setInteractionMode("paint");
                  setPaintScope("tile");
                  setActiveToolPanel(null);
                }}
              />
              <ToolRailButton
                label="Zone"
                icon={renderToolIcon("zone")}
                isActive={interactionMode === "paint" && paintScope === "area"}
                onClick={() => {
                  setInteractionMode("paint");
                  setPaintScope("area");
                  setActiveToolPanel(null);
                }}
              />
              <ToolRailButton
                label="Mesure"
                icon={renderToolIcon("measure")}
                isActive={interactionMode === "measure"}
                onClick={() => {
                  setInteractionMode("measure");
                  setActiveToolPanel(null);
                }}
              />
              <ToolRailButton
                label="Reset plan"
                icon={renderToolIcon("reset")}
                onClick={() => {
                  clearPaintedTiles();
                  setActiveToolPanel(null);
                }}
              />
              <ToolRailButton
                label="Reset cotes"
                icon={renderToolIcon("ruler")}
                onClick={() => {
                  setClearMeasureRequestId((current) => current + 1);
                  setActiveToolPanel(null);
                }}
              />
              <ToolRailButton
                label="Export"
                icon={renderToolIcon("export")}
                onClick={() => {
                  setExportRequestId((current) => current + 1);
                  setActiveToolPanel(null);
                }}
              />
            </aside>
          </div>
        </section>

        <aside className="catalog-panel catalog-panel--sticky">
          <div className="section-stack">
            <section>
              <h2 className="section-title">Gamme</h2>
              <div className="catalog-list catalog-list--simple">
                {orderedProducts.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`catalog-choice${
                      product.id === selectedProductId ? " active" : ""
                    }`}
                    onClick={() => {
                      const firstColor = product.availableColors[0] ?? "Noir";
                      const secondColor = product.availableColors[1] ?? firstColor;

                      setSelectedProductId(product.id);
                      setPrimaryColor(firstColor);
                      setSecondaryColor(secondColor);
                      setActivePaintColor(firstColor);
                    }}
                  >
                    <span className="catalog-choice-index">{index + 1}.</span>
                    <span className="catalog-choice-name">{product.name}</span>
                    <span className="catalog-choice-meta">{product.tileWeightGrams} g</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="summary-panel summary-panel--compact">
              <h2 className="summary-title">Résumé</h2>
              <div className="summary-grid">
                <div className="summary-metric compact">
                  <span className="summary-metric-label">Pertes</span>
                  <strong className="summary-metric-value">
                    {estimate.wasteTiles} tuiles
                  </strong>
                </div>
                <div className="summary-metric compact">
                  <span className="summary-metric-label">Edges</span>
                  <strong className="summary-metric-value">
                    {estimate.garageDoorEdgeTotalPieces} pcs
                  </strong>
                </div>
              </div>
              <p className="summary-note">
                Offset porte :{" "}
                <strong>
                  {fromInches(estimate.garageDoorOffsetIn, unit).toFixed(1)} {unit}
                </strong>
                {" "}| Coupes avant G/D :{" "}
                <strong>
                  {estimate.garageDoorLeftTileCuts} / {estimate.garageDoorRightTileCuts}
                </strong>
                {" "}| Total coupes avant :{" "}
                <strong>{estimate.garageDoorFrontTileCutsTotal}</strong>
                {" "}| Hors pose :{" "}
                <strong>{preview.excludedAreaSqFt.toFixed(1)} pi²</strong>
                {" "}| Découpes : <strong>{obstacles.length}</strong>
                {" "}| Bordure :{" "}
                <strong>{estimate.borderLinearFeet.toFixed(1)} pi lin.</strong>
              </p>
            </section>

            <section>
              <h2 className="section-title">Actions</h2>
              <div className="action-row">
                <button type="button" className="button primary">
                  Sauvegarder le projet
                </button>
                <button type="button" className="button">
                  Générer un devis
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => setExportRequestId((current) => current + 1)}
                >
                  Export image
                </button>
              </div>
            </section>
          </div>
        </aside>
      </section>
    </section>
  );
}

function getColorHex(color: string): string {
  return paintColorMap[color] ?? "#2f343c";
}

type ToolIconName =
  | "paint"
  | "eraser"
  | "tile"
  | "zone"
  | "measure"
  | "reset"
  | "ruler"
  | "export";

type ToolRailButtonProps = {
  label: string;
  icon: ReactNode;
  isActive?: boolean;
  onClick: () => void;
};

function ToolRailButton(props: ToolRailButtonProps) {
  return (
    <button
      type="button"
      className={`tool-rail-button${props.isActive ? " active" : ""}`}
      onClick={props.onClick}
      aria-pressed={props.isActive}
      title={props.label}
    >
      <span className="tool-rail-icon">{props.icon}</span>
      <span className="tool-rail-label">{props.label}</span>
    </button>
  );
}

function renderToolIcon(name: ToolIconName) {
  switch (name) {
    case "paint":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 4 20 10 10 20H4v-6L14 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 6 18 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "eraser":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m8 5 11 11-4 4H7L3 16l5-11Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10 19h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "tile":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "zone":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
          <path d="M8 8h8v8H8Z" fill="currentColor" opacity="0.28" />
        </svg>
      );
    case "measure":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 18 18 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M7 15h2M10 12h2M13 9h2M16 6h2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "reset":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 8V4H2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 4a9 9 0 1 1-1 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "ruler":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="7" width="16" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 9v3M11 9v2M14 9v3M17 9v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "export":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}
