import type { Metadata } from "next";

export type InvitationImages = {
  en: string;
  ar?: string;
};

type InvitationConfig = {
  path: `/${string}`;
  images: InvitationImages;
};

export const siteUrl = "https://osama-nour.com";

const previewDescription =
  "The wedding of Osama & Nour - You're invited. Please RSVP by June 20.";

const previewImageVersion = "2026-06-02";

export const invitations = {
  men: {
    path: "/men",
    images: {
      en: "/men-english.png",
      ar: "/men-arabic.jpeg"
    }
  },
  women: {
    path: "/women",
    images: {
      en: "/women-english.jpeg",
      ar: "/women-arabic.png"
    }
  },
  osama: {
    path: "/osama",
    images: {
      en: "/osama.jpeg"
    }
  }
} satisfies Record<string, InvitationConfig>;

export function previewImageUrl(imagePath: string) {
  return `${imagePath}?v=${previewImageVersion}`;
}

export function invitationMetadata(invitation: InvitationConfig): Metadata {
  const previewImage = previewImageUrl(invitation.images.en);

  return {
    title: "You're Invited",
    description: previewDescription,
    openGraph: {
      title: "You're Invited",
      description: previewDescription,
      url: invitation.path,
      siteName: "Osama & Nour Wedding",
      type: "website",
      images: [
        {
          url: previewImage,
          width: 1200,
          height: 1680,
          alt: "Osama and Nour wedding invitation"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: "You're Invited",
      description: previewDescription,
      images: [previewImage]
    }
  };
}
