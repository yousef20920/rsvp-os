import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";
import { invitationMetadata, invitations } from "@/lib/invitations";

export const metadata: Metadata = invitationMetadata(invitations.men);

export default function MenPage() {
  return <RsvpExperience images={invitations.men.images} />;
}
