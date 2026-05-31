import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";

export const metadata: Metadata = {
  title: "You're Invited",
  openGraph: {
    title: "You're Invited",
    description: "The wedding of Osama & Nour — You're invited. Please RSVP by June 20.",
    images: [{ url: "/women-english.png", width: 1200, height: 630 }],
  },
};

export default function WomenPage() {
  return (
    <RsvpExperience
      images={{ en: "/women-english.png", ar: "/women-arabic.png" }}
    />
  );
}
