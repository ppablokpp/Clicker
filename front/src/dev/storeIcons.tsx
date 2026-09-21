// Renders the store's product icons (Play Console wants 512×512 PNGs) from
// the game's own drawings: the vessel each pack ships in, on a dark tile.
// Query: ?contents=gems|keys&index=0..3. Captured by
// mobile-capacitor/store/icons.mjs; not part of the app.
import { createRoot } from 'react-dom/client'
import { GemContainer, gemContainerFor, keyContainerFor } from '../components/StallGoods'

const q = new URLSearchParams(location.search)
const contents = q.get('contents') === 'keys' ? 'keys' : 'gems'
const index = Number(q.get('index') ?? 0)
createRoot(document.getElementById('root')!).render(
  <div className={`tile ${contents}`}>
    <div style={{ filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.65))', transform: 'translateY(10px)' }}>
      <GemContainer kind={contents === 'keys' ? keyContainerFor(index) : gemContainerFor(index)} contents={contents} size={400} />
    </div>
  </div>,
)
