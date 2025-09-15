# Backend Changes Summary

This document outlines the backend changes implemented to improve user stats and add new endpoints.

## Enhanced User Stats Endpoint

### GET `/users/me/stats`
Returns comprehensive user statistics with both given and received metrics:

**Response:**
```json
{
  "postsCount": 10,           // secrets with status IN [published, under_review]
  "bookmarksCount": 15,       // bookmarks saved by user
  "currentStreak": 7,         // current consecutive days streak
  "reactionsGiven": 20,       // COUNT(Reaction WHERE userId = me)
  "reactionsReceived": 5,     // COUNT(Reaction JOIN Secret ... WHERE Secret.userId = me)
  "capsGiven": 8,             // COUNT(Cap WHERE userId = me)
  "capsReceived": 3,          // COUNT(Cap JOIN Secret ... WHERE Secret.userId = me)
  "repliesReceived": 12,      // COUNT(Reply JOIN Secret ... WHERE Secret.userId = me)
  "avgReactionsPerPost": 0.5  // reactionsReceived / NULLIF(postsCount, 0)
}
```

### GET `/users/:id/stats` 
Returns stats for any user (same response format as above)

## New Activity Endpoints

### GET `/reactions/me?page=1&limit=20`
Returns paginated list of secrets the user has reacted to:

**Response:**
```json
{
  "items": [
    {
      "secret": {
        "id": "secret-id",
        "text": "Secret content...",
        "author": { "id": "...", "handle": "...", "avatarUrl": "..." },
        "moods": [{ "code": "happy", "label": "Happy" }],
        "tags": ["tag1", "tag2"],
        "status": "published",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "reactionsCount": 25,
      "reactionType": "like",
      "reactedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### GET `/caps/me?page=1&limit=20`
Returns paginated list of secrets the user has capped:

**Response:**
```json
{
  "items": [
    {
      "secret": {
        // Same secret structure as above
      },
      "reactionsCount": 15, // caps count for this secret
      "cappedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

## Improved Streak Logic

Streak is now automatically updated in `SecretsService.createSecret()`:

- **No existing streak**: Create new streak with `days = 1`, `lastIncrementedOn = today`
- **Last post was yesterday**: Increment `days` by 1, set `lastIncrementedOn = today`
- **Already posted today**: No change
- **Gap in posting**: Reset to `days = 1`, `lastIncrementedOn = today`

## Minor Fixes

1. **Posts count**: Now excludes `REMOVED` status secrets
2. **Bookmarks pagination**: Fixed `total` to return actual bookmark count, not page slice length
3. **User metrics table**: Added optional `UserMetrics` entity for denormalized counters (performance optimization)

## Database Changes

- Added `UserMetrics` entity with denormalized counters
- Enhanced existing queries with proper status filtering
- Maintained backward compatibility with existing API

## Notes

- All endpoints require JWT authentication
- Pagination limits are capped at 100 items per page
- Query performance optimized with proper joins and indexes
- Streak logic handles timezone-agnostic date comparisons (YYYY-MM-DD format)