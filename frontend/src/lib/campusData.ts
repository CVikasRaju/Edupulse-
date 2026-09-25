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
    id: "p1",
    title: "Sahyadri Front Entrance & Façade",
    tag: "Campus",
    uploader: "Campus Media",
    src: "/photos/sahyadri_Front.png",
    ratio: "aspect-[16/10]",
  },
  {
    id: "p2",
    title: "Campus Front Approach & Plaza",
    tag: "Campus",
    uploader: "Campus Media",
    src: "/photos/sahyadri_Front_1.png",
    ratio: "aspect-[16/9]",
  },
  {
    id: "p3",
    title: "Academic Block Architecture",
    tag: "Architecture",
    uploader: "Campus Media",
    src: "/photos/Sahyadri_1.png",
    ratio: "aspect-[3/4]",
  },
  {
    id: "p4",
    title: "Sahyadri Riverside Campus Wing",
    tag: "Campus",
    uploader: "Campus Media",
    src: "/photos/Sahyadri_2.png",
    ratio: "aspect-[4/3]",
  },
  {
    id: "p5",
    title: "Campus Food Court — Main Dining Hall",
    tag: "Food Court",
    uploader: "Student Council",
    src: "/photos/food_court_1.png",
    ratio: "aspect-[3/2]",
  },
  {
    id: "p6",
    title: "Food Court Front Entrance Plaza",
    tag: "Food Court",
    uploader: "Student Council",
    src: "/photos/Food_court_front.png",
    ratio: "aspect-[4/3]",
  },
  {
    id: "p7",
    title: "Food Court Refreshment Counters",
    tag: "Food Court",
    uploader: "Student Council",
    src: "/photos/food_court_2.png",
    ratio: "aspect-square",
  },
  {
    id: "p8",
    title: "Food Court Seating & Kiosks",
    tag: "Food Court",
    uploader: "Student Council",
    src: "/photos/food_court_3.png",
    ratio: "aspect-square",
  },
  {
    id: "p9",
    title: "Main Sports Ground & Stadium",
    tag: "Sports",
    uploader: "Sports Committee",
    src: "/photos/Sahyadri_Ground_4.png",
    ratio: "aspect-[3/4]",
  },
  {
    id: "p10",
    title: "Sports Field Pavilion & Athletic Track",
    tag: "Sports",
    uploader: "Sports Committee",
    src: "/photos/Sahyadri_Ground_1.png",
    ratio: "aspect-[3/5]",
  },
  {
    id: "p11",
    title: "Sports Arena & Open Ground",
    tag: "Sports",
    uploader: "Sports Committee",
    src: "/photos/Sahyadri_Ground_2.png",
    ratio: "aspect-[4/3]",
  },
  {
    id: "p12",
    title: "Outdoor Campus Grounds & Greenery",
    tag: "Sports",
    uploader: "Sports Committee",
    src: "/photos/Sahyadri_Ground_3.png",
    ratio: "aspect-[4/3]",
  },
];

export const GALLERY_TAGS = [
  "Campus",
  "Food Court",
  "Sports",
  "Architecture",
  "Academics",
  "Lab",
  "Events",
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
  { label: "AIML_Lab 129 · First", cat: "lab" },
  { label: "AIML_ROOM 128 · First", cat: "classroom" },
  { label: "AIML_DEPT 126 · First", cat: "office" },
  { label: "AIML_DEPT 125 · First", cat: "office" },
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
