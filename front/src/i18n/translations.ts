export type Language = 'es' | 'en'

export interface TranslationStrings {
  signIn: {
    tagline: string
    continueWithGoogle: string
    redirecting: string
    genericError: string
  }
  home: {
    yourClicks: string
    tapAnywhere: string
    cps: string
    heat: {
      onFire: string
      unstoppable: string
      legendary: string
    }
  }
  nav: {
    home: string
    leaderboard: string
    achievements: string
    store: string
  }
  leaderboard: {
    title: string
    subtitle: string
    empty: string
    you: string
    fallbackName: string
  }
  store: {
    title: string
    subtitle: string
    comingSoon: string
    items: { title: string; desc: string }[]
  }
  achievements: {
    title: string
    subtitle: string
    comingSoon: string
    items: { title: string; desc: string }[]
  }
}

export const translations: Record<Language, TranslationStrings> = {
  es: {
    signIn: {
      tagline: 'Inicia sesión para guardar tus clicks y competir en la clasificación mundial.',
      continueWithGoogle: 'Continuar con Google',
      redirecting: 'Redirigiendo…',
      genericError: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
    },
    home: {
      yourClicks: 'Tus clicks',
      tapAnywhere: 'Toca en cualquier parte de la pantalla',
      cps: 'c/s',
      heat: {
        onFire: 'En racha',
        unstoppable: 'Imparable',
        legendary: 'Legendario',
      },
    },
    nav: {
      home: 'Inicio',
      leaderboard: 'Clasificación',
      achievements: 'Logros',
      store: 'Tienda',
    },
    leaderboard: {
      title: 'Clasificación mundial',
      subtitle: 'Compite con el resto de jugadores por clicks.',
      empty: 'Nadie ha dado clicks todavía. ¡Sé el primero!',
      you: 'Tú',
      fallbackName: 'Jugador',
    },
    store: {
      title: 'Tienda',
      subtitle: 'Todavía no hay nada a la venta, pero esto es lo que viene.',
      comingSoon: 'Próximamente',
      items: [
        { title: 'Multiplicadores', desc: 'Aumenta los clicks que suma cada toque.' },
        { title: 'Temas y skins', desc: 'Personaliza colores y efectos de la zona de click.' },
        { title: 'Auto-clicker', desc: 'Genera clicks pasivamente con mejoras.' },
      ],
    },
    achievements: {
      title: 'Logros',
      subtitle: 'Todavía no hay logros activos, pero esto es lo que viene.',
      comingSoon: 'Próximamente',
      items: [
        { title: 'Hitos de clicks', desc: 'Desbloquea logros al llegar a ciertas cifras totales.' },
        { title: 'Rachas', desc: 'Recompensas por jugar días seguidos.' },
        { title: 'Insignias de ranking', desc: 'Logros por posición en la clasificación mensual.' },
      ],
    },
  },
  en: {
    signIn: {
      tagline: 'Sign in to save your clicks and compete on the global leaderboard.',
      continueWithGoogle: 'Continue with Google',
      redirecting: 'Redirecting…',
      genericError: "Couldn't sign in with Google. Please try again.",
    },
    home: {
      yourClicks: 'Your clicks',
      tapAnywhere: 'Tap anywhere on the screen',
      cps: 'c/s',
      heat: {
        onFire: 'On fire',
        unstoppable: 'Unstoppable',
        legendary: 'Legendary',
      },
    },
    nav: {
      home: 'Home',
      leaderboard: 'Leaderboard',
      achievements: 'Achievements',
      store: 'Store',
    },
    leaderboard: {
      title: 'Global leaderboard',
      subtitle: 'Compete with other players for clicks.',
      empty: 'No one has clicked yet. Be the first!',
      you: 'You',
      fallbackName: 'Player',
    },
    store: {
      title: 'Store',
      subtitle: "Nothing for sale yet, but here's what's coming.",
      comingSoon: 'Coming soon',
      items: [
        { title: 'Multipliers', desc: 'Increase the clicks each tap adds.' },
        { title: 'Themes & skins', desc: 'Customize colors and effects of the click zone.' },
        { title: 'Auto-clicker', desc: 'Passively generate clicks with upgrades.' },
      ],
    },
    achievements: {
      title: 'Achievements',
      subtitle: "No active achievements yet, but here's what's coming.",
      comingSoon: 'Coming soon',
      items: [
        { title: 'Click milestones', desc: 'Unlock achievements at certain click totals.' },
        { title: 'Streaks', desc: 'Rewards for playing on consecutive days.' },
        { title: 'Ranking badges', desc: 'Achievements for your position on the monthly leaderboard.' },
      ],
    },
  },
}
