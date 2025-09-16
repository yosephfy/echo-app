import { Secret } from '../secret.entity';

export type SecretItemDto = {
  id: string;
  text: string;
  moods: { code: string; label?: string }[];
  tags: string[];
  status: string;
  createdAt: Date;
  author: {
    id: string;
    handle: string;
    avatarUrl: string | null;
  };
};

export function toSecretItemDto(secret: Secret): SecretItemDto {
  const author = secret.author
    ? {
        id: secret.author.id,
        handle: secret.author.handle,
        avatarUrl: secret.author.avatarUrl ?? null,
      }
    : {
        id: 'anonymous',
        handle: 'anonymous',
        avatarUrl: null as string | null,
      };
  return {
    id: secret.id,
    text: secret.text,
    moods: (secret.moods || []).map((m) => ({ code: m.code, label: m.label })),
    tags: (secret.tags || []).map((t) => t.slug),
    status: secret.status,
    createdAt: secret.createdAt,
    author,
  };
}
