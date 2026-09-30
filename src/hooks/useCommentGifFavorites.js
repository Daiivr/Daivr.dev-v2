import { useCallback, useEffect, useRef, useState } from "react";

const ENDPOINT = "/api/comments/gifs/favorites";

export function useCommentGifFavorites(userId) {
  const owner = userId || "";
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const requestRef = useRef(null);
  const savingRef = useRef(false);
  const [state, setState] = useState({ owner: "", favorites: [], loading: false, saving: false, error: "" });

  const reload = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setState((current) => ({ owner, favorites: current.owner === owner ? current.favorites : [], loading: !!owner, saving: false, error: "" }));
    if (!owner) return;
    try {
      const response = await fetch(ENDPOINT, { credentials: "include", signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Favorites could not be loaded.");
      if (!controller.signal.aborted && ownerRef.current === owner) setState({ owner, favorites: data.favorites, loading: false, saving: false, error: "" });
    } catch (error) {
      if (!controller.signal.aborted && ownerRef.current === owner) setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, [owner]);

  useEffect(() => { reload(); return () => requestRef.current?.abort(); }, [reload]);

  async function toggleFavorite(url) {
    if (!owner) throw new Error("Connect Discord to save GIF favorites.");
    if (savingRef.current || state.loading) return;
    if (state.error) throw new Error("Reload your favorites before saving this GIF.");
    const saved = !state.favorites.includes(url);
    savingRef.current = true;
    setState((current) => ({ ...current, saving: true }));
    try {
      const response = await fetch(ENDPOINT, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, saved }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Favorite could not be saved. Try again.");
      if (ownerRef.current === owner) setState({ owner, favorites: data.favorites, loading: false, saving: false, error: "" });
      return saved ? "Saved to Favorites. Find it with the GIF button." : "Removed from Favorites.";
    } finally {
      savingRef.current = false;
      if (ownerRef.current === owner) setState((current) => ({ ...current, saving: false }));
    }
  }

  return { ...(state.owner === owner ? state : { favorites: [], loading: !!owner, saving: false, error: "" }), reload, toggleFavorite };
}
