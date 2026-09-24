"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Plus, UploadCloud, X } from "lucide-react";
import { GALLERY_PHOTOS, GALLERY_TAGS, type GalleryPhoto } from "@/lib/campusData";

const hueOf = (s: string) =>
  Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

const initialsOf = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function CampusGallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(GALLERY_PHOTOS);
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<string>(GALLERY_TAGS[0]);
  const [toast, setToast] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f?: File | null) => {
    if (!f || !f.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(f));
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  };

  const closeModal = () => {
    setOpen(false);
    setDragOver(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    const photo: GalleryPhoto = {
      id: `u${Date.now()}`,
      title: title.trim() || "Untitled photo",
      tag,
      uploader: "You",
      src: preview,
      ratio: "aspect-[4/3]",
    };
    setPhotos((p) => [photo, ...p]);
    setPreview("");
    setTitle("");
    closeModal();
    setToast("Photo added to the gallery");
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold">Campus Gallery</h2>
          <p className="text-sm text-[#A8A29E]">
            {photos.length} photos · riverfront, courtyards, labs &amp; halls
          </p>
        </div>
        <span className="hidden rounded-full border border-[#262626] bg-[#1A1A1A] px-3 py-1.5 text-xs text-[#78716C] sm:inline-block">
          Hover a photo for details
        </span>
      </div>

      {/* Masonry grid */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {photos.map((p) => (
          <figure
            key={p.id}
            className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-[#262626] bg-[#1A1A1A]"
            style={{
              backgroundImage: `linear-gradient(135deg, hsl(${hueOf(
                p.uploader,
              )} 22% 16%), #141414)`,
            }}
          >
            <div className={`${p.ratio} w-full`}>
              <img
                src={p.src}
                alt={p.title}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            </div>

            {/* always-visible tag */}
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8A87C] backdrop-blur">
              {p.tag}
            </span>

            {/* hover details (always shown on touch devices) */}
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 pt-12 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
              <h3 className="font-heading text-sm font-bold text-white">{p.title}</h3>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-[#0F0F0F]"
                  style={{ background: `hsl(${hueOf(p.uploader)} 70% 75%)` }}
                >
                  {initialsOf(p.uploader)}
                </span>
                <span className="text-xs text-neutral-300">{p.uploader}</span>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#E8A87C] px-5 py-4 text-sm font-bold text-[#0F0F0F] shadow-lg shadow-black/50 transition hover:-translate-y-0.5 hover:bg-[#f0b98f]"
      >
        <Plus size={18} /> Upload Photo
      </button>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 right-6 z-40 flex items-center gap-2 rounded-xl border border-[#E8A87C]/30 bg-[#1A1A1A] px-4 py-3 text-sm text-[#FAFAF9] shadow-xl"
          >
            <CheckCircle2 size={16} className="text-[#E8A87C]" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.form
                onSubmit={submit}
                initial={{ opacity: 0, scale: 0.95, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#262626] bg-[#1A1A1A] shadow-2xl"
              >
                {/* modal header */}
                <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4">
                  <div>
                    <h3 className="font-heading text-lg font-bold">Upload Photo</h3>
                    <p className="text-xs text-[#78716C]">
                      Add a campus spot to the public gallery
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Close modal"
                    className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-2 text-[#A8A29E] transition hover:border-[#E8A87C]/40 hover:text-[#E8A87C]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 px-6 py-5">
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
                        ? "border-[#E8A87C] bg-[#E8A87C]/10"
                        : "border-[#2F2F2F] bg-[#141414] hover:border-[#E8A87C]/50"
                    }`}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Upload preview"
                        className="mx-auto h-40 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <>
                        <UploadCloud
                          size={30}
                          className="mx-auto text-[#E8A87C]"
                        />
                        <p className="mt-2 text-sm font-semibold text-[#FAFAF9]">
                          Drag &amp; drop an image here
                        </p>
                        <p className="mt-1 text-xs text-[#78716C]">
                          or click to browse — JPG / PNG / WEBP
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

                  {/* Title */}
                  <div>
                    <label
                      htmlFor="photo-title"
                      className="mb-1.5 block text-sm font-medium text-[#E7E5E4]"
                    >
                      Photo title
                    </label>
                    <input
                      id="photo-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Main Courtyard"
                      className="w-full rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-sm text-[#FAFAF9] outline-none transition placeholder:text-[#78716C] focus:border-[#E8A87C] focus:ring-2 focus:ring-[#E8A87C]/25"
                    />
                  </div>

                  {/* Tag */}
                  <div>
                    <label
                      htmlFor="photo-tag"
                      className="mb-1.5 block text-sm font-medium text-[#E7E5E4]"
                    >
                      Tag
                    </label>
                    <select
                      id="photo-tag"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#2A2A2A] bg-[#141414] px-4 py-2.5 text-sm text-[#FAFAF9] outline-none transition focus:border-[#E8A87C] focus:ring-2 focus:ring-[#E8A87C]/25"
                    >
                      {GALLERY_TAGS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex justify-end gap-3 border-t border-[#262626] px-6 py-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-[#2A2A2A] bg-[#141414] px-5 py-2.5 text-sm font-semibold text-[#A8A29E] transition hover:text-[#FAFAF9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!preview}
                    className="rounded-xl bg-[#E8A87C] px-5 py-2.5 text-sm font-bold text-[#0F0F0F] transition hover:bg-[#f0b98f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add to Gallery
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
