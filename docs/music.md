# Encrypted music

The player requests `/api/music/<track-id>`. The Node server authenticates and decrypts
AES-256-GCM files in memory, then serves audio with byte-range support for seeking.
No decryption key or encrypted files are included in the browser build. The same API
handler runs in Vite development and the production Node server.

## Files and key

- `shared/music-catalog.mjs`: titles, artists, stable IDs and original filenames.
- `private/music-source/`: original MP3s, local and ignored by Git.
- `private/music-encrypted/*.enc`: encrypted files to commit with the code.
- `.env.local`: ignored local `MUSIC_ENCRYPTION_KEY` (64 hex characters).

Back up the key privately, such as in a password manager. Never commit it, include it
in a `VITE_` variable, or paste it into client code. The encrypt command refuses to
generate a replacement key if encrypted files already exist. Do not delete the key
unless you intend to re-encrypt every track from its original source.

## Adding or updating music

1. Put MP3s in `private/music-source/` (not `public/`). Maximum 32 MiB per track.
2. Update `shared/music-catalog.mjs`, using unique lowercase IDs with optional hyphens.
3. Run `npm run music:encrypt`. The first run creates the local key without printing it.
   Every file is decrypted and compared to its original before it is accepted.
   Unchanged tracks keep their encrypted bytes to avoid needless Git growth.
4. Run `npm run test:music` and `npm run build`.
5. Commit the catalog, encrypted files and code. Remove obsolete `.enc` files when
   removing tracks; remember old versions remain in Git history.

## Production deployment

1. Set **MUSIC_ENCRYPTION_KEY** in the hosting provider's private runtime environment
   to the value already stored in local `.env.local`. Do not generate a different key.
2. Deploy the repository including `server/`, `shared/` and `private/music-encrypted/`.
3. Build with `npm run build`, then run `npm start` from the repository root.
4. Verify `/api/music/volt` returns `audio/mpeg`, and playback and seeking work.

The key is required at runtime, not during the frontend build. Restart the server
after changing it. A missing/wrong key, missing file or failed authentication gives
HTTP 503 without returning audio.
Static-only hosting (including GitHub Pages and `vite preview`) cannot run this API;
use the existing Node server. Rebuild old `dist/` folders so previous public MP3 copies
are removed. The Vite dev server blocks direct access to the private folder.

This protects the files stored in Git. The playback endpoint is public: listeners can
still download or record the audio. Encryption does not make playback website-exclusive.
The server keeps at most 32 MiB of cached plaintext in memory and decrypts up to four
different tracks concurrently; the playback handler never writes plaintext to disk.
