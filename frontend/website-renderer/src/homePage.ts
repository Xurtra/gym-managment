import { FeatureFlag } from "@gym-platform/constants";
import { button, card, emptyState } from "@gym-platform/ui";
import type { ButtonModel, CardModel, EmptyStateModel } from "@gym-platform/ui";

export interface WebsiteBuilderFeatureCardInput {
  title: string;
  description: string;
  href?: string;
}

export interface WebsiteBuilderTheme {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
}

export interface PublicWebsiteHomePage {
  screen: "public_website_home";
  websiteBuilderEnabled: boolean;
  gymName: string;
  heroTitle: string;
  heroBody: string;
  summaryLabel: string;
  theme: WebsiteBuilderTheme;
  featureCards: CardModel[];
  primaryAction: ButtonModel;
  secondaryAction: ButtonModel;
  empty?: EmptyStateModel;
  blockedReason?: string;
}

export function buildPublicWebsiteHomePage(inputModel: {
  gymName: string;
  featureFlags?: string[];
  heroTitle?: string;
  heroBody?: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  featureCards?: WebsiteBuilderFeatureCardInput[];
}): PublicWebsiteHomePage {
  const websiteBuilderEnabled = (inputModel.featureFlags ?? []).includes(FeatureFlag.WebsiteBuilder);
  const blockedReason = websiteBuilderEnabled
    ? undefined
    : "Website builder is disabled for this gym.";
  const featureCards = buildFeatureCards(inputModel);
  const _primaryActionHref = inputModel.primaryActionHref?.trim() || "/join";
  const _secondaryActionHref = inputModel.secondaryActionHref?.trim() || "/schedule";

  return {
    screen: "public_website_home",
    websiteBuilderEnabled,
    gymName: inputModel.gymName.trim(),
    heroTitle: inputModel.heroTitle?.trim() || `Welcome to ${inputModel.gymName.trim()}`,
    heroBody:
      inputModel.heroBody?.trim() ||
      "Build a clear public homepage around your gym's classes, memberships, and contact paths.",
    summaryLabel: buildSummaryLabel({
      blockedReason,
      featureCardCount: featureCards.length,
      gymName: inputModel.gymName.trim()
    }),
    theme: {
      primaryColor: inputModel.primaryColor?.trim() || "#0f172a",
      accentColor: inputModel.accentColor?.trim() || "#f97316",
      ...(inputModel.logoUrl?.trim() ? { logoUrl: inputModel.logoUrl.trim() } : {})
    },
    featureCards,
    primaryAction: button({
      label: inputModel.primaryActionLabel?.trim() || "Start membership signup",
      icon: "arrow-right",
      disabled: !websiteBuilderEnabled
    }),
    secondaryAction: button({
      label: inputModel.secondaryActionLabel?.trim() || "View class schedule",
      icon: "calendar",
      intent: "secondary",
      disabled: !websiteBuilderEnabled
    }),
    ...(!websiteBuilderEnabled && blockedReason
      ? {
          empty: emptyState({
            title: "Website builder unavailable",
            body: "Enable the website builder feature flag to publish and customize your public homepage."
          }),
          blockedReason
        }
      : {})
  };
}

function buildFeatureCards(inputModel: {
  featureFlags?: string[];
  featureCards?: WebsiteBuilderFeatureCardInput[];
}) {
  const cards = (inputModel.featureCards?.length
    ? inputModel.featureCards
    : defaultFeatureCards(inputModel.featureFlags ?? [])
  ).map<CardModel>((featureCard) =>
    card({
      title: featureCard.title.trim(),
      body: featureCard.description.trim(),
      actions: [
        button({
          label: featureCard.href?.trim() ? "Open section" : "Coming soon",
          intent: featureCard.href?.trim() ? "secondary" : "secondary",
          disabled: !featureCard.href?.trim()
        })
      ]
    })
  );

  return cards;
}

function defaultFeatureCards(featureFlags: string[]) {
  const cards: WebsiteBuilderFeatureCardInput[] = [];

  if (featureFlags.includes(FeatureFlag.OnlineSignup)) {
    cards.push({
      title: "Online signup",
      description: "Let prospects compare plans and complete signup without calling the front desk.",
      href: "/join"
    });
  }

  if (featureFlags.includes(FeatureFlag.ClassBooking)) {
    cards.push({
      title: "Class schedule",
      description: "Highlight upcoming sessions and make the weekly class calendar easy to find.",
      href: "/schedule"
    });
  }

  if (featureFlags.includes(FeatureFlag.MemberPortal)) {
    cards.push({
      title: "Member portal",
      description: "Point current members to account, booking, and membership self-service flows."
    });
  }

  if (cards.length === 0) {
    cards.push(
      {
        title: "Membership plans",
        description: "Publish pricing, plan summaries, and the main path into your join flow.",
        href: "/plans"
      },
      {
        title: "Visit the gym",
        description: "Use the homepage to direct traffic to your location, schedule, and contact details."
      }
    );
  }

  return cards;
}

function buildSummaryLabel(inputModel: {
  blockedReason: string | undefined;
  featureCardCount: number;
  gymName: string;
}) {
  if (inputModel.blockedReason) {
    return "Website builder unavailable";
  }

  return `${inputModel.gymName} homepage with ${inputModel.featureCardCount} feature sections`;
}
