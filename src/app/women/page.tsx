import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";
import { invitationMetadata, invitations } from "@/lib/invitations";

export const metadata: Metadata = invitationMetadata(invitations.women);

export default function WomenPage() {
  return <RsvpExperience images={invitations.women.images} />;
}
