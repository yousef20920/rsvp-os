import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";
import { invitationMetadata, invitations } from "@/lib/invitations";

export const metadata: Metadata = invitationMetadata(invitations.osama);

export default function OsamaPage() {
  return <RsvpExperience images={invitations.osama.images} />;
}
