import { BuddyCollectibleIcon } from "./BuddyCollectibleIcon";

export function BuddyRoomAquarium({ featured, collection }) {
  // The chosen fish leads the school; companions also come from actual catches.
  const school = featured ? [featured, ...collection.filter((item) => item.kind === "fish" && item.key !== featured.key)].slice(0, 3) : [];
  return <span className="room-aquarium-world" aria-hidden="true">
    <svg className="room-aquarium-habitat" viewBox="0 0 180 110" preserveAspectRatio="none" shapeRendering="crispEdges">
      <path d="M0 0h180v110H0z" fill="#153545" /><path d="M0 0h180v30H0z" fill="#255968" /><path d="M0 30h180v27H0z" fill="#204b5b" /><path d="M0 57h180v25H0z" fill="#1a4050" />
      <path d="M12 3h17l36 96H46zM63 3h10l36 96H95zM110 3h27l35 96h-22z" fill="#a9f4dd" opacity=".06" />
      <path d="M0 93h32v-4h37v5h42v-5h27v3h42v18H0z" fill="#716f59" /><path d="M0 101h180v9H0z" fill="#4d5149" />
      {Array.from({ length: 25 }, (_, i) => <path key={i} d={`M${i * 7} ${95 + i % 3 * 4}h${3 + i % 3}v3h-${3 + i % 3}z`} fill={["#9f9d7a", "#bec09a", "#525a50", "#85866a"][i % 4]} />)}
      <path d="M90 91h9v-7h8v-7h12v6h-7v10h21v6H87z" fill="#51483d" /><path d="M101 86h6v-5h9v2h-7v12h-8zM114 95h17v2h-17z" fill="#8a7254" />
      <path d="M22 94V55h4v39M16 82h7v4h-7M25 69h8v4h-8M17 61h7v4h-7" stroke="#365f4e" strokeWidth="3" />
      <path d="M12 56h10v6H12zM25 62h11v6H25zM9 75h13v6H9zM26 78h9v5h-9zM20 45h6v12h-6z" fill="#7db184" /><path d="M13 56h9v2h-9zM26 62h9v2h-9zM10 75h9v2h-9z" fill="#b3c99a" />
      <path d="M147 94V55h3v39M156 93V65h3v28M142 93V72h3v21" fill="#3e795c" /><path d="M143 57h5v16h-5zM150 49h5v19h-5zM154 69h9v7h-9zM137 70h6v14h-6zM148 79h7v6h-7z" fill="#69a879" /><path d="M146 59h2v12h-2zM151 51h2v14h-2z" fill="#a6c79c" />
      <path d="M45 94h5v-5h13v4h5v7H45z" fill="#8b9590" /><path d="M50 89h12v4H50zM47 94h8v2h-8z" fill="#b7c0b0" /><path d="M163 88h9v4h8v8h-21v-8h4z" fill="#707f7c" />
      <path d="M173 5h5v77h-5zM169 74h9v12h-9z" fill="#112a38" /><path d="M171 76h4v2h-4zM171 80h4v2h-4z" fill="#5a8487" />
    </svg>
    {school.map((fish, index) => <span className={`room-swimmer swimmer-${index}`} key={fish.key}><span className="room-fish-facing"><BuddyCollectibleIcon id={fish.id} color={fish.color} /></span></span>)}
    <span className="room-tank-bubble bubble-one" /><span className="room-tank-bubble bubble-two" /><span className="room-tank-bubble bubble-three" />
    <span className="room-tank-surface" /><span className="room-tank-glass" />
    {!featured ? <span className="room-aquarium-invite">+ add fish</span> : null}
  </span>;
}
