# Admin encounter commands

Open the site terminal with `/` after entering the cabinet. Sign in through Discord using an existing site admin account.

- `leviathan`: opens a portal at a safe footer position, lets Buddy run over and cast, then guarantees the Leviathan sighting after the warning sequence.
- `blackout`: starts the power outage and Buddy's flashlight/repair sequence.
- `powerout` and `power-out`: existing aliases for `blackout`, with identical permissions.
- `help --all`: lists these commands; the terminal also suggests the canonical names while typing.

The receiver verifies `/api/comments/me` on every manual request, including direct browser events. Admin status comes from the server's configured Discord admin IDs, never a local profile flag. Guests, members, expired sessions, and unavailable authentication cannot start manual encounters. Natural random sightings and outages keep their existing behavior.

Successful commands close the terminal and bring Buddy into view. Busy encounters, dragging/landing, attract mode, reduced motion, or an unavailable Buddy report a reason instead of claiming success. No events are queued to start unexpectedly later.

Verification: `npm test` covers the signed-session permission checks, aliases, revoked admins, tampered and expired sessions, and failed authentication. Browser checks cover actual terminal input and the encounter lifecycle.
