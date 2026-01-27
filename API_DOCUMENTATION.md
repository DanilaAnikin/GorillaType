# Gorilla Type API Documentation

## Base URL

```
/api
```

## Authentication

All protected endpoints require a valid Supabase session cookie. Authentication is handled via Supabase Auth middleware. The server-side `createClient()` helper reads session cookies automatically.

Unauthenticated requests to protected endpoints receive:

```json
{ "error": "Unauthorized" }
```

**HTTP Status:** `401`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Results](#2-results)
3. [Stats](#3-stats)
4. [Friends](#4-friends)
5. [Leaderboards](#5-leaderboards)
6. [Race](#6-race)
7. [Users](#7-users)
8. [Chat](#8-chat)
9. [Clans](#9-clans)
10. [Notifications](#10-notifications)
11. [Analytics](#11-analytics)
12. [Tournaments](#12-tournaments)
13. [Challenges](#13-challenges)
14. [Replay](#14-replay)
15. [Practice](#15-practice)
16. [Error Handling](#error-handling)

---

## 1. Authentication

### POST /api/auth/logout

Server-side logout that clears the Supabase session cookies.

**Authentication:** Required (session cookie present)

**Request Body:** None

**Response:**

```json
{
  "success": true
}
```

**Notes:** Always returns `{ "success": true }` even if the server-side sign-out encounters an error. The client should clear local state regardless.

---

## 2. Results

### GET /api/results

Fetch the authenticated user's typing test results with pagination and optional filters.

**Authentication:** Required

**Query Parameters:**

| Parameter   | Type   | Default        | Description                                                            |
|-------------|--------|----------------|------------------------------------------------------------------------|
| `page`      | number | `1`            | Page number for pagination                                             |
| `limit`     | number | `20`           | Results per page (max `100`)                                           |
| `mode`      | string | --             | Filter by test mode: `"time"`, `"words"`, `"quote"`, `"zen"`, `"custom"` |
| `language`  | string | --             | Filter by test language (e.g. `"english"`)                             |
| `sortBy`    | string | `completed_at` | Sort field: `completed_at`, `wpm`, `accuracy`, `consistency`, `test_duration` |
| `sortOrder` | string | `desc`         | Sort direction: `asc` or `desc`                                        |

**Response:**

```json
{
  "results": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "test_mode": "time",
      "test_duration": 30,
      "test_word_count": null,
      "test_language": "english",
      "punctuation_enabled": false,
      "numbers_enabled": false,
      "wpm": 85.2,
      "raw_wpm": 90.1,
      "accuracy": 97.5,
      "consistency": 88.3,
      "chars_correct": 210,
      "chars_incorrect": 5,
      "chars_extra": 1,
      "chars_missed": 0,
      "chart_data": { "wpm": [], "raw": [], "errors": [] },
      "completed_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Cases:**

| Status | Condition             |
|--------|-----------------------|
| 401    | Not authenticated     |
| 500    | Database query failed  |

---

### POST /api/results

Save a new typing test result with anti-cheat validation. Automatically updates personal bests and leaderboard entries.

**Authentication:** Required

**Request Body:**

```typescript
{
  mode: "time" | "words" | "quote" | "zen" | "custom";  // Required
  language: string;                                       // Required (e.g. "english")
  wpm: number;                                            // Required
  accuracy: number;                                       // Required (0-100)
  rawWpm: number;
  consistency: number;
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  extraCharacters: number;
  missedCharacters: number;
  duration: number;                                       // Test duration in seconds
  timeLimit?: number;                                     // For time mode
  wordLimit?: number;                                     // For words mode
  quoteId?: string;                                       // For quote mode
  punctuation?: boolean;
  numbers?: boolean;
  wpmHistory?: number[];                                  // Per-second WPM array
  rawWpmHistory?: number[];
  accuracyHistory?: number[];
}
```

**Anti-Cheat Validation Rules:**
- WPM must not exceed 350 (raw WPM max 400)
- No negative values for WPM, accuracy, or duration
- Accuracy must not exceed 100%
- Minimum duration of 1 second
- Character count consistency check
- WPM history consistency (within 50% of average)
- WPM spike detection (no jumps > 100 WPM between seconds)

**Response (201):**

```json
{
  "result": {
    "id": "uuid",
    "user_id": "uuid",
    "wpm": 85.2,
    "raw_wpm": 90.1,
    "accuracy": 97.5,
    "...": "..."
  },
  "isPb": true,
  "message": "New personal best!"
}
```

**Error Cases:**

| Status | Condition                        |
|--------|----------------------------------|
| 400    | Missing required fields          |
| 400    | Anti-cheat validation failed     |
| 401    | Not authenticated                |
| 500    | Database insert failed           |

---

## 3. Stats

### GET /api/stats

Fetch comprehensive statistics summary for the authenticated user, including averages, personal bests, trends, activity heatmap, and progression data.

**Authentication:** Required

**Query Parameters:**

| Parameter  | Type   | Default | Description                                     |
|------------|--------|---------|-------------------------------------------------|
| `mode`     | string | --      | Filter by test mode                              |
| `language` | string | --      | Filter by language                               |
| `days`     | number | `30`    | Number of days for trend analysis period         |

**Response:**

```json
{
  "profile": {
    "testsCompleted": 500,
    "timeTyping": 36000000,
    "streak": 7,
    "maxStreak": 30,
    "xp": 15000,
    "level": 12
  },
  "overall": {
    "averageWpm": 82.5,
    "averageRawWpm": 88.3,
    "averageAccuracy": 96.2,
    "averageConsistency": 85.1,
    "highestWpm": 120,
    "lowestWpm": 45,
    "totalDuration": 25000,
    "testsCount": 500
  },
  "recent": {
    "averageWpm": 85.0,
    "averageRawWpm": 90.5,
    "averageAccuracy": 97.0,
    "averageConsistency": 87.2,
    "highestWpm": 115,
    "lowestWpm": 60,
    "totalDuration": 3600,
    "testsCount": 45,
    "periodDays": 30
  },
  "trends": {
    "wpmChange": 5.2,
    "accuracyChange": 1.1,
    "consistencyChange": 3.0,
    "testsChange": 10.5,
    "improving": true
  },
  "personalBests": [
    {
      "mode": "time",
      "timeLimit": 30,
      "wordLimit": null,
      "language": "english",
      "punctuation": false,
      "numbers": false,
      "wpm": 120,
      "accuracy": 99.1,
      "achievedAt": "2025-01-10T08:00:00.000Z"
    }
  ],
  "breakdown": {
    "byMode": { "time": 300, "words": 150, "quote": 50 },
    "byLanguage": { "english": 450, "programming": 50 }
  },
  "activity": [
    { "date": "2025-01-15", "count": 5 }
  ],
  "progression": {
    "wpm": [{ "date": "2025-01-15", "value": 85.0 }],
    "accuracy": [{ "date": "2025-01-15", "value": 97.0 }]
  }
}
```

**Error Cases:**

| Status | Condition         |
|--------|-------------------|
| 401    | Not authenticated |
| 500    | Database error    |

---

## 4. Friends

### GET /api/friends

List the authenticated user's friends, pending requests (sent and received).

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Default | Description                                          |
|-----------|--------|---------|------------------------------------------------------|
| `status`  | string | `all`   | Filter: `pending`, `accepted`, `declined`, `all`     |
| `type`    | string | `all`   | Filter direction: `sent`, `received`, `all`          |

**Response:**

```json
{
  "friends": [
    {
      "id": "friendship-uuid",
      "status": "accepted",
      "direction": "sent",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z",
      "friend": {
        "id": "user-uuid",
        "username": "typist123",
        "displayName": "Speed Typist",
        "avatarUrl": "https://...",
        "country": "US",
        "level": 15,
        "lastSeenAt": "2025-01-15T10:00:00.000Z"
      }
    }
  ],
  "pendingReceived": [],
  "pendingSent": [],
  "counts": {
    "friends": 10,
    "pendingReceived": 2,
    "pendingSent": 1
  }
}
```

---

### POST /api/friends

Send a friend request or accept an existing request from the target user.

**Authentication:** Required

**Request Body:**

```typescript
{
  userId?: string;    // Target user ID
  username?: string;  // OR target username (at least one required)
}
```

**Response (201):**

```json
{
  "friendship": { "id": "uuid", "status": "pending", "...": "..." },
  "message": "Friend request sent",
  "action": "sent"
}
```

If the target user already sent a request to you, it auto-accepts:

```json
{
  "friendship": { "id": "uuid", "status": "accepted", "...": "..." },
  "message": "Friend request accepted",
  "action": "accepted"
}
```

**Error Cases:**

| Status | Condition                                       |
|--------|-------------------------------------------------|
| 400    | Missing userId and username                     |
| 400    | Cannot friend yourself                          |
| 401    | Not authenticated                               |
| 403    | User is blocked                                 |
| 404    | User not found                                  |
| 409    | Already friends or request already pending       |

---

### PATCH /api/friends

Accept, reject, block, or unblock a friend request.

**Authentication:** Required

**Request Body:**

```typescript
{
  friendshipId: string;                              // Required
  action: "accept" | "reject" | "block" | "unblock"; // Required
}
```

**Response:**

```json
{
  "friendship": { "id": "uuid", "status": "accepted", "...": "..." },
  "message": "Friend request accepted successfully"
}
```

**Error Cases:**

| Status | Condition                                  |
|--------|--------------------------------------------|
| 400    | Missing friendshipId or invalid action     |
| 400    | Cannot accept/reject non-pending request   |
| 401    | Not authenticated                          |
| 403    | Only recipient can accept/reject           |
| 404    | Friendship not found                       |

---

### DELETE /api/friends

Remove a friend or cancel a friend request.

**Authentication:** Required

**Query Parameters:**

| Parameter      | Type   | Required | Description           |
|----------------|--------|----------|-----------------------|
| `friendshipId` | string | Yes      | The friendship to remove |

**Response:**

```json
{
  "message": "Friend removed successfully"
}
```

**Error Cases:**

| Status | Condition                        |
|--------|----------------------------------|
| 400    | Missing friendshipId             |
| 401    | Not authenticated                |
| 403    | Not authorized (not participant) |
| 404    | Friendship not found             |

---

## 5. Leaderboards

### GET /api/leaderboards

Fetch the global leaderboard with filters for mode, language, time period, and pagination. Does not require authentication, but returns the current user's rank if authenticated.

**Authentication:** Optional (provides user rank if authenticated)

**Query Parameters:**

| Parameter   | Type   | Default   | Description                                        |
|-------------|--------|-----------|----------------------------------------------------|
| `mode`      | string | `time`    | Test mode: `time` or `words`                       |
| `timeLimit` | number | `30`      | Time limit in seconds (for time mode)              |
| `wordLimit` | number | --        | Word count (for words mode)                        |
| `language`  | string | `english` | Test language                                      |
| `period`    | string | `all`     | Time period: `all`, `day`, `week`, `month`         |
| `page`      | number | `1`       | Page number                                        |
| `limit`     | number | `50`      | Entries per page (max `100`)                       |

**Response:**

```json
{
  "entries": [
    {
      "id": "uuid",
      "rank": 1,
      "userId": "user-uuid",
      "username": "speedster",
      "displayName": "The Speedster",
      "avatarUrl": "https://...",
      "country": "US",
      "level": 25,
      "wpm": 145.5,
      "accuracy": 99.2,
      "consistency": 0,
      "date": "2025-01-15T08:00:00.000Z"
    }
  ],
  "total": 1500,
  "filters": {
    "mode": "time",
    "timeLimit": 30,
    "wordLimit": null,
    "language": "english",
    "period": "all"
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1500,
    "totalPages": 30
  },
  "userRank": {
    "rank": 42,
    "username": "myuser",
    "avatarUrl": "https://...",
    "wpm": 95.3,
    "accuracy": 97.8,
    "testCount": 150,
    "totalEntries": 1500,
    "percentile": 97.2
  }
}
```

**Notes:** `userRank` is `null` if the user is not authenticated or has no leaderboard entry for the current filter.

---

## 6. Race

### GET /api/race

Get race room details, list public rooms, or fetch race history. Behavior depends on query parameters.

**Authentication:** Required for `action=history`; Optional otherwise

**Query Parameters:**

| Parameter | Type   | Description                                           |
|-----------|--------|-------------------------------------------------------|
| `code`    | string | Room code (6-character alphanumeric)                  |
| `roomId`  | string | Room UUID                                             |
| `action`  | string | `"list"` = public rooms, `"history"` = user's history |

**Action: `list`** -- Returns public waiting rooms from the last hour.

**Response:**

```json
{
  "rooms": [
    {
      "id": "uuid",
      "code": "ABC123",
      "host": {
        "username": "typist",
        "avatarUrl": "https://...",
        "level": 10
      },
      "participantCount": 3,
      "maxParticipants": 5,
      "mode": "time",
      "timeLimit": 60,
      "wordLimit": null,
      "status": "waiting",
      "isPrivate": false,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**Action: `history`** -- Returns user's completed race history (last 10).

**Response:**

```json
{
  "history": [
    {
      "id": "uuid",
      "roomCode": "ABC123",
      "finishedAt": "2025-01-15T10:30:00.000Z",
      "position": 1,
      "totalRacers": 4,
      "wpm": 95,
      "accuracy": 98.5,
      "mode": "time",
      "timeLimit": 60,
      "wordLimit": null
    }
  ]
}
```

**By code/roomId** -- Returns detailed room data with participants.

**Response:**

```json
{
  "room": {
    "id": "uuid",
    "code": "ABC123",
    "status": "waiting",
    "mode": "time",
    "timeLimit": 60,
    "wordLimit": null,
    "language": "english",
    "punctuation": false,
    "numbers": false,
    "text": "the quick brown fox...",
    "maxParticipants": 5,
    "isPrivate": false,
    "host": {
      "id": "uuid",
      "username": "typist",
      "displayName": "Speed Typist",
      "avatarUrl": "https://...",
      "level": 10
    },
    "participants": [
      {
        "userId": "uuid",
        "username": "typist",
        "displayName": "Speed Typist",
        "avatarUrl": "https://...",
        "level": 10,
        "status": "ready",
        "wpm": null,
        "accuracy": null,
        "progress": 0,
        "finishedAt": null
      }
    ],
    "participantCount": 1,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "startedAt": null,
    "finishedAt": null
  }
}
```

**Error Cases:**

| Status | Condition                          |
|--------|------------------------------------|
| 400    | No code, roomId, or action given   |
| 401    | Not authenticated (for history)    |
| 404    | Room not found                     |
| 410    | Room expired (older than 1 hour)   |

---

### POST /api/race

Create a new race room. The creator is automatically added as the first participant.

**Authentication:** Required

**Request Body:**

```typescript
{
  mode?: "time" | "words";      // Default: "time"
  timeLimit?: number;            // Default: 60
  wordLimit?: number;            // Default: 50
  language?: string;             // Default: "english"
  punctuation?: boolean;         // Default: false
  numbers?: boolean;             // Default: false
  maxParticipants?: number;      // Default: 5 (range: 2-10)
  isPrivate?: boolean;           // Default: false
  text?: string;                 // Pre-generated race text (min 10 chars)
}
```

**Response (201):**

```json
{
  "room": {
    "id": "uuid",
    "code": "ABC123",
    "status": "waiting",
    "mode": "time",
    "timeLimit": 60,
    "host": { "id": "uuid", "username": "typist", "...": "..." },
    "participants": [{ "userId": "uuid", "...": "..." }],
    "participantCount": 1,
    "createdAt": "2025-01-15T10:00:00.000Z"
  },
  "message": "Room created successfully"
}
```

**Error Cases:**

| Status | Condition                                      |
|--------|------------------------------------------------|
| 400    | Invalid mode, participant range, or text length |
| 401    | Not authenticated                              |
| 500    | Failed to generate unique room code            |

---

### PATCH /api/race

Update room status or join/leave a room. Supports multiple actions.

**Authentication:** Required

**Request Body:**

```typescript
{
  roomId?: string;    // Room UUID
  code?: string;      // OR room code (at least one required)
  action: "join" | "leave" | "start" | "racing" | "finish" | "cancel";
  text?: string;      // Optional race text (for "start" action)
}
```

**Actions:**

| Action    | Who         | Description                           |
|-----------|-------------|---------------------------------------|
| `join`    | Any user    | Join a waiting room                   |
| `leave`   | Participant | Leave the room                        |
| `start`   | Host only   | Start countdown (needs 2+ players)    |
| `racing`  | Host only   | Transition from countdown to racing   |
| `finish`  | Host only   | Mark race as finished                 |
| `cancel`  | Host only   | Cancel the race                       |

**Response:**

```json
{
  "message": "Joined room successfully",
  "roomId": "uuid"
}
```

**Error Cases:**

| Status | Condition                                        |
|--------|--------------------------------------------------|
| 400    | Missing roomId/code, invalid action, wrong state |
| 401    | Not authenticated                                |
| 403    | Not host (for host-only actions)                 |
| 404    | Room not found                                   |

---

## 7. Users

### GET /api/users

Search for public user profiles by username or display name.

**Authentication:** Not required

**Query Parameters:**

| Parameter     | Type   | Default | Description                          |
|---------------|--------|---------|--------------------------------------|
| `q` or `query`| string | --      | Search query (min 2 characters)      |
| `page`        | number | `1`     | Page number                          |
| `limit`       | number | `20`    | Results per page (max `50`)          |

**Response:**

```json
{
  "users": [
    {
      "id": "uuid",
      "username": "typist123",
      "displayName": "Speed Typist",
      "avatarUrl": "https://...",
      "country": "US",
      "level": 15,
      "testsCompleted": 500,
      "joinedAt": "2024-06-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Error Cases:**

| Status | Condition                      |
|--------|--------------------------------|
| 400    | Query less than 2 characters   |
| 500    | Database error                 |

---

### PATCH /api/users

Update the authenticated user's profile.

**Authentication:** Required

**Request Body:**

```typescript
{
  username?: string;          // 3-20 chars, alphanumeric + _ and -
  display_name?: string;
  avatar_url?: string;        // Must be valid URL
  bio?: string;               // Max 500 characters
  country_code?: string;      // 2-letter ISO code
  keyboard?: string;
  is_public?: boolean;
  social_links?: {            // JSONB object
    twitter?: string;
    github?: string;
    website?: string;
  };
}
```

**Response:**

```json
{
  "profile": {
    "id": "uuid",
    "username": "newname",
    "displayName": "Display Name",
    "avatarUrl": "https://...",
    "bio": "I love typing",
    "country": "US",
    "keyboard": "QWERTY",
    "socialLinks": { "twitter": "@typist" },
    "isPublic": true,
    "updatedAt": "2025-01-15T10:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

**Error Cases:**

| Status | Condition                            |
|--------|--------------------------------------|
| 400    | Invalid username format/length       |
| 400    | Bio exceeds 500 characters           |
| 400    | Invalid avatar URL                   |
| 400    | Invalid country code                 |
| 400    | No valid fields to update            |
| 401    | Not authenticated                    |
| 409    | Username already taken               |

---

## 8. Chat

### GET /api/chat

List chat rooms the user has access to, with latest messages and unread counts.

**Authentication:** Required

**Query Parameters:**

| Parameter  | Type   | Default | Description                                                    |
|------------|--------|---------|----------------------------------------------------------------|
| `type`     | string | --      | Filter: `global`, `clan`, `race`, `direct`, `group`            |
| `withUser` | string | --      | Get or create a DM room with this user ID                      |
| `page`     | number | `1`     | Page number                                                    |
| `limit`    | number | `20`    | Results per page (max `50`)                                    |

**Response:**

```json
{
  "rooms": [
    {
      "id": "uuid",
      "type": "direct",
      "virtualType": "direct",
      "isGroup": false,
      "name": "Speed Typist",
      "clanId": null,
      "raceRoomId": null,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "isMuted": false,
      "lastReadAt": "2025-01-15T09:00:00.000Z",
      "participantCount": 2,
      "participants": [
        {
          "id": "uuid",
          "username": "typist123",
          "displayName": "Speed Typist",
          "avatarUrl": "https://..."
        }
      ],
      "latestMessage": {
        "content": "Hello!",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "sender": { "id": "uuid", "username": "me", "displayName": "Me" }
      },
      "unreadCount": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasMore": false
  }
}
```

---

### POST /api/chat

Create a new chat room (direct message or group).

**Authentication:** Required

**Request Body for DM:**

```typescript
{
  type: "direct";
  participantId: string;  // User ID to DM
}
```

**Request Body for Group:**

```typescript
{
  type: "group";
  name?: string;              // Group name (max 128 chars)
  participantIds: string[];   // Array of user IDs
}
```

**Response (201 for group):**

```json
{
  "room": {
    "id": "uuid",
    "type": "direct",
    "virtualType": "group",
    "isGroup": true,
    "name": "Study Group",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "participantCount": 4,
    "participants": [...]
  }
}
```

**Error Cases:**

| Status | Condition                                |
|--------|------------------------------------------|
| 400    | Invalid type, missing participants       |
| 400    | Cannot DM yourself                       |
| 401    | Not authenticated                        |
| 403    | Blocked user relationship                |
| 404    | User not found                           |
| 503    | Chat database migrations not applied     |

---

### GET /api/chat/messages

Fetch messages for a specific chat room with cursor-based pagination.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `roomId`  | string | Yes      | Chat room UUID                                   |
| `before`  | string | No       | Cursor: ISO timestamp for older messages         |
| `limit`   | number | No       | Messages per page (default `50`, max `100`)      |

**Response:**

```json
{
  "messages": [
    {
      "id": "uuid",
      "roomId": "room-uuid",
      "content": "Hello everyone!",
      "messageType": "text",
      "isDeleted": false,
      "editedAt": null,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "sender": {
        "id": "uuid",
        "username": "typist",
        "displayName": "Speed Typist",
        "avatarUrl": "https://...",
        "level": 15
      },
      "result": null
    }
  ],
  "hasMore": true,
  "cursor": "2025-01-15T09:00:00.000Z"
}
```

**Notes:** Messages are returned in chronological order (oldest first). For `result_share` messages, the `result` field contains linked typing result data.

---

### POST /api/chat/messages

Send a message to a chat room.

**Authentication:** Required

**Request Body:**

```typescript
{
  roomId: string;                                    // Required
  content: string;                                   // Required, max 500 chars
  messageType?: "text" | "result_share" | "system";  // Default: "text"
  resultId?: string;                                 // Required if messageType is "result_share"
}
```

**Response (201):**

```json
{
  "message": {
    "id": "uuid",
    "roomId": "room-uuid",
    "content": "Check out my score!",
    "messageType": "result_share",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "sender": { "id": "uuid", "username": "typist", "...": "..." },
    "result": {
      "id": "uuid",
      "wpm": 120,
      "rawWpm": 125,
      "accuracy": 99.1,
      "testDuration": 30,
      "testMode": "time",
      "createdAt": "2025-01-15T09:55:00.000Z"
    }
  }
}
```

**Error Cases:**

| Status | Condition                          |
|--------|------------------------------------|
| 400    | Missing/empty content or roomId    |
| 400    | Content exceeds 500 characters     |
| 400    | Room is no longer active           |
| 401    | Not authenticated                  |
| 403    | Access denied or banned from room  |
| 404    | Room or result not found           |

---

### DELETE /api/chat/messages

Soft-delete a message (only your own messages).

**Authentication:** Required

**Query Parameters:**

| Parameter   | Type   | Required | Description      |
|-------------|--------|----------|------------------|
| `messageId` | string | Yes      | Message UUID     |

**Response:**

```json
{
  "message": "Message deleted successfully"
}
```

**Error Cases:**

| Status | Condition                    |
|--------|------------------------------|
| 400    | Missing messageId or already deleted |
| 401    | Not authenticated            |
| 403    | Not the message author       |
| 404    | Message not found            |

---

### GET /api/chat/:roomId

Get detailed room information including all participants, message count, and unread count.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type   | Description   |
|-----------|--------|---------------|
| `roomId`  | string | Chat room UUID |

**Response:**

```json
{
  "room": {
    "id": "uuid",
    "type": "direct",
    "name": "Speed Typist",
    "clanId": null,
    "raceRoomId": null,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "messageCount": 150,
    "unreadCount": 5,
    "isMuted": false
  },
  "participants": [
    {
      "id": "user-uuid",
      "username": "typist",
      "displayName": "Speed Typist",
      "avatarUrl": "https://...",
      "level": 15,
      "country": "US",
      "lastReadAt": "2025-01-15T09:00:00.000Z",
      "joinedAt": "2025-01-01T00:00:00.000Z",
      "isCurrentUser": false
    }
  ]
}
```

---

### PATCH /api/chat/:roomId

Update read status or mute/unmute a chat room.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type   | Description   |
|-----------|--------|---------------|
| `roomId`  | string | Chat room UUID |

**Request Body:**

```typescript
{
  action: "markRead" | "mute" | "unmute";
}
```

**Response:**

```json
{
  "message": "Room marked as read successfully",
  "isMuted": false,
  "lastReadAt": "2025-01-15T10:00:00.000Z",
  "unreadCount": 0
}
```

---

### POST /api/chat/:roomId/members

Add members to a group chat (only works for rooms with 3+ participants or a set name).

**Authentication:** Required

**Path Parameters:**

| Parameter | Type   | Description   |
|-----------|--------|---------------|
| `roomId`  | string | Chat room UUID |

**Request Body:**

```typescript
{
  userIds: string[];  // Array of user IDs to add
}
```

**Response:**

```json
{
  "added": [
    {
      "id": "uuid",
      "username": "newmember",
      "displayName": "New Member",
      "avatarUrl": "https://..."
    }
  ],
  "alreadyMembers": ["uuid-of-existing-member"],
  "participantCount": 5
}
```

**Error Cases:**

| Status | Condition                                  |
|--------|--------------------------------------------|
| 400    | Cannot add to a DM (must be a group)       |
| 400    | Empty userIds array                        |
| 401    | Not authenticated                          |
| 403    | Not a participant                          |
| 404    | Room or users not found                    |

---

## 9. Clans

### GET /api/clans

List clans with optional search and sorting.

**Authentication:** Not required

**Query Parameters:**

| Parameter | Type   | Default   | Description                                |
|-----------|--------|-----------|--------------------------------------------|
| `q`       | string | --        | Search by name or tag                      |
| `page`    | number | `1`       | Page number                                |
| `limit`   | number | `20`      | Results per page (max `100`)               |
| `sortBy`  | string | `members` | Sort: `members`, `wpm`, `name`             |

**Response:**

```json
{
  "clans": [
    {
      "id": "uuid",
      "name": "Speed Demons",
      "tag": "SPD",
      "description": "We type fast.",
      "bannerUrl": "https://...",
      "isPublic": true,
      "owner": {
        "id": "uuid",
        "username": "founder",
        "displayName": "The Founder",
        "avatarUrl": "https://..."
      },
      "memberCount": 25,
      "totalTests": 5000,
      "averageWpm": 95.5,
      "createdAt": "2024-06-01T00:00:00.000Z",
      "updatedAt": "2025-01-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### POST /api/clans

Create a new clan. The creator automatically becomes the owner.

**Authentication:** Required

**Request Body:**

```typescript
{
  name: string;           // Required, 3-32 characters
  tag: string;            // Required, 2-5 uppercase letters (A-Z)
  description?: string;   // Max 500 characters
  banner_url?: string;
  isPublic?: boolean;     // Default: true
}
```

**Response (201):**

```json
{
  "clan": {
    "id": "uuid",
    "name": "Speed Demons",
    "tag": "SPD",
    "description": "We type fast.",
    "bannerUrl": null,
    "isPublic": true,
    "owner": { "id": "uuid", "username": "founder", "...": "..." },
    "memberCount": 1,
    "totalTests": 0,
    "averageWpm": 0,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  },
  "message": "Clan created successfully"
}
```

**Error Cases:**

| Status | Condition                        |
|--------|----------------------------------|
| 400    | Invalid name, tag, or description |
| 401    | Not authenticated                |
| 409    | Name or tag already exists       |

---

### PATCH /api/clans

Update clan details (owner or admin only).

**Authentication:** Required

**Request Body:**

```typescript
{
  clanId: string;           // Required
  name?: string;            // 3-32 characters
  tag?: string;             // 2-5 uppercase letters
  description?: string;     // Max 500 characters or null
  banner_url?: string;
  isPublic?: boolean;
}
```

**Response:**

```json
{
  "clan": { "id": "uuid", "name": "New Name", "...": "..." },
  "message": "Clan updated successfully"
}
```

---

### DELETE /api/clans

Delete a clan (owner only). Cascade deletes members and invites.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `clanId`  | string | Yes      | Clan UUID   |

**Response:**

```json
{
  "message": "Clan \"Speed Demons\" deleted successfully"
}
```

---

### GET /api/clans/:id

Get detailed clan information including members and stats. Use `:id = "me"` to get the authenticated user's clan.

**Authentication:** Required for `"me"`, optional otherwise

**Path Parameters:**

| Parameter | Type   | Description                              |
|-----------|--------|------------------------------------------|
| `id`      | string | Clan UUID or `"me"` for current user's clan |

**Response:**

```json
{
  "clan": {
    "id": "uuid",
    "name": "Speed Demons",
    "tag": "SPD",
    "description": "We type fast.",
    "bannerUrl": null,
    "isPublic": true,
    "ownerId": "uuid",
    "maxMembers": 50,
    "owner": { "id": "uuid", "username": "founder", "...": "..." },
    "memberCount": 25,
    "totalTests": 5000,
    "averageWpm": 95.5,
    "createdAt": "2024-06-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z"
  },
  "members": [
    {
      "id": "member-uuid",
      "userId": "user-uuid",
      "username": "typist",
      "displayName": "Speed Typist",
      "avatarUrl": "https://...",
      "level": 15,
      "country": "US",
      "role": "owner",
      "testsContributed": 500,
      "joinedAt": "2024-06-01T00:00:00.000Z"
    }
  ],
  "stats": {
    "totalMembers": 25,
    "totalTests": 5000,
    "totalTestsContributed": 3000,
    "averageWpm": 95.5,
    "roleDistribution": { "owners": 1, "admins": 3, "members": 21 }
  },
  "userMembership": {
    "role": "member",
    "joinedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Notes:** `userMembership` is `null` if the user is not a member.

---

### POST /api/clans/:id

Join a clan directly.

**Authentication:** Required

**Response:**

```json
{
  "message": "Successfully joined clan",
  "membership": {
    "id": "uuid",
    "clanId": "clan-uuid",
    "clanName": "Speed Demons",
    "userId": "user-uuid",
    "role": "member",
    "testsContributed": 0,
    "joinedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

---

### DELETE /api/clans/:id

Leave a clan. Owners cannot leave without transferring ownership first.

**Authentication:** Required

**Response:**

```json
{
  "message": "Successfully left clan"
}
```

---

### PATCH /api/clans/:id

Update clan details (owner/admin only). Same as `PATCH /api/clans` but uses path parameter for clan ID.

**Authentication:** Required

**Request Body:**

```typescript
{
  name?: string;
  description?: string;
  isPublic?: boolean;
}
```

---

### POST /api/clans/members

Join a clan via invite code or direct invite.

**Authentication:** Required

**Request Body:**

```typescript
{
  clanId?: string;       // Direct join (requires valid invite)
  inviteCode?: string;   // Join via invite code
}
```

**Response (201):**

```json
{
  "membership": {
    "id": "uuid",
    "clanId": "clan-uuid",
    "userId": "user-uuid",
    "role": "member",
    "testsContributed": 0,
    "joinedAt": "2025-01-15T10:00:00.000Z",
    "user": { "id": "uuid", "username": "typist", "...": "..." }
  },
  "clan": { "id": "uuid", "name": "Speed Demons", "tag": "SPD" },
  "message": "Successfully joined clan \"Speed Demons\""
}
```

**Error Cases:**

| Status | Condition                            |
|--------|--------------------------------------|
| 400    | Missing clanId and inviteCode        |
| 401    | Not authenticated                    |
| 403    | No valid invite / invite for another user |
| 404    | Invalid or expired invite code       |
| 409    | Already a member                     |

---

### PATCH /api/clans/members

Update a clan member's role (owner/admin only).

**Authentication:** Required

**Request Body:**

```typescript
{
  clanId: string;                   // Required
  userId: string;                   // Required -- target member
  role: "admin" | "member";        // Required (cannot set "owner")
}
```

**Response:**

```json
{
  "membership": {
    "id": "uuid",
    "clanId": "clan-uuid",
    "userId": "user-uuid",
    "role": "admin",
    "testsContributed": 100,
    "joinedAt": "2025-01-01T00:00:00.000Z",
    "user": { "id": "uuid", "username": "typist", "...": "..." }
  },
  "message": "Member role updated to admin"
}
```

---

### DELETE /api/clans/members

Leave a clan or kick a member (owner/admin only).

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Required | Description                                |
|-----------|--------|----------|--------------------------------------------|
| `clanId`  | string | Yes      | Clan UUID                                  |
| `userId`  | string | No       | Target user ID (omit to leave yourself)    |

**Response:**

```json
{
  "message": "Successfully left clan \"Speed Demons\"",
  "clanId": "clan-uuid",
  "userId": "user-uuid",
  "action": "left"
}
```

---

## 10. Notifications

### GET /api/notifications

Fetch the authenticated user's notifications, ordered by most recent first (max 50).

**Authentication:** Required

**Response:**

```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "challenge_received",
      "title": "New Challenge",
      "message": "SpeedTypist challenged you to a typing duel!",
      "data": "{ \"challenge_id\": \"uuid\" }",
      "link": "/challenges",
      "is_read": false,
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### PATCH /api/notifications

Mark notifications as read.

**Authentication:** Required

**Request Body -- Mark single notification:**

```typescript
{
  id: string;       // Notification UUID
  is_read: boolean; // Set read status
}
```

**Request Body -- Mark all as read:**

```typescript
{
  markAllRead: true;
}
```

**Response:**

```json
{
  "success": true
}
```

---

### DELETE /api/notifications

Delete a single notification.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Required | Description        |
|-----------|--------|----------|--------------------|
| `id`      | string | Yes      | Notification UUID  |

**Response:**

```json
{
  "success": true
}
```

---

## 11. Analytics

### GET /api/analytics

Fetch comprehensive analytics data for the authenticated user including WPM progression, accuracy trends, daily activity, mode/language breakdowns, and recent progress comparison.

**Authentication:** Required

**Response:**

```json
{
  "wpmHistory": [
    {
      "wpm": 85,
      "raw_wpm": 90,
      "accuracy": 97.5,
      "date": "2025-01-15T10:00:00.000Z",
      "test_mode": "time"
    }
  ],
  "dailyTests": [
    { "date": "2025-01-15", "count": 5, "avg_wpm": 82.3 }
  ],
  "modeStats": [
    { "mode": "time", "avg_wpm": 85.2, "best_wpm": 120, "tests": 300 }
  ],
  "languageStats": [
    { "language": "english", "avg_wpm": 85.0, "avg_accuracy": 97.0, "tests": 450 }
  ],
  "overallStats": {
    "totalTests": 100,
    "totalTime": 5000,
    "avgWpm": 82.5,
    "avgAccuracy": 96.2,
    "avgConsistency": 85.1,
    "bestWpm": 120,
    "charsCorrect": 25000,
    "charsIncorrect": 800,
    "charsExtra": 50,
    "charsMissed": 100
  },
  "recentProgress": {
    "currentAvg": 85.0,
    "previousAvg": 80.5,
    "improvement": 5.6
  }
}
```

**Notes:** `wpmHistory` returns the last 100 tests. `dailyTests` covers the last 30 days. `recentProgress` compares the last 10 tests vs. the previous 10 tests.

---

## 12. Tournaments

### GET /api/tournaments

List public tournaments with optional status filter and pagination.

**Authentication:** Not required

**Query Parameters:**

| Parameter | Type   | Default | Description                                       |
|-----------|--------|---------|---------------------------------------------------|
| `status`  | string | --      | Filter: `upcoming`, `active`, `completed`, `cancelled` |
| `page`    | number | `1`     | Page number                                       |
| `limit`   | number | `10`    | Results per page (max `50`)                       |

**Response:**

```json
{
  "tournaments": [
    {
      "id": "uuid",
      "name": "Weekend Sprint",
      "description": "30-second speed test tournament",
      "status": "upcoming",
      "testMode": "time",
      "testDuration": 30,
      "testWordCount": null,
      "testLanguage": "english",
      "maxParticipants": 64,
      "totalRounds": 3,
      "isPublic": true,
      "entryXpCost": 100,
      "startTime": "2025-01-20T18:00:00.000Z",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "creator": { "id": "uuid", "username": "organizer", "avatarUrl": "https://..." },
      "participantCount": 12
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### POST /api/tournaments

Create a new tournament. The creator is automatically added as the first participant.

**Authentication:** Required

**Request Body:**

```typescript
{
  name: string;                    // Required, non-empty
  description?: string;
  test_mode: "time" | "words";    // Required
  test_duration?: number;          // Default: 60 (for time mode)
  test_word_count?: number;        // Default: 50 (for words mode)
  test_language?: string;          // Default: "english"
  max_participants?: number;       // 2-256
  total_rounds?: number;           // 1-10, default: 3
  start_time: string;              // Required, ISO 8601 future date
  is_public?: boolean;             // Default: true
  entry_xp_cost?: number;          // Default: 0
}
```

**Response (201):**

```json
{
  "tournament": {
    "id": "uuid",
    "name": "Weekend Sprint",
    "status": "upcoming",
    "testMode": "time",
    "testDuration": 30,
    "totalRounds": 3,
    "startTime": "2025-01-20T18:00:00.000Z",
    "creator": { "id": "uuid", "username": "organizer", "avatarUrl": "https://..." },
    "participantCount": 1,
    "...": "..."
  },
  "message": "Tournament created successfully"
}
```

**Error Cases:**

| Status | Condition                               |
|--------|-----------------------------------------|
| 400    | Missing name, invalid mode, future date |
| 401    | Not authenticated                       |

---

### GET /api/tournaments/:id

Get tournament details including participants and round results.

**Authentication:** Not required

**Path Parameters:**

| Parameter | Type   | Description     |
|-----------|--------|-----------------|
| `id`      | string | Tournament UUID |

**Response:**

```json
{
  "tournament": {
    "id": "uuid",
    "name": "Weekend Sprint",
    "description": "...",
    "status": "active",
    "testMode": "time",
    "testDuration": 30,
    "testWordCount": null,
    "testLanguage": "english",
    "maxParticipants": 64,
    "totalRounds": 3,
    "isPublic": true,
    "entryXpCost": 100,
    "startTime": "2025-01-20T18:00:00.000Z",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "createdBy": "uuid",
    "creator": { "id": "uuid", "username": "organizer", "avatarUrl": "https://..." },
    "participants": [
      {
        "id": "participant-uuid",
        "userId": "user-uuid",
        "username": "typist",
        "avatarUrl": "https://...",
        "totalScore": 250.5,
        "joinedAt": "2025-01-16T00:00:00.000Z"
      }
    ],
    "participantCount": 12,
    "rounds": [
      {
        "id": "round-uuid",
        "participantId": "participant-uuid",
        "roundNumber": 1,
        "resultId": "result-uuid",
        "wpm": 95,
        "accuracy": 98.5,
        "score": 93.6,
        "completedAt": "2025-01-20T18:05:00.000Z"
      }
    ]
  }
}
```

---

### PUT /api/tournaments/:id

Update an upcoming tournament (creator only).

**Authentication:** Required

**Request Body:**

```typescript
{
  name?: string;
  description?: string;
  test_mode?: "time" | "words";
  test_duration?: number;
  test_word_count?: number;
  test_language?: string;
  max_participants?: number;
  total_rounds?: number;
  is_public?: boolean;
  start_time?: string;       // Must be a future date
  entry_xp_cost?: number;
}
```

**Response:**

```json
{
  "tournament": { "...": "..." },
  "message": "Tournament updated successfully"
}
```

**Error Cases:**

| Status | Condition                              |
|--------|----------------------------------------|
| 400    | Tournament is not in "upcoming" status |
| 400    | start_time not in the future           |
| 401    | Not authenticated                      |
| 403    | Not the tournament creator             |
| 404    | Tournament not found                   |

---

### DELETE /api/tournaments/:id

Cancel a tournament (sets status to `"cancelled"`). Creator only. Cannot cancel already completed or cancelled tournaments.

**Authentication:** Required

**Response:**

```json
{
  "message": "Tournament cancelled successfully"
}
```

---

### POST /api/tournaments/:id/join

Join an upcoming tournament.

**Authentication:** Required

**Response:**

```json
{
  "message": "Successfully joined the tournament"
}
```

**Error Cases:**

| Status | Condition                     |
|--------|-------------------------------|
| 400    | Tournament not "upcoming"     |
| 400    | Already joined                |
| 400    | Tournament is full            |
| 401    | Not authenticated             |
| 404    | Tournament not found          |

---

### POST /api/tournaments/:id/rounds

Submit a round result for an active tournament.

**Authentication:** Required

**Request Body:**

```typescript
{
  round_number: number;   // Required (1 to total_rounds)
  result_id?: string;     // Optional linked typing result
  wpm: number;            // Required (0-350)
  accuracy: number;       // Required (0-100)
}
```

**Score Calculation:** `score = wpm * (accuracy / 100)`

**Response (201):**

```json
{
  "round": {
    "id": "uuid",
    "roundNumber": 1,
    "wpm": 95,
    "accuracy": 98.5,
    "score": 93.58,
    "completedAt": "2025-01-20T18:05:00.000Z"
  },
  "totalScore": 93.58,
  "message": "Round result submitted successfully"
}
```

**Error Cases:**

| Status | Condition                                     |
|--------|-----------------------------------------------|
| 400    | Missing fields, invalid WPM/accuracy          |
| 400    | Tournament not "active"                       |
| 400    | Invalid round number or already submitted     |
| 401    | Not authenticated                             |
| 403    | Not a participant                             |
| 404    | Tournament not found                          |

---

## 13. Challenges

### GET /api/challenges

List the authenticated user's challenges (both sent and received).

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Description                                                   |
|-----------|--------|---------------------------------------------------------------|
| `status`  | string | Filter by status: `pending`, `accepted`, `in_progress`, `completed`, `declined`, `expired` |

**Response:**

```json
{
  "challenges": [
    {
      "id": "uuid",
      "challengerId": "uuid",
      "challengedId": "uuid",
      "status": "pending",
      "direction": "sent",
      "testMode": "time",
      "testDuration": 30,
      "testWordCount": null,
      "testLanguage": "english",
      "testText": "the quick brown fox...",
      "message": "Let's see who's faster!",
      "winnerId": null,
      "expiresAt": "2025-01-16T10:00:00.000Z",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z",
      "challenger": { "id": "uuid", "username": "me", "displayName": "Me", "avatarUrl": "..." },
      "challenged": { "id": "uuid", "username": "rival", "displayName": "Rival", "avatarUrl": "..." },
      "challengerResult": null,
      "challengedResult": null
    }
  ],
  "sent": [...],
  "received": [...],
  "counts": {
    "total": 15,
    "sent": 8,
    "received": 7,
    "pending": 3,
    "active": 2,
    "completed": 10
  }
}
```

---

### POST /api/challenges

Create a new typing challenge. Generates test text and creates a notification for the challenged user.

**Authentication:** Required

**Request Body:**

```typescript
{
  challengedId: string;     // Required -- target user UUID
  testMode: string;         // Required -- "time" or "words"
  testDuration?: number;    // For time mode (default: 30)
  testWordCount?: number;   // For words mode (default: 25)
  testLanguage?: string;    // Default: "english"
  message?: string;         // Optional challenge message
}
```

**Response (201):**

```json
{
  "challenge": {
    "id": "uuid",
    "challenger_id": "uuid",
    "challenged_id": "uuid",
    "status": "pending",
    "test_mode": "time",
    "test_duration": 30,
    "test_text": "the quick brown fox...",
    "expires_at": "2025-01-16T10:00:00.000Z",
    "...": "..."
  },
  "message": "Challenge sent successfully"
}
```

**Error Cases:**

| Status | Condition                              |
|--------|----------------------------------------|
| 400    | Missing challengedId or testMode       |
| 400    | Cannot challenge yourself              |
| 401    | Not authenticated                      |
| 404    | Challenged user not found              |
| 409    | Pending challenge already exists       |

---

### GET /api/challenges/:id

Get detailed challenge information. Only accessible by the two participants.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| `id`      | string | Challenge UUID |

**Response:**

```json
{
  "challenge": {
    "id": "uuid",
    "challengerId": "uuid",
    "challengedId": "uuid",
    "status": "accepted",
    "direction": "received",
    "testMode": "time",
    "testDuration": 30,
    "testText": "the quick brown fox...",
    "message": "Let's race!",
    "winnerId": null,
    "expiresAt": "2025-01-16T10:00:00.000Z",
    "challenger": { "id": "uuid", "username": "rival", "...": "..." },
    "challenged": { "id": "uuid", "username": "me", "...": "..." },
    "challengerResult": { "id": "uuid", "wpm": 95, "accuracy": 98.5, "...": "..." },
    "challengedResult": null
  }
}
```

---

### PATCH /api/challenges/:id

Update challenge status: accept, decline, or submit a result.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type   | Description    |
|-----------|--------|----------------|
| `id`      | string | Challenge UUID |

**Request Body:**

```typescript
{
  action: "accept" | "decline" | "submit_result";
  resultId?: string;  // Required when action is "submit_result"
}
```

**Actions:**

| Action          | Who              | Description                                |
|-----------------|------------------|--------------------------------------------|
| `accept`        | Challenged only  | Accept a pending challenge                 |
| `decline`       | Challenged only  | Decline a pending challenge                |
| `submit_result` | Either party     | Submit typing result for an active challenge |

**Response:**

```json
{
  "challenge": { "...": "..." },
  "message": "Result submitted. Waiting for opponent."
}
```

**Notes:** When both participants submit results, a database trigger automatically determines the winner and sets the status to `"completed"`.

**Error Cases:**

| Status | Condition                                        |
|--------|--------------------------------------------------|
| 400    | Invalid action, wrong status, already submitted  |
| 400    | Challenge expired                                |
| 401    | Not authenticated                                |
| 403    | Not a participant or wrong role for action       |
| 404    | Challenge or result not found                    |

---

### DELETE /api/challenges/:id

Cancel a pending challenge (challenger only).

**Authentication:** Required

**Response:**

```json
{
  "message": "Challenge cancelled successfully"
}
```

**Error Cases:**

| Status | Condition                     |
|--------|-------------------------------|
| 400    | Challenge is not pending      |
| 401    | Not authenticated             |
| 403    | Not the challenger            |
| 404    | Challenge not found           |

---

## 14. Replay

### GET /api/replay

Retrieve keystroke replay data for a specific typing test result. Accessible by the result owner or if the owner's profile is public.

**Authentication:** Required

**Query Parameters:**

| Parameter  | Type   | Required | Description          |
|------------|--------|----------|----------------------|
| `resultId` | string | Yes      | Typing result UUID   |

**Response:**

```json
{
  "resultId": "uuid",
  "keystrokes": [
    {
      "key": "t",
      "keyCode": "KeyT",
      "isCorrect": true,
      "timestampMs": 0,
      "charIndex": 0,
      "wordIndex": 0
    },
    {
      "key": "h",
      "keyCode": "KeyH",
      "isCorrect": true,
      "timestampMs": 85,
      "charIndex": 1,
      "wordIndex": 0
    }
  ]
}
```

**Error Cases:**

| Status | Condition                                  |
|--------|--------------------------------------------|
| 400    | Missing resultId                           |
| 401    | Not authenticated                          |
| 403    | Not owner and profile is not public        |
| 404    | Result not found                           |

---

### POST /api/replay

Save keystroke replay data for a typing test result (result owner only).

**Authentication:** Required

**Request Body:**

```typescript
{
  resultId: string;                // Required
  keystrokes: Array<{             // Required, max 10,000 entries
    key: string;                   // Character typed
    keyCode?: string;              // Key code (e.g. "KeyT")
    isCorrect: boolean;
    timestampMs: number;           // Milliseconds from test start
    charIndex: number;
    wordIndex: number;
  }>;
}
```

**Response (201):**

```json
{
  "message": "Replay data saved successfully",
  "count": 500
}
```

**Error Cases:**

| Status | Condition                               |
|--------|-----------------------------------------|
| 400    | Missing resultId or keystrokes          |
| 400    | Too many keystrokes (> 10,000)          |
| 401    | Not authenticated                       |
| 403    | Result does not belong to user          |
| 404    | Result not found                        |

---

## 15. Practice

### GET /api/practice

Analyze the user's keystroke data from recent test results and return a weakness report with suggested practice areas.

**Authentication:** Required

**Response (with data):**

```json
{
  "report": {
    "weakKeys": [
      { "key": "q", "accuracy": 0.72, "avgSpeed": 280, "totalAttempts": 50 }
    ],
    "slowKeys": [
      { "key": "z", "avgSpeed": 350, "accuracy": 0.95, "totalAttempts": 30 }
    ],
    "suggestions": [
      "Focus on accuracy for: q, x, z",
      "Practice speed for: b, v, p"
    ]
  }
}
```

**Response (no data):**

```json
{
  "report": null,
  "message": "No test results found. Complete some tests first to generate a practice plan."
}
```

**Notes:** Uses actual keystroke event data when available. Falls back to synthesized data from character statistics in test results. Analyzes the last 20 results.

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message description"
}
```

Some endpoints include additional detail:

```json
{
  "error": "Failed to fetch friends",
  "details": "relation \"friendships\" does not exist"
}
```

### Common HTTP Status Codes

| Code | Meaning              | Description                                    |
|------|----------------------|------------------------------------------------|
| 200  | OK                   | Request succeeded                              |
| 201  | Created              | Resource successfully created                  |
| 400  | Bad Request          | Invalid parameters or validation failure       |
| 401  | Unauthorized         | Missing or invalid authentication              |
| 403  | Forbidden            | Authenticated but insufficient permissions     |
| 404  | Not Found            | Resource does not exist                        |
| 409  | Conflict             | Duplicate resource (e.g., username taken)       |
| 410  | Gone                 | Resource expired (e.g., race room)             |
| 500  | Internal Server Error| Unexpected server-side failure                 |
| 503  | Service Unavailable  | Feature not available (database migrations needed) |
