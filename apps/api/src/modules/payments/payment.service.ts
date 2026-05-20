import { FeatureFlag } from "@gym-platform/constants";
import type {
  StripePaymentCollectInput,
  StripePaymentRefundInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import type { ApiConfig } from "../../config/env.js";
import { badRequest, conflict, notFound } from "../../http/errors.js";
import type {
  StripePaymentAccount,
  StripePaymentTransaction
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class PaymentService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock,
    private readonly config: ApiConfig
  ) {}

  async getStripeAccount(gymId: string) {
    return this.repositories.payments.getStripeAccountForGym(gymId);
  }

  async connectStripeAccount(gymId: string) {
    const gym = await this.repositories.gyms.getGym(gymId);
    if (!gym) {
      throw notFound("Gym was not found.");
    }
    const existing = await this.repositories.payments.getStripeAccountForGym(gymId);
    const now = this.clock.now();
    const stripeAccountId = existing?.stripeAccountId ?? this.createProviderAccountId(gym.slug);
    const account: StripePaymentAccount = {
      id: existing?.id ?? randomUUID(),
      gymId,
      stripeAccountId,
      onboardingComplete: this.config.stripeMockMode,
      chargesEnabled: this.config.stripeMockMode,
      payoutsEnabled: this.config.stripeMockMode,
      requirementsCurrentlyDue: this.config.stripeMockMode ? [] : ["stripe_account_onboarding"],
      dashboardUrl:
        existing?.dashboardUrl ??
        `https://dashboard.stripe.com/${this.config.stripeMockMode ? "test/" : ""}connect/accounts/${stripeAccountId}`,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    if (!this.config.stripeMockMode && !this.config.stripeSecretKey) {
      account.requirementsCurrentlyDue = ["stripe_secret_key"];
    }
    return {
      account: await this.repositories.payments.upsertStripeAccount(account),
      onboardingUrl: this.config.stripeMockMode
        ? `http://localhost/stripe/mock-onboarding/${account.stripeAccountId}`
        : undefined
    };
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
      status: this.config.stripeMockMode ? "succeeded" : "pending",
      refundedAmountCents: 0,
      createdAt: now,
      updatedAt: now
    };
    if (input.memberId) {
      transaction.memberId = input.memberId;
    }
    if (this.config.stripeMockMode) {
      transaction.stripePaymentIntentId = `pi_mock_${randomUUID().replaceAll("-", "")}`;
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
    const updated: StripePaymentTransaction = {
      ...payment,
      refundedAmountCents: payment.refundedAmountCents + amountCents,
      status: payment.refundedAmountCents + amountCents >= payment.amountCents ? "refunded" : payment.status,
      updatedAt: this.clock.now()
    };
    if (input.reason) {
      updated.note = `${payment.note ? `${payment.note} | ` : ""}Refund: ${input.reason}`;
    }
    return this.repositories.payments.updatePaymentTransaction(updated);
  }

  private createProviderAccountId(slug: string) {
    const prefix = this.config.stripeMockMode ? "acct_mock" : "acct_pending";
    return `${prefix}_${slug.replaceAll("-", "_")}_${randomUUID().slice(0, 8)}`;
  }
}
