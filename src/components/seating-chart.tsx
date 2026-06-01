"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type Hall = "men" | "women";
type Seats = (string | null)[];
type HallMap = Record<number, Seats>;
type Assignments = { men: HallMap; women: HallMap };

type RsvpRow = {
  is_attending: boolean;
  guest_names: string[];
};

const SEATS_PER_TABLE = 8;
const HALL = {
  men:   { label: "Men's Hall",   tables: 19 },
  women: { label: "Women's Hall", tables: 13 },
};

// Table circle dimensions
const R  = 38;   // radius from center to seat center
const S  = 24;   // seat diameter
const BOX = (R + S / 2 + 6) * 2; // full container size per table

function emptySeats(): Seats       { return Array(SEATS_PER_TABLE).fill(null); }
function getSeats(m: HallMap, t: number): Seats { return m[t] ?? emptySeats(); }

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function seatPos(i: number) {
  const rad = ((i * 360) / SEATS_PER_TABLE) * (Math.PI / 180);
  return { x: Math.sin(rad) * R, y: -Math.cos(rad) * R };
}

// ─── Table unit ───────────────────────────────────────────────────────────────

function TableUnit({
  index, seats, selected, onSeatClick,
}: {
  index: number;
  seats: Seats;
  selected: string | null;
  onSeatClick: (t: number, s: number, current: string | null) => void;
}) {
  const filled = seats.filter(Boolean).length;
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: BOX, height: BOX, position: "relative" }}>
        {/* Table */}
        <div
          style={{
            position: "absolute", left: "50%", top: "50%",
            width: 44, height: 44, transform: "translate(-50%,-50%)",
          }}
          className="flex items-center justify-center rounded-full border-2 border-wine/35 bg-wine/15"
        >
          <span className="text-[11px] font-bold text-wine/70">{index + 1}</span>
        </div>

        {/* Seats */}
        {seats.map((guest, s) => {
          const { x, y } = seatPos(s);
          const clickable = guest ? true : !!selected;
          return (
            <div
              key={s}
              style={{
                position: "absolute", left: "50%", top: "50%",
                width: S, height: S,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
            >
              <motion.button
                whileHover={clickable ? { scale: 1.15 } : {}}
                whileTap={clickable  ? { scale: 0.90 } : {}}
                onClick={() => onSeatClick(index, s, guest)}
                title={guest ?? (selected ? `Place ${selected} here` : "")}
                style={{ width: "100%", height: "100%" }}
                className={`flex items-center justify-center rounded-full border text-[9px] font-bold transition-colors ${
                  guest
                    ? "border-wine bg-wine text-white shadow-[0_3px_10px_rgba(111,48,50,0.35)]"
                    : selected
                    ? "border-wine/50 bg-white/85 text-wine/40 hover:border-wine hover:bg-wine/10 cursor-pointer"
                    : "border-white/55 bg-white/35 text-ink/20 cursor-default"
                }`}
              >
                {guest ? initials(guest) : ""}
              </motion.button>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-ink/35">{filled}/{SEATS_PER_TABLE}</p>
    </div>
  );
}

// ─── Hall view ────────────────────────────────────────────────────────────────

const AISLE_W = 56; // px — width of the bridal walkway

function HallView({
  tableCount, hallMap, selected, onSeatClick, showAisle,
}: {
  tableCount: number;
  hallMap: HallMap;
  selected: string | null;
  onSeatClick: (t: number, s: number, current: string | null) => void;
  showAisle: boolean;
}) {
  const leftCount  = Math.ceil(tableCount / 2);
  const rightCount = tableCount - leftCount;
  const tableRows  = Math.ceil(leftCount / 2);
  // height of the tables grid (rows × BOX + gaps between rows)
  const gridHeight = tableRows * BOX + Math.max(tableRows - 1, 0) * 12;

  return (
    <div className="overflow-x-auto touch-pan-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="mx-auto w-fit">

        {/* Stage */}
        <div className="relative flex h-14 items-center justify-center rounded-2xl border border-wine/35 bg-gradient-to-b from-wine/22 to-wine/8 shadow-inner">
          <span className="text-[11px] font-bold uppercase tracking-[0.32em] text-wine/65">✦ Stage ✦</span>
          <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-wine/30 to-transparent" />
        </div>

        {/* Aisle stub connecting stage to tables */}
        {showAisle && (
          <div className="flex justify-center">
            <div
              style={{ width: AISLE_W }}
              className="h-4 bg-gradient-to-b from-[#f0ddd0]/70 to-[#f5e8de]/50 border-x border-wine/15"
            />
          </div>
        )}

        {/* Section labels row */}
        <div className="mb-2 flex items-end justify-center">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/30"
             style={{ width: 2 * BOX + 12 }}>Left</p>
          <div style={{ width: AISLE_W }} />
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/30"
             style={{ width: 2 * BOX + 12 }}>Right</p>
        </div>

        {/* Tables + bridal aisle */}
        <div className="flex items-start justify-center">

          {/* Left tables — 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: leftCount }, (_, i) => (
              <TableUnit key={i} index={i}
                seats={getSeats(hallMap, i)}
                selected={selected} onSeatClick={onSeatClick} />
            ))}
          </div>

          {/* Bridal walkway — women's hall only */}
          <div
            className="relative mx-0 shrink-0 overflow-hidden"
            style={{ width: AISLE_W, height: gridHeight, visibility: showAisle ? "visible" : "hidden" }}
          >
            {/* Carpet background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#f0ddd0]/60 via-[#edddd0]/50 to-[#f0ddd0]/40 border-x border-wine/15" />
            {/* Centre dashed line */}
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
                 style={{ width: 1, backgroundImage: "repeating-linear-gradient(to bottom, rgba(111,48,50,0.25) 0px, rgba(111,48,50,0.25) 6px, transparent 6px, transparent 14px)" }} />
            {/* Entrance label */}
            <span
              className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest text-wine/35 whitespace-nowrap"
              style={{ writingMode: "vertical-rl", transform: "translateX(-50%) rotate(180deg)" }}
            >
              Entrance
            </span>
          </div>

          {/* Right tables — 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: rightCount }, (_, i) => (
              <TableUnit key={leftCount + i} index={leftCount + i}
                seats={getSeats(hallMap, leftCount + i)}
                selected={selected} onSeatClick={onSeatClick} />
            ))}
            {rightCount % 2 !== 0 && <div style={{ width: BOX }} />}
          </div>

        </div>

        {/* Mobile scroll hint */}
        <p className="mt-3 text-center text-[10px] text-ink/25 sm:hidden">
          ← scroll to see full hall →
        </p>

      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SeatingChart({ rsvps }: { rsvps: RsvpRow[] }) {
  const [hall, setHall]           = useState<Hall>("men");
  const [assignments, setAssign]  = useState<Assignments>({ men: {}, women: {} });
  const [selected, setSelected]   = useState<string | null>(null);

  useEffect(() => {
    try { const r = localStorage.getItem("seating-v1"); if (r) setAssign(JSON.parse(r)); } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("seating-v1", JSON.stringify(assignments));
  }, [assignments]);

  const allNames = rsvps.filter((r) => r.is_attending).flatMap((r) => r.guest_names);
  const pool = {
    men:   allNames.filter((n) => n.endsWith("(Male)")).map((n)   => n.replace(" (Male)", "")),
    women: allNames.filter((n) => n.endsWith("(Female)")).map((n) => n.replace(" (Female)", "")),
  };

  const hallMap   = assignments[hall];
  const assigned  = new Set(Object.values(hallMap).flat().filter(Boolean) as string[]);
  const unassigned = pool[hall].filter((g) => !assigned.has(g));
  const seated    = assigned.size;
  const total     = pool[hall].length;

  function handleSeatClick(t: number, s: number, current: string | null) {
    if (current) {
      setAssign((prev) => {
        const map = { ...prev[hall] };
        const seats = [...getSeats(map, t)];
        seats[s] = null;
        map[t] = seats;
        return { ...prev, [hall]: map };
      });
    } else if (selected) {
      setAssign((prev) => {
        const map = { ...prev[hall] };
        const seats = [...getSeats(map, t)];
        if (seats[s] !== null) return prev;
        seats[s] = selected;
        map[t] = seats;
        return { ...prev, [hall]: map };
      });
      setSelected(null);
    }
  }

  function clearHall() {
    setAssign((prev) => ({ ...prev, [hall]: {} }));
    setSelected(null);
  }

  return (
    <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/65 bg-white/38 shadow-glass backdrop-blur-2xl">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 px-5 py-4 sm:px-6">
        <div className="flex gap-2">
          {(["men", "women"] as Hall[]).map((h) => (
            <button
              key={h}
              onClick={() => { setHall(h); setSelected(null); }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                hall === h
                  ? "bg-wine text-white shadow-[0_8px_24px_rgba(111,48,50,0.25)]"
                  : "border border-white/65 bg-white/42 text-ink/65 hover:bg-white/70"
              }`}
            >
              {HALL[h].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/55">
            <span className="font-semibold text-wine">{seated}</span> / {total} seated
          </span>
          {seated > 0 && (
            <button
              onClick={clearHall}
              className="rounded-full border border-wine/20 bg-white/45 px-3 py-1.5 text-xs font-medium text-wine transition hover:bg-white/70"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">

        {/* Guest list */}
        <div className="w-full shrink-0 border-b border-white/60 p-4 lg:w-52 lg:border-b-0 lg:border-r lg:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
            Unassigned ({unassigned.length})
          </p>
          {unassigned.length === 0 ? (
            <p className="text-sm text-ink/40">All guests seated</p>
          ) : (
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
              {unassigned.map((guest) => (
                <motion.button
                  key={guest}
                  onClick={() => setSelected(selected === guest ? null : guest)}
                  whileTap={{ scale: 0.97 }}
                  className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                    selected === guest
                      ? "bg-wine font-semibold text-white shadow-[0_6px_18px_rgba(111,48,50,0.25)]"
                      : "border border-white/60 bg-white/50 text-ink/75 hover:bg-white/75"
                  }`}
                >
                  {guest}
                </motion.button>
              ))}
            </div>
          )}

          {assigned.size > 0 && (
            <>
              <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                Seated ({assigned.size})
              </p>
              <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
                {Array.from(assigned).map((guest) => (
                  <div key={guest} className="rounded-xl border border-white/60 bg-white/30 px-3 py-2 text-sm text-ink/40 line-through">
                    {guest}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Hall */}
        <div className="flex-1 p-4 sm:p-6">
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-5 flex items-center justify-between rounded-2xl border border-wine/20 bg-wine/8 px-4 py-2.5"
              >
                <p className="text-sm font-medium text-wine">
                  Placing <span className="font-bold">{selected}</span> — click an empty seat
                </p>
                <button onClick={() => setSelected(null)} className="text-wine/60 hover:text-wine">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <HallView
            showAisle={hall === "women"}
            tableCount={HALL[hall].tables}
            hallMap={hallMap}
            selected={selected}
            onSeatClick={handleSeatClick}
          />
        </div>

      </div>
    </div>
  );
}
