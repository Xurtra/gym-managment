import { FeatureFlag } from "@gym-platform/constants";
import type {
  StripePaymentCollectInput,
  StripePaymentRefundInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import type { ApiConfig } from "../../config/env.js";
import { badRequest, conflict, notFound } from "../../http/errors.js";
import type {
  StripePaymentAccount,
  StripePaymentTransaction
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class PaymentService {
  private readonly stripe?: Stripe;

  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock,
    private readonly config: ApiConfig
  ) {
    if (!config.stripeMockMode && config.stripeSecretKey) {
      this.stripe = new Stripe(config.stripeSecretKey);
    }
  }

  async getStripeAccount(gymId: string) {
    return this.repositories.payments.getStripeAccountForGym(gymId);
  }

  async connectStripeAccount(gymId: string) {
    const gym = await this.repositories.gyms.getGym(gymId);
    if (!gym) {
      throw notFound("Gym was not found.");
    }
    const existing = await this.repositories.payments.getStripeAccountForGym(gymId);
    if (this.config.stripeMockMode) {
      return this.connectMockStripeAccount(gymId, gym.slug, existing);
    }
    const stripe = this.requireStripe();
    const stripeAccount = existing
      ? await stripe.accounts.retrieve(existing.stripeAccountId)
      : await stripe.accounts.create({
          type: "express",
          country: "US",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          },
          metadata: { gymId, gymSlug: gym.slug }
        });
    const account = await this.repositories.payments.upsertStripeAccount(
      this.mapStripeAccount(gymId, stripeAccount, existing)
    );
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url: this.config.stripeOnboardingRefreshUrl,
      return_url: this.config.stripeOnboardingReturnUrl,
      type: "account_onboarding"
    });
    return { account, onboardingUrl: accountLink.url };
  }

  async listPayments(gymId: string) {
    return this.repositories.payments.listPaymentTransactionsForGym(gymId);
  }

  async collectPayment(gymId: string, input: StripePaymentCollectInput) {
    const gym = await this.repositories.gyms.getGym(gymId);
    if (!gym) {
      throw notFound("Gym was not found.");
    }
    if (!gym.featureFlags.includes(FeatureFlag.PointOfSale)) {
      throw conflict("Point of sale is not enabled for this gym.", "point_of_sale_disabled");
    }
    const account = await this.repositories.payments.getStripeAccountForGym(gymId);
    if (!account) {
      throw conflict("Connect Stripe before collecting payments.", "stripe_not_connected");
    }
    if (!account.chargesEnabled) {
      throw conflict("Stripe charges are not enabled yet.", "stripe_charges_disabled");
    }
    if (input.memberId) {
      const member = await this.repositories.members.getMember(input.memberId);
      if (!member || member.gymId !== gymId) {
        throw notFound("Member was not found.");
      }
    }
    const now = this.clock.now();
    const transaction: StripePaymentTransaction = {
      id: randomUUID(),
      gymId,
      stripeAccountId: account.stripeAccountId,
      amountCents: input.amountCents,
      currency: input.currency,
      applicationFeeCents: 0,
      paymentMethod: input.paymentMethod,
      status: "succeeded",
      refundedAmountCents: 0,
      createdAt: now,
      updatedAt: now
    };
    if (input.memberId) {
      transaction.memberId = input.memberId;
    }
    if (this.config.stripeMockMode) {
      transaction.stripePaymentIntentId = `pi_mock_${randomUUID().replaceAll("-", "")}`;
    } else {
      const paymentIntent = await this.createStripePaymentIntent(gymId, account, input);
      transaction.stripePaymentIntentId = paymentIntent.id;
      transaction.status = this.mapPaymentIntentStatus(paymentIntent.status);
      if (paymentIntent.client_secret) {
        transaction.stripeClientSecret = paymentIntent.client_secret;
      }
    }
    if (input.note) {
      transaction.note = input.note;
    }
    if (input.receiptEmail) {
      transaction.receiptEmail = input.receiptEmail;
    }
    return this.repositories.payments.createPaymentTransaction(transaction);
  }

  async refundPayment(gymId: string, paymentId: string, input: StripePaymentRefundInput) {
    const payment = await this.repositories.payments.getPaymentTransaction(paymentId);
    if (!payment || payment.gymId !== gymId) {
      throw notFound("Payment was not found.");
    }
    if (payment.status === "failed") {
      throw conflict("Failed payments cannot be refunded.", "payment_failed");
    }
    const refundable = payment.amountCents - payment.refundedAmountCents;
    if (refundable <= 0) {
      throw conflict("Payment has no refundable balance.", "payment_not_refundable");
    }
    const amountCents = input.amountCents ?? refundable;
    if (amountCents > refundable) {
      throw badRequest("Refund amount exceeds the refundable balance.", "refund_amount_exceeded");
    }
    if (!this.config.stripeMockMode) {
      const stripe = this.requireStripe();
      if (!payment.stripePaymentIntentId) {
        throw conflict("Payment is missing a Stripe PaymentIntent ID.", "stripe_payment_intent_missing");
      }
      await stripe.refunds.create(
        {
          payment_intent: payment.stripePaymentIntentId,
          amount: amountCents,
          metadata: {
            gymId,
            localPaymentId: payment.id,
            ...(input.reason ? { reason: input.reason } : {})
          }
        },
        payment.stripeAccountId ? { stripeAccount: payment.stripeAccountId } : undefined
      );
    }
    const updated: StripePaymentTransaction = {
      ...payment,
      refundedAmountCents: payment.refundedAmountCents + amountCents,
      status:
        payment.refundedAmountCents + amountCents >= payment.amountCents
          ? "refunded"
          : payment.status,
      updatedAt: this.clock.now()
    };
    if (input.reason) {
      updated.note = `${payment.note ? `${payment.note} | ` : ""}Refund: ${input.reason}`;
    }
    return this.repositories.payments.updatePaymentTransaction(updated);
  }

  async handleStripeWebhook(rawBody: string, signature: string | undefined) {
    if (this.config.stripeMockMode) {
      return { received: true, mode: "mock" };
    }
    const stripe = this.requireStripe();
    if (!this.config.stripeWebhookSecret) {
      throw conflict(
        "STRIPE_WEBHOOK_SECRET is required for live Stripe webhooks.",
        "stripe_webhook_secret_missing"
      );
    }
    if (!signature) {
      throw badRequest("Stripe-Signature header is required.", "stripe_signature_missing");
    }
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, this.config.stripeWebhookSecret);
    } catch {
      throw badRequest("Stripe webhook signature verification failed.", "stripe_signature_invalid");
    }
    switch (event.type) {
      case "account.updated":
        await this.syncStripeAccount(event.data.object);
        break;
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
      case "payment_intent.canceled":
      case "payment_intent.requires_action":
        await this.syncPaymentIntent(event.data.object);
        break;
      case "charge.refunded":
        await this.syncRefundedCharge(event.data.object);
        break;
      default:
        break;
    }
    return { received: true, type: event.type };
  }

  private async connectMockStripeAccount(
    gymId: string,
    gymSlug: string,
    existing: StripePaymentAccount | undefined
  ) {
    const now = this.clock.now();
    const stripeAccountId = existing?.stripeAccountId ?? this.createProviderAccountId(gymSlug);
    const account: StripePaymentAccount = {
      id: existing?.id ?? randomUUID(),
      gymId,
      stripeAccountId,
      onboardingComplete: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      requirementsCurrentlyDue: [],
      dashboardUrl:
        existing?.dashboardUrl ?? `https://dashboard.stripe.com/test/connect/accounts/${stripeAccountId}`,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    return {
      account: await this.repositories.payments.upsertStripeAccount(account),
      onboardingUrl: `http://localhost/stripe/mock-onboarding/${account.stripeAccountId}`
    };
  }

  private async createStripePaymentIntent(
    gymId: string,
    account: StripePaymentAccount,
    input: StripePaymentCollectInput
  ) {
    const stripe = this.requireStripe();
    const params: Stripe.PaymentIntentCreateParams = {
      amount: input.amountCents,
      currency: input.currency,
      confirm: Boolean(input.stripePaymentMethodId),
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      },
      metadata: {
        gymId,
        localPaymentMethod: input.paymentMethod,
        ...(input.memberId ? { memberId: input.memberId } : {})
      }
    };
    if (input.receiptEmail) {
      params.receipt_email = input.receiptEmail;
    }
    if (input.stripePaymentMethodId) {
      params.payment_method = input.stripePaymentMethodId;
    }
    if (input.note) {
      params.description = input.note;
    }
    return stripe.paymentIntents.create(
      params,
      { stripeAccount: account.stripeAccountId }
    );
  }

  private async syncStripeAccount(stripeAccount: Stripe.Account) {
    const existing =
      await this.repositories.payments.getStripeAccountByStripeAccountId(stripeAccount.id);
    if (!existing) {
      return;
    }
    await this.repositories.payments.upsertStripeAccount(
      this.mapStripeAccount(existing.gymId, stripeAccount, existing)
    );
  }

  private async syncPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
    const transaction =
      await this.repositories.payments.getPaymentTransactionByStripePaymentIntentId(paymentIntent.id);
    if (!transaction) {
      return;
    }
    await this.repositories.payments.updatePaymentTransaction({
      ...transaction,
      status: this.mapPaymentIntentStatus(paymentIntent.status),
      updatedAt: this.clock.now()
    });
  }

  private async syncRefundedCharge(charge: Stripe.Charge) {
    const paymentIntentId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (!paymentIntentId) {
      return;
    }
    const transaction =
      await this.repositories.payments.getPaymentTransactionByStripePaymentIntentId(paymentIntentId);
    if (!transaction) {
      return;
    }
    const refundedAmountCents = charge.amount_refunded;
    await this.repositories.payments.updatePaymentTransaction({
      ...transaction,
      refundedAmountCents,
      status: refundedAmountCents >= transaction.amountCents ? "refunded" : transaction.status,
      updatedAt: this.clock.now()
    });
  }

  private mapStripeAccount(
    gymId: string,
    stripeAccount: Stripe.Account,
    existing: StripePaymentAccount | undefined
  ): StripePaymentAccount {
    const now = this.clock.now();
    const requirements = [
      ...(stripeAccount.requirements?.currently_due ?? []),
      ...(stripeAccount.requirements?.past_due ?? [])
    ];
    return {
      id: existing?.id ?? randomUUID(),
      gymId,
      stripeAccountId: stripeAccount.id,
      onboardingComplete: requirements.length === 0 && Boolean(stripeAccount.details_submitted),
      chargesEnabled: stripeAccount.charges_enabled,
      payoutsEnabled: stripeAccount.payouts_enabled,
      requirementsCurrentlyDue: [...new Set(requirements)],
      dashboardUrl: `https://dashboard.stripe.com/connect/accounts/${stripeAccount.id}`,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
  }

  private mapPaymentIntentStatus(
    status: Stripe.PaymentIntent.Status
  ): StripePaymentTransaction["status"] {
    if (status === "succeeded") {
      return "succeeded";
    }
    if (status === "canceled") {
      return "failed";
    }
    return "pending";
  }

  private requireStripe() {
    if (!this.stripe) {
      throw conflict(
        "STRIPE_SECRET_KEY is required when STRIPE_MOCK_MODE=false.",
        "stripe_secret_key_missing"
      );
    }
    return this.stripe;
  }

  private createProviderAccountId(slug: string) {
    return `acct_mock_${slug.replaceAll("-", "_")}_${randomUUID().slice(0, 8)}`;
  }
}
