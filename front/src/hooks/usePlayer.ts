import { useState } from 'react'

const STORAGE_KEY = 'clicker:playerName'

const ADJECTIVES = ['Veloz', 'Feroz', 'Turbo', 'Fantasma', 'Rayo', 'Épico', 'Ágil', 'Certero']
const ANIMALS = ['Lince', 'Halcón', 'Tigre', 'Lobo', 'Cobra', 'Puma', 'Zorro', 'Águila']

function generateName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const suffix = Math.floor(Math.random() * 900 + 100)
  return `${adjective}${animal}${suffix}`
}

/**
 * Stand-in for real auth. Assigns a persistent random nickname to the
 * browser so the leaderboard has something to show before Clerk login
 * exists — replacing this with the authenticated user is the migration seam.
 */
export function usePlayer() {
  const [name, setName] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    const generated = generateName()
    localStorage.setItem(STORAGE_KEY, generated)
    return generated
  })

  const renamePlayer = (newName: string) => {
    const trimmed = newName.trim().slice(0, 20)
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    setName(trimmed)
  }

  return { name, renamePlayer }
}
