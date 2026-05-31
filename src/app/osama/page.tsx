import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";

export const metadata: Metadata = {
  title: "You're Invited",
  openGraph: {
    title: "You're Invited",
    images: [{ url: "/osama.jpeg", width: 1200, height: 630 }],
  },
};

export default function OsamaPage() {
  return <RsvpExperience images={{ en: "/osama.jpeg" }} />;
}
