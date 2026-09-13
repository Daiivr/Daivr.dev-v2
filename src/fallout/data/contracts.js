/**
 * @typedef {{name: string, url: string}} Source
 * @typedef {'current'|'stale'|'unavailable'} FeedStatus
 * @template T
 * @typedef {{status: FeedStatus, fetchedAt: string|null, source: Source, data: T|null}} Feed
 * @typedef {{startsAt: string, endsAt: string, codes: {alpha:string, bravo:string, charlie:string}}} NuclearCodes
 * @typedef {{name:string, gold:number}} InventoryItem
 * @typedef {{id:string, title:string, location:string, list:number, startsAt:string, endsAt:string, url:string, inventory:InventoryItem[]|null}} MinervaVisit
 * @typedef {{visits:MinervaVisit[]}} MinervaSchedule
 * @typedef {{name:string, month:string, regions:string[], startsAt:string, endsAt:string, imageUrl:string|null}} Axolotl
 * @typedef {{title:string, url:string, startsAt:string, endsAt:string|null}} WastelandEvent
 * @typedef {{codes:Feed<NuclearCodes>, minerva:Feed<MinervaSchedule>, axolotl:Feed<Axolotl>, events:Feed<WastelandEvent[]>}} Intelligence
 */
export {};
