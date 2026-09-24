"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { BUILDINGS, FLOORS } from "@/lib/campusData";

/** Minimal zoom API we rely on (keeps us decoupled from library typings). */
type ZoomApi = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: (animationTime?: number) => void;
};

interface UploadItem {
  id: string;
  src: string;
  label: string;
  building: string;
}

function CtrlBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-lg p-2 text-[#A8A29E] transition hover:bg-[#242424] hover:text-[#E8A87C]"
    >
      {children}
    </button>
  );
}

export default function BlueprintViewer() {
  const [index, setIndex] = useState(0);
  const [dims, setDims] = useState("");
  const [api, setApi] = useState<ZoomApi | null>(null);
  const [fs, setFs] = useState(false);

  /* Admin upload modal */
  const [modal, setModal] = useState(false);
  const [building, setBuilding] = useState<string>(BUILDINGS[0]);
  const [floorSel, setFloorSel] = useState<string>(FLOORS[0].label);
  const [preview, setPreview] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [activeUpload, setActiveUpload] = useState<UploadItem | null>(null);

  const viewerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const floor = FLOORS[index];
  const current = activeUpload
    ? { src: activeUpload.src, label: activeUpload.label, sub: activeUpload.building }
    : { src: floor.file, label: floor.label, sub: "SCEM Main Building" };

  const selectFloor = (i: number) => {
    setActiveUpload(null);
    setIndex((i + FLOORS.length) % FLOORS.length);
    setDims("");
  };

  /* Reset zoom whenever a different blueprint is shown */
  useEffect(() => {
    api?.resetTransform(0);
  }, [current.src, api]);

  /* Fullscreen state */
  useEffect(() => {
    const onChange = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFs = () => {
    const el = viewerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const pickFile = (f?: File | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(f));
  };

  const submitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    const item: UploadItem = {
      id: `b${Date.now()}`,
      src: preview,
      label: floorSel,
      building,
    };
    setUploads((u) => [...u, item]);
    setActiveUpload(item);
    setPreview("");
    setModal(false);
    setDragOver(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Architectural Blueprints</h2>
          <p className="text-sm text-[#A8A29E]">
            Six-floor plans extracted from SCEM_FLOOR_PLAN.pdf · scroll to zoom, drag to pan
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#C084FC]/40 bg-[#C084FC]/10 px-4 py-2.5 text-sm font-bold text-[#C084FC] transition hover:bg-[#C084FC]/20"
        >
          <Upload size={15} /> Upload Blueprint
        </button>
      </div>

      {/* Floor pills + prev/next */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
          Floor
        </span>
        <button
          type="button"
          aria-label="Previous floor"
          onClick={() => selectFloor(index - 1)}
          className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] p-2 text-[#A8A29E] transition hover:border-[#E8A87C]/40 hover:text-[#E8A87C]"
        >
          <ChevronLeft size={15} />
        </button>

        {FLOORS.map((f, i) => {
          const on = !activeUpload && i === index;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => selectFloor(i)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                on
                  ? "bg-[#E8A87C] text-[#0F0F0F] shadow-[0_4px_18px_rgba(232,168,124,0.3)]"
                  : "border border-[#2A2A2A] bg-[#1A1A1A] text-[#A8A29E] hover:border-[#E8A87C]/40 hover:text-[#FAFAF9]"
              }`}
            >
              {f.label}
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Next floor"
          onClick={() => selectFloor(index + 1)}
          className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] p-2 text-[#A8A29E] transition hover:border-[#E8A87C]/40 hover:text-[#E8A87C]"
        >
          <ChevronRight size={15} />
        </button>

        {/* uploaded blueprints */}
        {uploads.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setActiveUpload(u)}
            title={`${u.building} · uploaded blueprint`}
            className={`rounded-full border border-dashed px-4 py-2 text-sm font-semibold transition ${
              activeUpload?.id === u.id
                ? "border-[#C084FC] bg-[#C084FC]/15 text-[#C084FC]"
                : "border-[#3A3A3A] bg-[#141414] text-[#78716C] hover:text-[#C084FC]"
            }`}
          >
            {u.label} · new
          </button>
        ))}
      </div>

      {/* Viewer */}
      <div
        ref={viewerRef}
        className="relative h-[58vh] min-h-[400px] overflow-hidden rounded-3xl border border-[#262626] bg-[#0B0E11] lg:h-[calc(100vh-340px)]"
        style={{
          backgroundImage: "radial-gradient(#1f2933 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <TransformWrapper
          key={current.src}
          initialScale={1}
          minScale={0.2}
          maxScale={8}
          centerOnInit
          onInit={(a) => setApi(a as unknown as ZoomApi)}
        >
          <TransformComponent
            contentStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={current.src}
              alt={`${current.label} architectural blueprint`}
              draggable={false}
              onLoad={(e) =>
                setDims(`${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight}px`)
              }
              className="select-none rounded-lg shadow-2xl"
              style={{ maxWidth: "96%", maxHeight: "96%", objectFit: "contain" }}
            />
          </TransformComponent>
        </TransformWrapper>

        {/* Zoom controls */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-2xl border border-[#262626] bg-[#141414]/90 p-1.5 backdrop-blur">
          <CtrlBtn label="Zoom in" onClick={() => api?.zoomIn()}>
            <ZoomIn size={15} />
          </CtrlBtn>
          <CtrlBtn label="Zoom out" onClick={() => api?.zoomOut()}>
            <ZoomOut size={15} />
          </CtrlBtn>
          <CtrlBtn label="Reset view" onClick={() => api?.resetTransform()}>
            <RotateCcw size={15} />
          </CtrlBtn>
          <CtrlBtn label={fs ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFs}>
            {fs ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </CtrlBtn>
        </div>

        {/* Info bar */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-xl border border-[#262626] bg-[#141414]/90 px-3.5 py-2 backdrop-blur">
          <p className="text-xs font-bold text-[#FAFAF9]">
            {current.label} · {current.sub}
          </p>
          <p className="text-[10px] text-[#78716C]">
            {dims ? `${dims} · ` : ""}
            {activeUpload ? "uploaded blueprint" : "source: SCEM_FLOOR_PLAN.pdf"}
          </p>
        </div>
      </div>

      {/* Admin upload modal */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setModal(false);
                setDragOver(false);
              }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.form
                onSubmit={submitUpload}
                initial={{ opacity: 0, scale: 0.95, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#262626] bg-[#1A1A1A] shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Upload Blueprint</h3>
                    <p className="text-xs text-[#78716C]">
                      Admin only · building &amp; floor metadata required
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModal(false);
                      setDragOver(false);
                    }}
                    aria-label="Close modal"
                    className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-2 text-[#A8A29E] transition hover:border-[#C084FC]/50 hover:text-[#C084FC]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="bp-building"
                        className="mb-1.5 block text-sm font-medium text-[#E7E5E4]"
                      >
                        Building
                      </label>
                      <select
                        id="bp-building"
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-sm text-[#FAFAF9] outline-none transition focus:border-[#C084FC] focus:ring-2 focus:ring-[#C084FC]/25"
                      >
                        {BUILDINGS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="bp-floor"
                        className="mb-1.5 block text-sm font-medium text-[#E7E5E4]"
                      >
                        Floor
                      </label>
                      <select
                        id="bp-floor"
                        value={floorSel}
                        onChange={(e) => setFloorSel(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-sm text-[#FAFAF9] outline-none transition focus:border-[#C084FC] focus:ring-2 focus:ring-[#C084FC]/25"
                      >
                        {FLOORS.map((f) => (
                          <option key={f.id} value={f.label}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      pickFile(e.dataTransfer.files?.[0]);
                    }}
                    className={`cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition ${
                      dragOver
                        ? "border-[#C084FC] bg-[#C084FC]/10"
                        : "border-[#2F2F2F] bg-[#141414] hover:border-[#C084FC]/50"
                    }`}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Blueprint preview"
                        className="mx-auto max-h-44 w-auto rounded-lg"
                      />
                    ) : (
                      <>
                        <Upload size={30} className="mx-auto text-[#C084FC]" />
                        <p className="mt-2 text-sm font-semibold text-[#FAFAF9]">
                          Drag &amp; drop the blueprint file
                        </p>
                        <p className="mt-1 text-xs text-[#78716C]">
                          or click to browse — JPG / PNG / PDF image
                        </p>
                      </>
                    )}
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => pickFile(e.target.files?.[0])}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-[#262626] px-6 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setModal(false);
                      setDragOver(false);
                    }}
                    className="rounded-xl border border-[#2A2A2A] bg-[#141414] px-5 py-2.5 text-sm font-semibold text-[#A8A29E] transition hover:text-[#FAFAF9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!preview}
                    className="rounded-xl bg-[#C084FC] px-5 py-2.5 text-sm font-bold text-[#0F0F0F] transition hover:bg-[#cfa2fd] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Publish Blueprint
                  </button>
                </div>
              </motion.form>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
