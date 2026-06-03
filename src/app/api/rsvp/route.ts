import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, readJsonBody } from "@/lib/api-guards";

const MAX_NAME_LENGTH = 80;
const MAX_GUESTS = 20;
const GUEST_NAME_PATTERN = /^.+ \((Male|Female)\)$/;

type RsvpPayload = {
  first_name?: unknown;
  last_name?: unknown;
  is_attending?: unknown;
  party_size?: unknown;
  male_guests?: unknown;
  female_guests?: unknown;
  guest_names?: unknown;
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

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hashBucket(value: string) {
  return createHash("sha256")
    .update(`${process.env.RSVP_RATE_LIMIT_SALT ?? "rsvp-os"}:${value}`)
    .digest("hex");
}

function validatePayload(body: RsvpPayload) {
  const firstName = typeof body.first_name === "string" ? normalizeName(body.first_name) : "";
  const lastName = typeof body.last_name === "string" ? normalizeName(body.last_name) : "";
  const isAttending = body.is_attending;
  const rawPartySize = body.party_size;
  const rawMaleGuests = body.male_guests;
  const rawFemaleGuests = body.female_guests;
  const guestNames = body.guest_names;

  if (
    !firstName ||
    !lastName ||
    firstName.length > MAX_NAME_LENGTH ||
    lastName.length > MAX_NAME_LENGTH ||
    typeof isAttending !== "boolean" ||
    !Number.isInteger(rawPartySize) ||
    !Number.isInteger(rawMaleGuests) ||
    !Number.isInteger(rawFemaleGuests) ||
    !Array.isArray(guestNames) ||
    !guestNames.every((guest) => typeof guest === "string")
  ) {
    return null;
  }

  const partySize = rawPartySize as number;
  const maleGuests = rawMaleGuests as number;
  const femaleGuests = rawFemaleGuests as number;
  const normalizedGuestNames = guestNames.map((guest) => normalizeName(guest));
  const uniqueGuestNames = new Set(normalizedGuestNames.map((guest) => guest.toLowerCase()));

  if (
    partySize < 0 ||
    partySize > MAX_GUESTS ||
    maleGuests < 0 ||
    maleGuests > MAX_GUESTS ||
    femaleGuests < 0 ||
    femaleGuests > MAX_GUESTS ||
    uniqueGuestNames.size !== normalizedGuestNames.length
  ) {
    return null;
  }

  if (!isAttending) {
    if (partySize !== 0 || maleGuests !== 0 || femaleGuests !== 0 || normalizedGuestNames.length !== 0) {
      return null;
    }
  } else if (
    partySize < 1 ||
    maleGuests + femaleGuests !== partySize ||
    normalizedGuestNames.length !== partySize ||
    !normalizedGuestNames.every(
      (guest) => guest.length >= 5 && guest.length <= 160 && GUEST_NAME_PATTERN.test(guest)
    )
  ) {
    return null;
  }

  return {
    first_name: firstName,
    last_name: lastName,
    is_attending: isAttending,
    party_size: isAttending ? partySize : 0,
    male_guests: isAttending ? maleGuests : 0,
    female_guests: isAttending ? femaleGuests : 0,
    guest_names: isAttending ? normalizedGuestNames : []
  };
}

async function isRateLimited(req: NextRequest) {
  const client = serviceClient();
  const ipHash = hashBucket(getClientIp(req));
  const checks = [
    { bucket: `rsvp:ip:${ipHash}:minute`, windowSeconds: 60, maxRequests: 8, blockSeconds: 10 * 60 },
    { bucket: `rsvp:ip:${ipHash}:hour`, windowSeconds: 60 * 60, maxRequests: 40, blockSeconds: 60 * 60 }
  ];

  for (const check of checks) {
    const { data, error } = await client.rpc("consume_rsvp_rate_limit", {
      p_bucket: check.bucket,
      p_window_seconds: check.windowSeconds,
      p_max_requests: check.maxRequests,
      p_block_seconds: check.blockSeconds
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data !== true) {
      return true;
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  const body = await readJsonBody<RsvpPayload>(req);
  if (!body.ok) {
    return jsonError(body.error, body.status);
  }

  const payload = validatePayload(body.data);
  if (!payload) {
    return jsonError("invalid", 400);
  }

  try {
    if (await isRateLimited(req)) {
      return jsonError("rate_limited", 429);
    }

    const { error } = await serviceClient().from("rsvps").insert(payload);

    if (error) {
      if (error.code === "23505") {
        return jsonError("duplicate", 409);
      }

      if (error.code === "42501" || error.code === "23514") {
        return jsonError("invalid", 400);
      }

      return jsonError("server", 500);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("server", 500);
  }
}
