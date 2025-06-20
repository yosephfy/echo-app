// backend/src/moderation/moderation.processor.ts
import { Injectable, Inject } from '@nestjs/common';
import { Worker, Job, Queue } from 'bullmq';
import { SecretsService } from '../secrets/secrets.service';
import { OpenAI } from 'openai';
import { SecretStatus } from '../secrets/secret.entity';

@Injectable()
export class ModerationProcessor {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

  constructor(
    private readonly secrets: SecretsService,
    @Inject('MOD_QUEUE') private readonly modQueue: Queue,
  ) {
    // Start the worker listening to the *same* queue
    new Worker(this.modQueue.name, this.processJob.bind(this), {
      connection: this.modQueue.opts.connection,
    });
    console.log(
      `🔔 [ModerationProcessor] Worker listening on "${this.modQueue.name}"`,
    );
  }

  async processJob(job: Job) {
    console.log(`🔍 [ModerationProcessor] Got job ${job.id}:`, job.data);

    try {
      const { secretId, text } = job.data;
      console.log(`🔍 [ModerationProcessor] Calling OpenAI…`);
      const res = await this.openai.moderations.create({ input: text });
      const flagged = res.results[0].flagged;
      console.log(
        `🔍 [ModerationProcessor] secret=${secretId} -> flagged=${flagged}`,
      );

      await this.secrets.updateStatus(
        secretId,
        flagged ? SecretStatus.REMOVED : SecretStatus.PUBLISHED,
      );
      console.log(`✅ [ModerationProcessor] Updated status for ${secretId}`);
    } catch (err) {
      console.error(`❌ [ModerationProcessor] Job ${job.id} failed:`, err);
      // rethrow if you want the job to retry per your backoff settings
      throw err;
    }
  }
}
