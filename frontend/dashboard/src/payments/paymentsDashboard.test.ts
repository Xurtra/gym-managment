import { ConsumerRecordStatus, FeatureFlag, MemberStatus, Permission } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  StripePaymentMethod,
  StripePaymentStatus,
  buildStripePaymentCollectionScreen,
  buildStripePaymentConnectionScreen,
  buildStripePaymentDetailScreen,
  buildStripePaymentHistoryScreen,
  createStripePaymentRefundSubmission,
  createStripePaymentCollectionSubmission
} from "./index.js";

describe("stripe payments dashboard", () => {
  it("builds ready Stripe connection state", () => {
    const screen = buildStripePaymentConnectionScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      account: {
        gymId: "gym-1",
        accountId: "acct_123",
        country: "US",
        defaultCurrency: "usd",
        businessName: "Demo Strength Club",
        chargesEnabled: true,
        payoutsEnabled: true,
        onboardingComplete: true,
        requirementsDue: [],
        dashboardUrl: "https://dashboard.stripe.com/test/connect/accounts/acct_123"
      }
    });

    expect(screen.screen).toBe("stripe_payment_connection");
    expect(screen.connected).toBe(true);
    expect(screen.canManagePayments).toBe(true);
    expect(screen.statusLabel).toBe("Ready");
    expect(screen.countryLabel).toBe("US");
    expect(screen.currencyLabel).toBe("USD");
    expect(screen.businessLabel).toBe("Demo Strength Club");
    expect(screen.requirementCount).toBe(0);
    expect(screen.requirementsDue).toEqual([]);
    expect(screen.chargesEnabled).toBe(true);
    expect(screen.payoutsEnabled).toBe(true);
    expect(screen.onboardingComplete).toBe(true);
    expect(screen.hasDashboardLink).toBe(true);
    expect(screen.dashboardUrl).toBe("https://dashboard.stripe.com/test/connect/accounts/acct_123");
    expect(screen.connectAction.disabled).toBe(false);
    expect(screen.continueOnboardingAction.disabled).toBe(true);
    expect(screen.openDashboardAction.disabled).toBe(false);
    expect(screen.disconnectAction.disabled).toBe(false);
    expect(screen.actionCount).toBe(4);
    expect(screen.summaryLabel).toBe("Stripe account ready for payments");
  });

  it("builds onboarding-required Stripe connection state", () => {
    const screen = buildStripePaymentConnectionScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      account: {
        gymId: "gym-1",
        accountId: "acct_456",
        country: "CA",
        defaultCurrency: "cad",
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
        requirementsDue: ["business_profile.url", "external_account"]
      }
    });

    expect(screen.connected).toBe(true);
    expect(screen.statusLabel).toBe("Onboarding required");
    expect(screen.countryLabel).toBe("CA");
    expect(screen.currencyLabel).toBe("CAD");
    expect(screen.businessLabel).toBe("No connected business");
    expect(screen.requirementCount).toBe(2);
    expect(screen.requirementsDue).toEqual(["business_profile.url", "external_account"]);
    expect(screen.hasDashboardLink).toBe(false);
    expect(screen.continueOnboardingAction.disabled).toBe(false);
    expect(screen.openDashboardAction.disabled).toBe(true);
    expect(screen.summaryLabel).toBe("2 Stripe onboarding requirements remaining");
  });

  it("builds limited Stripe connection state after onboarding", () => {
    const screen = buildStripePaymentConnectionScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      account: {
        gymId: "gym-1",
        accountId: "acct_limited",
        country: "US",
        defaultCurrency: "usd",
        businessName: "Limited Strength Club",
        chargesEnabled: true,
        payoutsEnabled: false,
        onboardingComplete: true,
        requirementsDue: ["external_account"]
      }
    });

    expect(screen.connected).toBe(true);
    expect(screen.statusLabel).toBe("Limited");
    expect(screen.chargesEnabled).toBe(true);
    expect(screen.payoutsEnabled).toBe(false);
    expect(screen.continueOnboardingAction.disabled).toBe(true);
    expect(screen.summaryLabel).toBe("Stripe account ready for payments");
  });

  it("builds disconnected and read-only Stripe connection state", () => {
    const disconnected = buildStripePaymentConnectionScreen({
      permissions: [Permission.PaymentRead]
    });

    expect(disconnected.connected).toBe(false);
    expect(disconnected.canManagePayments).toBe(false);
    expect(disconnected.statusLabel).toBe("Not connected");
    expect(disconnected.countryLabel).toBe("No country selected");
    expect(disconnected.currencyLabel).toBe("No default currency");
    expect(disconnected.businessLabel).toBe("No connected business");
    expect(disconnected.requirementCount).toBe(0);
    expect(disconnected.connectAction.disabled).toBe(true);
    expect(disconnected.continueOnboardingAction.disabled).toBe(true);
    expect(disconnected.openDashboardAction.disabled).toBe(true);
    expect(disconnected.disconnectAction.disabled).toBe(true);
    expect(disconnected.summaryLabel).toBe("Stripe account not connected");
    expect(disconnected.reason).toBe("You do not have permission to manage payments.");
  });

  it("builds ready Stripe payment collection state", () => {
    const screen = buildStripePaymentCollectionScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      featureFlags: [FeatureFlag.PointOfSale],
      account: {
        gymId: "gym-1",
        accountId: "acct_789",
        defaultCurrency: "usd",
        chargesEnabled: true,
        payoutsEnabled: true,
        onboardingComplete: true,
        requirementsDue: []
      },
      member: {
        id: "member-1",
        gymId: "gym-1",
        firstName: "Jamie",
        lastName: "Rivera",
        recordStatus: ConsumerRecordStatus.Active,
        status: MemberStatus.Active,
        email: "jamie@example.com",
        tagNames: [],
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-01T00:00:00.000Z"
      },
      amountCents: "3499",
      note: "Monthly membership",
      paymentMethod: StripePaymentMethod.CardReader
    });

    expect(screen.screen).toBe("stripe_payment_collection");
    expect(screen.connected).toBe(true);
    expect(screen.accountReady).toBe(true);
    expect(screen.canManagePayments).toBe(true);
    expect(screen.pointOfSaleEnabled).toBe(true);
    expect(screen.memberName).toBe("Jamie Rivera");
    expect(screen.memberStatusLabel).toBe("Active");
    expect(screen.currencyCode).toBe("USD");
    expect(screen.fields.amountCents.value).toBe("3499");
    expect(screen.fields.note.value).toBe("Monthly membership");
    expect(screen.fields.receiptEmail.value).toBe("jamie@example.com");
    expect(screen.paymentMethodOptionCount).toBe(2);
    expect(screen.selectedPaymentMethod).toBe(StripePaymentMethod.CardReader);
    expect(screen.canSubmit).toBe(true);
    expect(screen.summaryLabel).toBe("Collect USD 34.99 from Jamie Rivera");
    expect(screen.action.disabled).toBe(false);
  });

  it("blocks payment collection when point of sale is disabled", () => {
    const screen = buildStripePaymentCollectionScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      account: {
        gymId: "gym-1",
        accountId: "acct_789",
        defaultCurrency: "usd",
        chargesEnabled: true,
        payoutsEnabled: true,
        onboardingComplete: true,
        requirementsDue: []
      },
      member: {
        id: "member-2",
        gymId: "gym-1",
        firstName: "Jordan",
        lastName: "Lee",
        recordStatus: ConsumerRecordStatus.Active,
        status: MemberStatus.PastDue,
        tagNames: [],
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-01T00:00:00.000Z"
      },
      amountCents: "2000",
      paymentMethod: StripePaymentMethod.ManualEntry
    });

    expect(screen.pointOfSaleEnabled).toBe(false);
    expect(screen.blockedReason).toBe("Point of sale is disabled for this gym.");
    expect(screen.canSubmit).toBe(false);
    expect(screen.summaryLabel).toBe("Payment collection unavailable");
    expect(screen.paymentMethodOptions.every((option) => option.disabled)).toBe(true);
    expect(screen.action.disabled).toBe(true);
  });

  it("validates Stripe payment collection input when account and member are ready", () => {
    const screen = buildStripePaymentCollectionScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      featureFlags: [FeatureFlag.PointOfSale],
      account: {
        gymId: "gym-1",
        accountId: "acct_789",
        defaultCurrency: "usd",
        chargesEnabled: true,
        payoutsEnabled: true,
        onboardingComplete: true,
        requirementsDue: []
      },
      member: {
        id: "member-3",
        gymId: "gym-1",
        firstName: "Avery",
        lastName: "Stone",
        recordStatus: ConsumerRecordStatus.Active,
        status: MemberStatus.Active,
        tagNames: [],
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-01T00:00:00.000Z"
      },
      amountCents: "0",
      receiptEmail: "invalid-email",
      paymentMethod: StripePaymentMethod.ManualEntry
    });

    expect(screen.blockedReason).toBeUndefined();
    expect(screen.fields.amountCents.error).toBe("Enter a valid amount greater than zero.");
    expect(screen.fields.receiptEmail.error).toBe("Enter a valid receipt email.");
    expect(screen.selectedPaymentMethod).toBe(StripePaymentMethod.ManualEntry);
    expect(screen.canSubmit).toBe(false);
    expect(screen.summaryLabel).toBe("Enter a valid payment amount");
    expect(screen.action.disabled).toBe(true);
  });

  it("normalizes Stripe payment collection submissions", () => {
    const submission = createStripePaymentCollectionSubmission({
      gymId: "gym-1",
      memberId: "member-1",
      amountCents: " 4999 ",
      paymentMethod: StripePaymentMethod.ManualEntry,
      note: " Personal training package ",
      receiptEmail: " billing@example.com "
    });

    expect(submission).toEqual({
      gymId: "gym-1",
      memberId: "member-1",
      amountCents: 4999,
      paymentMethod: StripePaymentMethod.ManualEntry,
      note: "Personal training package",
      receiptEmail: "billing@example.com"
    });
  });

  it("builds filtered Stripe payment history state", () => {
    const screen = buildStripePaymentHistoryScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      featureFlags: [FeatureFlag.PointOfSale],
      query: "jamie",
      status: StripePaymentStatus.Succeeded,
      transactions: [
        {
          id: "pay_2",
          gymId: "gym-1",
          memberId: "member-1",
          memberName: "Jamie Rivera",
          amountCents: 3499,
          currency: "usd",
          paymentMethod: StripePaymentMethod.CardReader,
          status: StripePaymentStatus.Succeeded,
          description: "Monthly membership",
          createdAt: "2026-05-18T11:00:00.000Z"
        },
        {
          id: "pay_1",
          gymId: "gym-1",
          memberId: "member-1",
          memberName: "Jamie Rivera",
          amountCents: 1500,
          currency: "usd",
          paymentMethod: StripePaymentMethod.ManualEntry,
          status: StripePaymentStatus.Succeeded,
          description: "Protein drinks",
          createdAt: "2026-05-18T10:00:00.000Z"
        },
        {
          id: "pay_3",
          gymId: "gym-1",
          memberId: "member-2",
          memberName: "Jordan Lee",
          amountCents: 2000,
          currency: "usd",
          paymentMethod: StripePaymentMethod.ManualEntry,
          status: StripePaymentStatus.Failed,
          description: "Past-due membership retry",
          createdAt: "2026-05-18T12:00:00.000Z"
        }
      ]
    });

    expect(screen.screen).toBe("stripe_payment_history");
    expect(screen.canViewPayments).toBe(true);
    expect(screen.canManagePayments).toBe(true);
    expect(screen.pointOfSaleEnabled).toBe(true);
    expect(screen.query).toBe("jamie");
    expect(screen.selectedStatus).toBe(StripePaymentStatus.Succeeded);
    expect(screen.rowCount).toBe(2);
    expect(screen.totalCount).toBe(3);
    expect(screen.totalCollectedAmountLabel).toBe("USD 49.99");
    expect(screen.statusOptionCount).toBe(4);
    expect(screen.rows.map((row) => row.id)).toEqual(["pay_2", "pay_1"]);
    expect(screen.rows[0]).toMatchObject({
      memberName: "Jamie Rivera",
      amountLabel: "USD 34.99",
      paymentMethodLabel: "Card reader",
      statusLabel: "Succeeded",
      detailHref: "/payments/pay_2"
    });
    expect(screen.summaryLabel).toBe("2 payments totaling USD 49.99");
    expect(screen.collectPaymentAction.disabled).toBe(false);
  });

  it("builds empty Stripe payment history state", () => {
    const screen = buildStripePaymentHistoryScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      featureFlags: [FeatureFlag.PointOfSale],
      transactions: []
    });

    expect(screen.rowCount).toBe(0);
    expect(screen.totalCount).toBe(0);
    expect(screen.summaryLabel).toBe("No payments recorded");
    expect(screen.empty?.title).toBe("No payments yet");
    expect(screen.empty?.action?.label).toBe("Collect payment");
    expect(screen.collectPaymentAction.disabled).toBe(false);
  });

  it("builds filtered-empty Stripe payment history state", () => {
    const screen = buildStripePaymentHistoryScreen({
      permissions: [Permission.PaymentRead],
      transactions: [
        {
          id: "pay_20",
          gymId: "gym-1",
          memberName: "Jordan Lee",
          amountCents: 2000,
          currency: "usd",
          paymentMethod: StripePaymentMethod.ManualEntry,
          status: StripePaymentStatus.Pending,
          description: "Pending retry",
          createdAt: "2026-05-18T10:00:00.000Z"
        }
      ],
      query: "jamie"
    });

    expect(screen.rowCount).toBe(0);
    expect(screen.summaryLabel).toBe("No matching payments");
    expect(screen.empty?.title).toBe("No payments match these filters");
    expect(screen.empty?.body).toBe("Adjust the search or payment status filter.");
    expect(screen.collectPaymentAction.disabled).toBe(true);
  });

  it("blocks Stripe payment history without read access", () => {
    const screen = buildStripePaymentHistoryScreen({
      permissions: [],
      transactions: [
        {
          id: "pay_1",
          gymId: "gym-1",
          amountCents: 1000,
          currency: "usd",
          paymentMethod: StripePaymentMethod.ManualEntry,
          status: StripePaymentStatus.Pending,
          createdAt: "2026-05-18T10:00:00.000Z"
        }
      ]
    });

    expect(screen.canViewPayments).toBe(false);
    expect(screen.blockedReason).toBe("Payment read permission is required.");
    expect(screen.rowCount).toBe(0);
    expect(screen.summaryLabel).toBe("Payment history unavailable");
    expect(screen.empty?.title).toBe("Payments unavailable");
    expect(screen.collectPaymentAction.disabled).toBe(true);
  });

  it("builds refundable Stripe payment detail state", () => {
    const screen = buildStripePaymentDetailScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      transaction: {
        id: "pay_10",
        gymId: "gym-1",
        memberId: "member-1",
        memberName: "Jamie Rivera",
        amountCents: 5000,
        refundedAmountCents: 1200,
        currency: "usd",
        paymentMethod: StripePaymentMethod.CardReader,
        status: StripePaymentStatus.Succeeded,
        description: "Private coaching session",
        createdAt: "2026-05-18T14:00:00.000Z"
      }
    });

    expect(screen.screen).toBe("stripe_payment_detail");
    expect(screen.canManagePayments).toBe(true);
    expect(screen.memberName).toBe("Jamie Rivera");
    expect(screen.amountLabel).toBe("USD 50.00");
    expect(screen.statusLabel).toBe("Succeeded");
    expect(screen.paymentMethodLabel).toBe("Card reader");
    expect(screen.refundableAmountLabel).toBe("USD 38.00");
    expect(screen.refundable).toBe(true);
    expect(screen.sectionCount).toBe(3);
    expect(screen.detailSections[0]?.title).toBe("Payment");
    expect(screen.refundAction.disabled).toBe(false);
    expect(screen.summaryLabel).toBe("Succeeded payment ready for refund review");
  });

  it("blocks Stripe refunding when no refundable amount remains", () => {
    const screen = buildStripePaymentDetailScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      transaction: {
        id: "pay_11",
        gymId: "gym-1",
        amountCents: 2500,
        refundedAmountCents: 2500,
        currency: "usd",
        paymentMethod: StripePaymentMethod.ManualEntry,
        status: StripePaymentStatus.Refunded,
        createdAt: "2026-05-18T15:00:00.000Z"
      }
    });

    expect(screen.refundable).toBe(false);
    expect(screen.blockedReason).toBe("No refundable amount remains.");
    expect(screen.refundAction.disabled).toBe(true);
    expect(screen.summaryLabel).toBe("Refund unavailable");
  });

  it("blocks Stripe refunding for failed payments", () => {
    const screen = buildStripePaymentDetailScreen({
      permissions: [Permission.PaymentRead, Permission.PaymentWrite],
      transaction: {
        id: "pay_failed",
        gymId: "gym-1",
        amountCents: 4200,
        currency: "usd",
        paymentMethod: StripePaymentMethod.ManualEntry,
        status: StripePaymentStatus.Failed,
        createdAt: "2026-05-18T16:00:00.000Z"
      }
    });

    expect(screen.memberName).toBe("Walk-in customer");
    expect(screen.refundable).toBe(false);
    expect(screen.blockedReason).toBe("Failed payments cannot be refunded.");
    expect(screen.refundAction.disabled).toBe(true);
    expect(screen.receiptAction.disabled).toBe(false);
  });

  it("normalizes Stripe refund submissions", () => {
    const submission = createStripePaymentRefundSubmission({
      transactionId: "pay_10",
      amountCents: " 1800 ",
      reason: " Partial service credit "
    });

    expect(submission).toEqual({
      transactionId: "pay_10",
      amountCents: 1800,
      reason: "Partial service credit"
    });
  });
});
