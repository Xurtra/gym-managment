import Stripe from "stripe";
import { badRequest } from "../../http/errors.js";
import type { ApiConfig } from "../../config/env.js";
import { PosService } from "./pos.service.js";
import type { PosPurchaseInput } from "@gym-platform/validation";
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

  async createPaymentIntent(gymId: string, input: PosPurchaseInput) {
    const stripe = this.requireStripe();
    const stripeAccount = await this.requireStripeAccountId(gymId);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      ...(input.receiptEmail ? { receipt_email: input.receiptEmail } : {}),
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
        consumerIdResolved: purchase.consumer.id
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
