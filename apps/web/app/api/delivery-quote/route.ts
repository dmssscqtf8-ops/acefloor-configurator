import { NextResponse } from "next/server";

const ORIGIN_ADDRESS = "1335 QC-263 Nord, Princeville, Quebec, Canada";
const DELIVERY_RATE_PER_KM = 1.5;
const GEOCODER_BASE_URL = "https://nominatim.openstreetmap.org/search";
const ROUTER_BASE_URL = "https://router.project-osrm.org/route/v1/driving";
const REQUEST_HEADERS = {
  "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.6",
  "User-Agent": "AceFloor Configurator/1.0 (delivery quote)",
};

type Coordinates = {
  lat: number;
  lon: number;
  label: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { address?: string };
    const address = body.address?.trim() ?? "";

    if (address.length < 8) {
      return NextResponse.json(
        { error: "Entre une adresse client plus complete." },
        { status: 400 },
      );
    }

    const [origin, destination] = await Promise.all([
      geocodeAddress(ORIGIN_ADDRESS),
      geocodeAddress(address),
    ]);
    const distanceKm = await fetchDrivingDistanceKm(origin, destination);
    const transportSubtotal = roundCurrency(distanceKm * DELIVERY_RATE_PER_KM);

    return NextResponse.json({
      originAddress: origin.label,
      destinationAddress: destination.label,
      distanceKm: roundToOneDecimal(distanceKm),
      transportSubtotal,
      ratePerKm: DELIVERY_RATE_PER_KM,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de calculer le transport pour cette adresse.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function geocodeAddress(address: string): Promise<Coordinates> {
  const params = new URLSearchParams({
    q: address,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    countrycodes: "ca",
  });
  const response = await fetch(`${GEOCODER_BASE_URL}?${params.toString()}`, {
    headers: REQUEST_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Le service de geocodage est temporairement indisponible.");
  }

  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  const firstResult = results[0];

  if (!firstResult) {
    throw new Error("Adresse introuvable. Verifie le code postal et la ville.");
  }

  return {
    lat: Number(firstResult.lat),
    lon: Number(firstResult.lon),
    label: firstResult.display_name,
  };
}

async function fetchDrivingDistanceKm(
  origin: Coordinates,
  destination: Coordinates,
): Promise<number> {
  const params = new URLSearchParams({
    alternatives: "false",
    overview: "false",
    steps: "false",
  });
  const response = await fetch(
    `${ROUTER_BASE_URL}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?${params.toString()}`,
    {
      headers: REQUEST_HEADERS,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Le calcul de distance routiere est temporairement indisponible.");
  }

  const payload = (await response.json()) as {
    routes?: Array<{ distance?: number }>;
  };
  const distanceMeters = payload.routes?.[0]?.distance;

  if (!distanceMeters || distanceMeters <= 0) {
    throw new Error("Impossible d'etablir le trajet routier pour cette adresse.");
  }

  return distanceMeters / 1000;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function roundToOneDecimal(value: number) {
  return Number(value.toFixed(1));
}
