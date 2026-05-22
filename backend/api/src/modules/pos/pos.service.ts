import { LeadStage, MemberStatus, MembershipStatus } from "@gym-platform/constants";
import type { PosPurchaseInput } from "@gym-platform/validation";
import { MemberMembershipService } from "../memberMemberships/memberMembership.service.js";
import { MemberService } from "../members/member.service.js";
import { POS_CUSTOMER_TAG } from "./pos.constants.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class PosService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async collectPurchase(gymId: string, input: PosPurchaseInput) {
    return this.repositories.transaction(async (repositories) => {
      const memberService = new MemberService(repositories, this.clock);
      const membershipService = new MemberMembershipService(repositories, this.clock);
      const existingMemberId =
        input.consumerId ?? (await findExistingMemberId(repositories, gymId, input.email, input.phone));

      const consumer = existingMemberId
        ? await memberService.update(gymId, existingMemberId, {
            ...(input.firstName ? { firstName: input.firstName } : {}),
            ...(input.lastName ? { lastName: input.lastName } : {}),
            ...(input.email ? { email: input.email } : {}),
            ...(input.phone ? { phone: input.phone } : {}),
            status: MemberStatus.Active,
            leadStage: LeadStage.None,
            tagNames: mergeTagNames((await memberService.get(gymId, existingMemberId)).tagNames)
          })
        : await memberService.create(gymId, {
            firstName: input.firstName!,
            lastName: input.lastName!,
            ...(input.email ? { email: input.email } : {}),
            ...(input.phone ? { phone: input.phone } : {}),
            status: MemberStatus.Active,
            leadStage: LeadStage.None,
            tagNames: [POS_CUSTOMER_TAG]
          });

      const membership = input.planId
        ? await membershipService.assignPlan(gymId, consumer.id, {
            planId: input.planId,
            status: MembershipStatus.Active
          })
        : undefined;

      return {
        consumer,
        ...(membership ? { membership } : {}),
        amountCents: input.amountCents,
        paymentMethod: input.paymentMethod,
        ...(input.note ? { note: input.note } : {}),
        ...(input.receiptEmail ? { receiptEmail: input.receiptEmail } : {})
      };
    });
  }
}

async function findExistingMemberId(
  repositories: Repositories,
  gymId: string,
  email?: string,
  phone?: string
) {
  if (!email && !phone) {
    return undefined;
  }
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = normalizePhone(phone);
  const members = await repositories.members.listMembersForGym(gymId);
  return members.find((member) => {
    if (member.status === MemberStatus.Archived) {
      return false;
    }
    const emailMatches = normalizedEmail && member.email?.toLowerCase() === normalizedEmail;
    const phoneMatches = normalizedPhone && normalizePhone(member.phone) === normalizedPhone;
    return Boolean(emailMatches || phoneMatches);
  })?.id;
}

function mergeTagNames(existing: string[]) {
  return [...new Set([...existing, POS_CUSTOMER_TAG])];
}

function normalizePhone(phone?: string) {
  return phone?.replace(/\D+/g, "");
}
