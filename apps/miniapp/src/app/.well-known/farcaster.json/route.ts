export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL as string;
  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE,
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      imageUrl: process.env.NEXT_PUBLIC_APP_IMAGE,
      buttonTitle: process.env.NEXT_PUBLIC_APP_BUTTON_TITLE,
      screenshotUrls: process.env.NEXT_PUBLIC_APP_SCREENSHOTS
        ? process.env.NEXT_PUBLIC_APP_SCREENSHOTS.split(",")
        : [],
      iconUrl: process.env.NEXT_PUBLIC_APP_ICON,
      splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY,
      tags: process.env.NEXT_PUBLIC_APP_TAGS
        ? process.env.NEXT_PUBLIC_APP_TAGS.split(",")
        : [],
      heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE,
      ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE,
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION,
      ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE,
      castShareUrl: `${URL}/api/share`,
      noindex: false,
    },
    baseBuilder: {
      allowedAddresses: [process.env.NEXT_PUBLIC_APP_ALLOWED_ADDRESSES],
    },
  });
}
