# Encrypted gate hosts

Host models, NH-02's staff, and the shared greeting motion are stored as AES-256-GCM
files in `private/hosts-encrypted/`. The Node API decrypts only requested assets in
memory at `/api/hosts/<id>`. The key and ciphertext are not part of the frontend build.
Small host portrait images remain public for the selection modal.

The greeting waits for saved ownership to load, then fixes the active host for that
page session. Selecting a host saves the next choice without loading its model.
On reload, only the selected, unlocked host and the shared greeting animation load;
NH-02 also loads her staff. Compact mobile greetings use Buddy and load no VRM.

## Updating assets

1. Keep editable originals in ignored `private/hosts-source/`, never `public/`.
2. Use filenames listed in `shared/host-assets.mjs`. Optimization scripts should
   write their final models into this private source directory.
3. Run `npm run hosts:encrypt`. Every encrypted result is decrypted and compared
   with its source. Unchanged assets retain their existing ciphertext.
4. Run `npm run test:hosts` and `npm run build`.
5. Include the encrypted files, catalog, server code and frontend changes in deployment.

The first encryption run generates `HOST_ENCRYPTION_KEY` in ignored `.env.local`
without printing it. Back it up privately. Never use a `VITE_` variable or commit the
key. The script refuses to generate a new key when encrypted assets already exist.
Asset-content tests use this local key; CI without the key skips those specific tests
while still running encryption, API, selection, calendar, and pose tests with fixtures.

## Production

Set `HOST_ENCRYPTION_KEY` in the production server's private environment to the same
value as local `.env.local`. Include `private/hosts-encrypted/`, `server/` and `shared/`
alongside the build, and run the existing Node server with `npm start`.
Restart after changing the key. Missing files, missing/wrong keys or tampering fail
closed with HTTP 503. There is no plaintext static fallback.

Vite development uses the same API and blocks direct access to `private/`.
Static-only hosting and `vite preview` cannot serve these endpoints. Rebuilding
clears legacy models from `dist/`. Previous copies in Git history are not rewritten.

As with music, this encrypts stored assets, not rendered content: a browser must
receive plaintext model data to display it, and the public API can be inspected.
The handler caches at most 64 MiB of decrypted data in server memory and limits
concurrent decryptions to four assets. No decryption key is sent to the browser.
