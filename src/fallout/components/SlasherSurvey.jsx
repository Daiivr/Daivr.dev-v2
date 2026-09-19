import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Compass, MapPin, Search, X } from "lucide-react";
import survey from "../data/slasher-spawns.json";
import { SlasherGameMap } from "./SlasherGameMap";

export function SlasherSurvey() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [selectedId, setSelectedId] = useState(survey.locations[0].id);
  const [overview, setOverview] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [viewKey, setViewKey] = useState(0);
  const mapRef = useRef(null);
  const needle = query.trim().toLocaleLowerCase();
  const locations = useMemo(() => survey.locations.filter(location => (region === "all" || location.region === region) && `${location.name} ${location.region}`.toLocaleLowerCase().includes(needle)), [region, needle]);
  const active = locations.find(location => location.id === selectedId) || locations[0];
  const count = locations.reduce((sum, location) => sum + location.spawns.length, 0);
  const selectLocation = useCallback((id) => {
    setSelectedId(id); setOverview(false); setSelectedPoint(null); setViewKey(value => value + 1);
    mapRef.current?.focus({ preventScroll: true });
    if (matchMedia("(max-width: 900px)").matches) mapRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);
  const selectPoint = useCallback((id) => setSelectedPoint({ id }), []);
  function reset() { setQuery(""); setRegion("all"); setOverview(true); setSelectedPoint(null); }

  return <section id="locations" className="fo-survey" aria-labelledby="fo-survey-title">
    <header className="fo-guide-section-heading"><span className="fo-kicker">02 / SEARCH THE WASTELAND</span><h2 id="fo-survey-title">The location directory.</h2><p>All 108 points, grouped by their nearest map landmark. Pick an area to inspect its individual mask positions.</p></header>
    <div className="fo-survey-filters"><div><label htmlFor="fo-guide-search">Search a landmark</label><div className="fo-survey-input"><Search size={17} aria-hidden="true" /><input id="fo-guide-search" type="search" value={query} onChange={event => { setQuery(event.target.value); setOverview(true); setSelectedPoint(null); }} placeholder="Try Camden Park or a lookout…" autoComplete="off" /></div></div><div><label htmlFor="fo-guide-region">Region</label><select id="fo-guide-region" value={region} onChange={event => { setRegion(event.target.value); setOverview(true); setSelectedPoint(null); }}><option value="all">All regions · 108 masks</option>{survey.regions.map(item => <option key={item.name} value={item.name}>{item.name} · {item.spawns} {item.spawns === 1 ? "mask" : "masks"}</option>)}</select></div><button type="button" onClick={reset} disabled={!query && region === "all"}><X size={15} aria-hidden="true" />Reset filters</button></div>
    <p className="fo-survey-result" role="status">{locations.length} search {locations.length === 1 ? "area" : "areas"} · {count} mask {count === 1 ? "spawn" : "spawns"}</p>
    {active ? <div className="fo-survey-layout">
      <div className="fo-survey-station" ref={mapRef} tabIndex={-1} aria-label={overview ? "Regional survey map" : `${active.name} local survey`}>
        <div className="fo-survey-map-heading"><Compass size={17} aria-hidden="true" /><strong>{overview ? "Regional overview" : active.name}</strong><button type="button" onClick={() => { setOverview(true); setSelectedPoint(null); setViewKey(value => value + 1); }}>Overview</button></div>
        <SlasherGameMap locations={locations} active={active} overview={overview} selectedPoint={selectedPoint} viewKey={viewKey} onSelectArea={selectLocation} onSelectPoint={selectPoint} />
        <div className="fo-survey-legend"><span><i />{overview ? "Search area" : "Mask position"}</span>{!overview && <span><img className="fo-survey-legend-icon" src={`/fallout/map-icons/${active.icon}.svg`} alt="" width="18" height="18" />Map landmark</span>}<span>NORTH ↑</span></div>
        <p className="fo-survey-map-note">Drag to explore · scroll or + / − to zoom · pinch on mobile. Blue icons show world landmarks; hover or select one for its name. Select a numbered area, then a mask to see its location photo. Pins use game coordinates; the map does not show individual floors or every object.</p>
        {!overview && <div className="fo-survey-local"><h3>{active.spawns.length} {active.spawns.length === 1 ? "mask" : "masks"} near {active.name}</h3><ol>{active.spawns.map((point, index) => <li key={point.id}><button type="button" aria-pressed={selectedPoint?.id === point.id} onClick={() => { selectPoint(point.id); mapRef.current?.scrollIntoView({ behavior: "instant", block: "start" }); }}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{point.bearing}</strong> of the map landmark<small>Mask {String(point.number).padStart(3, "0")} · Show on map</small></span><MapPin size={16} aria-hidden="true" /></button></li>)}</ol><p>Select a mask above to center its pin on the game map. Bearings start at the landmark icon, which can differ from the fast-travel arrival point.</p></div>}
      </div>
      <ol className="fo-survey-directory" aria-label="Mask search areas">{locations.map((location, index) => <li key={location.id}><button type="button" aria-pressed={!overview && active.id === location.id} onClick={() => selectLocation(location.id)}><span className="fo-survey-index">{String(index + 1).padStart(2, "0")}</span><span className="fo-survey-place"><small>{location.region}</small><strong>{location.name}</strong><span>{location.spawns.length} mask {location.spawns.length === 1 ? "position" : "positions"} <i>Inspect area <ArrowUpRight size={12} aria-hidden="true" /></i></span></span><img className="fo-survey-location-icon" src={`/fallout/map-icons/${location.icon}.svg`} alt="" aria-hidden="true" width="38" height="38" loading="lazy" /></button></li>)}</ol>
    </div> : <div className="fo-survey-empty"><Search size={28} aria-hidden="true" /><h3>No matching landmarks</h3><p>Try a shorter name or switch to all regions.</p><button type="button" onClick={reset}>Show all locations</button></div>}
  </section>;
}
