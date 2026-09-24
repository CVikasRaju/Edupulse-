/**
 * Static + mock data for the SCEM institutional portal.
 *
 * Institutional facts (accreditation, address, contacts, coordinates, start-ups)
 * were verified against the official college website. Gallery photos, recruiters
 * and uploaders are mock data pending live content.
 */

/* ── Campus facts (verified) ─────────────────────────────── */

export const CAMPUS = {
  name: "Sahyadri College of Engineering & Management",
  short: "SCEM",
  tagline: "Empowering Engineering & Management Innovators",
  address: "Adyar, Mangaluru, Dakshina Kannada, Karnataka – 575 007",
  phone1: "+91 824 2277222",
  phone2: "+91 824 2277333",
  coords: { lat: 12.867571, lng: 74.925072 },
  foundedBy: "Bhandary Foundation (R)",
  accreditation: [
    "NAAC A Grade Accredited",
    "NBA Accredited",
    "IE(I) Accredited",
    "Recognized by AICTE · UGC · MoE",
    "Autonomous · NIRF Listed",
  ],
} as const;

/* ── Bento-box institutional highlights ──────────────────── */

export type HighlightTone = "light" | "navy" | "crimson";

export interface Highlight {
  id: string;
  icon: "landmark" | "handshake" | "lightbulb" | "flask" | "waves";
  title: string;
  value?: string;
  desc: string;
  tone: HighlightTone;
  className: string;
}

export const HIGHLIGHTS: Highlight[] = [
  {
    id: "est",
    icon: "landmark",
    title: "Established",
    value: "2007",
    desc: "Founded by the Bhandary Foundation (R) as an autonomous institution.",
    tone: "light",
    className: "col-span-1 md:col-span-1",
  },
  {
    id: "placements",
    icon: "handshake",
    title: "Placement Partners",
    value: "100+",
    desc: "A dedicated training & placement cell connecting students with leading recruiters every season.",
    tone: "navy",
    className: "col-span-2 md:col-span-2",
  },
  {
    id: "patents",
    icon: "lightbulb",
    title: "Research Patents",
    value: "50+",
    desc: "Patents filed across engineering & management disciplines.",
    tone: "light",
    className: "col-span-1 md:col-span-1",
  },
  {
    id: "coe",
    icon: "flask",
    title: "Centres of Excellence",
    desc: "A recognised Centre of Excellence in Future Technology, backed by industry collaboration and 22 student start-ups on campus.",
    tone: "crimson",
    className: "col-span-2 md:col-span-2",
  },
  {
    id: "riverfront",
    icon: "waves",
    title: "Riverfront Campus",
    desc: "A green, riverside campus at Adyar along the Gurupura backwaters — labs, seminar halls and incubation spaces minutes from the city.",
    tone: "navy",
    className: "col-span-2 md:col-span-4",
  },
];

/* ── Academics (departments evidenced by campus floor plans) ─ */

export const ACADEMICS = [
  {
    id: "cse",
    name: "Computer Science & Engineering",
    desc: "Programming foundations through AI, data systems and cloud computing — with dedicated labs, staff rooms and department library.",
    tags: ["AI & Machine Learning", "Data Systems", "Cloud & Security"],
  },
  {
    id: "ece",
    name: "Electronics & Communication",
    desc: "Hardware-to-signal training across VLSI, embedded and communication laboratories with strong industry linkage.",
    tags: ["VLSI", "Embedded Systems", "Signals & Communication"],
  },
  {
    id: "civil",
    name: "Civil Engineering",
    desc: "Structural, environmental and construction management coursework supported by modern computing and drawing facilities.",
    tags: ["Structural", "Environmental", "Construction Management"],
  },
  {
    id: "mba",
    name: "Management (MBA)",
    desc: "A full-time management programme with its own library, classrooms, staff rooms and placement wing.",
    tags: ["Finance", "Marketing", "Operations"],
  },
] as const;

/* ── Placements (mock) ───────────────────────────────────── */

export const PLACEMENT_STATS = [
  { value: "100+", label: "Hiring Partners" },
  { value: "22", label: "Student Start-ups" },
  { value: "50+", label: "Patents Filed" },
  { value: "A", label: "NAAC Grade" },
] as const;

/** Sample recruiters — mock array pending live placement data. */
export const RECRUITERS = [
  "TCS",
  "Infosys",
  "Wipro",
  "Capgemini",
  "Cognizant",
  "HCLTech",
  "Tech Mahindra",
  "L&T Construction",
  "Bosch",
  "Amazon",
  "Deloitte",
  "Mphasis",
];

/* ── Campus gallery (mock photos) ────────────────────────── */

export interface GalleryPhoto {
  id: string;
  title: string;
  tag: string;
  uploader: string;
  src: string;
  /** tailwind aspect class used to reserve masonry height */
  ratio: string;
}

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "g1",
    title: "Riverfront Campus",
    tag: "Campus",
    uploader: "Ananya Shetty",
    src: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[4/3]",
  },
  {
    id: "g2",
    title: "Main Courtyard",
    tag: "Heritage",
    uploader: "Rahul Kamath",
    src: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[3/4]",
  },
  {
    id: "g3",
    title: "Innovation Lab",
    tag: "Lab",
    uploader: "Pooja Bhat",
    src: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[4/3]",
  },
  {
    id: "g4",
    title: "Seminar Hall",
    tag: "Auditorium",
    uploader: "Imran Ali",
    src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[16/10]",
  },
  {
    id: "g5",
    title: "Central Library",
    tag: "Library",
    uploader: "Sneha Rao",
    src: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[3/4]",
  },
  {
    id: "g6",
    title: "Graduation Day",
    tag: "Events",
    uploader: "Vikram Prabhu",
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[4/3]",
  },
  {
    id: "g7",
    title: "Lecture in Progress",
    tag: "Academics",
    uploader: "Meera Naik",
    src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[16/10]",
  },
  {
    id: "g8",
    title: "Sahyadri Hills",
    tag: "Nature",
    uploader: "Arjun Shetty",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[4/3]",
  },
  {
    id: "g9",
    title: "Placement Week",
    tag: "Placements",
    uploader: "Nisha Dsouza",
    src: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[3/4]",
  },
  {
    id: "g10",
    title: "Digital Classroom",
    tag: "Academics",
    uploader: "Farhan Pasha",
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=70",
    ratio: "aspect-[4/3]",
  },
];

export const GALLERY_TAGS = [
  "Campus",
  "Academics",
  "Lab",
  "Events",
  "Placements",
  "Heritage",
  "Nature",
  "Auditorium",
  "Library",
];

/* ── Architectural blueprints ────────────────────────────── */

export interface BlueprintFloor {
  /** id = source floor-plan image number */
  id: number;
  label: string;
  file: string;
}

/**
 * Floor ↔ image mapping exactly as specified in the project brief
 * (note the non-sequential file order for Third/Fourth/Fifth floors).
 * Source: SCEM_FLOOR_PLAN.pdf (6 pages, extracted to /public/floor-plans).
 */
export const FLOORS: BlueprintFloor[] = [
  { id: 1, label: "Ground Floor", file: "/floor-plans/floor_1.jpg" },
  { id: 2, label: "First Floor", file: "/floor-plans/floor_2.jpg" },
  { id: 3, label: "Second Floor", file: "/floor-plans/floor_3.jpg" },
  { id: 6, label: "Third Floor", file: "/floor-plans/floor_6.jpg" },
  { id: 5, label: "Fourth Floor", file: "/floor-plans/floor_5.jpg" },
  { id: 4, label: "Fifth Floor", file: "/floor-plans/floor_4.jpg" },
];

export const BUILDINGS = [
  "SCEM Main Building",
  "Admin Block",
  "Library Block",
] as const;

/* ── Wayfinding places (labels must match the 3D navigator) ─ */

export type PlaceCategory = "lab" | "toilet" | "office" | "classroom" | "library";

export interface Place {
  /**
   * Exact entry from the 3D navigator's room index:
   * "<Name>[ <RoomNo>] · <Floor>". Verified against the navigator's data.
   */
  label: string;
  cat: PlaceCategory;
}

export const PLACE_CATEGORIES: { key: PlaceCategory; label: string }[] = [
  { key: "lab", label: "Labs" },
  { key: "toilet", label: "Toilets" },
  { key: "office", label: "Offices" },
  { key: "classroom", label: "Classrooms" },
  { key: "library", label: "Library" },
];

export const placeName = (label: string) => label.split(" · ")[0];
export const placeFloor = (label: string) => label.split(" · ")[1] ?? "Ground";

export const PLACES: Place[] = [
  /* Ground floor */
  { label: "Innovation Lab 32 · Ground", cat: "lab" },
  { label: "Computer Lab-5 24 · Ground", cat: "lab" },
  { label: "Computer Lab 27 · Ground", cat: "lab" },
  { label: "Principal's Chamber 2 · Ground", cat: "office" },
  { label: "Academic Section 3 · Ground", cat: "office" },
  { label: "Foundation Office 1 · Ground", cat: "office" },
  { label: "Director's Chamber 9 · Ground", cat: "office" },
  { label: "Dept. of Placement 14 · Ground", cat: "office" },
  { label: "Dept. Wise Placement Office 18 · Ground", cat: "office" },
  { label: "Examination Section 8 · Ground", cat: "office" },
  { label: "Admission Section 37 · Ground", cat: "office" },
  { label: "Board Room 44 · Ground", cat: "office" },
  { label: "Seminar Hall (GF) 19 · Ground", cat: "classroom" },
  { label: "CR 6 · Ground", cat: "classroom" },
  { label: "Toilets · Ground", cat: "toilet" },
  { label: "Toilet · Ground", cat: "toilet" },
  { label: "Dept Library · Ground", cat: "library" },

  /* First floor */
  { label: "CAED Lab 112 · First", cat: "lab" },
  { label: "Aptitude Lab 116 · First", cat: "lab" },
  { label: "E&C Lab-1 122 · First", cat: "lab" },
  { label: "E&C Lab-8 134 · First", cat: "lab" },
  { label: "LIBRARY (First Floor) 135 · First", cat: "library" },
  { label: "Digital Library 137 · First", cat: "library" },
  { label: "MBA Class 110 · First", cat: "classroom" },
  { label: "MBA CR 102 · First", cat: "classroom" },
  { label: "Seminar Hall (FF) 117 · First", cat: "classroom" },
  { label: "MBA Director's Chamber 101 · First", cat: "office" },
  { label: "MBA Office 109 · First", cat: "office" },
  { label: "Office E&C 126A · First", cat: "office" },
  { label: "Boys Toilet 105 · First", cat: "toilet" },
  { label: "Girls Toilet 104 · First", cat: "toilet" },
  { label: "Ladies Room 113 · First", cat: "toilet" },

  /* Second floor */
  { label: "Physics Lab 218 · Second", cat: "lab" },
  { label: "Chemistry Lab 240 · Second", cat: "lab" },
  { label: "Intel Lab 220 · Second", cat: "lab" },
  { label: "IS Lab-2 229 · Second", cat: "lab" },
  { label: "Civil Computer Lab 208 · Second", cat: "lab" },
  { label: "E&C CR 211 · Second", cat: "classroom" },
  { label: "CS CR 226 · Second", cat: "classroom" },
  { label: "Mathematics Dept 213 · Second", cat: "office" },
  { label: "MBA Placement 201 · Second", cat: "office" },
  { label: "LIBRARY (Second Floor) 239 · Second", cat: "library" },
  { label: "Ladies Toilet 216 · Second", cat: "toilet" },

  /* Third floor */
  { label: "ARM Lab 341 · Third", cat: "lab" },
  { label: "ENV Lab 321 · Third", cat: "lab" },
  { label: "CS-M Lab 344 · Third", cat: "lab" },
  { label: "Civil CR 313 · Third", cat: "classroom" },
  { label: "1st Yr-K CR 315 · Third", cat: "classroom" },
  { label: "1st Yr CR 318 · Third", cat: "classroom" },
  { label: "Civil Staff Room 311 · Third", cat: "office" },

  /* Fourth floor */
  { label: "CV Lab 410 · Fourth", cat: "lab" },
  { label: "SPSS 409 · Fourth", cat: "lab" },
  { label: "E&C Class Room 413 · Fourth", cat: "classroom" },
  { label: "CS Class Room 420 · Fourth", cat: "classroom" },
  { label: "Research Office 401 · Fourth", cat: "office" },
  { label: "Sahyadri Green Cell 411 · Fourth", cat: "office" },
  { label: "Ladies Toilet 415 · Fourth", cat: "toilet" },

  /* Fifth floor */
  { label: "Incubation Centre 510 · Fifth", cat: "office" },
  { label: "Entrepreneur Cell 511 · Fifth", cat: "office" },
  { label: "Chairman's Cabin 501 · Fifth", cat: "office" },
  { label: "APTRA 509 · Fifth", cat: "office" },
  { label: "IT Start-up 508 · Fifth", cat: "office" },
  { label: "Dreamers R&D 502 · Fifth", cat: "lab" },
  { label: "Toilets 503 · Fifth", cat: "toilet" },
];

export const NAVIGATOR_PATH = "/navigator/SCEM Campus Navigator.html";

/** Build the deep-link URL for the pre-built 3D navigator (handoff support). */
export function navigatorHref(from?: string, to?: string): string {
  const params = new URLSearchParams();
  const f = from?.trim();
  const t = to?.trim();
  if (f) params.set("from", f);
  if (t) params.set("to", t);
  const qs = params.toString();
  return `${NAVIGATOR_PATH}${qs ? `?${qs}` : ""}`;
}
