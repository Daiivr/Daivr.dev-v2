# Community and cabinet features

The site uses the existing Node server and a single writable persistent data directory. Run one server process against that directory. Multiple writers or replicas require a transactional database; these JSON stores are not a shared database.

## Configuration and storage

`npm start` requires `COMMENTS_SESSION_SECRET` (or `JWT_SECRET`). Use a long random secret; keep the same value across restarts to preserve Discord sessions. The known development fallback is rejected by the production server. Vite development retains its local fallback.

Set `COMMENTS_DATA_DIR` or `DATA_DIR` to a persistent volume. Backups on an ephemeral deployment directory do not survive a redeploy. Back up that volume externally as well.

Comments, preferences, inbox read markers, posting history, and passports use atomic replacement: write a temporary file, flush it, then rename it. Each store retains the previous healthy revision in `.bak` and seven rotating `.day-N.bak` copies. If the primary file is missing, corrupt, or fails validation, the reader restores a valid recovery copy. If no copy is valid, requests fail without replacing the damaged data with an empty store. Recovery can lose changes after the latest healthy snapshot; restore an external backup if needed. Existing comments are read without a migration.

## Community

- Mentions grant access to a thread. Authors, admins, and existing participants can also reply.
- Inbox events include mentions and replies after someone joins a conversation, excluding their own messages. The latest 100 notifications are shown. Read markers are stored per Discord account and broadcast to connected guestbook tabs.
- Links use `/#comment-ID` and `/#reply-ID`. Following one opens the appropriate page and expands its thread. Deleted links show an unavailable message.
- Comment and active reply drafts, including GIFs and mention selections, are stored on the current device per Discord account for up to 30 days. They are not synced across devices. Sending or cancelling clears the relevant draft. Browser storage may be unavailable in restricted contexts.
- Posts and replies share an 8-second cooldown and 30-per-hour limit. Identical text/GIF submissions are limited to once per minute. Posting history survives deletions and restarts. Requests above 16 KiB are rejected; mutation requests from other origins are rejected.
- These are on-site notifications; no email or Discord DM is sent.

## Player passport and daily challenge

The Player button opens the signed-in visitor's passport, personal bests, favorite game, earned title, accent, and up to three badges. Buddy level and quest count come from existing saved buddy progress. Personal bests come from Tower Block, Cross Road, Space Cadet, and Drive Mad. Passport edits are validated against earned rewards.

The daily challenge rotates between Tower Block (20 blocks), Cross Road (75 points), and Space Cadet (500,000 points). Targets were calibrated against the public leaderboards on September 30, 2026: Tower Block 38/26, Cross Road 282/144, and Space Cadet 1,376,250/1,365,000. Targets stay fixed during a day; they do not change with live rankings. Everyone gets the same challenge for the UTC date; it resets at 00:00 UTC. Sign in before playing. A completed run must pass the game's existing server validation. Challenge progress uses that day's run, not an all-time record. Meeting the target automatically awards one completion, a passport title, and a matching accent; repeated runs cannot award another completion for the same day. Previously completed challenges remain credited after a target rebalance. These are cosmetic rewards. Existing game validation checks bounds and timing; it does not cryptographically verify a game replay.

Completion badges unlock at 1, 7, 25, 50, 100, 250, and 365 daily wins. Streak badges unlock at 3, 7, 14, 30, 60, and 100 consecutive UTC days. A streak remains active if the last completion was today or yesterday; missing a whole UTC day resets the current streak. Streak badges use the best recorded streak and remain earned after a break. Existing completion totals and badge IDs are preserved. Streaks are backfilled from saved completion dates (older stores retained only the last 90 completions; missing history cannot be inferred). All completion dates are now retained so future long streaks and awards remain verifiable. The collection shows locked milestones and progress; only earned badges can be featured, with a maximum of three.

## Projects and mobile navigation

On screens below 1024px, the sidebar is collapsed behind Menu, with Buddy directly accessible. Desktop navigation stays expanded. The project stories are in `src/data/projectStories.js`. Links use `/#project-tradedex` and `/#project-palwatch`; they open the project after the entry greeting. The stories describe documented functionality and contain no invented adoption metrics.

## Asset caching

The production build generates `dist/.vite/manifest.json`. Only exact build outputs listed there receive year-long immutable caching. Other static files revalidate with ETags; HTML uses `no-cache`. Deploy the complete `dist` directory, including its manifest. Older builds without a manifest safely revalidate every asset.

## Checks

Run `node --test scripts/test-comment-mentions.mjs scripts/test-community.mjs` and `npm run build`. API tests use temporary directories and synthetic sessions, never production data.
