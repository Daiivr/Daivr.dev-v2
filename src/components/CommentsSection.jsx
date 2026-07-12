import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  LogIn,
  LogOut,
  MessageSquare,
  Pin,
  RadioTower,
  Reply,
  Search,
  Send,
  ShieldCheck,
  SmilePlus,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DecodeText } from "./DecodeText";

const COMMENTS_ENDPOINT = "/api/comments";
const COMMENTS_STREAM_ENDPOINT = "/api/comments/stream";
const MAX_COMMENT_LENGTH = 700;
const COMMENTS_PER_PAGE = 5;
const REACTION_ASSETS = [
  { id: "smile", label: "Smile", src: "/assets/reactions/smile.webp" },
  { id: "laugh-tears", label: "Laughing", src: "/assets/reactions/laugh-tears.webp" },
  { id: "heart-eyes", label: "Heart eyes", src: "/assets/reactions/heart-eyes.webp" },
  { id: "surprised-hands", label: "Surprised", src: "/assets/reactions/surprised-hands.webp" },
  { id: "simple-smile", label: "Simple smile", src: "/assets/reactions/simple-smile.webp" },
  { id: "monocle", label: "Inspecting", src: "/assets/reactions/monocle.webp" },
  { id: "sweat", label: "Sweating", src: "/assets/reactions/sweat.webp" },
  { id: "angry", label: "Angry", src: "/assets/reactions/angry.webp" },
  { id: "sparkle-heart", label: "Sparkle heart", src: "/assets/reactions/sparkle-heart.webp" },
  { id: "thumbs-up", label: "Thumbs up", src: "/assets/reactions/thumbs-up.webp" },
  { id: "thumbs-down", label: "Thumbs down", src: "/assets/reactions/thumbs-down.webp" },
  { id: "blank", label: "Blank stare", src: "/assets/reactions/blank.webp" },
  { id: "fire", label: "Fire", src: "/assets/reactions/fire.webp" },
  { id: "party-popper", label: "Party popper", src: "/assets/reactions/party-popper.webp" },
  { id: "sparkles", label: "Sparkles", src: "/assets/reactions/sparkles.webp" },
  { id: "skull", label: "Skull", src: "/assets/reactions/skull.webp" }
];
const FALLBACK_REACTIONS = REACTION_ASSETS.map((reaction) => reaction.id);
const REACTION_ASSET_MAP = Object.fromEntries(REACTION_ASSETS.map((reaction) => [reaction.id, reaction]));
const MARKDOWN_HELP_LINES = [
  "**bold**",
  "*italic*",
  "~~strike~~",
  "`inline code`",
  "==highlight==",
  "^^glow text^^",
  "||spoiler||",
  "> quote",
  "- list item",
  "[link](https://example.com)"
];
let gifScrollUnlockTimer = null;
let gifScrollGuardCleanup = null;

function enableGifScrollGuard() {
  if (typeof window === "undefined" || gifScrollGuardCleanup) return;

  function isInsideGifResults(event) {
    const target = event.target;
    return target instanceof Element && Boolean(target.closest(".comments-gif-grid"));
  }

  function stopBackgroundScroll(event) {
    if (isInsideGifResults(event)) return;
    event.preventDefault();
  }

  document.addEventListener("wheel", stopBackgroundScroll, { capture: true, passive: false });
  document.addEventListener("touchmove", stopBackgroundScroll, { capture: true, passive: false });

  gifScrollGuardCleanup = () => {
    document.removeEventListener("wheel", stopBackgroundScroll, { capture: true });
    document.removeEventListener("touchmove", stopBackgroundScroll, { capture: true });
    gifScrollGuardCleanup = null;
  };
}

function lockGifPageWidth() {
  if (typeof window === "undefined") return;
  if (gifScrollUnlockTimer) window.clearTimeout(gifScrollUnlockTimer);

  const root = document.documentElement;
  const bodyWidth = document.body.getBoundingClientRect().width;
  const lockWidth = Math.round(bodyWidth || root.clientWidth);
  const scrollbarWidth = Math.max(0, window.innerWidth - lockWidth);

  root.style.setProperty("--project-scrollbar-width", `${scrollbarWidth}px`);
  root.style.setProperty("--project-lock-width", `${lockWidth}px`);
  root.classList.add("project-modal-layout-lock");
  document.body.classList.add("project-modal-layout-lock");
  enableGifScrollGuard();
}

function unlockGifPageWidth() {
  if (typeof window === "undefined") return;
  if (gifScrollUnlockTimer) window.clearTimeout(gifScrollUnlockTimer);

  gifScrollUnlockTimer = window.setTimeout(() => {
    const root = document.documentElement;
    root.classList.remove("project-modal-layout-lock");
    document.body.classList.remove("project-modal-layout-lock");
    root.style.removeProperty("--project-scrollbar-width");
    root.style.removeProperty("--project-lock-width");
    gifScrollGuardCleanup?.();
  }, 240);
}

function formatTimestamp(value) {
  if (!value) return "now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatFullTimestamp(value) {
  if (!value) return "Timestamp unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Timestamp unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);
}

function getInitials(name = "?") {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function UserAvatar({ user }) {
  const [failed, setFailed] = useState(false);
  const avatarUrl = failed ? "" : user?.avatarUrl;

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <span>{getInitials(user?.username)}</span>
  );
}

function safeMarkdownUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function parseMarkdownInline(text, keyPrefix = "md") {
  const source = String(text || "");
  const tokenPattern = /(\[([^\]]{1,90})\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|~~([^~]+)~~|==([^=]+)==|\^\^([^^]+)\^\^|\|\|([^|]+)\|\||https?:\/\/[^\s<]+)/g;
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenPattern.exec(source))) {
    if (match.index > lastIndex) nodes.push(source.slice(lastIndex, match.index));
    const key = `${keyPrefix}-${match.index}`;
    const [raw, , linkLabel, linkUrl, code, boldA, boldB, italicA, italicB, strike, mark, glow, spoiler] = match;

    if (linkLabel && linkUrl) {
      const href = safeMarkdownUrl(linkUrl);
      nodes.push(href ? <a href={href} key={key} rel="nofollow noreferrer noopener" target="_blank">{linkLabel}</a> : raw);
    } else if (code) {
      nodes.push(<code key={key}>{code}</code>);
    } else if (boldA || boldB) {
      nodes.push(<strong key={key}>{boldA || boldB}</strong>);
    } else if (italicA || italicB) {
      nodes.push(<em key={key}>{italicA || italicB}</em>);
    } else if (strike) {
      nodes.push(<s key={key}>{strike}</s>);
    } else if (mark) {
      nodes.push(<mark key={key}>{mark}</mark>);
    } else if (glow) {
      nodes.push(<span className="comment-md-glow" key={key}>{glow}</span>);
    } else if (spoiler) {
      nodes.push(<span className="comment-md-spoiler" key={key} tabIndex="0">{spoiler}</span>);
    } else {
      const href = safeMarkdownUrl(raw);
      nodes.push(href ? <a href={href} key={key} rel="nofollow noreferrer noopener" target="_blank">{raw}</a> : raw);
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < source.length) nodes.push(source.slice(lastIndex));
  return nodes;
}

function MarkdownText({ text, compact = false }) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    const value = paragraph.join("\n");
    blocks.push(
      <p key={`p-${blocks.length}`}>
        {parseMarkdownInline(value, `p-${blocks.length}`)}
      </p>
    );
    paragraph = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      blocks.push(<pre key={`code-${blocks.length}`}><code>{codeLines.join("\n")}</code></pre>);
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quoteLines = [trimmed.replace(/^>\s?/, "")];
      while (index + 1 < lines.length && lines[index + 1].trim().startsWith(">")) {
        index += 1;
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
      }
      blocks.push(
        <blockquote key={`quote-${blocks.length}`}>
          {parseMarkdownInline(quoteLines.join(" "), `quote-${blocks.length}`)}
        </blockquote>
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      const items = [trimmed.replace(/^[-*]\s+/, "")];
      while (index + 1 < lines.length && /^[-*]\s+/.test(lines[index + 1].trim())) {
        index += 1;
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
      }
      blocks.push(
        <ul key={`list-${blocks.length}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{parseMarkdownInline(item, `list-${blocks.length}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return <div className={`comment-markdown ${compact ? "is-compact" : ""}`}>{blocks}</div>;
}

function hasContent(text, gifUrl) {
  return text.trim().length > 0 || !!gifUrl;
}

function getReactionAsset(id) {
  return REACTION_ASSET_MAP[id] || { id, label: id, src: "" };
}

function hasAdminReply(comment) {
  return (comment?.replies || []).some((reply) => !!reply.author?.isAdmin);
}

function canReplyToComment(comment, user) {
  if (!comment || !user) return false;
  if (user.isAdmin) return true;
  return !!comment.mine && hasAdminReply(comment);
}

function getReactionPickerStyle(button) {
  const card = button?.closest?.(".comment-card");
  if (!button || !card) return undefined;

  const buttonRect = button.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const viewportHeight = window.visualViewport?.height || window.innerHeight;

  return {
    "--reaction-picker-card-center": `${cardRect.left + cardRect.width / 2}px`,
    "--reaction-picker-button-top": `${viewportHeight - buttonRect.top + 8}px`
  };
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
}

function CommentMedia({ gifUrl }) {
  if (!gifUrl) return null;
  return (
    <a className="comment-gif" href={gifUrl} target="_blank" rel="noreferrer">
      <img src={gifUrl} alt="Attached GIF" loading="lazy" decoding="async" />
    </a>
  );
}

export function CommentsSection() {
  const sectionRef = useRef(null);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState(FALLBACK_REACTIONS);
  const [auth, setAuth] = useState({ configured: false, user: null, loginUrl: "/api/comments/auth/discord", logoutUrl: "/api/comments/auth/logout" });
  const [draft, setDraft] = useState("");
  const [draftGif, setDraftGif] = useState("");
  const [replyingTo, setReplyingTo] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyGif, setReplyGif] = useState("");
  const [gifPicker, setGifPicker] = useState(null);
  const [reactionPickerId, setReactionPickerId] = useState("");
  const [reactionPickerStyle, setReactionPickerStyle] = useState(undefined);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [gifBusy, setGifBusy] = useState(false);
  const [status, setStatus] = useState("booting guestbook stream...");
  const [busy, setBusy] = useState(false);
  const [reactionBusyId, setReactionBusyId] = useState("");
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [markdownHelpOpen, setMarkdownHelpOpen] = useState(false);

  const pinnedCount = useMemo(() => comments.filter((comment) => comment.pinned).length, [comments]);
  const pinnedComments = useMemo(() => comments.filter((comment) => comment.pinned), [comments]);
  const regularComments = useMemo(() => comments.filter((comment) => !comment.pinned), [comments]);
  const totalPages = Math.max(1, Math.ceil(regularComments.length / COMMENTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE;
  const visibleRegularComments = regularComments.slice(startIndex, startIndex + COMMENTS_PER_PAGE);
  const visibleComments = [...pinnedComments, ...visibleRegularComments];
  const canPost = !!auth.user && auth.configured && hasContent(draft, draftGif) && !busy;
  const draftPercent = Math.min(100, (draft.length / MAX_COMMENT_LENGTH) * 100);
  const meterWidth = `${draftPercent}%`;

  function applyPayload(payload) {
    if (Array.isArray(payload.comments)) setComments(payload.comments);
    if (payload.auth) setAuth((current) => ({ ...current, ...payload.auth }));
    if (Array.isArray(payload.reactions) && payload.reactions.length) setReactions(payload.reactions);
  }

  async function loadComments() {
    try {
      const response = await fetch(COMMENTS_ENDPOINT, { credentials: "include" });
      if (!response.ok) throw new Error(`Comments returned ${response.status}`);
      const payload = await response.json();
      applyPayload(payload);
      setStatus("guestbook stream live");
    } catch {
      setStatus("comment stream offline");
    }
  }

  useEffect(() => {
    loadComments();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
          detail: { type: "guestbook" }
        }));
        observer.disconnect();
      },
      { threshold: 0.25 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return undefined;

    const stream = new EventSource(COMMENTS_STREAM_ENDPOINT, { withCredentials: true });

    function handleStreamMessage(event) {
      try {
        const payload = JSON.parse(event.data);
        applyPayload(payload);
        setStatus("guestbook stream live");
      } catch {
        setStatus("live stream payload error");
      }
    }

    function handleStreamOpen() {
      setStatus("guestbook stream live");
    }

    function handleStreamError() {
      setStatus("live stream reconnecting...");
    }

    // Presencia en vivo: se re-emite como evento global para el footer y el buddy.
    function handlePresence(event) {
      try {
        const payload = JSON.parse(event.data);
        if (typeof payload.count === "number") {
          window.dispatchEvent(new CustomEvent("daivr-presence", { detail: { count: payload.count } }));
        }
      } catch {
        // Payload de presencia invalido: se ignora sin romper el stream.
      }
    }

    stream.addEventListener("presence:update", handlePresence);
    stream.addEventListener("comments:init", handleStreamMessage);
    stream.addEventListener("comments:update", handleStreamMessage);
    stream.addEventListener("comments:create", handleStreamMessage);
    stream.addEventListener("comments:reply", handleStreamMessage);
    stream.addEventListener("comments:delete", handleStreamMessage);
    stream.addEventListener("comments:reaction", handleStreamMessage);
    stream.addEventListener("comments:pin", handleStreamMessage);
    stream.addEventListener("open", handleStreamOpen);
    stream.addEventListener("error", handleStreamError);

    return () => {
      stream.close();
    };
  }, []);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!reactionPickerId) return undefined;

    function closeReactionPicker(event) {
      if (event.target.closest?.(".reaction-picker-wrapper, .reaction-picker")) return;
      setReactionPickerId("");
      setReactionPickerStyle(undefined);
    }

    window.addEventListener("pointerdown", closeReactionPicker);
    return () => window.removeEventListener("pointerdown", closeReactionPicker);
  }, [reactionPickerId]);

  useEffect(() => {
    if (!gifPicker) return undefined;

    lockGifPageWidth();

    function closeOnEscape(event) {
      if (event.key === "Escape") closeGifPicker();
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      unlockGifPageWidth();
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [gifPicker]);

  useEffect(() => () => unlockGifPageWidth(), []);

  useEffect(() => {
    if (!deleteDialog) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setDeleteDialog(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [deleteDialog]);

  async function submitComment(event) {
    event.preventDefault();
    if (!canPost) return;

    setBusy(true);
    setStatus("transmitting comment...");
    try {
      const response = await fetch(COMMENTS_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft, gifUrl: draftGif })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Comment failed");
      applyPayload(payload);
      setDraft("");
      setDraftGif("");
      setPage(1);
      setStatus("comment stored");
    } catch (error) {
      setStatus(error.message || "comment failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitReply(commentId) {
    const targetComment = comments.find((comment) => String(comment.id) === String(commentId));
    if (!canReplyToComment(targetComment, auth.user)) {
      setStatus("only admins can reply unless they answered your thread");
      return;
    }
    if (!hasContent(replyDraft, replyGif) || busy) return;

    setBusy(true);
    setStatus("transmitting reply...");
    try {
      const response = await fetch(`${COMMENTS_ENDPOINT}/${commentId}/replies`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyDraft, gifUrl: replyGif })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Reply failed");
      applyPayload(payload);
      setReplyingTo("");
      setReplyDraft("");
      setReplyGif("");
      setStatus("reply stored");
    } catch (error) {
      setStatus(error.message || "reply failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(commentId) {
    if (!auth.user || busy) return;

    setBusy(true);
    try {
      const response = await fetch(`${COMMENTS_ENDPOINT}/${commentId}`, { method: "DELETE", credentials: "include" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Delete failed");
      applyPayload(payload);
      setDeleteDialog(null);
      setStatus("comment deleted");
    } catch (error) {
      setStatus(error.message || "delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReply(commentId, replyId) {
    if (!auth.user || busy) return;

    setBusy(true);
    try {
      const response = await fetch(`${COMMENTS_ENDPOINT}/${commentId}/replies/${replyId}`, { method: "DELETE", credentials: "include" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Delete failed");
      applyPayload(payload);
      setDeleteDialog(null);
      setStatus("reply deleted");
    } catch (error) {
      setStatus(error.message || "delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleReaction(commentId, emoji) {
    const reactionKey = `${commentId}:${emoji}`;
    if (!auth.user) {
      setStatus(auth.configured ? "connect Discord to react" : "Discord OAuth needs env keys");
      return;
    }
    if (reactionBusyId) return;

    setReactionBusyId(reactionKey);
    try {
      const response = await fetch(`${COMMENTS_ENDPOINT}/${commentId}/reactions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Reaction failed");
      applyPayload(payload);
      setStatus("reaction synced");
    } catch (error) {
      setStatus(error.message || "reaction failed");
    } finally {
      setReactionBusyId("");
    }
  }

  function chooseReaction(commentId, emoji) {
    toggleReaction(commentId, emoji);
    setReactionPickerId("");
  }

  async function togglePin(commentId) {
    if (!auth.user?.isAdmin || busy) return;

    setBusy(true);
    try {
      const response = await fetch(`${COMMENTS_ENDPOINT}/${commentId}/pin`, { method: "POST", credentials: "include" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Pin failed");
      applyPayload(payload);
      setStatus("pin state updated");
    } catch (error) {
      setStatus(error.message || "pin failed");
    } finally {
      setBusy(false);
    }
  }

  function startReply(comment) {
    if (!auth.user) {
      setStatus(auth.configured ? "connect Discord to reply" : "Discord OAuth needs env keys");
      return;
    }
    if (!canReplyToComment(comment, auth.user)) {
      setStatus("only admins can reply unless they answered your thread");
      return;
    }
    setReplyingTo((current) => (current === comment.id ? "" : comment.id));
    setReplyDraft("");
    setReplyGif("");
    setGifPicker(null);
  }

  function openGifPicker(target, commentId = "") {
    if (!auth.user) {
      setStatus(auth.configured ? "connect Discord to attach GIFs" : "Discord OAuth needs env keys");
      return;
    }
    setGifQuery("");
    setGifResults([]);
    setGifPicker({ target, commentId });
    setStatus("GIF picker ready");
  }

  function closeGifPicker() {
    setGifPicker(null);
    setGifBusy(false);
  }

  async function searchGifs(query = gifQuery) {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setGifResults([]);
      setStatus("type a GIF search first");
      return;
    }

    setGifBusy(true);
    setStatus("searching GIF signal...");
    try {
      const response = await fetch(`${COMMENTS_ENDPOINT}/gifs?q=${encodeURIComponent(cleanQuery)}`, { credentials: "include" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "GIF search failed");
      setGifResults(Array.isArray(payload.gifs) ? payload.gifs : []);
      setStatus(payload.gifs?.length ? "GIF results loaded" : payload.error || "no GIF results");
    } catch (error) {
      setStatus(error.message || "GIF search failed");
    } finally {
      setGifBusy(false);
    }
  }

  function selectGif(url) {
    if (gifPicker?.target === "reply") setReplyGif(url);
    else setDraftGif(url);
    setGifPicker(null);
    setStatus("GIF attached");
  }

  function clearGif(target = "comment") {
    if (target === "reply") setReplyGif("");
    else setDraftGif("");
  }

  function openDeleteComment(comment) {
    setDeleteDialog({
      type: "comment",
      commentId: comment.id,
      title: "Delete comment?",
      body: comment.mine ? "This removes your comment from the guestbook stream." : "This removes the selected comment as admin."
    });
  }

  function openDeleteReply(comment, reply) {
    setDeleteDialog({
      type: "reply",
      commentId: comment.id,
      replyId: reply.id,
      title: "Delete reply?",
      body: reply.mine ? "This removes your reply from the thread." : "This removes the selected reply as admin."
    });
  }

  function confirmDelete() {
    if (!deleteDialog || busy) return;
    if (deleteDialog.type === "reply") {
      deleteReply(deleteDialog.commentId, deleteDialog.replyId);
      return;
    }
    deleteComment(deleteDialog.commentId);
  }

  const gifModal = gifPicker && typeof document !== "undefined"
    ? createPortal(
        <div className="comments-gif-modal" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeGifPicker();
        }}>
          <div className="comments-gif-dialog" role="dialog" aria-modal="true" aria-labelledby="comments-gif-title">
            <header className="comments-gif-dialog-head">
              <div>
                <span>GIF uplink</span>
                <h3 id="comments-gif-title">Search Klipy</h3>
              </div>
              <button className="has-tooltip" data-tooltip="Close GIF picker." type="button" onClick={closeGifPicker} aria-label="Close GIF picker"><X size={16} aria-hidden="true" /></button>
            </header>
            <form className="comments-gif-search" onSubmit={(event) => { event.preventDefault(); searchGifs(); }}>
              <Search size={15} aria-hidden="true" />
              <input
                value={gifQuery}
                onChange={(event) => setGifQuery(event.target.value)}
                placeholder="search GIFs..."
              />
              <button className="has-tooltip" data-tooltip="Search Klipy for GIFs." type="submit" disabled={gifBusy || !gifQuery.trim()}>search</button>
            </form>
            <div className="comments-gif-grid">
              {gifResults.map((url) => (
                <button className="has-tooltip" data-tooltip="Attach this GIF." type="button" key={url} onClick={() => selectGif(url)}>
                  <img src={url} alt="GIF result" loading="lazy" decoding="async" />
                </button>
              ))}
              {!gifBusy && !gifResults.length ? <p>{gifQuery.trim() ? "No GIFs loaded. Try another search." : "Search for a GIF to attach."}</p> : null}
              {gifBusy ? <p>Searching GIF signal...</p> : null}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const deleteModal = deleteDialog && typeof document !== "undefined"
    ? createPortal(
        <div className="comments-delete-modal" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) setDeleteDialog(null);
        }}>
          <div className="comments-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="comments-delete-title">
            <header>
              <span>destructive command</span>
              <h3 id="comments-delete-title">{deleteDialog.title}</h3>
            </header>
            <p>{deleteDialog.body}</p>
            <div className="comments-delete-actions">
              <button type="button" onClick={() => setDeleteDialog(null)} disabled={busy}>cancel</button>
              <button className="is-danger" type="button" onClick={confirmDelete} disabled={busy}>
                <Trash2 size={14} aria-hidden="true" />
                delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const shouldPortalReactionPicker = isMobileViewport();

  return (
    <section className="py-16 md:py-24" id="contact" ref={sectionRef}>
      <div className="comments-section-heading">
        <DecodeText as="p" className="pixel-label" duration={520} text="OPEN CHANNEL" />
        <DecodeText
          as="h2"
          className="font-display text-[clamp(2rem,4.6vw,4.2rem)] font-black uppercase leading-[.95] text-white"
          delay={140}
          duration={980}
          text="Comments on the machine."
        />
      </div>

      <div className="comments-console panel-strong">
        <header className="comments-console-titlebar">
          <div className="comments-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>~/daivr/guestbook.stream</span>
          <div className="comments-titlebar-actions">
            <span className="has-tooltip" data-tooltip="Updates after each comment action without reloading the page." tabIndex="0"><RadioTower size={13} aria-hidden="true" /> live</span>
          </div>
        </header>

        <div className="comments-console-head">
          <div className="comments-console-summary">
            <p>Discord-auth messages, pinned signals, GIF drops, replies, and quick reactions from the arcade cabinet.</p>
            <div className="comments-console-meta">
              <span className="has-tooltip" data-tooltip="Messages are stored in the local guestbook stream." tabIndex="0"><MessageSquare size={13} aria-hidden="true" /> {comments.length} comments</span>
              <span className="has-tooltip" data-tooltip="Pinned messages stay at the top of the stream." tabIndex="0"><Pin size={13} aria-hidden="true" /> {pinnedCount} pinned</span>
              <span className={`has-tooltip ${auth.user ? "is-online" : ""}`} data-tooltip={auth.user ? "Discord session is linked." : "Read-only until Discord is connected."} tabIndex="0">{auth.user ? "discord linked" : "guest mode"}</span>
            </div>
          </div>

          <div className="comments-auth-panel">
            {auth.user ? (
              <>
                <div className="comments-user-chip">
                  <UserAvatar user={auth.user} />
                  <strong>{auth.user.username}</strong>
                  {auth.user.isAdmin ? <em><ShieldCheck size={12} aria-hidden="true" /> admin</em> : null}
                </div>
                <a className="comments-auth-btn is-secondary has-tooltip" data-tooltip="End the Discord guestbook session." href={auth.logoutUrl || "/api/comments/auth/logout"}>
                  <LogOut size={15} aria-hidden="true" />
                  log out
                </a>
              </>
            ) : (
              <>
                <a className={`comments-auth-btn has-tooltip ${auth.configured ? "" : "is-disabled"}`} data-tooltip={auth.configured ? "Use Discord identify to post and react." : "Add Discord OAuth env keys to enable login."} href={auth.configured ? auth.loginUrl : undefined} aria-disabled={!auth.configured}>
                  <LogIn size={15} aria-hidden="true" />
                  connect Discord
                </a>
                {!auth.configured ? <small>OAuth env keys pending</small> : null}
              </>
            )}
          </div>
        </div>

        <form className="comments-composer" onSubmit={submitComment}>
          <div className="comments-composer-top">
            <span>$ comment --discord-auth</span>
            <div className="comments-composer-tools">
              <div className="comments-markdown-help-wrap">
                <button
                  className="comments-markdown-help-btn"
                  type="button"
                  aria-expanded={markdownHelpOpen}
                  aria-controls="comments-markdown-help"
                  onClick={() => setMarkdownHelpOpen((current) => !current)}
                  onBlur={(event) => {
                    if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setMarkdownHelpOpen(false);
                  }}
                >
                  markdown
                </button>
                {markdownHelpOpen ? (
                  <div className="comments-markdown-help" id="comments-markdown-help" role="tooltip" tabIndex="-1">
                    {MARKDOWN_HELP_LINES.map((line) => (
                      <code key={line}>{line}</code>
                    ))}
                  </div>
                ) : null}
              </div>
              <span>{status}</span>
            </div>
          </div>
          <label className="comments-input-frame">
            <span aria-hidden="true">&gt;</span>
            <textarea
              value={draft}
              maxLength={MAX_COMMENT_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={auth.user ? "Write a signal for the guestbook..." : auth.configured ? "Connect Discord to write here..." : "Discord OAuth is not configured yet..."}
              disabled={!auth.user || !auth.configured || busy}
            />
          </label>
          {draftGif ? (
            <div className="comments-gif-preview">
              <button className="has-tooltip" data-tooltip="Remove attached GIF" type="button" onClick={() => clearGif()} aria-label="Remove attached GIF"><X size={14} aria-hidden="true" /></button>
              <img src={draftGif} alt="Selected GIF preview" />
            </div>
          ) : null}
          <div className="comments-composer-footer">
            <div className="comments-length-meter" aria-hidden="true">
              <span style={{ width: meterWidth }} />
            </div>
            <span className="comments-count-readout">{draft.length}/{MAX_COMMENT_LENGTH}</span>
            <button className="comments-gif-btn has-tooltip" data-tooltip="Search and attach a GIF to this comment." type="button" disabled={!auth.user || busy} onClick={() => openGifPicker("comment")}>
              <ImageIcon size={15} aria-hidden="true" />
              GIF
            </button>
            <button className="has-tooltip" data-tooltip={canPost ? "Send this comment to the guestbook." : "Write a message or attach a GIF first."} type="submit" disabled={!canPost}>
              <Send size={15} aria-hidden="true" />
              send
            </button>
          </div>
        </form>

        {gifModal}

        {deleteModal}

        <div className="comments-stream" aria-live="polite">
          {visibleComments.map((comment) => {
            const reactionEntries = Object.entries(comment.reactions || {}).filter(([, ids]) => Array.isArray(ids) && ids.length > 0);
            const canDeleteComment = !!auth.user && (auth.user.isAdmin || comment.mine);
            const canReplyComment = canReplyToComment(comment, auth.user);
            const isReplying = replyingTo === comment.id;
            const canSendReply = canReplyComment && hasContent(replyDraft, replyGif) && !busy;
            const reactionMap = comment.reactions && typeof comment.reactions === "object" ? comment.reactions : {};

            return (
              <article className={`comment-card is-terminal-transmission ${comment.pinned ? "is-pinned" : ""}`} key={comment.id}>
                {comment.pinned ? <span className="comment-pinned-badge"><Pin size={12} aria-hidden="true" /> pinned</span> : null}
                <span className="comment-transmission-badge" aria-hidden="true">incoming transmission</span>
                <div className="comment-avatar">
                  <UserAvatar user={comment.author} />
                </div>
                <div className="comment-body">
                  <header className="comment-card-head">
                    <strong>{comment.author?.username || "Unknown signal"}</strong>
                    {comment.author?.isAdmin ? <em className="comment-admin-badge"><ShieldCheck size={11} aria-hidden="true" /> admin</em> : null}
                    <span className="comment-time has-tooltip" data-tooltip={formatFullTimestamp(comment.createdAt)} tabIndex="0">{formatTimestamp(comment.createdAt)}</span>
                    <div className="comment-actions">
                      {canReplyComment ? (
                        <button className="has-tooltip" data-tooltip={isReplying ? "Close reply composer." : auth.user?.isAdmin ? "Reply as admin." : "Reply in your admin-answered thread."} type="button" onClick={() => startReply(comment)} aria-label={isReplying ? "Cancel reply" : "Reply"}>
                          <Reply size={13} aria-hidden="true" />
                        </button>
                      ) : null}
                      {auth.user?.isAdmin ? (
                        <button className="has-tooltip" data-tooltip={comment.pinned ? "Unpin this comment." : "Pin this comment to the top."} type="button" onClick={() => togglePin(comment.id)} aria-label={comment.pinned ? "Unpin comment" : "Pin comment"}>
                          <Pin size={13} aria-hidden="true" />
                        </button>
                      ) : null}
                      {canDeleteComment ? (
                        <button className="is-danger has-tooltip" data-tooltip={comment.mine ? "Delete your comment." : "Admin delete comment."} type="button" onClick={() => openDeleteComment(comment)} aria-label="Delete comment">
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </header>
                  {comment.text ? <MarkdownText text={comment.text} /> : null}
                  <CommentMedia gifUrl={comment.gifUrl} />

                  <div className="comment-reactions">
                    {reactionEntries.map(([reactionId, ids]) => {
                      const reaction = getReactionAsset(reactionId);
                      const mine = !!auth.user && ids.includes(auth.user.id);
                      const isHeart = reactionId === "sparkle-heart" || reactionId === "heart-eyes";
                      const reactionKey = `${comment.id}:${reactionId}`;
                      return (
                        <button className={`reaction-chip has-tooltip ${mine ? "is-mine" : ""} ${isHeart ? "is-heart" : ""}`} data-tooltip={mine ? `Remove ${reaction.label} reaction.` : `React with ${reaction.label}.`} type="button" key={reactionId} onClick={() => toggleReaction(comment.id, reactionId)} disabled={!!reactionBusyId && reactionBusyId !== reactionKey}>
                          {reaction.src ? <img className="reaction-emoji" src={reaction.src} alt="" aria-hidden="true" /> : <span className="reaction-emoji">{reaction.label}</span>}
                          <b>{ids.length}</b>
                        </button>
                      );
                    })}
                    <div className="reaction-picker-wrapper">
                      <button
                        className="reaction-add-btn has-tooltip"
                        data-tooltip={auth.user ? "Add a reaction." : "Connect Discord to react."}
                        type="button"
                        onClick={(event) => {
                          if (!auth.user) {
                            setStatus(auth.configured ? "connect Discord to react" : "Discord OAuth needs env keys");
                            return;
                          }
                          const nextStyle = isMobileViewport() ? getReactionPickerStyle(event.currentTarget) : undefined;
                          setReactionPickerId((current) => {
                            if (current === comment.id) {
                              setReactionPickerStyle(undefined);
                              return "";
                            }
                            setReactionPickerStyle(nextStyle);
                            return comment.id;
                          });
                        }}
                        aria-expanded={reactionPickerId === comment.id}
                        aria-label="Add reaction"
                      >
                        <span aria-hidden="true">+</span>
                        <SmilePlus size={14} aria-hidden="true" />
                      </button>
                      {reactionPickerId === comment.id ? (() => {
                        const picker = (
                          <div className="reaction-picker" role="menu" aria-label="Choose reaction" style={shouldPortalReactionPicker ? reactionPickerStyle : undefined}>
                            {reactions.map((reactionId) => {
                              const reaction = getReactionAsset(reactionId);
                              const active = !!auth.user && (reactionMap[reactionId] || []).includes(auth.user.id);
                              const reactionKey = `${comment.id}:${reactionId}`;
                              return (
                                <button
                                  className={`reaction-picker-item ${active ? "is-active" : ""}`}
                                  type="button"
                                  key={reactionId}
                                  onClick={() => chooseReaction(comment.id, reactionId)}
                                  aria-label={`React with ${reaction.label}`}
                                  disabled={!!reactionBusyId && reactionBusyId !== reactionKey}
                                >
                                  {reaction.src ? <img className="reaction-emoji" src={reaction.src} alt="" aria-hidden="true" /> : reaction.label}
                                </button>
                              );
                            })}
                          </div>
                        );
                        return shouldPortalReactionPicker && typeof document !== "undefined" ? createPortal(picker, document.body) : picker;
                      })() : null}
                    </div>
                  </div>

                  {Array.isArray(comment.replies) && comment.replies.length ? (
                    <div className="comment-replies">
                      {comment.replies.map((reply) => {
                        const canDeleteReply = !!auth.user && (auth.user.isAdmin || reply.mine);
                        return (
                          <div className="comment-reply" key={reply.id}>
                            <div className="comment-reply-avatar">
                              <UserAvatar user={reply.author} />
                            </div>
                            <div>
                              <header>
                                <strong>{reply.author?.username || "Unknown signal"}</strong>
                                {reply.author?.isAdmin ? <em className="comment-admin-badge"><ShieldCheck size={10} aria-hidden="true" /> admin</em> : null}
                                <span className="comment-time has-tooltip" data-tooltip={formatFullTimestamp(reply.createdAt)} tabIndex="0">{formatTimestamp(reply.createdAt)}</span>
                                {canDeleteReply ? (
                                  <button className="has-tooltip" data-tooltip={reply.mine ? "Delete your reply." : "Admin delete reply."} type="button" onClick={() => openDeleteReply(comment, reply)} aria-label="Delete reply">
                                    <Trash2 size={12} aria-hidden="true" />
                                  </button>
                                ) : null}
                              </header>
                              {reply.text ? <MarkdownText compact text={reply.text} /> : null}
                              <CommentMedia gifUrl={reply.gifUrl} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {isReplying ? (
                    <form className="comment-reply-form" onSubmit={(event) => { event.preventDefault(); submitReply(comment.id); }}>
                      <label className="comments-input-frame">
                        <span aria-hidden="true">&gt;</span>
                        <textarea
                          value={replyDraft}
                          maxLength={MAX_COMMENT_LENGTH}
                          onChange={(event) => setReplyDraft(event.target.value)}
                          placeholder={`Reply to ${comment.author?.username || "this comment"}...`}
                          disabled={busy}
                        />
                      </label>
                      {replyGif ? (
                        <div className="comments-gif-preview is-reply-preview">
                          <button className="has-tooltip" data-tooltip="Remove reply GIF" type="button" onClick={() => clearGif("reply")} aria-label="Remove reply GIF"><X size={14} aria-hidden="true" /></button>
                          <img src={replyGif} alt="Selected reply GIF preview" />
                        </div>
                      ) : null}
                      <div className="comment-reply-actions">
                        <button className="has-tooltip" data-tooltip="Search and attach a GIF to this reply." type="button" onClick={() => openGifPicker("reply", comment.id)} disabled={busy}>
                          <ImageIcon size={14} aria-hidden="true" />
                          GIF
                        </button>
                        <button className="has-tooltip" data-tooltip="Close reply composer." type="button" onClick={() => startReply(comment)}>cancel</button>
                        <button className="has-tooltip" data-tooltip={canSendReply ? "Send this reply." : "Write a reply or attach a GIF first."} type="submit" disabled={!canSendReply}>
                          <Send size={14} aria-hidden="true" />
                          reply
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}

          {!comments.length ? (
            <div className="comments-empty-state">
              <MessageSquare size={15} aria-hidden="true" />
              <span>No comments in the stream yet.</span>
            </div>
          ) : null}

          {regularComments.length > COMMENTS_PER_PAGE ? (
            <nav className="comments-pagination" aria-label="Comment pages">
              <span>
                page {currentPage} / {totalPages}
                <b>{regularComments.length} regular comments</b>
              </span>
              <div>
                <button
                  className="has-tooltip"
                  data-tooltip="Previous comment page."
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous comments page"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                  prev
                </button>
                <button
                  className="has-tooltip"
                  data-tooltip="Next comment page."
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next comments page"
                >
                  next
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  );
}
