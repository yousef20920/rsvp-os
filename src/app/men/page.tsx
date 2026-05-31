import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";

export const metadata: Metadata = {
  title: "You're Invited",
  openGraph: {
    title: "You're Invited",
    description: "The wedding of Osama & Nour — You're invited.",
    images: [{ url: "/men-english.jpeg", width: 1200, height: 630 }],
  },
};

export default function MenPage() {
  return (
    <RsvpExperience
      images={{ en: "/men-english.jpeg", ar: "/men-arabic.jpeg" }}
    />
  );
}
