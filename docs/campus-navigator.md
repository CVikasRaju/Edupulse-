# Sahyadri Campus Navigator

A self-contained campus navigation web app for the Sahyadri College building
(Ground Floor to 5th Floor), plus an embedded 3D building model.

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
- Step-by-step walking directions with an estimated walk time.
- Interactive floor diagram that highlights the calculated route.
- **3D Building View** tab — an interactive Three.js model of the building (drag to rotate,
  scroll/pinch to zoom, click a floor slab or a floor name for its contents).
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

The 3D model data lives in the `3D Building Model` script block of the same file
(`FLOOR_NAMES` and `FLOOR_SUMMARY`).

The timetable logic lives in the `My Timetable` script block (third `<script>` after the
planner). It reuses the planner's graph — one-tap routes just set the planner's From/To
selects and call `findRoute()` — so timetable routing stays consistent with manual routing.

## Moving the timetable to the database later

Because `localStorage` is per device, a student who logs in elsewhere will not see their
timetable. To make it follow the account, the entries (`day`, `start`, `end`, `subject`,
`roomId`) map cleanly onto a `timetable_slots` table keyed by `user_id` in the existing
Supabase/Prisma setup, and the read/write pair in the timetable script (`readStore()` /
`writeStore()`) is the only place that needs to change.
