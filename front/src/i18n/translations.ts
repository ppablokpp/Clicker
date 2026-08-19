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
    prestigeReady: string
    changePrestige: string
    prestigeComingSoon: string
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
    stats: string
    store: string
  }
  leaderboard: {
    title: string
    subtitle: string
    empty: string
    you: string
    fallbackName: string
    clicksTab: string
    cpsTab: string
  }
  store: {
    title: string
    subtitle: string
    costLabel: string
    buy: string
    buying: string
    active: string
    owned: string
    notEnoughClicks: string
    lootSection: string
    casesSection: string
    casesSubtitle: string
    openCase: string
    openCaseMoney: string
    openCaseGems: string
    notEnoughGems: string
    notEnoughKeys: string
    notEnoughChests: string
    notEnoughClicksForChest: string
    buyChest: string
    claimDailyKey: string
    keyClaimedToday: string
    claimingKey: string
    buyClicksTitle: string
    buyKeysTitle: string
    buyGemsTitle: string
    savingsBadge: (pct: number) => string
    opening: string
    youWon: (amount: string) => string
    youWonGems: (amount: string) => string
    casePrizeNames: Record<string, string>
    caseCatalogButton: string
    caseCatalogTitle: string
    caseMythicLabel: string
    caseTitleClicks: string
    caseTitleGems: string
    powerupsSection: string
    powerupsCardTitle: string
    powerupsSubtitle: string
    upgradesSection: string
    infinity: string
    luckTitle: string
    noUpgradeYet: string
    maxLevel: string
    upgradeCta: string
    moneyUpgradesTitle: string
    purchaseError: string
    timedLuckTitle: string
    timedLuckSubtitle: string
    powerups: Record<string, { name: string; desc: string }>
    upgrades: Record<string, { name: string; desc: string }>
    moneyUpgrades: Record<string, { name: string; desc: string }>
    timedLuckPowerups: Record<string, { name: string; desc: string }>
  }
  stats: {
    title: string
    subtitle: string
    rewardLabel: string
    claim: string
    claiming: string
    claimed: string
    rewardPowerup: (name: string) => string
    rewardClicks: (amount: string) => string
    rewardPermanent: (pct: string) => string
    categories: {
      totalClicks: { label: string; unit: string }
      bestCps: { label: string; unit: string }
      longestStreak: { label: string; unit: string }
      casesOpened: { label: string; unit: string }
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
      prestigeReady: '¡Prestigio disponible!',
      changePrestige: 'Cambiar de prestigio',
      prestigeComingSoon: 'Próximamente...',
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
      stats: 'Estadísticas',
      store: 'Tienda',
    },
    leaderboard: {
      title: 'Clasificación mundial',
      subtitle: 'Compite con el resto de jugadores por clicks.',
      empty: 'Nadie ha dado clicks todavía. ¡Sé el primero!',
      you: 'Tú',
      fallbackName: 'Jugador',
      clicksTab: 'Ranking de clicks',
      cpsTab: 'Ranking de velocidad',
    },
    store: {
      title: 'Tienda',
      subtitle: 'Mejora tus clicks con potenciadores y mejoras permanentes.',
      costLabel: 'clicks',
      buy: 'Comprar',
      buying: 'Comprando…',
      active: 'Activo',
      owned: 'Comprado',
      notEnoughClicks: 'Te faltan clicks',
      lootSection: 'Premios',
      casesSection: 'Cofres',
      casesSubtitle: 'Compra cofres para poder abrirlos con las llaves y probar tu suerte.',
      openCase: 'Abrir cofre',
      openCaseMoney: 'Comprar cofre',
      openCaseGems: 'Abrir con gemas',
      notEnoughGems: 'Te faltan gemas',
      notEnoughKeys: 'Te falta una llave',
      notEnoughChests: 'Compra un cofre primero',
      notEnoughClicksForChest: 'Te faltan clicks',
      buyChest: 'Comprar cofre',
      claimDailyKey: 'Reclamar llave gratis diaria',
      keyClaimedToday: 'Llave diaria reclamada',
      claimingKey: 'Reclamando…',
      buyClicksTitle: 'Comprar clicks',
      buyKeysTitle: 'Comprar llaves',
      buyGemsTitle: 'Comprar gemas',
      savingsBadge: (pct) => `Ahorra ${pct}%`,
      opening: 'Abriendo…',
      youWon: (amount) => `+${amount} clicks`,
      youWonGems: (amount) => `+${amount} ${amount === '1' ? 'gema' : 'gemas'}`,
      casePrizeNames: {
        consumer: 'Común',
        milspec: 'Poco común',
        restricted: 'Raro',
        classified: 'Muy raro',
        covert: 'Épico',
        gold: 'Legendario',
        gem_1: 'Mítico',
        gem_2: 'Mítico',
        gem_3: 'Mítico',
        gem_5: 'Mítico',
      },
      caseCatalogButton: 'Ver catálogo',
      caseCatalogTitle: 'Premios posibles',
      caseMythicLabel: 'Mítico',
      caseTitleClicks: 'Cofre de clicks',
      caseTitleGems: 'Cofre de gemas',
      powerupsSection: 'Potenciadores',
      powerupsCardTitle: 'Multiplicadores',
      powerupsSubtitle: 'Multiplica tus clicks durante un tiempo.',
      upgradesSection: 'Mejoras permanentes',
      luckTitle: 'Suerte',
      noUpgradeYet: 'Todavía ninguna',
      maxLevel: 'Nivel máximo',
      upgradeCta: 'Mejorar',
      infinity: '∞',
      moneyUpgradesTitle: 'Multiplicador premium',
      purchaseError: 'No se pudo completar la compra. Inténtalo de nuevo.',
      timedLuckTitle: 'Suerte relámpago',
      timedLuckSubtitle: 'Multiplica tu Suerte permanente mientras esté activa.',
      powerups: {
        click_x2: {
          name: 'Click x2',
          desc: 'Duplica el valor de cada click. El más barato, ideal para probar.',
        },
        click_x3: {
          name: 'Click x3',
          desc: 'Triplica cada click durante más tiempo. Rinde bien en tiradas largas.',
        },
        click_x5: {
          name: 'Click x5',
          desc: 'Cada click cuenta x5 durante el tiempo activo.',
        },
        click_x10: {
          name: 'Click x10',
          desc: 'El multiplicador más alto, ráfaga corta. Solo rentable si aprietas a fondo.',
        },
      },
      upgrades: {
        luck_x2: {
          name: 'Suerte x2',
          desc: 'Cada click tiene una pequeña probabilidad de contar x2.',
        },
        luck_x3: {
          name: 'Suerte x3',
          desc: 'Cada click tiene una pequeña probabilidad de contar x3.',
        },
        luck_x5: {
          name: 'Suerte x5',
          desc: 'Cada click tiene una pequeña probabilidad de contar x5.',
        },
        luck_x10: {
          name: 'Suerte x10',
          desc: 'La mejora más alta. Pequeña probabilidad de un click x10.',
        },
      },
      moneyUpgrades: {
        x2_clicks: {
          name: 'Multiplicador x2',
          desc: 'Cada click cuenta x2, para siempre.',
        },
        x3_clicks: {
          name: 'Multiplicador x3',
          desc: 'Cada click cuenta x3, para siempre.',
        },
        x5_clicks: {
          name: 'Multiplicador x5',
          desc: 'Cada click cuenta x5, para siempre.',
        },
        x10_clicks: {
          name: 'Multiplicador x10',
          desc: 'El nivel más alto. Cada click cuenta x10, para siempre.',
        },
      },
      timedLuckPowerups: {
        luck_x25: { name: 'Suerte x25', desc: '1% de probabilidad de un click x25.' },
        luck_x50: { name: 'Suerte x50', desc: '1% de probabilidad de un click x50.' },
        luck_x75: { name: 'Suerte x75', desc: '1% de probabilidad de un click x75.' },
        luck_x100: { name: 'Suerte x100', desc: '1% de probabilidad de un click x100. La más alta.' },
      },
    },
    stats: {
      title: 'Estadísticas',
      subtitle: 'Tu progreso, hito a hito.',
      rewardLabel: 'Recompensa',
      claim: 'Reclamar',
      claiming: 'Reclamando…',
      claimed: 'Reclamado',
      rewardPowerup: (name) => `Potenciador ${name}`,
      rewardClicks: (amount) => `+${amount} clicks`,
      rewardPermanent: (mult) => `×${mult} a todos tus clicks`,
      categories: {
        totalClicks: { label: 'Clicks totales', unit: 'clicks' },
        bestCps: { label: 'Velocidad máxima', unit: 'c/s' },
        longestStreak: { label: 'Racha de días', unit: 'días' },
        casesOpened: { label: 'Cofres abiertos', unit: 'cofres' },
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
      prestigeReady: 'Prestige available!',
      changePrestige: 'Change prestige',
      prestigeComingSoon: 'Coming soon',
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
      stats: 'Stats',
      store: 'Store',
    },
    leaderboard: {
      title: 'Global leaderboard',
      subtitle: 'Compete with other players for clicks.',
      empty: 'No one has clicked yet. Be the first!',
      you: 'You',
      fallbackName: 'Player',
      clicksTab: 'Clicks ranking',
      cpsTab: 'Speed ranking',
    },
    store: {
      title: 'Store',
      subtitle: 'Boost your clicks with powerups and permanent upgrades.',
      costLabel: 'clicks',
      buy: 'Buy',
      buying: 'Buying…',
      active: 'Active',
      owned: 'Owned',
      notEnoughClicks: "You're short on clicks",
      lootSection: 'Prizes',
      casesSection: 'Cases',
      casesSubtitle: 'Buy chests to open them with keys and try your luck.',
      openCase: 'Open case',
      openCaseMoney: 'Buy case',
      openCaseGems: 'Open with gems',
      notEnoughGems: "You're short on gems",
      notEnoughKeys: 'You need a key',
      notEnoughChests: 'Buy a chest first',
      notEnoughClicksForChest: "You're short on clicks",
      buyChest: 'Buy chest',
      claimDailyKey: 'Claim free daily key',
      keyClaimedToday: 'Daily key claimed',
      claimingKey: 'Claiming…',
      buyClicksTitle: 'Buy clicks',
      buyKeysTitle: 'Buy keys',
      buyGemsTitle: 'Buy gems',
      savingsBadge: (pct) => `Save ${pct}%`,
      opening: 'Opening…',
      youWon: (amount) => `+${amount} clicks`,
      youWonGems: (amount) => `+${amount} ${amount === '1' ? 'gem' : 'gems'}`,
      casePrizeNames: {
        consumer: 'Common',
        milspec: 'Uncommon',
        restricted: 'Rare',
        classified: 'Very rare',
        covert: 'Epic',
        gold: 'Legendary',
        gem_1: 'Mythic',
        gem_2: 'Mythic',
        gem_3: 'Mythic',
        gem_5: 'Mythic',
      },
      caseCatalogButton: 'View catalog',
      caseCatalogTitle: 'Possible prizes',
      caseMythicLabel: 'Mythic',
      caseTitleClicks: 'Click chest',
      caseTitleGems: 'Gem chest',
      powerupsSection: 'Powerups',
      powerupsCardTitle: 'Multipliers',
      powerupsSubtitle: 'Multiplies your clicks for a while.',
      upgradesSection: 'Permanent upgrades',
      luckTitle: 'Luck',
      noUpgradeYet: 'None yet',
      maxLevel: 'Max level',
      upgradeCta: 'Upgrade',
      infinity: '∞',
      moneyUpgradesTitle: 'Premium multiplier',
      purchaseError: "Couldn't complete the purchase. Please try again.",
      timedLuckTitle: 'Lightning luck',
      timedLuckSubtitle: 'Multiplies your permanent Luck while active.',
      powerups: {
        click_x2: {
          name: 'Click x2',
          desc: 'Doubles the value of every click. The cheapest one, great for trying it out.',
        },
        click_x3: {
          name: 'Click x3',
          desc: 'Triples every click for longer. Pays off well on long runs.',
        },
        click_x5: {
          name: 'Click x5',
          desc: 'Every click counts x5 while active.',
        },
        click_x10: {
          name: 'Click x10',
          desc: 'The highest multiplier, short burst. Only worth it if you go all out.',
        },
      },
      upgrades: {
        luck_x2: {
          name: 'Luck x2',
          desc: 'Every click has a small chance to count x2.',
        },
        luck_x3: {
          name: 'Luck x3',
          desc: 'Every click has a small chance to count x3.',
        },
        luck_x5: {
          name: 'Luck x5',
          desc: 'Every click has a small chance to count x5.',
        },
        luck_x10: {
          name: 'Luck x10',
          desc: 'The highest one. A small chance at a x10 click.',
        },
      },
      moneyUpgrades: {
        x2_clicks: {
          name: 'Multiplier x2',
          desc: 'Every click counts x2, forever.',
        },
        x3_clicks: {
          name: 'Multiplier x3',
          desc: 'Every click counts x3, forever.',
        },
        x5_clicks: {
          name: 'Multiplier x5',
          desc: 'Every click counts x5, forever.',
        },
        x10_clicks: {
          name: 'Multiplier x10',
          desc: 'The highest tier. Every click counts x10, forever.',
        },
      },
      timedLuckPowerups: {
        luck_x25: { name: 'Luck x25', desc: '1% chance of a x25 click.' },
        luck_x50: { name: 'Luck x50', desc: '1% chance of a x50 click.' },
        luck_x75: { name: 'Luck x75', desc: '1% chance of a x75 click.' },
        luck_x100: { name: 'Luck x100', desc: '1% chance of a x100 click. The highest one.' },
      },
    },
    stats: {
      title: 'Stats',
      subtitle: 'Your progress, milestone by milestone.',
      rewardLabel: 'Reward',
      claim: 'Claim',
      claiming: 'Claiming…',
      claimed: 'Claimed',
      rewardPowerup: (name) => `${name} powerup`,
      rewardClicks: (amount) => `+${amount} clicks`,
      rewardPermanent: (mult) => `×${mult} to all your clicks`,
      categories: {
        totalClicks: { label: 'Total clicks', unit: 'clicks' },
        bestCps: { label: 'Peak speed', unit: 'c/s' },
        longestStreak: { label: 'Day streak', unit: 'days' },
        casesOpened: { label: 'Cases opened', unit: 'cases' },
      },
    },
  },
}
