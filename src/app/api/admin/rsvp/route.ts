import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, readJsonBody, UUID_PATTERN } from "@/lib/api-guards";

const ADMIN_EMAILS = [
  "yousef.hadi.cs@gmail.com",
  "dr.osama.abdelhadi@gmail.com",
  "alhayeknour@gmail.com",
];

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

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const { data } = await createClient(
    url,
    anonKey,
    {
      auth: {
        persistSession: false
      }
    }
  ).auth.getUser(token);

  const email = data.user?.email?.toLowerCase();
  return email && ADMIN_EMAILS.includes(email) ? email : null;
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

// DELETE /api/admin/rsvp?id=<uuid>  — delete entire RSVP
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return jsonError("Unauthorized", 401);

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
  const admin = await verifyAdmin(req);
  if (!admin) return jsonError("Unauthorized", 401);

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
