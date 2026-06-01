import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";

export const metadata: Metadata = {
  title: "You're Invited",
  openGraph: {
    title: "You're Invited",
    description: "The wedding of Osama & Nour — You're invited. Please RSVP by June 20.",
    url: "https://osama-nour.com/men",
    type: "website",
    images: [{ url: "/men-english.jpeg" }],
  },
};

export default function MenPage() {
  return (
    <RsvpExperience
      images={{ en: "/men-english.png", ar: "/men-arabic.jpeg" }}
    />
  );
}
