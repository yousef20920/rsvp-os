import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";

export const metadata: Metadata = {
  title: "You're Invited",
  openGraph: {
    title: "You're Invited",
    description: "The wedding of Osama & Nour — You're invited. Please RSVP by June 20.",
    url: "https://osama-nour.com/osama",
    type: "website",
    images: [{ url: "/osama.jpeg" }],
  },
};

export default function OsamaPage() {
  return <RsvpExperience images={{ en: "/osama.jpeg" }} />;
}
