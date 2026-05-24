import { ConsumerRecordStatus, MemberStatus } from "@gym-platform/constants";
import type { CrmActivityCreateInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { notFound } from "../../http/errors.js";
import type { CrmActivity, Member } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export interface PublicCrmActivity {
  id: string;
  gymId: string;
  consumerId: string;
  type: CrmActivity["type"];
  title: string;
  description?: string;
  outcome?: string;
  occurredAt: string;
  followUpAt?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export class CrmActivityService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async list(gymId: string, consumerId: string) {
    await this.getActiveConsumer(gymId, consumerId);
    return (await this.repositories.crmActivities.listActivitiesForConsumer(gymId, consumerId)).map(
      toPublicCrmActivity
    );
  }

  async create(gymId: string, consumerId: string, actorUserId: string, input: CrmActivityCreateInput) {
    await this.getActiveConsumer(gymId, consumerId);
    const now = this.clock.now();
    const activity: CrmActivity = {
      id: randomUUID(),
      gymId,
      consumerId,
      type: input.type ?? "note",
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      ...(input.outcome ? { outcome: input.outcome } : {}),
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : now,
      ...(input.followUpAt ? { followUpAt: new Date(input.followUpAt) } : {}),
      createdByUserId: actorUserId,
      createdAt: now,
      updatedAt: now
    };
    return toPublicCrmActivity(await this.repositories.crmActivities.createActivity(activity));
  }

  private async getActiveConsumer(gymId: string, consumerId: string): Promise<Member> {
    const consumer = await this.repositories.members.getMember(consumerId);
    if (
      !consumer ||
      consumer.gymId !== gymId ||
      consumer.status === MemberStatus.Archived ||
      consumer.recordStatus === ConsumerRecordStatus.Archived
    ) {
      throw notFound("Consumer was not found.");
    }
    return consumer;
  }
}

function toPublicCrmActivity(activity: CrmActivity): PublicCrmActivity {
  return {
    id: activity.id,
    gymId: activity.gymId,
    consumerId: activity.consumerId,
    type: activity.type,
    title: activity.title,
    ...(activity.description ? { description: activity.description } : {}),
    ...(activity.outcome ? { outcome: activity.outcome } : {}),
    occurredAt: activity.occurredAt.toISOString(),
    ...(activity.followUpAt ? { followUpAt: activity.followUpAt.toISOString() } : {}),
    ...(activity.createdByUserId ? { createdByUserId: activity.createdByUserId } : {}),
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString()
  };
}
