import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // IMPORTANT: Private key may contain literal \n in env. Normalize it.
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    if (privateKey.startsWith('"')) privateKey = privateKey.slice(1, -1);
    privateKey = privateKey.replace(/\\n/g, '\n');

    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
      this.logger.log(`Firebase Admin initialized (bucket=${storageBucket})`);
    }
  }

  get auth() {
    return admin.auth();
  }
  get storage() {
    return admin.storage();
  }
  get bucket() {
    return admin.storage().bucket();
  }
}
