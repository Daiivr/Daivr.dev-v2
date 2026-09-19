import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GAME_MAP, worldToMap } from "../data/gameMap";
import photos from "../data/slasher-photos.json";
import worldLocations from "../data/world-locations.json";

const worldLandmarks = worldLocations.map(location => ({ ...location, position: L.latLng(worldToMap(location.x, location.y)) }));

function pinIcon(label, kind) {
  return L.divIcon({ className: `fo-game-pin fo-game-pin-${kind}`, html: `<span>${label}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] });
}

function maskPopup(point, location, onEnlarge) {
  const popup = document.createElement("div");
  const label = document.createElement("small");
  label.textContent = `MASK ${String(point.number).padStart(3, "0")} / ${location.region}`;
  const heading = document.createElement("strong");
  heading.textContent = location.name;
  const note = document.createElement("p");
  note.textContent = `${point.bearing[0].toUpperCase() + point.bearing.slice(1)} of the map landmark.`;
  popup.append(label, heading, note);
  const photo = photos[point.id];
  if (photo) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fo-mask-photo-preview";
    button.setAttribute("aria-label", `Enlarge location photo for mask ${point.number}`);
    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = `Mask ${String(point.number).padStart(3, "0")} location near ${location.name}`;
    image.width = photo.width;
    image.height = photo.height;
    image.decoding = "async";
    const caption = document.createElement("span");
    caption.textContent = "LOCATION PHOTO · Click to enlarge ↗";
    image.addEventListener("error", () => {
      image.hidden = true;
      caption.textContent = "Location photo unavailable";
      button.disabled = true;
    }, { once: true });
    button.append(image, caption);
    button.addEventListener("click", () => onEnlarge({ point, location, photo, opener: button }));
    popup.append(button);
  }
  return popup;
}

function LocationPhoto({ selection, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => { dialog.close(); if (selection.opener.isConnected) selection.opener.focus({ preventScroll: true }); };
  }, [selection]);
  const { point, location, photo } = selection;
  return <dialog ref={dialogRef} className="fo-location-photo-dialog" aria-labelledby="fo-location-photo-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <header><div><small>FIELD PHOTOGRAPH / MASK {String(point.number).padStart(3, "0")}</small><h2 id="fo-location-photo-title">{location.name}</h2></div><button type="button" onClick={onClose} aria-label="Close location photo" autoFocus>×</button></header>
    <img src={photo.src} alt={`Mask ${point.number} location near ${location.name}`} width={photo.width} height={photo.height} />
    <footer>{location.region}<span>Look for the mask on the victim.</span></footer>
  </dialog>;
}

export function SlasherGameMap({ locations, active, overview, selectedPoint, viewKey, onSelectArea, onSelectPoint }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const [imageFailed, setImageFailed] = useState(false);
  const [photoSelection, setPhotoSelection] = useState(null);
  const [showWorldLocations, setShowWorldLocations] = useState(true);

  useEffect(() => {
    const bounds = [[0, 0], [GAME_MAP.size, GAME_MAP.size]];
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const map = L.map(containerRef.current, {
      // Offset the Simple CRS so the tile pyramid uses ordinary top-left XYZ indices.
      crs: L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(1, 0, -1, GAME_MAP.size) }),
      minZoom: -4, maxZoom: 2, zoomSnap: .25,
      scrollWheelZoom: true, zoomAnimation: !reducedMotion,
      fadeAnimation: false, markerZoomAnimation: false,
      maxBounds: [[-512, -512], [4608, 4608]], maxBoundsViscosity: .8,
    });
    mapRef.current = map;
    map.attributionControl.setPrefix(false);
    L.tileLayer(GAME_MAP.tiles, {
      tileSize: GAME_MAP.tileSize, zoomOffset: GAME_MAP.tileZoomOffset,
      minZoom: -4, maxZoom: 2, minNativeZoom: -3, maxNativeZoom: 0,
      bounds, noWrap: true, keepBuffer: 1, updateWhenIdle: true, updateWhenZooming: false,
      attribution: 'Map © Bethesda · <a href="https://github.com/AHeroicLlama/Mappalachia" target="_blank" rel="noreferrer">Mappalachia</a>',
    }).on("tileerror", () => setImageFailed(true)).addTo(map);
    map.createPane("worldLocations").style.zIndex = 450;
    const updateDetail = () => containerRef.current.classList.toggle("fo-game-map-detailed", map.getZoom() >= -1);
    map.on("zoomend", updateDetail);
    map.fitBounds(bounds, { animate: false });
    updateDetail();
    const resize = new ResizeObserver(() => map.invalidateSize({ pan: true, animate: false }));
    resize.observe(containerRef.current);
    return () => { resize.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!showWorldLocations) return;
    const map = mapRef.current;
    const layer = L.layerGroup().addTo(map);
    const markers = new Map();
    function createMarker(location) {
      const label = document.createElement("span");
      label.textContent = location.name;
      const popup = document.createElement("strong");
      popup.textContent = location.name;
      const marker = L.marker(location.position, {
        pane: "worldLocations", title: location.name, alt: location.name,
        icon: L.icon({ iconUrl: `/fallout/map-icons/${location.icon}.svg`,
          className: "fo-world-location", iconSize: [28, 28], iconAnchor: [14, 14] }),
      }).bindTooltip(label, { direction: "top", offset: [0, -9], className: "fo-world-location-label" })
        .bindPopup(popup, { className: "fo-world-location-popup", maxWidth: 220, autoPanPadding: [30, 40] });
      return marker;
    }
    // Keep all landmarks searchable by panning, but render only the viewport
    // and a small buffer. Local views no longer animate hundreds of hidden SVGs.
    const updateVisible = () => {
      const bounds = map.getBounds();
      const bufferedBounds = bounds.pad(.15);
      worldLandmarks.forEach(location => {
        let marker = markers.get(location);
        if (!bufferedBounds.contains(location.position)) {
          if (marker && layer.hasLayer(marker)) layer.removeLayer(marker);
          return;
        }
        if (!marker) { marker = createMarker(location); markers.set(location, marker); }
        if (!layer.hasLayer(marker)) layer.addLayer(marker);
        const element = marker.getElement();
        element.setAttribute("aria-label", `World location: ${location.name}`);
        element.tabIndex = bounds.contains(location.position) ? 0 : -1;
      });
    };
    let pendingFrame;
    const scheduleUpdate = () => {
      cancelAnimationFrame(pendingFrame);
      pendingFrame = requestAnimationFrame(updateVisible);
    };
    map.on("moveend", scheduleUpdate);
    updateVisible();
    return () => { cancelAnimationFrame(pendingFrame); map.off("moveend", scheduleUpdate); layer.remove(); markers.clear(); };
  }, [showWorldLocations]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = L.layerGroup().addTo(map);
    markersRef.current.clear();
    const coordinates = [];
    if (overview) {
      locations.forEach((location, index) => {
        const center = location.spawns.reduce((sum, point) => [sum[0] + point.x / location.spawns.length, sum[1] + point.y / location.spawns.length], [0, 0]);
        const position = worldToMap(...center);
        coordinates.push(...location.spawns.map(point => worldToMap(point.x, point.y)));
        const title = `${location.name}: ${location.spawns.length} masks. Open area`;
        L.marker(position, { icon: pinIcon(String(index + 1).padStart(2, "0"), "area"), title, alt: title })
          .on("click", () => onSelectArea(location.id)).addTo(layer).getElement()?.setAttribute("aria-label", title);
      });
    } else {
      const landmark = worldToMap(...active.marker);
      coordinates.push(landmark);
      const landmarkLabel = document.createElement("span");
      landmarkLabel.textContent = active.name;
      L.marker(landmark, { icon: L.icon({ iconUrl: `/fallout/map-icons/${active.icon}.svg`, className: "fo-world-location fo-selected-landmark", iconSize: [36, 36], iconAnchor: [18, 18] }), title: `${active.name} map landmark`, alt: `${active.name} map landmark` })
        .bindTooltip(landmarkLabel, { direction: "top" }).addTo(layer).getElement()?.setAttribute("aria-label", `${active.name} map landmark`);
      active.spawns.forEach((point, index) => {
        const position = worldToMap(point.x, point.y);
        coordinates.push(position);
        const title = `Mask ${String(point.number).padStart(3, "0")} near ${active.name}`;
        const marker = L.marker(position, { icon: pinIcon(String(index + 1).padStart(2, "0"), "mask"), title, alt: title, riseOnHover: true })
          .bindPopup(() => maskPopup(point, active, setPhotoSelection), { className: "fo-mask-photo-popup", maxWidth: 320, minWidth: 200, autoPanPaddingTopLeft: [20, 95], autoPanPaddingBottomRight: [20, 35] })
          .on("click", () => onSelectPoint(point.id)).addTo(layer);
        marker.getElement()?.setAttribute("aria-label", title);
        markersRef.current.set(point.id, marker);
      });
    }
    // Frame the artwork itself in overview; the mask distribution is off-center.
    // Local views keep all masks visible but give close-together pickups more room.
    const viewBounds = overview ? [[0, 0], [GAME_MAP.size, GAME_MAP.size]] : coordinates;
    map.fitBounds(L.latLngBounds(viewBounds), { padding: overview ? [16, 16] : [48, 48], maxZoom: overview ? -1 : 1.5, animate: false });
    return () => { layer.remove(); markersRef.current.clear(); };
  }, [locations, active, overview, onSelectArea, onSelectPoint, viewKey]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const selected = id === selectedPoint?.id;
      marker.getElement()?.classList.toggle("is-selected", selected);
      marker.setZIndexOffset(selected ? 1000 : 0);
      if (selected) {
        mapRef.current.panTo(marker.getLatLng(), { animate: false });
        marker.openPopup();
      }
    }
  }, [selectedPoint, overview, active]);

  return <div className="fo-game-map-wrap">
    <div className="fo-game-map-layers"><label><input type="checkbox" checked={showWorldLocations} onChange={event => setShowWorldLocations(event.target.checked)} /><span>World locations <small>{worldLocations.length}</small></span></label><span>Blue icons · select for names</span></div>
    <div ref={containerRef} className="fo-game-map" role="region" aria-label="Interactive Appalachia mask map. Drag to pan. Scroll or use plus and minus to zoom, or pinch on touchscreens." />
    <span className="fo-game-map-north" aria-hidden="true">N ↑</span>
    {imageFailed && <p className="fo-game-map-error" role="alert">The game map could not load. Reload the page to retry; mask positions remain available in the directory.</p>}
    {photoSelection && <LocationPhoto selection={photoSelection} onClose={() => setPhotoSelection(null)} />}
  </div>;
}
