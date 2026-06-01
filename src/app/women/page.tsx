import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";

export const metadata: Metadata = {
  title: "You're Invited",
  openGraph: {
    title: "You're Invited",
    description: "The wedding of Osama & Nour — You're invited. Please RSVP by June 20.",
    url: "https://osama-nour.com/women",
    type: "website",
    images: [{ url: "/women-english.jpeg" }],
  },
};

export default function WomenPage() {
  return (
    <RsvpExperience
      images={{ en: "/women-english.jpeg", ar: "/women-arabic.png" }}
    />
  );
}
