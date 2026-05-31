"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X } from "lucide-react";

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
  men: { label: "Men's Hall", tables: 19 },
  women: { label: "Women's Hall", tables: 13 },
};
const RADIUS = 54;
const SEAT = 34;
const BOX = (RADIUS + SEAT / 2 + 6) * 2;

function emptySeats(): Seats {
  return Array(SEATS_PER_TABLE).fill(null);
}

function getSeats(map: HallMap, t: number): Seats {
  return map[t] ?? emptySeats();
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function seatPos(i: number) {
  const angle = (i * 360) / SEATS_PER_TABLE;
  const rad = (angle * Math.PI) / 180;
  return { x: Math.sin(rad) * RADIUS, y: -Math.cos(rad) * RADIUS };
}

export function SeatingChart({ rsvps }: { rsvps: RsvpRow[] }) {
  const [hall, setHall] = useState<Hall>("men");
  const [assignments, setAssignments] = useState<Assignments>({ men: {}, women: {} });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("seating-v1");
      if (raw) setAssignments(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("seating-v1", JSON.stringify(assignments));
  }, [assignments]);

  const allNames = rsvps.filter((r) => r.is_attending).flatMap((r) => r.guest_names);
  const pool = {
    men: allNames.filter((n) => n.endsWith("(Male)")).map((n) => n.replace(" (Male)", "")),
    women: allNames.filter((n) => n.endsWith("(Female)")).map((n) => n.replace(" (Female)", "")),
  };

  const hallMap = assignments[hall];
  const assigned = new Set(Object.values(hallMap).flat().filter(Boolean) as string[]);
  const unassigned = pool[hall].filter((g) => !assigned.has(g));
  const tableCount = HALL[hall].tables;
  const seated = assigned.size;
  const total = pool[hall].length;

  function handleSeatClick(t: number, s: number, current: string | null) {
    if (current) {
      setAssignments((prev) => {
        const map = { ...prev[hall] };
        const seats = [...getSeats(map, t)];
        seats[s] = null;
        map[t] = seats;
        return { ...prev, [hall]: map };
      });
    } else if (selected) {
      setAssignments((prev) => {
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
    setAssignments((prev) => ({ ...prev, [hall]: {} }));
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

      <div className="flex flex-col gap-0 lg:flex-row">
        {/* Guest list */}
        <div className="w-full shrink-0 border-b border-white/60 p-4 lg:w-56 lg:border-b-0 lg:border-r lg:p-5">
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
                  <div
                    key={guest}
                    className="rounded-xl border border-white/60 bg-white/30 px-3 py-2 text-sm text-ink/45 line-through"
                  >
                    {guest}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tables */}
        <div className="flex-1 overflow-x-auto p-4 sm:p-6">
          {selected && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 flex items-center justify-between rounded-2xl border border-wine/20 bg-wine/8 px-4 py-2.5"
              >
                <p className="text-sm font-medium text-wine">
                  Placing <span className="font-bold">{selected}</span> — click an empty seat
                </p>
                <button onClick={() => setSelected(null)} className="text-wine/60 hover:text-wine">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: tableCount }, (_, t) => {
              const seats = getSeats(hallMap, t);
              const filledCount = seats.filter(Boolean).length;
              return (
                <div key={t} className="flex flex-col items-center gap-1.5">
                  <div style={{ width: BOX, height: BOX, position: "relative" }}>
                    {/* Table circle */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 52,
                        height: 52,
                        transform: "translate(-50%,-50%)",
                      }}
                      className="flex items-center justify-center rounded-full border-2 border-wine/30 bg-wine/12"
                    >
                      <span className="text-xs font-bold text-wine/70">{t + 1}</span>
                    </div>

                    {/* Seats */}
                    {seats.map((guest, s) => {
                      const { x, y } = seatPos(s);
                      const isEmpty = !guest;
                      const isClickable = isEmpty ? !!selected : true;
                      return (
                        <motion.button
                          key={s}
                          whileHover={isClickable ? { scale: 1.12 } : {}}
                          whileTap={isClickable ? { scale: 0.94 } : {}}
                          onClick={() => handleSeatClick(t, s, guest)}
                          title={guest ?? (selected ? `Seat ${selected} here` : "")}
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: SEAT,
                            height: SEAT,
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          }}
                          className={`flex items-center justify-center rounded-full border text-[10px] font-bold transition ${
                            guest
                              ? "border-wine bg-wine text-white shadow-[0_4px_12px_rgba(111,48,50,0.3)]"
                              : selected
                              ? "border-wine/40 bg-white/80 text-wine/50 hover:border-wine hover:bg-wine/10"
                              : "border-white/55 bg-white/40 text-ink/25"
                          }`}
                        >
                          {guest ? initials(guest) : ""}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-ink/40">
                    {filledCount}/{SEATS_PER_TABLE}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
