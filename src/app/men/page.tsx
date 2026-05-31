import type { Metadata } from "next";
import { RsvpExperience } from "@/components/rsvp-experience";

export const metadata: Metadata = {
  title: "You're Invited",
  openGraph: {
    title: "You're Invited",
    images: [{ url: "/invitation.jpg", width: 1200, height: 630 }],
  },
};

export default function MenPage() {
  // Replace /men-english.png (and optionally /men-arabic.png) once the image is ready
  return <RsvpExperience images={{ en: "/invitation.jpg" }} />;
}
