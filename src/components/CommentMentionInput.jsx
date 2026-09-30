import { useEffect, useId, useRef, useState } from "react";
import { findMentionRanges, insertMention, MAX_MENTIONS, mentionQuery, mentionsInText } from "../../shared/comment-mentions.mjs";
import { AtSign, CornerDownLeft } from "lucide-react";

export function CommentMentionInput({ value, onChange, mentions, onMentionsChange, users, disabled, placeholder, label, maxLength }) {
  const id = useId();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(0);
  const [selectionError, setSelectionError] = useState("");
  const match = mentionQuery(value, cursor);
  const query = match?.query.toLocaleLowerCase();
  const pastMention = match && findMentionRanges(value, mentions).some((range) => range.start === match.start && range.end < cursor);
  const open = focused && !disabled && !dismissed && !!match && !pastMention;
  const suggestions = open ? users.filter((user) =>
    (mentions.length < MAX_MENTIONS || mentions.some((selected) => selected.id === user.id)) && user.username.toLocaleLowerCase().includes(query)
  ).slice(0, 6) : [];
  const activeIndex = Math.min(active, Math.max(0, suggestions.length - 1));

  useEffect(() => {
    const option = listRef.current?.children[activeIndex];
    if (!option) return;
    const list = listRef.current;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
    }
  }, [activeIndex, open, query]);

  function selectUser(user) {
    const inserted = insertMention(value, cursor, user, maxLength);
    if (!inserted) { setSelectionError("Not enough room for this mention. Shorten your message first."); return; }
    onChange(inserted.value);
    onMentionsChange(mentionsInText(inserted.value, [...mentions.filter((entry) => entry.id !== user.id), user]));
    setCursor(inserted.cursor);
    setSelectionError("");
    setDismissed(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(inserted.cursor, inserted.cursor);
    });
  }

  return (
    <div className="comment-mention-input" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    }}>
      <label className="comments-input-frame">
        <span aria-hidden="true">&gt;</span>
        <textarea ref={inputRef} aria-label={label} value={value} maxLength={maxLength} disabled={disabled} placeholder={placeholder}
          role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
          aria-activedescendant={suggestions.length ? `${id}-option-${activeIndex}` : undefined} aria-describedby={`${id}-hint`}
          onFocus={() => setFocused(true)}
          onSelect={(event) => setCursor(event.currentTarget.selectionStart)}
          onChange={(event) => {
            onChange(event.target.value);
            onMentionsChange(mentionsInText(event.target.value, mentions));
            setCursor(event.target.selectionStart); setDismissed(false); setActive(0); setSelectionError("");
          }}
          onKeyDown={(event) => {
            if (!open || event.nativeEvent.isComposing) return;
            if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setDismissed(true); }
            if (!suggestions.length) return;
            if (["ArrowDown", "ArrowUp"].includes(event.key)) {
              event.preventDefault();
              setActive((activeIndex + (event.key === "ArrowDown" ? 1 : -1) + suggestions.length) % suggestions.length);
            }
            if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); selectUser(suggestions[activeIndex]); }
          }}
        />
      </label>
      {open ? <div className="comment-mention-suggestions">
        <div className="comment-mention-menu-heading"><span><AtSign size={13} aria-hidden="true" />Mention a player</span><small>{String(suggestions.length).padStart(2, "0")} found</small></div>
        <div className="comment-mention-options" ref={listRef} id={`${id}-list`} role="listbox" aria-label="Guestbook users">
        {suggestions.length ? suggestions.map((user, index) => (
          <button key={user.id} id={`${id}-option-${index}`} type="button" role="option" aria-selected={index === activeIndex}
            onPointerDown={(event) => event.preventDefault()} onClick={() => selectUser(user)}>
            <span className="comment-mention-avatar" aria-hidden="true">{Array.from(user.username)[0]?.toLocaleUpperCase() || "@"}</span>
            <span className="comment-mention-user"><strong>@{user.username}</strong><small>Player · …{user.id.slice(-6)}</small></span>
            <span className="comment-mention-select" aria-hidden="true"><CornerDownLeft size={14} /></span>
          </button>
        )) : <span className="comment-mention-empty">No matching guestbook users.</span>}
        </div>
        <div className="comment-mention-menu-footer" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> select <kbd>esc</kbd> close</span></div>
      </div> : null}
      <small className="comment-mention-hint" id={`${id}-hint`} aria-live="polite">{selectionError || (mentions.length === MAX_MENTIONS ? "Mention limit reached (5 people)." : "Type @ and choose a player to mention them in your sentence.")} Delete their @name to remove the mention.</small>
    </div>
  );
}
