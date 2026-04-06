import { NextResponse } from "next/server";

const ORIGIN_ADDRESS = "1335 Route 263 Nord, Princeville, Quebec, Canada";
const ORIGIN_COORDINATES: Coordinates = {
  lat: 46.180166,
  lon: -71.8851799,
  label: ORIGIN_ADDRESS,
};
const DELIVERY_RATE_PER_KM = 1.5;
const GEOCODER_BASE_URL = "https://nominatim.openstreetmap.org/search";
const GEOCODER_FALLBACK_BASE_URL = "https://photon.komoot.io/api/";
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

    const origin = ORIGIN_COORDINATES;
    const destination = await geocodeAddress(address);
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
  const candidates = buildGeocodeCandidates(address);

  for (const candidate of candidates) {
    const match = await geocodeWithNominatim(candidate);

    if (match) {
      return match;
    }
  }

  for (const candidate of candidates) {
    const match = await geocodeWithPhoton(candidate);

    if (match) {
      return match;
    }
  }

  throw new Error("Adresse introuvable. Verifie le numero civique, la ville et le code postal.");
}

async function geocodeWithNominatim(address: string): Promise<Coordinates | null> {
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
    return null;
  }

  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  const firstResult = results[0];

  if (!firstResult) {
    return null;
  }

  return {
    lat: Number(firstResult.lat),
    lon: Number(firstResult.lon),
    label: firstResult.display_name,
  };
}

async function geocodeWithPhoton(address: string): Promise<Coordinates | null> {
  const params = new URLSearchParams({
    q: address,
    limit: "1",
    lang: "fr",
  });
  const response = await fetch(`${GEOCODER_FALLBACK_BASE_URL}?${params.toString()}`, {
    headers: REQUEST_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        name?: string;
        housenumber?: string;
        street?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
      };
    }>;
  };
  const feature = payload.features?.[0];
  const coordinates = feature?.geometry?.coordinates;

  if (!feature || !coordinates || coordinates.length < 2) {
    return null;
  }

  const properties = feature.properties ?? {};
  const label = [
    properties.name,
    [properties.housenumber, properties.street].filter(Boolean).join(" ").trim(),
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ]
    .filter((value) => value && value.length > 0)
    .join(", ");

  return {
    lon: coordinates[0],
    lat: coordinates[1],
    label: label || address,
  };
}

function buildGeocodeCandidates(address: string) {
  const compactAddress = normalizeSpacing(address);
  const normalizedAddress = normalizeCanadianAddress(compactAddress);
  const candidates = [
    compactAddress,
    normalizedAddress,
    appendSegment(normalizedAddress, "Quebec"),
    appendSegment(normalizedAddress, "Canada"),
    appendSegment(appendSegment(normalizedAddress, "Quebec"), "Canada"),
  ];

  return [...new Set(candidates.map(normalizeSpacing).filter((value) => value.length > 0))];
}

async function fetchDrivingDistanceKm(origin: Coordinates, destination: Coordinates): Promise<number> {
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

function normalizeCanadianAddress(address: string) {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return address;
  }

  const [streetSegment, ...restSegments] = segments;

  return [
    expandStreetDirections(streetSegment),
    ...restSegments.map(expandProvinceAbbreviations),
  ].join(", ");
}

function expandStreetDirections(segment: string) {
  return segment
    .replace(/\bN\b\.?/gi, "Nord")
    .replace(/\bS\b\.?/gi, "Sud")
    .replace(/\bE\b\.?/gi, "Est")
    .replace(/\bO\b\.?/gi, "Ouest")
    .replace(/\bW\b\.?/gi, "West");
}

function expandProvinceAbbreviations(segment: string) {
  return segment
    .replace(/\bQC\b/gi, "Quebec")
    .replace(/\bPQ\b/gi, "Quebec")
    .replace(/\bON\b/gi, "Ontario")
    .replace(/\bNB\b/gi, "New Brunswick")
    .replace(/\bNS\b/gi, "Nova Scotia");
}

function appendSegment(address: string, segment: string) {
  if (new RegExp(`\\b${segment}\\b`, "i").test(address)) {
    return address;
  }

  return `${address}, ${segment}`;
}

function normalizeSpacing(value: string) {
  return value.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
}
