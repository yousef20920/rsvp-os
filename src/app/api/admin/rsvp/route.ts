import { timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, readJsonBody, UUID_PATTERN } from "@/lib/api-guards";

const MAX_GUESTS = 20;
const GUEST_NAME_PATTERN = /^.+ \((Male|Female)\)$/;

type AdminPatchBody = {
  guest_names?: unknown;
  party_size?: unknown;
  male_guests?: unknown;
  female_guests?: unknown;
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });
}

function verifyAdmin(req: NextRequest) {
  const expected = process.env.RSVP_ADMIN_PASSWORD;
  const provided = req.headers.get("x-rsvp-admin-password");

  if (!expected || !provided) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validateGuestUpdate(body: AdminPatchBody) {
  const {
    guest_names: guestNames,
    party_size: rawPartySize,
    male_guests: rawMaleGuests,
    female_guests: rawFemaleGuests
  } = body;

  if (
    !Array.isArray(guestNames) ||
    !guestNames.every((guest) => typeof guest === "string") ||
    !Number.isInteger(rawPartySize) ||
    !Number.isInteger(rawMaleGuests) ||
    !Number.isInteger(rawFemaleGuests)
  ) {
    return null;
  }

  const partySize = rawPartySize as number;
  const maleGuests = rawMaleGuests as number;
  const femaleGuests = rawFemaleGuests as number;
  const normalizedGuestNames = guestNames.map((guest) => normalizeName(guest));
  const uniqueGuestNames = new Set(normalizedGuestNames.map((guest) => guest.toLowerCase()));

  if (
    partySize < 1 ||
    partySize > MAX_GUESTS ||
    maleGuests < 0 ||
    maleGuests > MAX_GUESTS ||
    femaleGuests < 0 ||
    femaleGuests > MAX_GUESTS ||
    normalizedGuestNames.length !== partySize ||
    maleGuests + femaleGuests !== partySize ||
    uniqueGuestNames.size !== normalizedGuestNames.length ||
    !normalizedGuestNames.every((guest) => guest.length >= 5 && guest.length <= 160 && GUEST_NAME_PATTERN.test(guest))
  ) {
    return null;
  }

  return {
    guest_names: normalizedGuestNames,
    party_size: partySize,
    male_guests: maleGuests,
    female_guests: femaleGuests
  };
}

// GET /api/admin/rsvp — list RSVP responses
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return jsonError("Unauthorized", 401);

  try {
    const { data, error } = await serviceClient()
      .from("rsvps")
      .select("id, created_at, first_name, last_name, is_attending, party_size, male_guests, female_guests, guest_names")
      .order("created_at", { ascending: false });

    if (error) return jsonError("server", 500);

    return NextResponse.json({ rsvps: data ?? [] });
  } catch {
    return jsonError("server", 500);
  }
}

// DELETE /api/admin/rsvp?id=<uuid>  — delete entire RSVP
export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) return jsonError("Unauthorized", 401);

  const id = req.nextUrl.searchParams.get("id");
  if (!id || !UUID_PATTERN.test(id)) return jsonError("Missing or invalid id", 400);

  try {
    const { error } = await serviceClient().from("rsvps").delete().eq("id", id);
    if (error) return jsonError("server", 500);
  } catch {
    return jsonError("server", 500);
  }

  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/rsvp?id=<uuid>  — update guest list
export async function PATCH(req: NextRequest) {
  if (!verifyAdmin(req)) return jsonError("Unauthorized", 401);

  const id = req.nextUrl.searchParams.get("id");
  if (!id || !UUID_PATTERN.test(id)) return jsonError("Missing or invalid id", 400);

  const body = await readJsonBody<AdminPatchBody>(req);
  if (!body.ok) {
    return jsonError(body.error, body.status);
  }

  const update = validateGuestUpdate(body.data);
  if (!update) {
    return jsonError("invalid", 400);
  }

  try {
    const { error } = await serviceClient().from("rsvps").update(update).eq("id", id);
    if (error) return jsonError("server", 500);
  } catch {
    return jsonError("server", 500);
  }

  return NextResponse.json({ ok: true });
}
