import Stripe from "stripe";
import { badRequest } from "../../http/errors.js";
import type { ApiConfig } from "../../config/env.js";
import { PosService } from "./pos.service.js";
import type { PosPurchaseInput, StripeConnectOnboardingLinkInput } from "@gym-platform/validation";
import type { Services } from "../../app.js";

type StripePurchaseMetadata = {
  gymId: string;
  consumerId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  planId?: string;
  note?: string;
  receiptEmail?: string;
  paymentMethod: string;
  purchaseProcessed?: string;
  consumerIdResolved?: string;
};

type StripeConnectAccountView = {
  accountId?: string;
  country?: string;
  defaultCurrency?: string;
  businessName?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
  requirementsDue: string[];
  dashboardUrl?: string;
};

type StripeConnectSessionView = {
  clientSecret: string;
  stripeAccountId: string;
  expiresAt: number;
  components: {
    accountOnboarding: boolean;
    notificationBanner: boolean;
    accountManagement: boolean;
    balances: boolean;
    payouts: boolean;
    payments: boolean;
  };
};

export class PosStripeService {
  private readonly stripe?: Stripe;

  constructor(
    private readonly config: ApiConfig,
    private readonly services: Services
  ) {
    if (config.stripeSecretKey) {
      this.stripe = new Stripe(config.stripeSecretKey);
    }
  }

  async getConfig(gymId: string) {
    const gym = await this.services.tenancyService.getGym(gymId);
    return {
      enabled: Boolean(this.config.stripePublishableKey && this.config.stripeSecretKey && gym.stripeAccountId),
      ...(this.config.stripePublishableKey
        ? { publishableKey: this.config.stripePublishableKey }
        : {})
    };
  }


  async getConnectAccount(gymId: string): Promise<StripeConnectAccountView> {
    const gym = await this.services.tenancyService.getGym(gymId);
    if (!gym.stripeAccountId) {
      return {
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
        requirementsDue: []
      };
    }

    const stripe = this.requireStripeApi();
    const stripeAccountId = gym.stripeAccountId;
    const account = await this.withStripeErrors(() => stripe.accounts.retrieve(stripeAccountId));
    const requirementsDue = dedupeRequirements(account.requirements);
    const businessName = resolveBusinessName(account);

    return {
      accountId: account.id,
      ...(account.country ? { country: account.country } : {}),
      ...(account.default_currency ? { defaultCurrency: account.default_currency } : {}),
      ...(businessName ? { businessName } : {}),
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      onboardingComplete: Boolean(account.details_submitted) && requirementsDue.length === 0,
      requirementsDue,
      dashboardUrl: buildStripeDashboardUrl(account.id, this.config.stripeSecretKey)
    };
  }

  async createConnectOnboardingLink(gymId: string, input: StripeConnectOnboardingLinkInput) {
    const stripe = this.requireStripeApi();
    const gym = await this.services.tenancyService.getGym(gymId);
    const stripeAccountId = gym.stripeAccountId ?? await this.createConnectedAccount(gymId);
    const accountLink = await this.withStripeErrors(() => stripe.accountLinks.create({
      account: stripeAccountId,
      type: "account_onboarding",
      return_url: input.returnUrl,
      refresh_url: input.refreshUrl ?? input.returnUrl
    }));

    return {
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
      stripeAccountId
    };
  }

  async createConnectAccountSession(gymId: string): Promise<StripeConnectSessionView> {
    const stripe = this.requireStripe();
    const gym = await this.services.tenancyService.getGym(gymId);
    const stripeAccountId = gym.stripeAccountId ?? await this.createConnectedAccount(gymId);
    const session = await this.withStripeErrors(() => stripe.accountSessions.create({
      account: stripeAccountId,
      components: {
        account_onboarding: {
          enabled: true,
          features: {
            external_account_collection: true
          }
        },
        notification_banner: {
          enabled: true,
          features: {
            external_account_collection: true
          }
        },
        account_management: {
          enabled: true,
          features: {
            external_account_collection: true
          }
        },
        balances: {
          enabled: true
        },
        payouts: {
          enabled: true
        },
        payments: {
          enabled: true,
          features: {
            capture_payments: true,
            dispute_management: true,
            refund_management: true
          }
        }
      }
    }));

    if (!session.client_secret) {
      throw badRequest("Stripe did not return an account session client secret.", "stripe_account_session_missing");
    }

    return {
      clientSecret: session.client_secret,
      stripeAccountId,
      expiresAt: session.expires_at,
      components: {
        accountOnboarding: Boolean(session.components.account_onboarding?.enabled),
        notificationBanner: Boolean(session.components.notification_banner?.enabled),
        accountManagement: Boolean(session.components.account_management?.enabled),
        balances: Boolean(session.components.balances?.enabled),
        payouts: Boolean(session.components.payouts?.enabled),
        payments: Boolean(session.components.payments?.enabled)
      }
    };
  }

  async disconnectConnectAccount(gymId: string) {
    const gym = await this.services.tenancyService.getGym(gymId);
    if (!gym.stripeAccountId) {
      return { disconnected: false };
    }

    await this.services.tenancyService.updateGym(gymId, { stripeAccountId: undefined });
    return { disconnected: true };
  }

  async createTerminalConnectionToken(gymId: string) {
    const stripe = this.requireStripeApi();
    const stripeAccount = await this.requireStripeAccountId(gymId);
    const token = await this.withStripeErrors(() => stripe.terminal.connectionTokens.create({}, { stripeAccount }));

    if (!token.secret) {
      throw badRequest("Stripe did not return a Terminal connection token.", "stripe_terminal_connection_token_missing");
    }

    return {
      secret: token.secret
    };
  }

  async createPaymentIntent(gymId: string, input: PosPurchaseInput) {
    const stripe = this.requireStripe();
    const stripeAccount = await this.requireStripeAccountId(gymId);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      payment_method_types: input.paymentMethod === "card_reader" ? ["card_present"] : ["card"],
      ...(input.paymentMethod === "card_reader" ? {} : (input.receiptEmail ? { receipt_email: input.receiptEmail } : {})),
      metadata: buildPurchaseMetadata(gymId, input)
    }, {
      stripeAccount
    });

    if (!paymentIntent.client_secret) {
      throw badRequest("Stripe did not return a client secret.", "stripe_client_secret_missing");
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    };
  }

  async finalizePaymentIntent(gymId: string, paymentIntentId: string) {
    const stripe = this.requireStripe();
    const stripeAccount = await this.requireStripeAccountId(gymId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {}, {
      stripeAccount
    });
    if (paymentIntent.status !== "succeeded") {
      throw badRequest("Payment intent has not succeeded yet.", "stripe_payment_not_succeeded");
    }
    return this.processSuccessfulPaymentIntent(paymentIntent, stripeAccount);
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const stripe = this.requireStripe();
    if (!this.config.stripeWebhookSecret) {
      throw badRequest("Stripe webhook signing secret is not configured.", "stripe_webhook_not_configured");
    }
    if (!signature) {
      throw badRequest("Stripe signature header is required.", "stripe_signature_missing");
    }
    const event = stripe.webhooks.constructEvent(
      rawBody.toString("utf8"),
      signature,
      this.config.stripeWebhookSecret
    );
    if (event.type === "payment_intent.succeeded") {
      await this.processSuccessfulPaymentIntent(
        event.data.object as Stripe.PaymentIntent,
        event.account ?? undefined
      );
    }
    return { received: true };
  }

  private async processSuccessfulPaymentIntent(intent: Stripe.PaymentIntent, stripeAccount?: string) {
    const stripe = this.requireStripe();
    const metadata = intent.metadata as StripePurchaseMetadata;
    if (metadata.purchaseProcessed === "true") {
      if (metadata.consumerIdResolved) {
        return {
          consumer: await this.services.memberService.get(metadata.gymId, metadata.consumerIdResolved),
          alreadyProcessed: true
        };
      }
      return { alreadyProcessed: true };
    }

    const purchaseInput = metadataToPurchaseInput(intent);
    const purchase = await this.services.posService.collectPurchase(metadata.gymId, purchaseInput);
    const resolvedStripeAccount = stripeAccount ?? await this.requireStripeAccountId(metadata.gymId);

    await stripe.paymentIntents.update(intent.id, {
      metadata: {
        ...intent.metadata,
        purchaseProcessed: "true",
        ...("consumer" in purchase && purchase.consumer?.id ? { consumerIdResolved: purchase.consumer.id } : {})
      }
    }, {
      stripeAccount: resolvedStripeAccount
    });

    return purchase;
  }

  private requireStripe() {
    if (!this.stripe || !this.config.stripePublishableKey) {
      throw badRequest(
        "Stripe is not configured on this API instance.",
        "stripe_not_configured"
      );
    }
    return this.stripe;
  }

  private requireStripeApi() {
    if (!this.stripe) {
      throw badRequest(
        "Stripe is not configured on this API instance.",
        "stripe_not_configured"
      );
    }
    return this.stripe;
  }

  private async requireStripeAccountId(gymId: string) {
    const gym = await this.services.tenancyService.getGym(gymId);
    if (!gym.stripeAccountId) {
      throw badRequest(
        "Stripe Connect is not configured for this gym.",
        "stripe_connect_not_configured"
      );
    }
    return gym.stripeAccountId;
  }

  private async createConnectedAccount(gymId: string) {
    const stripe = this.requireStripeApi();
    const gym = await this.services.tenancyService.getGym(gymId);
    const businessInfo = gym.businessInfo;
    const country = normalizeCountryCode(businessInfo?.address?.country);
    const testPrefill = buildStripeTestAccountPrefill(gym, this.config.stripeSecretKey);
    const account = await this.withStripeErrors(() => stripe.accounts.create({
      type: "standard",
      country,
      ...(testPrefill.account ?? {}),
      ...(businessInfo?.email ? { email: businessInfo.email } : {}),
      ...(businessInfo?.website || testPrefill.businessProfile
        ? {
            business_profile: {
              ...(testPrefill.businessProfile ?? {}),
              ...(businessInfo?.website ? { url: businessInfo.website } : {})
            }
          }
        : {}),
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      metadata: {
        gymId: gym.id,
        gymSlug: gym.slug
      }
    }));

    if (testPrefill.person) {
      await this.withStripeErrors(() => stripe.accounts.createPerson(account.id, testPrefill.person));
    }

    await this.services.tenancyService.updateGym(gymId, { stripeAccountId: account.id });
    return account.id;
  }

  private async withStripeErrors<T>(operation: () => Promise<T>) {
    try {
      return await operation();
    } catch (error) {
      throw normalizeStripeError(error);
    }
  }
}

function buildPurchaseMetadata(gymId: string, input: PosPurchaseInput): Stripe.MetadataParam {
  return {
    gymId,
    paymentMethod: input.paymentMethod,
    purchaseProcessed: "false",
    ...(input.consumerId ? { consumerId: input.consumerId } : {}),
    ...(input.firstName ? { firstName: input.firstName } : {}),
    ...(input.lastName ? { lastName: input.lastName } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.planId ? { planId: input.planId } : {}),
    ...(input.note ? { note: input.note } : {}),
    ...(input.receiptEmail ? { receiptEmail: input.receiptEmail } : {})
  };
}

function metadataToPurchaseInput(intent: Stripe.PaymentIntent): PosPurchaseInput {
  const metadata = intent.metadata as StripePurchaseMetadata;
  return {
    ...(metadata.consumerId ? { consumerId: metadata.consumerId } : {}),
    ...(metadata.firstName ? { firstName: metadata.firstName } : {}),
    ...(metadata.lastName ? { lastName: metadata.lastName } : {}),
    ...(metadata.email ? { email: metadata.email } : {}),
    ...(metadata.phone ? { phone: metadata.phone } : {}),
    ...(metadata.planId ? { planId: metadata.planId } : {}),
    amountCents: intent.amount,
    paymentMethod: metadata.paymentMethod === "card_reader" ? "card_reader" : "manual_entry",
    ...(metadata.note ? { note: metadata.note } : {}),
    ...(metadata.receiptEmail ? { receiptEmail: metadata.receiptEmail } : {})
  };
}

function dedupeRequirements(requirements: Stripe.Account.Requirements | null | undefined) {
  const values = [
    ...(requirements?.currently_due ?? []),
    ...(requirements?.past_due ?? []),
    ...(requirements?.eventually_due ?? [])
  ];
  return [...new Set(values)].sort();
}

function resolveBusinessName(account: Stripe.Account) {
  return account.business_profile?.name ?? account.settings?.dashboard?.display_name ?? undefined;
}

function normalizeCountryCode(country: string | undefined) {
  const normalized = country?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : "US";
}

function buildStripeTestAccountPrefill(
  gym: {
    name: string;
    slug: string;
    businessInfo?: {
      legalName?: string;
      phone?: string;
      email?: string;
      website?: string;
      taxId?: string;
      address?: {
        line1?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        country?: string;
      };
    };
  },
  secretKey: string | undefined
) {
  if (!secretKey?.includes("_test_")) {
    return {} as {
      account?: Stripe.AccountCreateParams;
      businessProfile?: Stripe.AccountCreateParams.BusinessProfile;
      person?: Stripe.AccountCreatePersonParams;
    };
  }

  const businessInfo = gym.businessInfo;
  const country = normalizeCountryCode(businessInfo?.address?.country);
  const phone = normalizeStripeTestPhone(businessInfo?.phone);
  const address = buildStripeTestAddress(businessInfo?.address, country);
  const businessName = businessInfo?.legalName?.trim() || `${gym.name} Test Gym LLC`;
  const representativeEmail = businessInfo?.email?.trim() || `owner+${gym.slug}@example.com`;

  return {
    account: {
      business_type: "company" as const,
      company: {
        name: businessName,
        phone,
        address,
        ...(country === "US" ? { tax_id: businessInfo?.taxId?.trim() || "000000000" } : {})
      }
    },
    businessProfile: {
      name: businessName,
      product_description: `Gym memberships, classes, and point-of-sale purchases for ${gym.name}`,
      support_phone: phone,
      url: businessInfo?.website?.trim() || "https://accessible.stripe.com"
    },
    person: {
      first_name: "Test",
      last_name: "Owner",
      email: representativeEmail,
      phone,
      address,
      dob: {
        day: 1,
        month: 1,
        year: 1901
      },
      relationship: {
        representative: true,
        executive: true,
        director: true,
        owner: true,
        title: "Owner",
        percent_ownership: 100
      },
      ...(country === "US" ? { id_number: "000000000" } : {})
    }
  };
}

function buildStripeTestAddress(
  address: {
    line1?: string;
    city?: string;
    region?: string;
    postalCode?: string;
  } | undefined,
  country: string
) {
  return {
    line1: address?.line1?.trim() || "address_full_match",
    city: address?.city?.trim() || "New York",
    state: address?.region?.trim() || "NY",
    postal_code: address?.postalCode?.trim() || "10001",
    country
  };
}

function normalizeStripeTestPhone(phone: string | undefined) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits.length >= 10 ? digits.slice(0, 10) : "0000000000";
}

function buildStripeDashboardUrl(accountId: string, secretKey: string | undefined) {
  const testPrefix = secretKey?.includes("_test_") ? "test/" : "";
  return `https://dashboard.stripe.com/${testPrefix}connect/accounts/${accountId}`;
}

function normalizeStripeError(error: unknown) {
  if (!isStripeLikeError(error)) {
    return error;
  }

  const loweredMessage = error.message.toLowerCase();
  if (loweredMessage.includes("no such account") || loweredMessage.includes("connected account")) {
    return badRequest(
      "Stripe rejected this connected account for the current platform keys. Save a connected account that belongs to this Stripe platform, or start onboarding from this gym.",
      "stripe_connect_account_invalid"
    );
  }

  return badRequest(error.message, error.code ?? error.type ?? "stripe_request_failed");
}

function isStripeLikeError(error: unknown): error is { message: string; code?: string; type?: string } {
  if (!error || typeof error !== "object") {
    return false;
  }
  return typeof Reflect.get(error, "message") === "string" && (
    typeof Reflect.get(error, "type") === "string" || typeof Reflect.get(error, "code") === "string"
  );
}
