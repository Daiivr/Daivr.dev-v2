import { useId, useRef, useState } from "react";
import { MAX_MENTIONS } from "../../shared/comment-mentions.mjs";

export function CommentMentions({ mentions = [], userId }) {
  if (!mentions.length) return null;
  return (
    <div className="comment-mentions" aria-label="Mentioned users">
      {mentions.map((user) => <span className={`comment-mention ${String(user.id) === String(userId) ? "is-you" : ""}`} key={user.id}>@{user.username}{String(user.id) === String(userId) ? " (you)" : ""}</span>)}
    </div>
  );
}

export function CommentMentionInput({ value, onChange, mentions, onMentionsChange, users, disabled, placeholder, label, maxLength }) {
  const id = useId();
  const inputRef = useRef(null);
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(0);
  const match = value.slice(0, cursor).match(/(?:^|\s)@([^@\n]{0,32})$/);
  const query = match?.[1].toLocaleLowerCase();
  const open = focused && !dismissed && !!match && mentions.length < MAX_MENTIONS;
  const suggestions = open ? users.filter((user) => !mentions.some((selected) => selected.id === user.id) && user.username.toLocaleLowerCase().includes(query)).slice(0, 6) : [];
  const activeIndex = Math.min(active, Math.max(0, suggestions.length - 1));

  function selectUser(user) {
    const start = cursor - match[1].length - 1;
    onChange(value.slice(0, start) + value.slice(cursor));
    onMentionsChange([...mentions, user]);
    setCursor(start);
    setDismissed(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(start, start);
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
          onChange={(event) => { onChange(event.target.value); setCursor(event.target.selectionStart); setDismissed(false); setActive(0); }}
          onKeyDown={(event) => {
            if (!open) return;
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
      {open ? <div className="comment-mention-suggestions" id={`${id}-list`} role="listbox" aria-label="Guestbook users">
        {suggestions.length ? suggestions.map((user, index) => (
          <button key={user.id} id={`${id}-option-${index}`} type="button" role="option" aria-selected={index === activeIndex}
            onPointerDown={(event) => event.preventDefault()} onClick={() => selectUser(user)}>
            <span>@{user.username}</span><small>…{user.id.slice(-6)}</small>
          </button>
        )) : <span className="comment-mention-empty">No matching guestbook users.</span>}
      </div> : null}
      {mentions.length ? <div className="comment-mentions" aria-label="Selected mentions">
        {mentions.map((user) => <button className="comment-mention" key={user.id} type="button" disabled={disabled}
          aria-label={`Remove mention of ${user.username}`} onClick={() => onMentionsChange(mentions.filter((entry) => entry.id !== user.id))}>@{user.username} ×</button>)}
      </div> : null}
      <small className="comment-mention-hint" id={`${id}-hint`}>{mentions.length === MAX_MENTIONS ? "Mention limit reached (5)." : "Type @ to select a guestbook user."} Selected tags invite people to reply in this thread.</small>
    </div>
  );
}
