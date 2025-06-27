// backend/src/users/handle.service.ts
import { Injectable } from '@nestjs/common';

const ADJECTIVES = ['Silver', 'Golden', 'Brave', 'Clever', 'Quiet', 'Swift'];
const NOUNS = ['Fox', 'Wolf', 'Eagle', 'Lion', 'Otter', 'Hawk'];
const MAX_SUFFIX = 99;

const AVATAR_POOL = [
  'https://www.placeholder.co/40x40/random.png',
  'https://www.placeholder.co/40x40/random.png',
  'https://www.placeholder.co/40x40/random.png',

  // …add as many as you like…
];

@Injectable()
export class HandleService {
  /** Generate a random handle like "BraveOtter42" */
  generateHandle(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const suffix = Math.floor(Math.random() * (MAX_SUFFIX + 1));
    return `${adj}${noun}${suffix}`;
  }

  /** Pick a random avatar URL from the pool */
  pickAvatar(): string {
    return AVATAR_POOL[Math.floor(Math.random() * AVATAR_POOL.length)];
  }
}
