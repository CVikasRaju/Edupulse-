# Sahyadri Campus Navigator

A self-contained campus navigation web app for the Sahyadri College building
(Ground Floor to 5th Floor), with two embedded 3D models, a saved per-student
timetable, and one-tap routes between classes.

## Where it lives

| Page | File | Served at |
|------|------|-----------|
| College landing page (digital features) | `frontend/public/college/index.html` | `/college/index.html` |
| Campus Navigator (route planner + 3D view) | `frontend/public/navigation/index.html` | `/navigation/index.html` |

Because both files live in Next.js's `public/` directory they are served as static
assets by the existing EduPulse deployment — no route handlers or build step needed.

> The pages use relative links, so opening the files directly in a browser also works
> as long as the sibling `college/` / `navigation/` folders stay next to each other.
> The **Login** buttons point to `../login`, which only resolves on the running app.

## Features

- Search and filter rooms by category (classrooms, labs, offices, libraries, seminar halls,
  study spaces, washrooms, workshops).
- Pick a "From" and "To" location and get the shortest route (Dijkstra's algorithm) across
  floors, including stairs/lift transitions.
- Step-by-step walking directions with an estimated distance, walk time and number of
  floor changes (see the calibration note below).
- Interactive floor diagram that highlights the calculated route.
- **3D Building View** tab with two modes (drag to rotate, scroll/pinch to zoom):
  - **From floor plan (rooms)** — geometry *generated* from `FLOORS`: one wedge
    (annular sector) per room, so the ground floor shows 26 rooms, the 5th floor 6, and
    every room sits where the route planner puts it. Floors stack around an open
    courtyard with a lift/stair core and an entrance canopy at Main Entry. Floor names are
    always labelled; clicking a floor isolates it and labels its rooms; clicking a room
    shows its name/floor/category with **Route here** (runs the planner from your current
    From selection) and **Show on floor map**.
  - **Simple massing** — the stacked-slab outline with the attached workshop wing.
- **My Timetable** tab — a student saves the room of each class once (day, start/end, subject,
  room) and then gets one-tap routes between classes:
  - an "Up next" card that shows the ongoing/next class with a **Navigate now** button,
  - **➡️ To next class** on each row to route straight from one class to the following one,
  - **↩️ Start here** to tell the navigator where you currently are,
  - **📍 Where am I right now?** defaults to *Auto*, which uses your ongoing class, then the
    last class that finished today, then Main Entry.
  - Today's class rooms are ringed in orange on the floor diagram.

  The timetable is stored in `localStorage` (`sahyadri.timetable.v1`, plus
  `sahyadri.nav.origin.v1` for the "where am I" choice), so it is per-browser and needs no
  backend. Entries keep a copy of the room name/floor: if a room is later removed from
  `FLOORS`, the row is marked ⚠️ and routing asks you to pick the room again instead of
  silently routing to the wrong place.

## Customizing the data

All room data lives in the `FLOORS` array near the top of the first `<script>` tag in
`frontend/public/navigation/index.html`:

```js
const FLOORS=[
["G","Ground Floor",[["Main Entry","entry"], ...]],
...
];
```

- Each floor is `[floorKey, floorDisplayName, [ [roomName, category], ... ]]`.
- Categories: `classroom, lab, office, library, seminar, study, washroom, food, stairs, entry, other`.
- To add a room, add another `["Room Name","category"]` entry to the relevant floor's list —
  the layout, search, filters, and routing all update automatically.
- Routing connects rooms in sequence around each floor's loop, plus one stairs/lift link
  between each pair of adjacent floors. To add a shortcut edge (e.g. across a courtyard),
  add a line to the `edges` array inside `buildGraph()`.

The `From floor plan` 3D model is generated from the same `FLOORS` array — there is no
separate model data to maintain. Its script block is the last one in the file; the tunables
are at the top of it:

```js
const FLOOR_H=1.15, SLAB=0.12, rCourt=2.5, rCorr=3.4, rOut=6.5;
const TAPER=[1,1,0.97,0.93,0.88,0.82];   // upper floors pull in a little
const GAP=0.035;                         // fraction of each wedge left as wall
```

The pure layout maths lives in `buildBuildingPlan()`, which is exposed as
`window.buildBuildingPlan()` so the geometry can be inspected (and checked) without WebGL.
Room ids it produces are the planner's own node ids (`"3_6"` = Third Floor, 7th room), which
is what makes click-to-route work.

The `Simple massing` outline lives in its own script block, with hand-written
`FLOOR_NAMES`, `FLOOR_SUMMARY` and `SCALE` values.

The walk-time estimate in `renderDirections()` (planner script) maps route units to
metres with `1 unit ≈ 0.1 m` — the floor diagrams are 600 units across and represent a
building roughly 60 m wide — then budgets ~75 m/min plus 0.4 min per floor change. If your
actual corridor lengths differ, `metres/75` and the `0.4` are the two numbers to tune.

The timetable logic lives in the `My Timetable` script block (third `<script>` after the
planner). It reuses the planner's graph — one-tap routes just set the planner's From/To
selects and call `findRoute()` — so timetable routing stays consistent with manual routing.

## Moving the timetable to the database later

Because `localStorage` is per device, a student who logs in elsewhere will not see their
timetable. To make it follow the account, the entries (`day`, `start`, `end`, `subject`,
`roomId`) map cleanly onto a `timetable_slots` table keyed by `user_id` in the existing
Supabase/Prisma setup, and the read/write pair in the timetable script (`readStore()` /
`writeStore()`) is the only place that needs to change.
