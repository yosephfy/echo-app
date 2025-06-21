import { Injectable, Inject, Logger } from '@nestjs/common';
import { Worker, Job, Queue } from 'bullmq';
import { NotificationsService } from './notifications.service';

interface NotificationJobData {
  userId: string;
  type: 'cooldown' | 'reminder';
}

@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    @Inject('NOTIF_QUEUE') private readonly notifQueue: Queue,
    private readonly notifications: NotificationsService,
  ) {
    const worker = new Worker(this.notifQueue.name, this.handleJob.bind(this), {
      connection: this.notifQueue.opts.connection,
    });

    worker.on('completed', (job: Job) =>
      this.logger.log(`Job ${job.id} completed`),
    );
    worker.on('failed', (job: Job, err) =>
      this.logger.error(`Job ${job.id} failed: ${err.message}`),
    );

    this.logger.log(`Worker listening on "${this.notifQueue.name}"`);
  }

  private async handleJob(job: Job<NotificationJobData>) {
    const { userId, type } = job.data;
    this.logger.log(
      `Processing job ${job.id}: type=${type} for user=${userId}`,
    );

    // Fetch tokens
    const tokens = await this.notifications.getTokensForUser(userId);
    if (tokens.length === 0) {
      this.logger.warn(`No tokens for user ${userId}`);
      return;
    }

    // Build messages
    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title:
        type === 'cooldown'
          ? 'Cooldown Complete'
          : 'Reminder: Your secret cooldown ends soon',
      body:
        type === 'cooldown'
          ? 'Your 24-hour cooldown is over! Share a new secret now.'
          : 'Just 3 hours left until you can post again.',
      data: { type, timestamp: Date.now() },
    }));

    // Send via Expo Push API
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Expo push failed: ${res.status} ${text}`);
    }
    this.logger.log(`Sent ${messages.length} notifications for job ${job.id}`);
  }
}
