"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Box,
  Building2,
  Droplets,
  ExternalLink,
  FlaskConical,
  Library,
  MapPinned,
  Navigation2,
  Presentation,
} from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  CAMPUS,
  NAVIGATOR_PATH,
  PLACE_CATEGORIES,
  PLACES,
  navigatorHref,
  placeFloor,
  placeName,
  type PlaceCategory,
} from "@/lib/campusData";

const CATEGORY_ICONS: Record<PlaceCategory, typeof FlaskConical> = {
  lab: FlaskConical,
  toilet: Droplets,
  office: Building2,
  classroom: Presentation,
  library: Library,
};

const { lat, lng } = CAMPUS.coords;

/** Token-free outdoor context: OpenStreetMap embed (fallback) & deep links. */
const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${(
  lng - 0.007
).toFixed(5)}%2C${(lat - 0.005).toFixed(5)}%2C${(lng + 0.007).toFixed(
  5,
)}%2C${(lat + 0.005).toFixed(5)}&layer=mapnik&marker=${lat}%2C${lng}`;
const OSM_LINK = `https://www.openstreetmap.org/#map=16/${lat}/${lng}`;

/** Raster style — plain OSM tiles, no Mapbox token required. */
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

interface MapLike {
  remove: () => void;
}

export default function CampusNavigatorView() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cat, setCat] = useState<PlaceCategory | null>("lab");
  const [mode, setMode] = useState<"map" | "3d">("map");
  const [mapFailed, setMapFailed] = useState(false);
  const [iframeSrc, setIframeSrc] = useState<string>(NAVIGATOR_PATH);
  const [hint, setHint] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLike | null>(null);

  const filtered = useMemo(
    () => (cat ? PLACES.filter((p) => p.cat === cat) : []),
    [cat],
  );

  /* ── Outdoor map: mapbox-gl with token-less OSM raster style ── */
  useEffect(() => {
    if (mode !== "map") return;
    let cancelled = false;

    (async () => {
      try {
        const mod: unknown = await import("mapbox-gl");
        if (cancelled || !containerRef.current) return;
        const mapboxgl =
          (mod as { default?: Record<string, unknown> }).default ??
          (mod as Record<string, unknown>);
        const MapCtor = mapboxgl.Map as new (opts: Record<string, unknown>) => MapLike;
        const MarkerCtor = mapboxgl.Marker as new (opts?: Record<string, unknown>) => {
          setLngLat: (c: [number, number]) => { addTo: (m: MapLike) => unknown };
        };

        const map = new MapCtor({
          container: containerRef.current,
          style: OSM_STYLE,
          center: [lng, lat],
          zoom: 15.4,
          attributionControl: false,
        });
        mapRef.current = map;

        new MarkerCtor({ color: "#E8A87C" }).setLngLat([lng, lat]).addTo(map);
      } catch (err) {
        console.warn("Mapbox GL unavailable — falling back to OSM embed:", err);
        if (!cancelled) setMapFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove();
      } catch {
        /* map already gone */
      }
      mapRef.current = null;
    };
  }, [mode, mapFailed]);

  /* ── Handoff helpers ─────────────────────────────────────── */
  const openNavigator = (withRoute: boolean) => {
    setIframeSrc(withRoute ? navigatorHref(from, to) : NAVIGATOR_PATH);
    setMode("3d");
  };

  const findRoute = () => {
    if (!to.trim()) {
      setHint("Pick a destination below — or type a room name.");
      return;
    }
    setHint("");
    openNavigator(true);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(300px,340px)_1fr]">
      {/* ── Left panel: wayfinding search ─────────────────── */}
      <section className="rounded-3xl border border-[#262626] bg-[#1A1A1A] p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8A87C]/15 text-[#E8A87C]">
            <Navigation2 size={17} />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold">Wayfinding</h2>
            <p className="text-[11px] text-[#78716C]">
              Start location → destination
            </p>
          </div>
        </div>

        {/* From / To */}
        <div className="mt-5 space-y-3">
          <div>
            <label
              htmlFor="nav-from"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#A8A29E]"
            >
              Start location
            </label>
            <input
              id="nav-from"
              list="nav-from-list"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Main Entry (blank = Ground floor entry)"
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-sm text-[#FAFAF9] outline-none transition placeholder:text-[#78716C] focus:border-[#E8A87C] focus:ring-2 focus:ring-[#E8A87C]/25"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={swap}
              aria-label="Swap start and destination"
              className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-2 text-[#A8A29E] transition hover:border-[#E8A87C]/40 hover:text-[#E8A87C]"
            >
              <ArrowDownUp size={14} />
            </button>
          </div>

          <div>
            <label
              htmlFor="nav-to"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#A8A29E]"
            >
              Destination
            </label>
            <input
              id="nav-to"
              list="nav-to-list"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Room, lab, office, library…"
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-sm text-[#FAFAF9] outline-none transition placeholder:text-[#78716C] focus:border-[#E8A87C] focus:ring-2 focus:ring-[#E8A87C]/25"
            />
          </div>

          <datalist id="nav-from-list">
            <option value="Main Entry (Ground floor)" />
            {PLACES.map((p) => (
              <option key={`f-${p.label}`} value={p.label} />
            ))}
          </datalist>
          <datalist id="nav-to-list">
            {PLACES.map((p) => (
              <option key={`t-${p.label}`} value={p.label} />
            ))}
          </datalist>
        </div>

        {/* Quick-select categories */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#A8A29E]">
            Quick categories
          </p>
          <div className="flex flex-wrap gap-2">
            {PLACE_CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c.key];
              const on = cat === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCat(on ? null : c.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    on
                      ? "bg-[#E8A87C] text-[#0F0F0F]"
                      : "border border-[#2A2A2A] bg-[#141414] text-[#A8A29E] hover:border-[#E8A87C]/40 hover:text-[#FAFAF9]"
                  }`}
                >
                  <Icon size={13} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category results */}
        {cat && (
          <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-[#262626] bg-[#141414]">
            {filtered.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setTo(p.label);
                  setHint("");
                }}
                className="flex w-full items-center justify-between gap-3 border-b border-[#212121] px-3.5 py-2.5 text-left transition last:border-b-0 hover:bg-[#1F1F1F]"
              >
                <span className="truncate text-sm text-[#E7E5E4]">
                  {placeName(p.label)}
                </span>
                <span className="shrink-0 rounded-full bg-[#242424] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#A8A29E]">
                  {placeFloor(p.label)}
                </span>
              </button>
            ))}
          </div>
        )}

        {hint && <p className="mt-3 text-xs text-[#f87171]">{hint}</p>}

        {/* Actions */}
        <button
          type="button"
          onClick={findRoute}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8A87C] px-5 py-3.5 text-sm font-bold text-[#0F0F0F] transition hover:bg-[#f0b98f]"
          style={{ boxShadow: "0 6px 24px rgba(232,168,124,0.22)" }}
        >
          <Box size={16} /> Find Route in 3D
          <ArrowRight size={15} />
        </button>
        <button
          type="button"
          onClick={() => openNavigator(false)}
          className="mt-2 w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-5 py-2.5 text-xs font-semibold text-[#A8A29E] transition hover:border-[#C084FC]/40 hover:text-[#C084FC]"
        >
          Open 3D navigator without a route
        </button>

        <p className="mt-4 border-t border-[#262626] pt-3 text-[11px] leading-relaxed text-[#78716C]">
          Indoor routing runs in the pre-built SCEM Campus Navigator (Three.js) —
          six floors, stairs, and step-by-step directions.
        </p>
      </section>

      {/* ── Right panel: map / 3D navigator ───────────────── */}
      <section className="relative h-[460px] overflow-hidden rounded-3xl border border-[#262626] bg-[#12161A] sm:h-[560px] lg:h-[680px]">
        {/* Mode toggle */}
        <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 gap-1 rounded-xl border border-[#262626] bg-[#141414]/90 p-1 backdrop-blur">
          <button
            type="button"
            onClick={() => setMode("map")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              mode === "map"
                ? "bg-[#E8A87C] text-[#0F0F0F]"
                : "text-[#A8A29E] hover:text-[#FAFAF9]"
            }`}
          >
            <MapPinned size={13} /> Outdoor Map
          </button>
          <button
            type="button"
            onClick={() => setMode("3d")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              mode === "3d"
                ? "bg-[#C084FC] text-[#0F0F0F]"
                : "text-[#A8A29E] hover:text-[#FAFAF9]"
            }`}
          >
            <Box size={13} /> 3D Indoor
          </button>
        </div>

        {mode === "map" ? (
          <div className="absolute inset-0">
            {mapFailed ? (
              <iframe
                title="OpenStreetMap — SCEM campus"
                src={OSM_EMBED}
                className="h-full w-full border-0"
                loading="lazy"
              />
            ) : (
              <div ref={containerRef} className="absolute inset-0" />
            )}

            {/* Campus info card */}
            <div className="absolute left-3 top-16 z-20 max-w-[19rem] rounded-2xl border border-[#262626] bg-[#141414]/92 p-4 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#E8A87C]">
                Outdoor context
              </p>
              <p className="mt-1.5 font-heading text-sm font-bold text-white">
                {CAMPUS.name}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#A8A29E]">
                {CAMPUS.address}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openNavigator(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8A87C] px-3 py-2 text-xs font-bold text-[#0F0F0F] transition hover:bg-[#f0b98f]"
                >
                  <Box size={13} /> Open 3D Navigator
                </button>
                <a
                  href={OSM_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-xs font-semibold text-[#A8A29E] transition hover:text-[#FAFAF9]"
                >
                  OpenStreetMap <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Attribution */}
            <p className="absolute bottom-2 right-2 z-10 rounded bg-black/55 px-2 py-0.5 text-[10px] text-white/85">
              ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                OpenStreetMap
              </a>{" "}
              contributors
            </p>
          </div>
        ) : (
          <div className="absolute inset-0">
            <iframe
              key={iframeSrc}
              src={iframeSrc}
              title="SCEM 3D Campus Navigator"
              className="h-full w-full border-0"
              allow="fullscreen"
            />
            <div className="absolute right-3 top-16 z-20 flex flex-col items-end gap-2">
              <a
                href={iframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#262626] bg-[#141414]/90 px-3 py-2 text-xs font-semibold text-[#A8A29E] backdrop-blur transition hover:text-[#FAFAF9]"
              >
                New tab <ExternalLink size={12} />
              </a>
              <button
                type="button"
                onClick={() => setMode("map")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#262626] bg-[#141414]/90 px-3 py-2 text-xs font-semibold text-[#A8A29E] backdrop-blur transition hover:text-[#FAFAF9]"
              >
                <MapPinned size={12} /> Back to map
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
