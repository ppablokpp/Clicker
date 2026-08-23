// Trying lucide's own `Stone` icon for platino instead of the hand-drawn
// nugget — re-exported under this name so every call site (already using
// `<PlatinumIcon .../>` or `icon={PlatinumIcon}`) picks it up with zero
// other changes. Swap the import back to the custom nugget path below if
// this doesn't stick.
export { Stone as PlatinumIcon } from 'lucide-react'
