"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  buildRoomPreview,
  computeEstimateFromPreview,
  formatCurrency,
} from "@acefloor/core-engine";
import {
  catalogProducts,
  getCatalogProductHeroImage,
} from "../data/mock-catalog";
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

const DELIVERY_ORIGIN_ADDRESS = "1335 Route 263 Nord, Princeville, Quebec, Canada";
const DELIVERY_RATE_PER_KM = 1.5;

type DeliveryQuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      distanceKm: number;
      transportSubtotal: number;
      destinationAddress: string;
      distanceSource: "route" | "estimated";
    }
  | { status: "error"; message: string };

export function ConfiguratorShell({
  initialProductId,
}: ConfiguratorShellProps) {
  const effectiveRoomShape = "rectangle" as const;
  const installationPricePerSqFt = 2;
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"paint" | "measure">("paint");
  const [paintScope, setPaintScope] = useState<"tile" | "area">("tile");
  const [activeToolPanel, setActiveToolPanel] = useState<"colors" | null>(null);
  const [colorPanelTarget, setColorPanelTarget] = useState<"primary" | "secondary" | "brush">("brush");
  const [exportRequestId, setExportRequestId] = useState(0);
  const [clearMeasureRequestId, setClearMeasureRequestId] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [includeInstallation, setIncludeInstallation] = useState(false);
  const [clientAddress, setClientAddress] = useState("");
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuoteState>({
    status: "idle",
  });
  const roomWidth = useConfiguratorStore((state) => state.roomWidth);
  const roomLength = useConfiguratorStore((state) => state.roomLength);
  const garageDoorEnabled = useConfiguratorStore((state) => state.garageDoorEnabled);
  const garageDoorWidth = useConfiguratorStore((state) => state.garageDoorWidth);
  const garageDoorOffset = useConfiguratorStore((state) => state.garageDoorOffset);
  const unit = useConfiguratorStore((state) => state.unit);
  const obstacles = useConfiguratorStore((state) => state.obstacles);
  const exteriorDoors = useConfiguratorStore((state) => state.exteriorDoors);
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
  const clearObstacles = useConfiguratorStore((state) => state.clearObstacles);
  const removeObstacle = useConfiguratorStore((state) => state.removeObstacle);
  const updateObstacle = useConfiguratorStore((state) => state.updateObstacle);
  const addExteriorDoor = useConfiguratorStore((state) => state.addExteriorDoor);
  const removeExteriorDoor = useConfiguratorStore((state) => state.removeExteriorDoor);
  const updateExteriorDoor = useConfiguratorStore((state) => state.updateExteriorDoor);
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
  const unitOptions = [
    { value: "ft", label: "Pi / po" },
    { value: "in", label: "Pouces" },
    { value: "cm", label: "CM" },
    { value: "m", label: "M" },
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
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const syncMobileState = () => setIsMobileLayout(mediaQuery.matches);

    syncMobileState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncMobileState);
      return () => mediaQuery.removeEventListener("change", syncMobileState);
    }

    mediaQuery.addListener(syncMobileState);
    return () => mediaQuery.removeListener(syncMobileState);
  }, []);

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

  useEffect(() => {
    if (copyState === "idle") return;

    const timeout = window.setTimeout(() => {
      setCopyState("idle");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [copyState]);

  useEffect(() => {
    if (includeInstallation) {
      setDeliveryQuote({ status: "idle" });
      return;
    }

    const trimmedAddress = clientAddress.trim();

    if (trimmedAddress.length < 8) {
      setDeliveryQuote({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setDeliveryQuote({ status: "loading" });

      try {
        const response = await fetch("/api/delivery-quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address: trimmedAddress }),
          signal: controller.signal,
        });
        const payload = (await response.json()) as
          | {
              destinationAddress: string;
              distanceKm: number;
              transportSubtotal: number;
              distanceSource?: "route" | "estimated";
            }
          | { error?: string };

        if (!response.ok || !("distanceKm" in payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Impossible de calculer le transport.",
          );
        }

        setDeliveryQuote({
          status: "ready",
          distanceKm: payload.distanceKm,
          transportSubtotal: payload.transportSubtotal,
          destinationAddress: payload.destinationAddress,
          distanceSource: payload.distanceSource ?? "route",
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        setDeliveryQuote({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Impossible de calculer le transport.",
        });
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [clientAddress, includeInstallation]);

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
    exteriorDoors,
  });

  const estimate = computeEstimateFromPreview({
    preview,
    tileAreaSqFt: selectedProduct.tileAreaSqFt,
    pricePerSqFt: selectedProduct.pricePerSqFt,
    includePerimeterBorders: layoutMode === "border",
    tilesPerBox: selectedProduct.tilesPerBox,
  });
  const installationSubtotal = includeInstallation
    ? Number(
        (estimate.billableAreaSqFt * installationPricePerSqFt).toFixed(2),
      )
    : 0;
  const deliverySubtotal =
    includeInstallation || deliveryQuote.status !== "ready"
      ? 0
      : deliveryQuote.transportSubtotal;
  const totalReady = includeInstallation || deliveryQuote.status === "ready";
  const projectTotal = Number(
    (estimate.totalEstimate + installationSubtotal + deliverySubtotal).toFixed(2),
  );
  const projectQuote = buildProjectQuote({
    roomWidth,
    roomLength,
    unit,
    productName: selectedProduct.name,
    productPositioning: selectedProduct.positioningLabel,
    layoutMode,
    primaryColor,
    secondaryColor,
    estimateAreaSqFt: estimate.areaSqFt,
    billableAreaSqFt: estimate.billableAreaSqFt,
    installTiles: estimate.installTiles,
    cutTiles: estimate.cutTiles,
    totalTiles: estimate.totalTiles,
    boxesRequired: estimate.boxesRequired,
    materialSubtotal: estimate.tileSubtotal,
    installationIncluded: includeInstallation,
    installationSubtotal,
    clientAddress,
    deliveryIncluded: includeInstallation,
    deliverySubtotal,
    deliveryDistanceKm:
      deliveryQuote.status === "ready" ? deliveryQuote.distanceKm : null,
    deliveryDistanceSource:
      deliveryQuote.status === "ready" ? deliveryQuote.distanceSource : null,
    deliveryOriginAddress: DELIVERY_ORIGIN_ADDRESS,
    projectTotal,
    totalReady,
    complexityLabel: estimate.complexityLabel,
    garageDoorEnabled,
    garageDoorWidth,
    garageDoorOffset,
    obstaclesCount: obstacles.length,
    materialPricePerSqFt: selectedProduct.pricePerSqFt,
  });
  const controlsSummary = [
    `${formatDimensionValue(roomWidth, unit)} x ${formatDimensionValue(roomLength, unit)}`,
    garageDoorEnabled ? "seuil garage actif" : "sans seuil garage",
    `${exteriorDoors.length} porte${exteriorDoors.length > 1 ? "s" : ""}`,
    `${obstacles.length} decrochement${obstacles.length > 1 ? "s" : ""}`,
  ].join(" • ");
  const commercialSummary = [
    selectedProduct.name,
    `${estimate.boxesRequired} boite${estimate.boxesRequired > 1 ? "s" : ""}`,
    totalReady ? `${formatCurrency(projectTotal)}` : "transport a calculer",
  ].join(" • ");
  const installationDirectionNote = garageDoorEnabled
    ? "commencer par le edge de la porte de garage principale, puis poser la premiere tuile en bas a gauche. Voir les videos explicatives d'installation."
    : "commencer par la premiere tuile en bas a gauche. Voir les videos explicatives d'installation.";
  const deliveryNote = includeInstallation
    ? "Transport inclus avec la pose partout au Quebec."
    : deliveryQuote.status === "ready"
      ? deliveryQuote.distanceSource === "estimated"
        ? `Transport estime depuis ${DELIVERY_ORIGIN_ADDRESS} jusqu'a ${deliveryQuote.destinationAddress}.`
        : `Transport calcule depuis ${DELIVERY_ORIGIN_ADDRESS} jusqu'a ${deliveryQuote.destinationAddress}.`
      : deliveryQuote.status === "loading"
        ? "Calcul du transport en cours."
        : deliveryQuote.status === "error"
          ? deliveryQuote.message
          : `Entre l'adresse client pour calculer le transport a ${formatCurrency(DELIVERY_RATE_PER_KM)} / km depuis ${DELIVERY_ORIGIN_ADDRESS}.`;

  const handleExportReady = useCallback((dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `acefloor-plan-${selectedProduct.id}-${Date.now()}.png`;
    link.click();
  }, [selectedProduct.id]);

  const handleProductSelection = useCallback((productId: string) => {
    const product = orderedProducts.find((entry) => entry.id === productId);

    if (!product) return;

    const firstColor = product.availableColors[0] ?? "Noir";
    const secondColor = product.availableColors[1] ?? firstColor;

    setSelectedProductId(product.id);
    setPrimaryColor(firstColor);
    setSecondaryColor(secondColor);
    setActivePaintColor(firstColor);
  }, [
    orderedProducts,
    setActivePaintColor,
    setPrimaryColor,
    setSecondaryColor,
    setSelectedProductId,
  ]);

  const handleCopyProjectQuote = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(projectQuote);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }, [projectQuote]);

  const controlsPanelContent = (
    <div className="section-stack">
      {isMobileLayout ? (
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
                  inputMode={unit === "ft" ? "decimal" : "numeric"}
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
                  inputMode={unit === "ft" ? "decimal" : "numeric"}
                  value={garageDoorOffset}
                  onChange={(event) =>
                    setGarageDoorOffset(Number(event.target.value) || 0)
                  }
                />
              </div>

              <p className="muted-copy" style={{ margin: "10px 0 0" }}>
                Au bas, le montage demarre avec les edges directement sur la
                porte. Les coupes se gerent de chaque cote de l'ouverture, sans
                decrochement beton au seuil principal.
              </p>
            </>
          ) : (
            <p className="muted-copy" style={{ margin: 0 }}>
              Aucun seuil applique au calcul.
            </p>
          )}
        </section>
      ) : null}

      <section>
        <div className="inline-header">
          <h2 className="section-title" style={{ margin: 0 }}>
            Portes additionnelles
          </h2>
          <button
            type="button"
            className="button"
            onClick={addExteriorDoor}
          >
            Ajouter
          </button>
        </div>
        <div className="section-stack">
          {exteriorDoors.length === 0 ? (
            <p className="muted-copy" style={{ margin: 0 }}>
              Ajoute une porte sur le mur gauche, droit ou au fond.
            </p>
          ) : (
            exteriorDoors.map((door, index) => {
              const wallLimit = door.wall === "bottom" ? roomWidth : roomLength;

              return (
                <div key={door.id} className="step-item compact">
                  <div className="inline-header">
                    <strong>Porte {index + 1}</strong>
                    <button
                      type="button"
                      className="button"
                      onClick={() => removeExteriorDoor(door.id)}
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="field-grid two-up">
                    <div className="field">
                      <label htmlFor={`door-kind-${door.id}`}>Type</label>
                      <select
                        id={`door-kind-${door.id}`}
                        value={door.kind}
                        onChange={(event) =>
                          updateExteriorDoor(door.id, {
                            kind: event.target.value as "garage" | "man",
                          })
                        }
                      >
                        <option value="man">Porte d'homme</option>
                        <option value="garage">Porte de garage</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor={`door-wall-${door.id}`}>Mur</label>
                      <select
                        id={`door-wall-${door.id}`}
                        value={door.wall}
                        onChange={(event) =>
                          updateExteriorDoor(door.id, {
                            wall: event.target.value as "left" | "right" | "bottom",
                          })
                        }
                      >
                        <option value="left">Gauche</option>
                        <option value="right">Droite</option>
                        <option value="bottom">Fond</option>
                      </select>
                    </div>

                    <div className="field">
                      <label htmlFor={`door-width-${door.id}`}>Largeur ({unit})</label>
                      <input
                        id={`door-width-${door.id}`}
                        min={unit === "ft" ? 1 : 12}
                        step={unit === "ft" ? 1 / 12 : 0.1}
                        max={wallLimit}
                        type="number"
                        inputMode={unit === "ft" ? "decimal" : "numeric"}
                        value={door.width}
                        onChange={(event) =>
                          updateExteriorDoor(door.id, {
                            width: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="field">
                      <label htmlFor={`door-offset-${door.id}`}>
                        Position depuis l'avant ({unit})
                      </label>
                      <input
                        id={`door-offset-${door.id}`}
                        min={0}
                        step={unit === "ft" ? 1 / 12 : 0.1}
                        max={Math.max(wallLimit - door.width, 0)}
                        type="number"
                        inputMode={unit === "ft" ? "decimal" : "numeric"}
                        value={door.offset}
                        onChange={(event) =>
                          updateExteriorDoor(door.id, {
                            offset: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <p className="muted-copy" style={{ margin: "10px 0 0" }}>
                    {door.kind === "garage"
                      ? door.wall === "bottom"
                        ? "Au fond, la porte de garage cree elle aussi un decrochement aligne aux tuiles pleines. La regle du seuil direct s'applique seulement a la porte principale du bas."
                        : "Sur un mur lateral, la porte de garage cree un decrochement aligne aux tuiles pleines. Une bande de beton peut rester visible a peinturer."
                      : "Une porte d'homme n'a pas besoin de edge devant l'ouverture."}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section>
        <div className="inline-header">
          <h2 className="section-title" style={{ margin: 0 }}>
            Decrochements
          </h2>
          <button type="button" className="button" onClick={addObstacle}>
            Ajouter
          </button>
        </div>

        <div className="section-stack">
          {obstacles.length === 0 ? (
            <p className="muted-copy" style={{ margin: 0 }}>
              Aucun decrochement.
            </p>
          ) : (
            obstacles.map((obstacle, index) => (
              <div key={obstacle.id} className="step-item compact">
                <div className="inline-header">
                  <strong>Decrochement {index + 1}</strong>
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
                      inputMode={unit === "ft" ? "decimal" : "numeric"}
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
                      inputMode={unit === "ft" ? "decimal" : "numeric"}
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
                      inputMode={unit === "ft" ? "decimal" : "numeric"}
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
                      inputMode={unit === "ft" ? "decimal" : "numeric"}
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
  );

  const colorToolPanelContent =
    activeToolPanel === "colors" ? (
      <>
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
      </>
    ) : null;

  const toolRailButtonItems = (
    <>
      <ToolRailButton
        label="Couleur"
        icon={renderToolIcon("paint")}
        isActive={activeToolPanel === "colors"}
        onClick={() => {
          setInteractionMode("paint");
          setActivePaintTool("paint");
          setActiveToolPanel((current) => (current === "colors" ? null : "colors"));
        }}
      />
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
    </>
  );

  const desktopSetupDock = !isMobileLayout ? (
    <aside className="canvas-utility-dock" aria-label="Configuration rapide">
      <section className="workspace-inline-card">
        <div className="workspace-card-head workspace-card-head--tight">
          <span className="workspace-card-kicker">Setup</span>
          <strong>Dimensions garage</strong>
        </div>
        <div className="mobile-unit-strip" role="group" aria-label="Unite">
          {unitOptions.map((option) => (
            <button
              key={`desktop-unit-${option.value}`}
              type="button"
              className={`mobile-unit-pill${unit === option.value ? " active" : ""}`}
              onClick={() => setUnit(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mobile-dimension-grid desktop-dimension-grid">
          <CompactDimensionField
            id="desktop-room-width"
            label="Largeur"
            unit={unit}
            value={roomWidth}
            min={1}
            onChange={setRoomWidth}
          />
          <CompactDimensionField
            id="desktop-room-length"
            label="Longueur"
            unit={unit}
            value={roomLength}
            min={1}
            onChange={setRoomLength}
          />
        </div>
      </section>

      <section className="workspace-inline-card">
        <div className="workspace-card-head workspace-card-head--tight">
          <span className="workspace-card-kicker">Seuil</span>
          <strong>Porte principale</strong>
        </div>
        <div className="field">
          <label htmlFor="desktop-garage-door-enabled">Porte de garage</label>
          <select
            id="desktop-garage-door-enabled"
            value={garageDoorEnabled ? "yes" : "no"}
            onChange={(event) => setGarageDoorEnabled(event.target.value === "yes")}
          >
            <option value="yes">Actif</option>
            <option value="no">Inactif</option>
          </select>
        </div>
        {garageDoorEnabled ? (
          <div className="workspace-inline-stack">
            <div className="field">
              <label htmlFor="desktop-garage-door-width">Largeur ouverture ({unit})</label>
              <input
                id="desktop-garage-door-width"
                min={0}
                step="0.1"
                max={roomWidth}
                type="number"
                inputMode={unit === "ft" ? "decimal" : "numeric"}
                value={garageDoorWidth}
                onChange={(event) =>
                  setGarageDoorWidth(Number(event.target.value) || 0)
                }
              />
            </div>
            <div className="field">
              <label htmlFor="desktop-garage-door-offset">
                Offset gauche ({unit})
              </label>
              <input
                id="desktop-garage-door-offset"
                min={0}
                step="0.1"
                max={Math.max(roomWidth - garageDoorWidth, 0)}
                type="number"
                inputMode={unit === "ft" ? "decimal" : "numeric"}
                value={garageDoorOffset}
                onChange={(event) =>
                  setGarageDoorOffset(Number(event.target.value) || 0)
                }
              />
            </div>
          </div>
        ) : (
          <p className="muted-copy" style={{ margin: 0 }}>
            Seuil inactif.
          </p>
        )}
      </section>
    </aside>
  ) : null;

  const desktopToolDock = !isMobileLayout ? (
    <aside className="workspace-tool-column" aria-label="Outils du plan">
      <div className="tool-rail tool-rail--stacked">
        {toolRailButtonItems}
      </div>
      {colorToolPanelContent ? (
        <div className="canvas-floating-panel canvas-floating-panel--inline">
          {colorToolPanelContent}
        </div>
      ) : null}
    </aside>
  ) : null;

  const catalogPanelContent = (
    <div className="section-stack">
      <section className="summary-panel summary-panel--compact quote-panel">
        <h2 className="summary-title">Soumission</h2>
        <div className="quote-option">
          <label htmlFor="quote-installation">Pose</label>
          <select
            id="quote-installation"
            value={includeInstallation ? "yes" : "no"}
            onChange={(event) => setIncludeInstallation(event.target.value === "yes")}
          >
            <option value="no">Non</option>
            <option value="yes">Oui • 2,00 $ / pi²</option>
          </select>
        </div>
        <div className="quote-option">
          <label htmlFor="quote-address">Adresse client</label>
          <textarea
            id="quote-address"
            rows={3}
            value={clientAddress}
            onChange={(event) => setClientAddress(event.target.value)}
            placeholder="Adresse complete du client"
          />
        </div>
        <div className="summary-grid quote-grid">
          <div className="summary-metric compact">
            <span className="summary-metric-label">Materiau</span>
            <strong className="summary-metric-value">
              {formatCurrency(estimate.tileSubtotal)}
            </strong>
          </div>
          <div className="summary-metric compact">
            <span className="summary-metric-label">Pose</span>
            <strong className="summary-metric-value">
              {includeInstallation ? formatCurrency(installationSubtotal) : formatCurrency(0)}
            </strong>
          </div>
          <div className="summary-metric compact">
            <span className="summary-metric-label">Transport</span>
            <strong className="summary-metric-value">
              {includeInstallation
                ? "Inclus"
                : deliveryQuote.status === "ready"
                  ? formatCurrency(deliverySubtotal)
                  : deliveryQuote.status === "loading"
                    ? "Calcul..."
                    : deliveryQuote.status === "error"
                      ? "Erreur"
                      : "Adresse"}
            </strong>
          </div>
          <div className="summary-metric compact">
            <span className="summary-metric-label">Boites</span>
            <strong className="summary-metric-value">
              {estimate.boxesRequired}
            </strong>
          </div>
          <div className="summary-metric compact">
            <span className="summary-metric-label">Distance</span>
            <strong className="summary-metric-value">
              {includeInstallation
                ? "0 km"
                : deliveryQuote.status === "ready"
                  ? `${deliveryQuote.distanceKm.toFixed(1)} km`
                  : "--"}
            </strong>
          </div>
          <div className="summary-metric compact quote-metric--total">
            <span className="summary-metric-label">Total</span>
            <strong className="summary-metric-value">
              {totalReady ? formatCurrency(projectTotal) : "A calculer"}
            </strong>
          </div>
        </div>
        <p className="summary-note">{deliveryNote}</p>
        <p className="summary-note">
          Base de calcul : <strong>{estimate.billableAreaSqFt.toFixed(1)} pi²</strong>
          {" "}facturable • <strong>{estimate.totalTiles} tuiles</strong> •{" "}
          <strong>{formatCurrency(selectedProduct.pricePerSqFt)} / pi²</strong> materiau
          • taxes non incluses.
        </p>
      </section>

      <section className="summary-panel summary-panel--compact">
        <h2 className="summary-title">Details chantier</h2>
        <div className="summary-grid">
          <div className="summary-metric compact">
            <span className="summary-metric-label">Tuiles</span>
            <strong className="summary-metric-value">
              {estimate.installTiles}
            </strong>
          </div>
          <div className="summary-metric compact">
            <span className="summary-metric-label">Edges</span>
            <strong className="summary-metric-value">
              {estimate.garageDoorEdgeTotalPieces} pcs
            </strong>
          </div>
          <div className="summary-metric compact">
            <span className="summary-metric-label">Coupes</span>
            <strong className="summary-metric-value">
              {estimate.cutTiles}
            </strong>
          </div>
          <div className="summary-metric compact">
            <span className="summary-metric-label">Pi2 reel</span>
            <strong className="summary-metric-value">
              {estimate.areaSqFt.toFixed(1)} pi²
            </strong>
          </div>
          <div className="summary-metric compact">
            <span className="summary-metric-label">Pi2 facturable</span>
            <strong className="summary-metric-value">
              {estimate.billableAreaSqFt.toFixed(1)} pi²
            </strong>
          </div>
        </div>
        <p className="summary-note">
          <strong>Sens d'installation :</strong> {installationDirectionNote}
        </p>
      </section>
    </div>
  );

  const desktopWorkbenchShowcase = !isMobileLayout ? (
    <div className="paint-workbench-showcase">
      <div className="paint-overview-card">
        <span className="workspace-card-kicker">Apercu 2D</span>
        <strong>
          {selectedProduct.name} • {preview.columns} x {preview.rows} tuiles
        </strong>
        <p>
          {garageDoorEnabled
            ? `Porte garage • seuil edge au bas • ${garageDoorWidth} ${unit}`
            : "Sans porte de garage principale"}
        </p>
        <div className="paint-overview-swatches" aria-label="Couleurs actives">
          {[primaryColor, secondaryColor].filter(Boolean).map((color, index) => (
            <span
              key={`${color}-${index}`}
              className="paint-overview-swatch"
              style={{ backgroundColor: getColorHex(color) }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="product-showcase-strip" aria-label="Gammes AceFloor">
        {orderedProducts.map((product) => {
          const preferredColor = product.availableColors.includes(primaryColor)
            ? primaryColor
            : product.availableColors[0];
          const productMedia =
            product.mediaByColor?.[preferredColor] ?? getCatalogProductHeroImage(product);

          return (
            <button
              key={`showcase-${product.id}`}
              type="button"
              className={`product-showcase-card${
                product.id === selectedProductId ? " active" : ""
              }`}
              onClick={() => handleProductSelection(product.id)}
            >
              <span className="product-showcase-kicker">{product.name}</span>
              <span className="product-showcase-weight">{product.tileWeightGrams} g</span>
              <span className="product-showcase-media">
                <img src={productMedia} alt={product.name} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <section
      className="page-shell page-shell--workspace"
      aria-labelledby="configurator-heading"
    >
      <section className="workspace-main">
        <section className="canvas-panel canvas-panel--workspace workspace-panel workspace-panel--canvas">
          <div className="canvas-toolbar canvas-toolbar--workspace">
            <div>
              <h2 id="configurator-heading" className="section-title" style={{ marginBottom: 6 }}>
                Plan de travail
              </h2>
              <p className="muted-copy" style={{ margin: 0 }}>
                Vue 2D active. Clique ou glisse pour dessiner sur les tuiles.
              </p>
            </div>

            <div className="workspace-toolbar-actions">
              <button
                type="button"
                className="button primary button--sharp"
                onClick={handleCopyProjectQuote}
              >
                {copyState === "copied"
                  ? "Brief copie"
                  : copyState === "error"
                    ? "Copie impossible"
                    : "Copier le brief"}
              </button>
              <button
                type="button"
                className="button button--sharp"
                onClick={() => setExportRequestId((current) => current + 1)}
              >
                Export image
              </button>
              <button
                type="button"
                className="button button--sharp"
                onClick={() => {
                  clearPaintedTiles();
                  clearObstacles();
                  setClearMeasureRequestId((current) => current + 1);
                }}
              >
                Reset projet
              </button>
            </div>
          </div>

          <div className="paint-workbench">
            <div className="paint-workbench-shell">
              <div className="paint-workbench-primary">
                <div className="workspace-card-head workspace-card-head--tight">
                  <span className="workspace-card-kicker">Palette</span>
                  <strong>
                    {isMobileLayout ? "Palette, gamme et dimensions" : "Dessin libre et presets"}
                  </strong>
                </div>

                {isMobileLayout ? (
                  <div className="mobile-workbench-stack">
                    <section className="mobile-workbench-card">
                      <div className="mobile-workbench-head">
                        <span className="workspace-card-kicker">Tuile</span>
                        <strong>{selectedProduct.name}</strong>
                      </div>
                      <div className="mobile-product-grid">
                        {orderedProducts.map((product) => (
                          <button
                            key={`mobile-product-${product.id}`}
                            type="button"
                            className={`mobile-product-pill${
                              product.id === selectedProductId ? " active" : ""
                            }`}
                            onClick={() => handleProductSelection(product.id)}
                          >
                            <span>{product.name}</span>
                            <small>{product.tileWeightGrams} g</small>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="mobile-workbench-card">
                      <div className="mobile-workbench-head">
                        <span className="workspace-card-kicker">Garage</span>
                        <strong>{formatDimensionValue(roomWidth, unit)} x {formatDimensionValue(roomLength, unit)}</strong>
                      </div>
                      <div className="mobile-unit-strip" role="group" aria-label="Unite">
                        {unitOptions.map((option) => (
                          <button
                            key={`mobile-unit-${option.value}`}
                            type="button"
                            className={`mobile-unit-pill${unit === option.value ? " active" : ""}`}
                            onClick={() => setUnit(option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="mobile-dimension-grid">
                        <CompactDimensionField
                          id="mobile-room-width"
                          label="Largeur"
                          unit={unit}
                          value={roomWidth}
                          min={1}
                          onChange={setRoomWidth}
                        />
                        <CompactDimensionField
                          id="mobile-room-length"
                          label="Longueur"
                          unit={unit}
                          value={roomLength}
                          min={1}
                          onChange={setRoomLength}
                        />
                      </div>
                    </section>
                  </div>
                ) : null}

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
                  <span className="tag">Motif: {getLayoutLabel(layoutMode)}</span>
                  <span className="tag">
                    Palette: {primaryColor}{secondaryColor ? ` / ${secondaryColor}` : ""}
                  </span>
                  <span className="tag">Plan: {paintedTileCount}</span>
                </div>
              </div>

              {desktopWorkbenchShowcase}
            </div>
          </div>

          <div className="canvas-workspace-shell">
            {desktopSetupDock}
            {desktopToolDock}
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
                exteriorDoors={exteriorDoors}
                onPaintTile={paintTile}
                onEraseTile={eraseTile}
                onExportReady={handleExportReady}
                onGarageDoorOffsetChange={setGarageDoorOffset}
                onObstaclePositionChange={(id, nextX, nextY) =>
                  updateObstacle(id, { x: nextX, y: nextY })
                }
              />
            </div>
            {isMobileLayout ? (
              <div className="canvas-overlay-dock">
                {colorToolPanelContent ? (
                  <div className="canvas-floating-panel">
                    {colorToolPanelContent}
                  </div>
                ) : null}
                <aside className="tool-rail" aria-label="Outils du plan">
                  {toolRailButtonItems}
                </aside>
              </div>
            ) : null}
          </div>
        </section>

        <section className="workspace-sidepanels">
          <aside className="control-panel control-panel--sticky workspace-panel workspace-panel--controls">
            {isMobileLayout ? (
              <WorkspaceFold
                title="Configuration chantier"
                subtitle={controlsSummary}
                defaultOpen
              >
                {controlsPanelContent}
              </WorkspaceFold>
            ) : (
              controlsPanelContent
            )}
          </aside>

          <aside className="catalog-panel catalog-panel--sticky workspace-panel workspace-panel--catalog">
            {isMobileLayout ? (
              <WorkspaceFold
                title="Soumission & details"
                subtitle={commercialSummary}
              >
                {catalogPanelContent}
              </WorkspaceFold>
            ) : (
              catalogPanelContent
            )}
          </aside>
        </section>
      </section>

    </section>
  );
}

type WorkspaceFoldProps = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function WorkspaceFold(props: WorkspaceFoldProps) {
  return (
    <details className="workspace-fold" open={props.defaultOpen}>
      <summary className="workspace-fold-summary">
        <div className="workspace-fold-copy">
          <span className="workspace-card-kicker">Mobile</span>
          <strong>{props.title}</strong>
          {props.subtitle ? <span>{props.subtitle}</span> : null}
        </div>
        <span className="workspace-fold-indicator" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="workspace-fold-body">{props.children}</div>
    </details>
  );
}

function getColorHex(color: string): string {
  return paintColorMap[color] ?? "#2f343c";
}

function getLayoutLabel(layoutMode: string): string {
  switch (layoutMode) {
    case "solid":
      return "Uni";
    case "checker":
      return "Damier";
    case "border":
      return "Bordure";
    case "manual":
      return "Libre";
    default:
      return layoutMode;
  }
}

type DimensionFieldProps = {
  id: string;
  label: string;
  unit: "ft" | "in" | "cm" | "m";
  value: number;
  min?: number;
  onChange: (value: number) => void;
};

function DimensionField(props: DimensionFieldProps) {
  if (props.unit === "ft") {
    const parts = splitFeetAndInches(props.value, props.min ?? 1);

    return (
      <div className="field field--dimension">
        <div className="dimension-field">
          <div className="dimension-field-head">
            <label>{props.label}</label>
            <div className="dimension-field-summary">
              {formatFeetAndInchesLabel(props.value, props.min ?? 1)}
            </div>
          </div>
          <div className="dimension-stepper-grid">
            <DimensionPartStepper
              id={`${props.id}-feet`}
              label="Pi"
              value={parts.feet}
              min={Math.max(Math.floor(props.min ?? 1), 0)}
              onDecrement={() =>
                props.onChange(adjustFeetAndInches(props.value, -12, props.min ?? 1))
              }
              onIncrement={() =>
                props.onChange(adjustFeetAndInches(props.value, 12, props.min ?? 1))
              }
              onValueChange={(nextFeet) =>
                props.onChange(updateFeetPart(props.value, nextFeet, props.min ?? 1))
              }
            />
            <DimensionPartStepper
              id={`${props.id}-inches`}
              label="Po"
              value={parts.inches}
              min={0}
              max={11}
              onDecrement={() =>
                props.onChange(adjustFeetAndInches(props.value, -1, props.min ?? 1))
              }
              onIncrement={() =>
                props.onChange(adjustFeetAndInches(props.value, 1, props.min ?? 1))
              }
              onValueChange={(nextInches) =>
                props.onChange(updateInchPart(props.value, nextInches, props.min ?? 1))
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const step = props.unit === "in" ? 1 : 0.1;

  return (
    <div className="field field--dimension">
      <label htmlFor={props.id}>{props.label}</label>
      <div className="dimension-stepper-single">
        <button
          type="button"
          className="dimension-stepper-button"
          aria-label={`Diminuer ${props.label}`}
          onClick={() =>
            props.onChange(Math.max(props.min ?? 0, roundToStep(props.value - step, step)))
          }
        >
          -
        </button>
        <input
          id={props.id}
          min={props.min ?? 0}
          step={step}
          type="number"
          value={props.value}
          onChange={(event) => props.onChange(Number(event.target.value) || props.min || 0)}
        />
        <button
          type="button"
          className="dimension-stepper-button"
          aria-label={`Augmenter ${props.label}`}
          onClick={() => props.onChange(roundToStep(props.value + step, step))}
        >
          +
        </button>
      </div>
    </div>
  );
}

function CompactDimensionField(props: DimensionFieldProps) {
  if (props.unit === "ft") {
    const parts = splitFeetAndInches(props.value, props.min ?? 1);

    return (
      <div className="compact-dimension-card">
        <div className="compact-dimension-head">
          <span>{props.label}</span>
          <div className="compact-dimension-summary" role="group" aria-label={props.label}>
            <CompactSummaryInput
              ariaLabel={`${props.label} pieds`}
              value={parts.feet}
              min={Math.max(Math.floor(props.min ?? 1), 0)}
              onCommit={(nextFeet) =>
                props.onChange(updateFeetPart(props.value, nextFeet, props.min ?? 1))
              }
            />
            <span>pi</span>
            <CompactSummaryInput
              ariaLabel={`${props.label} pouces`}
              value={parts.inches}
              min={0}
              max={11}
              onCommit={(nextInches) =>
                props.onChange(updateInchPart(props.value, nextInches, props.min ?? 1))
              }
            />
            <span>po</span>
          </div>
        </div>
        <div className="compact-dimension-parts">
          <CompactDimensionPartStepper
            id={`${props.id}-feet`}
            label="Pi"
            value={parts.feet}
            min={Math.max(Math.floor(props.min ?? 1), 0)}
            onDecrement={() =>
              props.onChange(adjustFeetAndInches(props.value, -12, props.min ?? 1))
            }
            onIncrement={() =>
              props.onChange(adjustFeetAndInches(props.value, 12, props.min ?? 1))
            }
            onValueChange={(nextFeet) =>
              props.onChange(updateFeetPart(props.value, nextFeet, props.min ?? 1))
            }
          />
          <CompactDimensionPartStepper
            id={`${props.id}-inches`}
            label="Po"
            value={parts.inches}
            min={0}
            max={11}
            onDecrement={() =>
              props.onChange(adjustFeetAndInches(props.value, -1, props.min ?? 1))
            }
            onIncrement={() =>
              props.onChange(adjustFeetAndInches(props.value, 1, props.min ?? 1))
            }
            onValueChange={(nextInches) =>
              props.onChange(updateInchPart(props.value, nextInches, props.min ?? 1))
            }
          />
        </div>
      </div>
    );
  }

  const step = props.unit === "in" ? 1 : 0.1;

  return (
    <div className="compact-dimension-card">
      <div className="compact-dimension-head">
        <span>{props.label}</span>
        <strong>{formatDimensionValue(props.value, props.unit)}</strong>
      </div>
      <div className="compact-dimension-single">
        <button
          type="button"
          className="compact-stepper-button"
          aria-label={`Diminuer ${props.label}`}
          onClick={() =>
            props.onChange(Math.max(props.min ?? 0, roundToStep(props.value - step, step)))
          }
        >
          -
        </button>
        <input
          id={props.id}
          min={props.min ?? 0}
          step={step}
          type="number"
          value={props.value}
          onChange={(event) =>
            props.onChange(Number(event.target.value) || props.min || 0)
          }
        />
        <button
          type="button"
          className="compact-stepper-button"
          aria-label={`Augmenter ${props.label}`}
          onClick={() => props.onChange(roundToStep(props.value + step, step))}
        >
          +
        </button>
      </div>
    </div>
  );
}

type DimensionPartStepperProps = {
  id: string;
  label: string;
  value?: number;
  min?: number;
  max?: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onValueChange: (value: number) => void;
};

function DimensionPartStepper(props: DimensionPartStepperProps) {
  return (
    <div className="dimension-part-stepper">
      <span className="dimension-part-label">{props.label}</span>
      <div className="dimension-stepper-single">
        <button
          type="button"
          className="dimension-stepper-button"
          aria-label={`Diminuer ${props.label}`}
          onClick={props.onDecrement}
        >
          -
        </button>
        <input
          id={props.id}
          min={props.min}
          max={props.max}
          step={1}
          type="number"
          inputMode="numeric"
          value={props.value}
          onChange={(event) => props.onValueChange(Number(event.target.value) || 0)}
        />
        <button
          type="button"
          className="dimension-stepper-button"
          aria-label={`Augmenter ${props.label}`}
          onClick={props.onIncrement}
        >
          +
        </button>
      </div>
    </div>
  );
}

function CompactDimensionPartStepper(props: DimensionPartStepperProps) {
  return (
    <div className="compact-dimension-part">
      <span className="compact-dimension-label">{props.label}</span>
      <div className="compact-stepper-actions">
        <button
          type="button"
          className="compact-stepper-button"
          aria-label={`Diminuer ${props.label}`}
          onClick={props.onDecrement}
        >
          -
        </button>
        <button
          type="button"
          className="compact-stepper-button"
          aria-label={`Augmenter ${props.label}`}
          onClick={props.onIncrement}
        >
          +
        </button>
      </div>
    </div>
  );
}

type CompactSummaryInputProps = {
  ariaLabel: string;
  value: number;
  min?: number;
  max?: number;
  onCommit: (value: number) => void;
};

function CompactSummaryInput(props: CompactSummaryInputProps) {
  const [draftValue, setDraftValue] = useState(String(props.value));

  useEffect(() => {
    setDraftValue(String(props.value));
  }, [props.value]);

  const commitDraft = (rawValue: string) => {
    const cleanedValue = rawValue.replace(/[^\d]/g, "");

    if (!cleanedValue) {
      setDraftValue(String(props.value));
      return;
    }

    const nextValue = clampWholeNumber(
      Number(cleanedValue),
      props.min,
      props.max,
    );

    props.onCommit(nextValue);
    setDraftValue(String(nextValue));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={props.ariaLabel}
      className="compact-dimension-summary-input"
      value={draftValue}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const cleanedValue = event.target.value.replace(/[^\d]/g, "");

        setDraftValue(cleanedValue);

        if (!cleanedValue) {
          return;
        }

        props.onCommit(
          clampWholeNumber(Number(cleanedValue), props.min, props.max),
        );
      }}
      onBlur={(event) => commitDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function buildProjectQuote(input: {
  roomWidth: number;
  roomLength: number;
  unit: string;
  productName: string;
  productPositioning: string;
  layoutMode: string;
  primaryColor: string;
  secondaryColor: string;
  estimateAreaSqFt: number;
  billableAreaSqFt: number;
  installTiles: number;
  cutTiles: number;
  totalTiles: number;
  boxesRequired: number;
  materialSubtotal: number;
  installationIncluded: boolean;
  installationSubtotal: number;
  clientAddress: string;
  deliveryIncluded: boolean;
  deliverySubtotal: number;
  deliveryDistanceKm: number | null;
  deliveryDistanceSource: "route" | "estimated" | null;
  deliveryOriginAddress: string;
  projectTotal: number;
  totalReady: boolean;
  complexityLabel: string;
  garageDoorEnabled: boolean;
  garageDoorWidth: number;
  garageDoorOffset: number;
  obstaclesCount: number;
  materialPricePerSqFt: number;
}): string {
  return [
    `Soumission AceFloor`,
    `Projet: ${formatDimensionValue(input.roomWidth, input.unit)} x ${formatDimensionValue(input.roomLength, input.unit)}`,
    `Gamme: ${input.productName} (${input.productPositioning})`,
    `Motif / palette: ${getLayoutLabel(input.layoutMode)} • ${input.primaryColor}${input.secondaryColor ? ` / ${input.secondaryColor}` : ""}`,
    `Surface reelle: ${input.estimateAreaSqFt.toFixed(1)} pi²`,
    `Surface facturable: ${input.billableAreaSqFt.toFixed(1)} pi²`,
    `Quantite: ${input.totalTiles} tuiles • ${input.boxesRequired} boites`,
    `Coupes: ${input.cutTiles}`,
    `Prix materiau: ${formatCurrency(input.materialPricePerSqFt)} / pi²`,
    `Sous-total materiau: ${formatCurrency(input.materialSubtotal)}`,
    input.installationIncluded
      ? `Sous-total pose: ${formatCurrency(input.installationSubtotal)}`
      : "Pose: non incluse",
    input.clientAddress.trim()
      ? `Adresse client: ${input.clientAddress.trim()}`
      : "Adresse client: a confirmer",
    input.deliveryIncluded
      ? `Transport: inclus avec la pose depuis ${input.deliveryOriginAddress}`
      : input.deliveryDistanceKm !== null
        ? `Transport: ${formatCurrency(input.deliverySubtotal)} (${input.deliveryDistanceKm.toFixed(1)} km${input.deliveryDistanceSource === "estimated" ? " estimes" : ""} depuis ${input.deliveryOriginAddress})`
        : `Transport: calcul requis depuis ${input.deliveryOriginAddress}`,
    input.totalReady
      ? `Total avant taxes: ${formatCurrency(input.projectTotal)}`
      : "Total avant taxes: a calculer avec le transport",
    `Complexite chantier: ${input.complexityLabel}`,
    input.garageDoorEnabled
      ? `Porte de garage principale: oui (${input.garageDoorWidth} ${input.unit}, offset ${input.garageDoorOffset} ${input.unit})`
      : "Porte de garage: non",
    `Decrochements: ${input.obstaclesCount}`,
    `Taxes non incluses.`,
  ].join(" | ");
}

function splitFeetAndInches(value: number, minFeet = 1) {
  const totalInches = Math.max(minFeet * 12, Math.round(value * 12));

  return {
    feet: Math.floor(totalInches / 12),
    inches: totalInches % 12,
  };
}

function adjustFeetAndInches(
  value: number,
  deltaInches: number,
  minFeet = 1,
): number {
  const totalInches = Math.max(
    minFeet * 12,
    Math.round(value * 12) + deltaInches,
  );

  return totalInches / 12;
}

function updateFeetPart(value: number, nextFeet: number, minFeet = 1): number {
  const current = splitFeetAndInches(value, minFeet);
  const normalizedFeet = Math.max(Math.floor(nextFeet) || 0, 0);
  const totalInches = Math.max(
    minFeet * 12,
    normalizedFeet * 12 + current.inches,
  );

  return totalInches / 12;
}

function updateInchPart(value: number, nextInches: number, minFeet = 1): number {
  const current = splitFeetAndInches(value, minFeet);
  const normalizedInches = Math.max(Math.floor(nextInches) || 0, 0);
  const totalInches = Math.max(
    minFeet * 12,
    current.feet * 12 + normalizedInches,
  );

  return totalInches / 12;
}

function formatFeetAndInchesLabel(value: number, minFeet = 1): string {
  const parts = splitFeetAndInches(value, minFeet);
  return `${parts.feet} pi ${parts.inches} po`;
}

function formatDimensionValue(value: number, unit: string): string {
  if (unit === "ft") {
    return formatFeetAndInchesLabel(value, 1);
  }

  return `${value} ${unit}`;
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clampWholeNumber(value: number, min?: number, max?: number): number {
  const integerValue = Math.max(Math.floor(value) || 0, 0);
  const minValue = min ?? 0;
  const maxValue = max ?? Number.POSITIVE_INFINITY;

  return Math.min(Math.max(integerValue, minValue), maxValue);
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
