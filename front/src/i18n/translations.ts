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
    unlocked: string
    categories: {
      totalClicks: { label: string; unit: string }
      bestCps: { label: string; unit: string }
      longestStreak: { label: string; unit: string }
    }
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
      subtitle: 'Se desbloquean según tus estadísticas.',
      unlocked: 'Desbloqueado',
      categories: {
        totalClicks: { label: 'Clicks totales', unit: 'clicks' },
        bestCps: { label: 'Velocidad máxima', unit: 'c/s' },
        longestStreak: { label: 'Racha de días', unit: 'días' },
      },
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
      subtitle: 'Unlocked based on your stats.',
      unlocked: 'Unlocked',
      categories: {
        totalClicks: { label: 'Total clicks', unit: 'clicks' },
        bestCps: { label: 'Peak speed', unit: 'c/s' },
        longestStreak: { label: 'Day streak', unit: 'days' },
      },
    },
  },
}
