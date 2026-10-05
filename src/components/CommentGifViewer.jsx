import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { Download, Heart, Image as ImageIcon, X } from "lucide-react";
import { canProxyGif } from "../../shared/comment-gifs.mjs";

export function CommentGifDialog({ title, description, open = true, onClose, returnFocusRef, variant = "", children }) {
  return <Dialog.Root open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="comments-gif-modal motion-backdrop" />
      <Dialog.Content className={`comments-gif-dialog motion-panel is-accessible ${variant}`} onCloseAutoFocus={(event) => { event.preventDefault(); returnFocusRef?.current?.focus({ preventScroll: true }); }}>
        <header className="comments-gif-dialog-head">
          <div><span><ImageIcon size={12} aria-hidden="true" /> GIF collection</span><Dialog.Title asChild><h3>{title}</h3></Dialog.Title></div>
          <Dialog.Close asChild><button type="button" aria-label={`Close ${title.toLowerCase()}`}><X size={18} aria-hidden="true" /></button></Dialog.Close>
        </header>
        <Dialog.Description className="comments-gif-description">{description}</Dialog.Description>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function CommentGifViewer({ url, open, onClose, returnFocusRef, favorites, signedIn, loginUrl, canSignIn }) {
  const [imageState, setImageState] = useState("loading");
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const downloadRef = useRef(null);
  const imageRef = useRef(null);
  const saved = favorites.favorites.includes(url);
  useEffect(() => {
    if (imageRef.current?.complete) setImageState(imageRef.current.naturalWidth ? "loaded" : "error");
    return () => downloadRef.current?.abort();
  }, []);

  async function download() {
    if (downloadRef.current) return;
    const controller = new AbortController();
    downloadRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 30_000);
    setDownloading(true); setMessage("");
    try {
      const response = await fetch(canProxyGif(url) ? `/api/comments/gifs/download?url=${encodeURIComponent(url)}` : url, { signal: controller.signal, credentials: "omit" });
      if (!response.ok) throw new Error("This GIF could not be downloaded. Try again.");
      const blob = await response.blob();
      if (!/^image\/(gif|webp|png)(;|$)/i.test(blob.type) || !blob.size) throw new Error("The link did not return a downloadable image.");
      if (blob.size > 25 * 1024 * 1024) throw new Error("This GIF is too large to download here.");
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `guestbook-gif.${blob.type.split("/")[1].split(";")[0]}`;
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      setMessage("Download started.");
    } catch (error) {
      setMessage(error.name === "AbortError" ? "Download timed out. Please try again." : error instanceof TypeError ? "This image host blocked the download. Try another GIF." : error.message);
    } finally { window.clearTimeout(timer); downloadRef.current = null; setDownloading(false); }
  }

  return <CommentGifDialog title="GIF preview" description="Keep a favorite for your next reply, or download a copy." open={open} onClose={onClose} returnFocusRef={returnFocusRef} variant="is-viewer">
    <div className={`comments-gif-stage is-${imageState}`} aria-busy={imageState === "loading"}>
      {imageState !== "loaded" ? <p role="status">{imageState === "error" ? "This GIF is unavailable. You can still save its link as a favorite." : "Loading GIF…"}</p> : null}
      <img ref={imageRef} src={url} alt="GIF shared in the guestbook" onLoad={() => setImageState("loaded")} onError={() => setImageState("error")} />
    </div>
    <div className="comments-gif-viewer-actions">
      <button type="button" onClick={download} disabled={downloading}><Download size={16} aria-hidden="true" />{downloading ? "Downloading…" : "Download"}</button>
      <button type="button" className="comments-gif-favorite" aria-pressed={saved} disabled={!signedIn || favorites.loading || favorites.saving || !!favorites.error} onClick={async () => {
        try { setMessage(await favorites.toggleFavorite(url) || ""); } catch (error) { setMessage(error.message); }
      }}><Heart size={16} fill={saved ? "currentColor" : "none"} aria-hidden="true" />{favorites.saving ? "Saving…" : saved ? "Favorited" : "Favorite"}</button>
    </div>
    {!signedIn ? <p className="comments-gif-description">{canSignIn ? <a href={loginUrl}>Connect Discord</a> : "Sign-in is currently unavailable"} to save favorites to your account.</p> : null}
    {favorites.error ? <p className="comments-gif-feedback" role="status">{favorites.error} <button type="button" onClick={favorites.reload}>Retry favorites</button></p> : null}
    <p className="comments-gif-feedback" role="status">{message}</p>
  </CommentGifDialog>;
}
