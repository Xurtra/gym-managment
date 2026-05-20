import { NotificationEventStatus } from "@gym-platform/constants";
import type { NotificationProcessInput } from "@gym-platform/validation";
import { conflict, notFound } from "../../http/errors.js";
import type { NotificationEvent } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class NotificationService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async list(gymId: string) {
    return this.repositories.notifications.listNotificationEventsForGym(gymId);
  }

  async process(gymId: string, eventId: string, input: NotificationProcessInput = {}) {
    const event = await this.getScopedEvent(gymId, eventId);
    if (event.status === NotificationEventStatus.Sent) {
      throw conflict("Notification has already been sent.", "notification_already_sent");
    }
    const now = this.clock.now();
    const updated: NotificationEvent = {
      ...event,
      status: input.markFailed ? NotificationEventStatus.Failed : NotificationEventStatus.Sent,
      updatedAt: now
    };
    if (input.markFailed) {
      updated.failedAt = now;
      updated.failureReason = input.failureReason ?? "Manual processing failure.";
      delete updated.sentAt;
    } else {
      updated.sentAt = now;
      delete updated.failedAt;
      delete updated.failureReason;
    }
    return this.repositories.notifications.updateNotificationEvent(updated);
  }

  async retry(gymId: string, eventId: string) {
    const event = await this.getScopedEvent(gymId, eventId);
    if (event.status !== NotificationEventStatus.Failed) {
      throw conflict("Only failed notifications can be retried.", "notification_retry_not_failed");
    }
    const updated: NotificationEvent = {
      ...event,
      status: NotificationEventStatus.Pending,
      updatedAt: this.clock.now()
    };
    delete updated.failedAt;
    delete updated.failureReason;
    return this.repositories.notifications.updateNotificationEvent(updated);
  }

  private async getScopedEvent(gymId: string, eventId: string) {
    const event = await this.repositories.notifications.getNotificationEvent(eventId);
    if (!event || event.gymId !== gymId) {
      throw notFound("Notification was not found.");
    }
    return event;
  }
}
