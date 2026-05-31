"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Check,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Plus,
  Trash2
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Attendance = "yes" | "no" | "";
type Gender = "male" | "female" | "";
type Lang = "en" | "ar";

type GuestName = {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
};

type T = typeof translations.en;

const translations = {
  en: {
    events: [
      { title: "Reception", time: "6:00 PM", location: "", description: "Enjoy drinks from our soft bar." },
      { title: "Zaffa & Dabka", time: "6:45 PM", location: "Hall A", description: "Traditional Zaffa procession and Dabka folk dance." },
      { title: "Bride & Groom Entrance", time: "7:15 PM", location: "Hall F — Women", description: "The couple makes their grand entrance." },
      { title: "Dinner", time: "8:00 PM (Men) · 8:30 PM (Women)", location: "Hall A (Men) · Hall F (Women)", description: "Open buffet in Hall A · Seated dinner in Hall F." }
    ],
    scheduleTitle: "Schedule of Events",
    scheduleDate: "July 5th",
    venueLabel: "Venue",
    venueTitle: "Getting There",
    venueName: "Mississauga Convention Centre",
    hallInfo: "Men's Hall: A · Women's Hall: F",
    getDirections: "Get Directions",
    rsvpLabel: "Kindly Reply",
    rsvpTitle: "RSVP",
    rsvpSubtitle: "Please share your attendance details so we can prepare your place with care.",
    rsvpDeadline: "Please RSVP by June 20",
    firstName: "First Name",
    lastName: "Last Name",
    attendingQuestion: "Will you be attending?",
    yes: "Yes",
    no: "No",
    guestsTitle: "Guests",
    guestsSubtitle: "Add each person attending, including you.",
    add: "Add",
    party: "Party",
    male: "Male",
    female: "Female",
    gender: "Gender",
    remove: "Remove",
    submit: "Submit RSVP",
    sending: "Sending",
    receivedLabel: "RSVP Received",
    thanksTitle: "Thank you",
    thanksMessage: "Your response has been recorded. We are grateful to celebrate this day with the people closest to us.",
    duplicateGuest: "Each guest should only be listed once.",
    errorDuplicate: "We already received an RSVP for this name. Please contact us if you need to make a change.",
    errorPermission: "This RSVP did not pass the database security rules. Please check the names and guest list.",
    errorGeneral: "We could not save your RSVP. Please try again.",
    errorConfig: "Supabase is not configured yet. Add your public anon key."
  },
  ar: {
    events: [
      { title: "الاستقبال", time: "٦:٠٠ مساءً", location: "", description: "استمتع بالمشروبات من البار الخاص بنا." },
      { title: "الزفة والدبكة", time: "٦:٤٥ مساءً", location: "قاعة A", description: "زفة تقليدية وعروض دبكة شعبية." },
      { title: "دخول العروسين", time: "٧:١٥ مساءً", location: "القاعة F — النساء", description: "يدخل العروسان بأبهى حلة." },
      { title: "العشاء", time: "٨:٠٠ مساءً (رجال) · ٨:٣٠ مساءً (نساء)", location: "قاعة A (رجال) · قاعة F (نساء)", description: "بوفيه مفتوح في قاعة A · عشاء رسمي في قاعة F." }
    ],
    scheduleTitle: "جدول الفعاليات",
    scheduleDate: "٥ يوليو",
    venueLabel: "المكان",
    venueTitle: "كيف تصل",
    venueName: "مركز مسيسوغا للمؤتمرات",
    hallInfo: "قاعة الرجال: A · قاعة النساء: F",
    getDirections: "احصل على الاتجاهات",
    rsvpLabel: "الرجاء الرد",
    rsvpTitle: "تأكيد الحضور",
    rsvpSubtitle: "يُرجى مشاركة تفاصيل حضورك حتى نتمكن من تجهيز مكانك باهتمام.",
    rsvpDeadline: "يُرجى تأكيد الحضور قبل ٢٠ يونيو",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    attendingQuestion: "هل ستحضر؟",
    yes: "نعم",
    no: "لا",
    guestsTitle: "الضيوف",
    guestsSubtitle: "أضف كل شخص سيحضر، بما فيك أنت.",
    add: "إضافة",
    party: "المجموعة",
    male: "ذكر",
    female: "أنثى",
    gender: "الجنس",
    remove: "إزالة",
    submit: "إرسال التأكيد",
    sending: "جارٍ الإرسال",
    receivedLabel: "تم استلام التأكيد",
    thanksTitle: "شكراً لك",
    thanksMessage: "تم تسجيل ردك. يسعدنا الاحتفال بهذا اليوم مع أعزّ الناس إلينا.",
    duplicateGuest: "لا يجب إدراج كل ضيف إلا مرة واحدة.",
    errorDuplicate: "لقد تلقينا بالفعل تأكيداً لهذا الاسم. يرجى التواصل معنا إذا أردت إجراء تغيير.",
    errorPermission: "لم يجتز هذا التأكيد قواعد الأمان. يرجى التحقق من الأسماء.",
    errorGeneral: "لم نتمكن من حفظ تأكيدك. يرجى المحاولة مرة أخرى.",
    errorConfig: "لم يتم تكوين Supabase بعد."
  }
};

const MAX_NAME_LENGTH = 80;
const MAX_GUESTS = 20;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 }
};

type ImageConfig = { en: string; ar?: string };

export function RsvpExperience({ images }: { images: ImageConfig }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];
  const isAr = lang === "ar";
  const imageSrc = isAr && images.ar ? images.ar : images.en;

  return (
    <main dir={isAr ? "rtl" : "ltr"} className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-champagne/40 blur-3xl" />
        <div className="absolute bottom-36 left-0 h-[28rem] w-[28rem] rounded-full bg-blush/20 blur-3xl" />
      </div>

      <div className="flex justify-end px-5 pt-5 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={() => setLang(isAr ? "en" : "ar")}
          className="rounded-full border border-white/60 bg-white/45 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-wine shadow-sm backdrop-blur-xl transition hover:bg-white/65"
        >
          {isAr ? "English" : "العربية"}
        </button>
      </div>

      <HeroSection imageSrc={imageSrc} />
      <TimelineSection t={t} />
      <LocationSection t={t} />
      <RsvpSection t={t} />
    </main>
  );
}

function HeroSection({ imageSrc }: { imageSrc: string }) {
  return (
    <section className="px-5 pb-20 pt-6 sm:px-8 lg:px-12 lg:pb-28">
      <motion.div
        className="mx-auto flex max-w-6xl flex-col items-center gap-8"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative w-full max-w-[760px]">
          <div className="absolute -inset-5 rounded-[2.2rem] bg-white/40 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/50 p-3 shadow-glass backdrop-blur-xl sm:p-4">
            <div className="relative aspect-[5/7] overflow-hidden rounded-[1.45rem] bg-porcelain">
              <Image
                src={imageSrc}
                alt="Wedding invitation card"
                fill
                priority
                sizes="(max-width: 768px) 92vw, 760px"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Scroll to RSVP indicator */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-wine/70">
            Scroll to RSVP
          </p>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5 text-wine/60" />
          </motion.div>
        </motion.div>

      </motion.div>
    </section>
  );
}

function TimelineSection({ t }: { t: T }) {
  return (
    <section className="px-5 py-14 sm:py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal className="mb-10 text-center sm:mb-14">
          <h2 className="font-display text-4xl text-ink sm:text-5xl">
            {t.scheduleTitle}
          </h2>
          <p className="mt-3 text-sm text-ink/55">{t.scheduleDate}</p>
        </ScrollReveal>

        <div className="relative">
          <div className="absolute start-[9px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-wine/25 via-wine/50 to-transparent" />
          <div className="space-y-4 sm:space-y-6">
            {t.events.map((event) => (
              <TimelineItem key={event.title} event={event} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineItem({ event }: { event: T["events"][number] }) {
  return (
    <ScrollReveal className="flex gap-4 sm:gap-7">
      <div className="relative mt-[1.25rem] shrink-0 sm:mt-[1.55rem]">
        <div className="h-[19px] w-[19px] rounded-full border-2 border-wine bg-white shadow-[0_0_0_3px_rgba(111,48,50,0.1)]" />
      </div>

      <motion.div
        className="flex-1 rounded-[1.2rem] border border-white/70 bg-white/50 p-4 shadow-[0_20px_60px_rgba(65,42,36,0.11)] backdrop-blur-xl transition sm:rounded-[1.35rem] sm:p-6 hover:-translate-y-1 hover:bg-white/65"
        whileHover={{ scale: 1.01 }}
      >
        <h3 className="font-display text-2xl text-wine sm:text-3xl">{event.title}</h3>
        <p className="mt-1 text-sm text-ink/55">{event.description}</p>

        <div className="mt-4 grid gap-2 text-sm text-ink/70 sm:mt-5 sm:gap-3">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 shrink-0 text-wine" />
            <span>{event.time}</span>
          </div>
          {event.location ? (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-wine" />
              <span>{event.location}</span>
            </div>
          ) : null}
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

function LocationSection({ t }: { t: T }) {
  return (
    <section className="px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-olive">{t.venueLabel}</p>
          <h2 className="font-display text-4xl text-ink sm:text-5xl">{t.venueTitle}</h2>
          <p className="mt-5 font-display text-2xl text-ink">{t.venueName}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-ink/58">{t.hallInfo}</p>
          <a
            href="https://maps.app.goo.gl/pMQSRpiYMAJbh9ou6"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-wine px-6 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(111,48,50,0.22)] transition hover:-translate-y-0.5 hover:bg-[#5f292b] sm:w-auto"
          >
            <MapPin className="h-4 w-4" />
            {t.getDirections}
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}

function RsvpSection({ t }: { t: T }) {
  return (
    <section className="px-5 pb-28 pt-14 sm:px-8 lg:px-12">
      <ScrollReveal className="mx-auto max-w-3xl">
        <RsvpForm t={t} />
      </ScrollReveal>
    </section>
  );
}

function RsvpForm({ t }: { t: T }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("");
  const [guestNames, setGuestNames] = useState<GuestName[]>([
    { id: "guest-1", firstName: "", lastName: "", gender: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const nextGuestId = useRef(2);

  const attending = attendance === "yes";
  const partySize = guestNames.length;
  const maleGuests = guestNames.filter((g) => g.gender === "male").length;
  const femaleGuests = guestNames.filter((g) => g.gender === "female").length;
  const normalizedGuestNames = guestNames.map((g) =>
    `${g.firstName.trim()} ${g.lastName.trim()}`.replace(/\s+/g, " ").toLowerCase()
  );
  const hasDuplicateGuests =
    attending && new Set(normalizedGuestNames.filter(Boolean)).size !== normalizedGuestNames.length;
  const hasGuestNames = !attending
    ? true
    : guestNames.every(
        (g) =>
          g.firstName.trim().length > 0 &&
          g.firstName.trim().length <= MAX_NAME_LENGTH &&
          g.lastName.trim().length > 0 &&
          g.lastName.trim().length <= MAX_NAME_LENGTH &&
          g.gender
      ) && !hasDuplicateGuests;

  const canSubmit = useMemo(() => {
    if (!firstName.trim() || !lastName.trim() || !attendance) return false;
    if (attending) return partySize >= 1 && hasGuestNames;
    return true;
  }, [attendance, attending, firstName, hasGuestNames, lastName, partySize]);

  function selectAttendance(next: Attendance) {
    setAttendance(next);
    if (next === "yes") {
      setGuestNames((current) => {
        if (current.some((g) => g.firstName || g.lastName || g.gender)) return current;
        return [{ ...current[0], firstName: firstName.trim(), lastName: lastName.trim() }];
      });
    }
  }

  function addGuest() {
    if (guestNames.length >= MAX_GUESTS) return;
    const id = `guest-${nextGuestId.current++}`;
    setGuestNames((current) => [...current, { id, firstName: "", lastName: "", gender: "" }]);
  }

  function removeGuest(id: string) {
    setGuestNames((current) =>
      current.length === 1 ? current : current.filter((g) => g.id !== id)
    );
  }

  function updateGuest(id: string, field: keyof Omit<GuestName, "id">, value: string) {
    setGuestNames((current) =>
      current.map((g) => (g.id === id ? { ...g, [field]: value as GuestName[typeof field] } : g))
    );
  }

  async function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setSubmitError("");
    setIsSubmitting(true);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      is_attending: attending,
      party_size: attending ? partySize : 0,
      male_guests: attending ? maleGuests : 0,
      female_guests: attending ? femaleGuests : 0,
      guest_names: attending
        ? guestNames.map((g) => `${g.firstName.trim()} ${g.lastName.trim()} (${g.gender === "male" ? "Male" : "Female"})`)
        : []
    };

    if (!isSupabaseConfigured || !supabase) {
      setIsSubmitting(false);
      setSubmitError(t.errorConfig);
      return;
    }

    const { error } = await supabase.from("rsvps").insert(payload);
    setIsSubmitting(false);

    if (error) {
      if (error.code === "23505") { setSubmitError(t.errorDuplicate); return; }
      if (error.code === "42501") { setSubmitError(t.errorPermission); return; }
      setSubmitError(t.errorGeneral);
      return;
    }

    setIsComplete(true);
  }

  return (
    <motion.div
      className="overflow-hidden rounded-[2rem] border border-white/65 bg-white/35 shadow-glass backdrop-blur-2xl"
      layout
    >
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="thanks"
            className="px-6 py-16 text-center sm:px-12"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.45 }}
          >
            <div className="mx-auto mb-7 grid h-16 w-16 place-items-center rounded-full bg-wine text-white shadow-xl">
              <Check className="h-8 w-8" />
            </div>
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-olive">{t.receivedLabel}</p>
            <h2 className="font-display text-4xl text-ink sm:text-5xl">{t.thanksTitle}</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-ink/65">{t.thanksMessage}</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={submitRsvp}
            className="px-5 py-8 sm:px-10 sm:py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.28em] text-olive">{t.rsvpLabel}</p>
              <h2 className="font-display text-4xl text-ink sm:text-5xl">{t.rsvpTitle}</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ink/58">{t.rsvpSubtitle}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-wine/70">{t.rsvpDeadline}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label={t.firstName} value={firstName} onChange={setFirstName} autoComplete="given-name" />
              <TextField label={t.lastName} value={lastName} onChange={setLastName} autoComplete="family-name" />
            </div>

            <fieldset className="mt-7">
              <legend className="mb-3 text-sm font-medium text-ink/75">{t.attendingQuestion}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <RadioCard label={t.yes} selected={attendance === "yes"} onClick={() => selectAttendance("yes")} />
                <RadioCard label={t.no} selected={attendance === "no"} onClick={() => selectAttendance("no")} />
              </div>
            </fieldset>

            <AnimatePresence>
              {attending ? (
                <motion.div
                  className="mt-7 space-y-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <SummaryPill label={t.party} value={partySize} />
                    <SummaryPill label={t.male} value={maleGuests} />
                    <SummaryPill label={t.female} value={femaleGuests} />
                  </div>

                  <div>
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display text-2xl text-ink">{t.guestsTitle}</h3>
                        <p className="mt-1 text-sm text-ink/55">{t.guestsSubtitle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={addGuest}
                        disabled={guestNames.length >= MAX_GUESTS}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-wine/20 bg-white/55 px-4 text-sm font-semibold text-wine shadow-sm transition hover:-translate-y-0.5 hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                      >
                        <Plus className="h-4 w-4" />
                        {t.add}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {guestNames.map((guest, index) => (
                        <motion.div
                          key={guest.id}
                          className="grid gap-4 rounded-[1.25rem] border border-white/60 bg-white/35 p-4 sm:grid-cols-[auto_1fr_1fr_auto]"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-wine/10 text-sm font-semibold text-wine">
                            {index + 1}
                          </div>
                          <TextField
                            label={t.firstName}
                            value={guest.firstName}
                            onChange={(v) => updateGuest(guest.id, "firstName", v)}
                            autoComplete="given-name"
                          />
                          <TextField
                            label={t.lastName}
                            value={guest.lastName}
                            onChange={(v) => updateGuest(guest.id, "lastName", v)}
                            autoComplete="family-name"
                          />
                          <div className="grid gap-3 sm:col-span-4 sm:grid-cols-[1fr_auto] lg:col-span-1 lg:block">
                            <GenderField
                              value={guest.gender}
                              onChange={(v) => updateGuest(guest.id, "gender", v)}
                              maleLabel={t.male}
                              femaleLabel={t.female}
                              genderLabel={t.gender}
                            />
                            <button
                              type="button"
                              onClick={() => removeGuest(guest.id)}
                              disabled={guestNames.length === 1}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-wine/15 bg-white/45 px-4 text-sm font-medium text-wine transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-35 sm:self-end lg:mt-7 lg:w-11 lg:px-0"
                              aria-label={`${t.remove} ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="lg:hidden">{t.remove}</span>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <AnimatePresence>
                      {hasDuplicateGuests ? (
                        <motion.p
                          className="mt-4 rounded-2xl border border-wine/15 bg-white/55 px-4 py-3 text-sm text-wine"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.45 }}
                        >
                          {t.duplicateGuest}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {submitError ? (
                <motion.p
                  className="mt-6 rounded-2xl border border-wine/15 bg-white/55 px-4 py-3 text-sm text-wine"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {submitError}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="mt-8 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-wine px-6 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_50px_rgba(111,48,50,0.28)] transition hover:-translate-y-0.5 hover:bg-[#5f292b] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.sending}
                </>
              ) : (
                t.submit
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TextField({
  label, value, onChange, autoComplete
}: {
  label: string; value: string; onChange: (value: string) => void; autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink/72">{label}</span>
      <input
        className="premium-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        autoComplete={autoComplete}
        maxLength={MAX_NAME_LENGTH}
      />
    </label>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.15rem] border border-white/60 bg-white/42 px-5 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</p>
      <p className="mt-1 font-display text-3xl text-wine">{value}</p>
    </div>
  );
}

function GenderField({
  value, onChange, maleLabel, femaleLabel, genderLabel
}: {
  value: Gender;
  onChange: (value: Gender) => void;
  maleLabel: string;
  femaleLabel: string;
  genderLabel: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-ink/72">{genderLabel}</legend>
      <div className="grid grid-cols-2 gap-2 lg:w-44">
        <GenderButton label={maleLabel} value="male" selected={value === "male"} onClick={onChange} />
        <GenderButton label={femaleLabel} value="female" selected={value === "female"} onClick={onChange} />
      </div>
    </fieldset>
  );
}

function GenderButton({
  label, value, selected, onClick
}: {
  label: string; value: Exclude<Gender, "">; selected: boolean; onClick: (value: Exclude<Gender, "">) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`h-11 rounded-full border px-3 text-sm font-medium transition ${
        selected
          ? "border-wine bg-wine text-white shadow-[0_10px_28px_rgba(111,48,50,0.2)]"
          : "border-white/65 bg-white/42 text-ink/65 hover:bg-white/70"
      }`}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

function RadioCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-[1.15rem] border px-5 py-4 transition ${
        selected
          ? "border-wine/45 bg-wine/10 text-wine shadow-[0_14px_35px_rgba(111,48,50,0.12)]"
          : "border-white/65 bg-white/38 text-ink/70 hover:bg-white/62"
      }`}
      aria-pressed={selected}
    >
      <span className="font-medium">{label}</span>
      <span className={`grid h-6 w-6 place-items-center rounded-full border ${selected ? "border-wine bg-wine text-white" : "border-ink/18"}`}>
        {selected ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}

function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
