"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { SeatingChart } from "@/components/seating-chart";

type RsvpRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  is_attending: boolean;
  party_size: number;
  male_guests: number;
  female_guests: number;
  guest_names: string[];
};

type SessionState = "loading" | "signed-out" | "signed-in";
const ADMIN_EMAILS = ["yousef.hadi.cs@gmail.com", "dr.osama.abdelhadi@gmail.com", "alhayeknour@gmail.com"];

export function AdminDashboard() {
  const [sessionState, setSessionState] = useState<SessionState>(
    isSupabaseConfigured ? "loading" : "signed-out"
  );
  const [email, setEmail] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"responses" | "seating">("responses");
  const [search, setSearch] = useState("");
  const configError = isSupabaseConfigured ? "" : "Supabase is not configured yet.";

  const attendingRows = rsvps.filter((rsvp) => rsvp.is_attending);
  const stats = useMemo(
    () => ({
      responses: rsvps.length,
      attendingResponses: attendingRows.length,
      notAttendingResponses: rsvps.length - attendingRows.length,
      peopleComing: attendingRows.reduce((total, rsvp) => total + rsvp.party_size, 0),
      maleGuests: attendingRows.reduce((total, rsvp) => total + rsvp.male_guests, 0),
      femaleGuests: attendingRows.reduce((total, rsvp) => total + rsvp.female_guests, 0)
    }),
    [attendingRows, rsvps]
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSessionState(data.session ? "signed-in" : "signed-out");
      setSignedInEmail(data.session?.user.email?.toLowerCase() ?? "");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionState(session ? "signed-in" : "signed-out");
      setSignedInEmail(session?.user.email?.toLowerCase() ?? "");
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionState === "signed-in") {
      void loadRsvps();
    }
  }, [sessionState]);

  async function sendLoginLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !email.trim()) {
      return;
    }

    setError("");
    setNotice("");
    setIsSendingLink(true);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/admin/rsvp-vault-7f4c9a`
      }
    });

    setIsSendingLink(false);

    if (signInError) {
      setError("Could not send the sign-in link. Check the email and Supabase Auth settings.");
      return;
    }

    setNotice("Check your email for the admin sign-in link.");
  }

  async function loadRsvps() {
    if (!supabase) {
      return;
    }

    setError("");
    setIsLoadingRows(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const currentEmail = userData.user?.email?.toLowerCase() ?? "";
    setSignedInEmail(currentEmail);

    if (userError || !ADMIN_EMAILS.includes(currentEmail)) {
      setIsLoadingRows(false);
      setRsvps([]);
      setError(
        currentEmail
          ? `Signed in as ${currentEmail}. This email is not authorized to view RSVPs.`
          : "Your admin session expired. Please sign in again."
      );
      return;
    }

    const { data, error: rowsError } = await supabase
      .from("rsvps")
      .select(
        "id, created_at, first_name, last_name, is_attending, party_size, male_guests, female_guests, guest_names"
      )
      .order("created_at", { ascending: false });

    setIsLoadingRows(false);

    if (rowsError) {
      setError("You are signed in, but this email is not authorized to view RSVPs.");
      setRsvps([]);
      return;
    }

    setRsvps((data ?? []) as RsvpRow[]);
  }

  async function getAuthHeader() {
    const { data } = await supabase!.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token}` };
  }

  async function deleteRsvp(id: string) {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/admin/rsvp?id=${id}`, { method: "DELETE", headers });
    if (res.ok) setRsvps((prev) => prev.filter((r) => r.id !== id));
    else setError("Failed to delete RSVP.");
  }

  async function removeGuest(rsvp: RsvpRow, guestName: string) {
    const updatedNames = rsvp.guest_names.filter((g) => g !== guestName);
    const male = updatedNames.filter((g) => g.endsWith("(Male)")).length;
    const female = updatedNames.filter((g) => g.endsWith("(Female)")).length;
    const headers = { ...(await getAuthHeader()), "Content-Type": "application/json" };
    const res = await fetch(`/api/admin/rsvp?id=${rsvp.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ guest_names: updatedNames, party_size: updatedNames.length, male_guests: male, female_guests: female }),
    });
    if (res.ok) {
      setRsvps((prev) => prev.map((r) => r.id === rsvp.id
        ? { ...r, guest_names: updatedNames, party_size: updatedNames.length, male_guests: male, female_guests: female }
        : r
      ));
    } else {
      setError("Failed to remove guest.");
    }
  }

  async function signOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setRsvps([]);
    setOpenId(null);
    setSignedInEmail("");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,163,160,0.22),transparent_28rem),linear-gradient(135deg,#fbf7f1,#efe7d8)] px-5 py-8 text-ink sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-xs uppercase tracking-[0.22em] text-wine backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4" />
              Private Admin
            </p>
            <h1 className="font-display text-4xl text-ink sm:text-5xl">RSVP Responses</h1>
            {sessionState === "signed-in" ? (
              <p className="mt-2 text-sm text-ink/58">
                Signed in as {signedInEmail || "unknown"}
              </p>
            ) : null}
          </div>

          {sessionState === "signed-in" ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadRsvps}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-wine/15 bg-white/55 px-4 text-sm font-semibold text-wine shadow-sm backdrop-blur-xl transition hover:bg-white/75"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingRows ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-wine px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5f292b]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>

        {/* Instance links */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { label: "Men", href: "/men" },
            { label: "Women", href: "/women" },
            { label: "Osama", href: "/osama" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/65 bg-white/45 px-4 py-2 text-xs font-semibold text-wine backdrop-blur-xl transition hover:bg-white/70"
            >
              <ExternalLink className="h-3 w-3" />
              {label}
            </a>
          ))}
        </div>

        {sessionState !== "signed-in" ? (
          <section className="max-w-xl rounded-[2rem] border border-white/65 bg-white/38 p-6 shadow-glass backdrop-blur-2xl sm:p-8">
            <h2 className="font-display text-3xl text-ink">Admin sign in</h2>

            <form onSubmit={sendLoginLink} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink/72">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/38" />
                  <input
                    className="premium-field !pl-11"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={isSendingLink || !email.trim()}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-wine px-5 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_50px_rgba(111,48,50,0.22)] transition hover:-translate-y-0.5 hover:bg-[#5f292b] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                {isSendingLink ? "Sending" : "Send Sign-In Link"}
              </button>
            </form>

            <StatusMessage error={error || configError} notice={notice} />
          </section>
        ) : (
          <>
            <StatsGrid stats={stats} />
            <StatusMessage error={error} notice={notice} />

            <div className="mt-6 flex gap-2">
              {(["responses", "seating"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                    tab === t
                      ? "bg-wine text-white shadow-[0_8px_24px_rgba(111,48,50,0.25)]"
                      : "border border-white/65 bg-white/42 text-ink/65 hover:bg-white/70"
                  }`}
                >
                  {t === "responses" ? "Responses" : "Seating Chart"}
                </button>
              ))}
            </div>

            {tab === "responses" ? (
              <section className="mt-4 overflow-hidden rounded-[2rem] border border-white/65 bg-white/38 shadow-glass backdrop-blur-2xl">
                <div className="border-b border-white/60 px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-display text-2xl text-ink">People who replied</h2>
                    <div className="relative">
                      <input
                        className="premium-field !py-2 !text-sm w-full sm:w-56"
                        type="search"
                        placeholder="Search by name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-white/55">
                  {rsvps.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-ink/58 sm:px-6">No RSVPs yet.</p>
                  ) : (() => {
                    const q = search.toLowerCase().trim();
                    const filtered = q
                      ? rsvps.filter((r) =>
                          `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
                          r.guest_names.some((g) => g.toLowerCase().includes(q))
                        )
                      : rsvps;
                    return filtered.length === 0 ? (
                      <p className="px-5 py-8 text-sm text-ink/58 sm:px-6">No results for &quot;{search}&quot;.</p>
                    ) : (
                      filtered.map((rsvp) => (
                        <RsvpRowView
                          key={rsvp.id}
                          rsvp={rsvp}
                          isOpen={openId === rsvp.id}
                          onToggle={() => setOpenId((current) => (current === rsvp.id ? null : rsvp.id))}
                          onDelete={() => deleteRsvp(rsvp.id)}
                          onRemoveGuest={(g) => removeGuest(rsvp, g)}
                        />
                      ))
                    );
                  })()}
                </div>
              </section>
            ) : (
              <SeatingChart rsvps={rsvps} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StatsGrid({
  stats
}: {
  stats: {
    responses: number;
    attendingResponses: number;
    notAttendingResponses: number;
    peopleComing: number;
    maleGuests: number;
    femaleGuests: number;
  };
}) {
  const cards = [
    { label: "People Coming", value: stats.peopleComing, icon: Users },
    { label: "Female Guests", value: stats.femaleGuests, icon: UserRound },
    { label: "Male Guests", value: stats.maleGuests, icon: UserRound },
    { label: "Not Attending", value: stats.notAttendingResponses, icon: X },
    { label: "Responses", value: stats.responses, icon: Mail }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[1.35rem] border border-white/65 bg-white/42 p-5 shadow-[0_18px_50px_rgba(65,42,36,0.1)] backdrop-blur-2xl"
        >
          <card.icon className="mb-5 h-5 w-5 text-wine" />
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{card.label}</p>
          <p className="mt-2 font-display text-4xl text-wine">{card.value}</p>
        </div>
      ))}
    </section>
  );
}

function RsvpRowView({
  rsvp,
  isOpen,
  onToggle,
  onDelete,
  onRemoveGuest,
}: {
  rsvp: RsvpRow;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRemoveGuest: (guest: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2 px-5 sm:px-6">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center justify-between gap-4 py-5 text-left transition hover:opacity-75"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-2xl text-ink">
                {rsvp.first_name} {rsvp.last_name}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                  rsvp.is_attending
                    ? "bg-olive/10 text-olive"
                    : "bg-wine/10 text-wine"
                }`}
              >
                {rsvp.is_attending ? "Yes" : "No"}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink/55">
              {rsvp.is_attending ? `${rsvp.party_size} attending` : "Not attending"}{" "}
              · {new Date(rsvp.created_at).toLocaleDateString()}
            </p>
          </div>
          <ChevronDown className={`h-5 w-5 shrink-0 text-wine transition ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Delete button */}
        {confirmDelete ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              className="rounded-full bg-wine px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#5f292b]"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-full border border-white/65 bg-white/45 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:bg-white/70"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 rounded-full border border-wine/15 bg-white/45 p-2 text-wine/50 transition hover:border-wine/30 hover:bg-white/70 hover:text-wine"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 sm:px-6">
              <div className="rounded-[1.15rem] border border-white/60 bg-white/35 p-4">
                {rsvp.guest_names.length === 0 ? (
                  <p className="text-sm text-ink/58">No attending guests listed.</p>
                ) : (
                  <ul className="grid gap-2 text-sm text-ink/72">
                    {rsvp.guest_names.map((guest) => (
                      <li key={guest} className="flex items-center justify-between gap-3 rounded-xl bg-white/42 px-3 py-2">
                        <span>{guest}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveGuest(guest)}
                          className="shrink-0 rounded-full p-1 text-ink/30 transition hover:bg-wine/10 hover:text-wine"
                          title="Remove guest"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function StatusMessage({ error, notice }: { error: string; notice: string }) {
  if (!error && !notice) {
    return null;
  }

  return (
    <p
      className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
        error
          ? "border-wine/15 bg-white/55 text-wine"
          : "border-olive/20 bg-white/55 text-olive"
      }`}
    >
      {error || notice}
    </p>
  );
}
