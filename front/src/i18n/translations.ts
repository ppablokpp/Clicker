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
    objectLabel: (n: string) => string
    objectsProgress: (broken: string, target: string) => string
    prestigeReady: string
    changePrestige: string
    prestigeComingSoon: string
    cps: string
    tps: string
    totalLabel: string
    heat: {
      onFire: string
      unstoppable: string
      legendary: string
    }
    inventory: string
    inventoryTitle: string
    openButton: string
    activateButton: string
    inventoryEmpty: string
    durationLabel: (seconds: number) => string
  }
  nav: {
    home: string
    leaderboard: string
    tree: string
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
    availableIn: (time: string) => string
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
    chestLimitReached: string
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
    magnetsTitle: string
    magnetsSubtitle: string
    powerups: Record<string, { name: string; desc: string }>
    upgrades: Record<string, { name: string; desc: string }>
    moneyUpgrades: Record<string, { name: string; desc: string }>
    timedLuckPowerups: Record<string, { name: string; desc: string }>
    magnets: Record<string, { name: string; desc: string }>
  }
  stats: {
    streakUnit: string
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
    milestoneTiers: {
      bronze: string
      silver: string
      gold: string
      platinum: string
    }
    milestoneDescriptions: {
      totalClicks: (amount: string) => string
      bestCps: (amount: string) => string
      longestStreak: (amount: string) => string
      casesOpened: (amount: string) => string
    }
  }
  tree: {
    placeholder: string
    zoomIn: string
    zoomOut: string
    resetView: string
    level: string
    autoClickName: string
    autoClickDesc: string
    dronesUnit: string
    currentRate: string
    nextLevelRate: string
    upgrading: string
    premiumDesc: string
    currentMultiplier: string
    nextMultiplier: string
    luckName: string
    luckDesc: string
    multiplierName: string
    multiplierDesc: string
    currentClickValue: string
    nextClickValue: string
    luckChanceName: string
    luckChanceDesc: string
    currentChance: string
    nextChance: string
    legendaryEaseName: string
    legendaryEaseDesc: string
    currentStreakClicks: string
    nextStreakClicks: string
    legendaryGrowthName: string
    legendaryGrowthDesc: string
    currentBonusStep: string
    nextBonusStep: string
    fortunaName: string
    fortunaDesc: string
    azarName: string
    azarDesc: string
    turboName: string
    turboDesc: string
    tapMultiplierName: string
    tapMultiplierDesc: string
  }
  prestige: {
    confirmTitle: string
    confirmBody: (points: string) => string
    confirmButton: string
    cancelButton: string
    shopTitle: string
    pointsLabel: string
    reactorName: string
    reactorDesc: string
    currentMultiplier: string
    nextMultiplier: string
    notEnoughPoints: string
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
      yourClicks: 'Tu platino',
      objectLabel: (n) => `Objeto #${n}`,
      objectsProgress: (broken, target) => `${broken} / ${target} niveles`,
      prestigeReady: '¡Prestigio disponible!',
      changePrestige: 'Cambiar de prestigio',
      prestigeComingSoon: 'Próximamente...',
      cps: 'pt/s',
      tps: 't/s',
      totalLabel: 'Total:',
      heat: {
        onFire: 'En racha',
        unstoppable: 'Imparable',
        legendary: 'Legendario',
      },
      inventory: 'Inventario',
      inventoryTitle: 'Inventario',
      openButton: 'Abrir',
      activateButton: 'Activar',
      inventoryEmpty: 'Aquí se guardan tus objetos. Cuando consigas alguno, aparecerá aquí.',
      durationLabel: (seconds) => `Dura ${seconds}s`,
    },
    nav: {
      home: 'Inicio',
      leaderboard: 'Clasificación',
      tree: 'Árbol',
      stats: 'Estadísticas',
      store: 'Tienda',
    },
    leaderboard: {
      title: 'Clasificación mundial',
      subtitle: 'Compite con el resto de jugadores por platino.',
      empty: 'Nadie ha dado clicks todavía. ¡Sé el primero!',
      you: 'Tú',
      fallbackName: 'Jugador',
      clicksTab: 'Ranking de platino',
      cpsTab: 'Ranking de velocidad',
    },
    store: {
      title: 'Tienda',
      subtitle: 'Mejora tus clicks con potenciadores y mejoras permanentes.',
      costLabel: 'platino',
      buy: 'Comprar',
      buying: 'Comprando…',
      availableIn: (time) => `Disponible en ${time}`,
      active: 'Activo',
      owned: 'Comprado',
      notEnoughClicks: 'Te falta platino',
      lootSection: 'Premios',
      casesSection: 'Cofres',
      casesSubtitle: 'Compra cofres para poder abrirlos con las llaves y probar tu suerte.',
      openCase: 'Abrir cofre',
      openCaseMoney: 'Comprar cofre',
      openCaseGems: 'Abrir con gemas',
      notEnoughGems: 'Te faltan gemas',
      notEnoughKeys: 'Te falta una llave',
      notEnoughChests: 'Compra un cofre primero',
      notEnoughClicksForChest: 'Te falta platino',
      buyChest: 'Comprar cofre',
      chestLimitReached: 'Ya tienes el máximo de cofres',
      claimDailyKey: 'Reclamar llave gratis diaria',
      keyClaimedToday: 'Llave diaria reclamada',
      claimingKey: 'Reclamando…',
      buyClicksTitle: 'Comprar platino',
      buyKeysTitle: 'Comprar llaves',
      buyGemsTitle: 'Comprar gemas',
      savingsBadge: (pct) => `Ahorra ${pct}%`,
      opening: 'Abriendo…',
      youWon: (amount) => `+${amount} platino`,
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
      caseTitleClicks: 'Cofre de platino',
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
      timedLuckTitle: 'Suerte',
      timedLuckSubtitle: 'Multiplica tu Suerte permanente mientras esté activa.',
      magnetsTitle: 'Imanes',
      magnetsSubtitle: 'Mientras esté activo, cada click tiene una pequeña probabilidad de darte un objeto.',
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
        luck_x10: { name: 'Suerte x10', desc: '1% de probabilidad de un click x10.' },
        luck_x25: { name: 'Suerte x25', desc: '1% de probabilidad de un click x25.' },
        luck_x50: { name: 'Suerte x50', desc: '1% de probabilidad de un click x50.' },
        luck_x100: { name: 'Suerte x100', desc: '1% de probabilidad de un click x100. La más alta.' },
      },
      magnets: {
        key_magnet: {
          name: 'Imán de llaves',
          desc: 'Mientras esté activo, cada click tiene una pequeña probabilidad de darte una llave extra.',
        },
        gem_magnet: {
          name: 'Imán de gemas',
          desc: 'Mientras esté activo, cada click tiene una pequeña probabilidad de darte una gema extra.',
        },
      },
    },
    stats: {
      streakUnit: 'días',
      rewardLabel: 'Recompensa',
      claim: 'Reclamar',
      claiming: 'Reclamando…',
      claimed: 'Reclamado',
      rewardPowerup: (name) => `Potenciador ${name}`,
      rewardClicks: (amount) => `+${amount} platino`,
      rewardPermanent: (mult) => `×${mult} a todos tus clicks`,
      categories: {
        totalClicks: { label: 'Taps reales', unit: 'taps' },
        bestCps: { label: 'Velocidad máxima', unit: 't/s' },
        longestStreak: { label: 'Racha más larga', unit: 'días' },
        casesOpened: { label: 'Cofres abiertos', unit: 'cofres' },
      },
      milestoneTiers: {
        bronze: 'Bronce',
        silver: 'Plata',
        gold: 'Oro',
        platinum: 'Platino',
      },
      milestoneDescriptions: {
        totalClicks: (amount) => `Haz ${amount} taps`,
        bestCps: (amount) => `Alcanza ${amount} t/s`,
        longestStreak: (amount) => `Clica ${amount} días seguidos`,
        casesOpened: (amount) => `Abre ${amount} cofres`,
      },
    },
    tree: {
      placeholder: 'Vista previa del árbol de mejoras — mueve y haz zoom para explorarlo.',
      zoomIn: 'Acercar',
      zoomOut: 'Alejar',
      resetView: 'Restablecer vista',
      level: 'Nv.',
      autoClickName: 'Drones',
      autoClickDesc: 'Cada dron produce 0.5 platino por segundo.',
      dronesUnit: 'drones',
      currentRate: 'Drones actuales:',
      nextLevelRate: 'Drones siguiente nivel:',
      upgrading: 'Mejorando…',
      premiumDesc: 'Multiplicador permanente aplicado a todos tus clicks para siempre. No se acumula con otros niveles — solo cuenta el más alto que tengas.',
      currentMultiplier: 'Multiplicador actual:',
      nextMultiplier: 'Multiplicador siguiente nivel:',
      luckName: 'Suerte',
      luckDesc: 'Probabilidad de que un click cuente por el multiplicador.',
      multiplierName: 'Productividad',
      multiplierDesc: 'Sube los clicks obtenidos por cada tap. Cada nivel suma encima del valor actual.',
      currentClickValue: 'Platino por tap actual:',
      nextClickValue: 'Platino por tap siguiente nivel:',
      luckChanceName: 'Probabilidad',
      luckChanceDesc: 'Sube la probabilidad de que un click cuente por el multiplicador de Suerte.',
      currentChance: 'Probabilidad actual:',
      nextChance: 'Probabilidad siguiente nivel:',
      legendaryEaseName: 'Ritmo',
      legendaryEaseDesc: 'Reduce los clicks que hacen falta para subir de nivel en modo Legendario.',
      currentStreakClicks: 'Clicks actuales:',
      nextStreakClicks: 'Clicks siguiente nivel:',
      legendaryGrowthName: 'Impulso',
      legendaryGrowthDesc: 'Aumenta la subida del multiplicador de modo Legendario cada vez que sube de nivel.',
      currentBonusStep: 'Subida actual:',
      nextBonusStep: 'Subida siguiente nivel:',
      fortunaName: 'Fortuna',
      fortunaDesc: 'La producción del autoclick tiene una probabilidad de contar por un multiplicador. Igual que Suerte, pero para el autoclick.',
      azarName: 'Azar',
      azarDesc: 'Sube la probabilidad de Fortuna.',
      turboName: 'Sobrecarga',
      turboDesc: 'Multiplica la producción del autoclick de forma garantizada.',
      tapMultiplierName: 'Multiplicador',
      tapMultiplierDesc: 'Multiplica los clicks por tap. Cada nivel sube el multiplicador un poco más.',
    },
    prestige: {
      confirmTitle: '¿Reiniciar y ganar puntos de prestigio?',
      confirmBody: (points) =>
        `Ganarás ${points} puntos de prestigio. Tu platino y todos los niveles del árbol volverán a 0 — tus estadísticas de por vida y los puntos de prestigio se quedan para siempre.`,
      confirmButton: 'Reiniciar',
      cancelButton: 'Cancelar',
      shopTitle: 'Prestigio',
      pointsLabel: 'Puntos de prestigio:',
      reactorName: 'Reactor',
      reactorDesc: 'Multiplicador permanente sobre toda tu producción. Sobrevive a cada reinicio.',
      currentMultiplier: 'Multiplicador actual:',
      nextMultiplier: 'Multiplicador siguiente nivel:',
      notEnoughPoints: 'Te faltan puntos de prestigio',
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
      yourClicks: 'Your platinum',
      objectLabel: (n) => `Object #${n}`,
      objectsProgress: (broken, target) => `${broken} / ${target} levels`,
      prestigeReady: 'Prestige available!',
      changePrestige: 'Change prestige',
      prestigeComingSoon: 'Coming soon',
      cps: 'pt/s',
      tps: 't/s',
      totalLabel: 'Total:',
      heat: {
        onFire: 'On fire',
        unstoppable: 'Unstoppable',
        legendary: 'Legendary',
      },
      inventory: 'Inventory',
      inventoryTitle: 'Inventory',
      openButton: 'Open',
      activateButton: 'Activate',
      inventoryEmpty: "Your items live here. Once you get one, it'll show up here.",
      durationLabel: (seconds) => `Lasts ${seconds}s`,
    },
    nav: {
      home: 'Home',
      leaderboard: 'Leaderboard',
      tree: 'Tree',
      stats: 'Stats',
      store: 'Store',
    },
    leaderboard: {
      title: 'Global leaderboard',
      subtitle: 'Compete with other players for platinum.',
      empty: 'No one has clicked yet. Be the first!',
      you: 'You',
      fallbackName: 'Player',
      clicksTab: 'Platinum ranking',
      cpsTab: 'Speed ranking',
    },
    store: {
      title: 'Store',
      subtitle: 'Boost your clicks with powerups and permanent upgrades.',
      costLabel: 'platinum',
      buy: 'Buy',
      buying: 'Buying…',
      availableIn: (time) => `Available in ${time}`,
      active: 'Active',
      owned: 'Owned',
      notEnoughClicks: "You're short on platinum",
      lootSection: 'Prizes',
      casesSection: 'Chests',
      casesSubtitle: 'Buy chests to open them with keys and try your luck.',
      openCase: 'Open chest',
      openCaseMoney: 'Buy chest',
      openCaseGems: 'Open with gems',
      notEnoughGems: "You're short on gems",
      notEnoughKeys: 'You need a key',
      notEnoughChests: 'Buy a chest first',
      notEnoughClicksForChest: "You're short on platinum",
      buyChest: 'Buy chest',
      chestLimitReached: "You've hit the chest limit",
      claimDailyKey: 'Claim free daily key',
      keyClaimedToday: 'Daily key claimed',
      claimingKey: 'Claiming…',
      buyClicksTitle: 'Buy platinum',
      buyKeysTitle: 'Buy keys',
      buyGemsTitle: 'Buy gems',
      savingsBadge: (pct) => `Save ${pct}%`,
      opening: 'Opening…',
      youWon: (amount) => `+${amount} platinum`,
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
      caseTitleClicks: 'Platinum chest',
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
      timedLuckTitle: 'Luck',
      timedLuckSubtitle: 'Multiplies your permanent Luck while active.',
      magnetsTitle: 'Magnets',
      magnetsSubtitle: 'While active, every click has a small chance of giving you an item.',
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
        luck_x10: { name: 'Luck x10', desc: '1% chance of a x10 click.' },
        luck_x25: { name: 'Luck x25', desc: '1% chance of a x25 click.' },
        luck_x50: { name: 'Luck x50', desc: '1% chance of a x50 click.' },
        luck_x100: { name: 'Luck x100', desc: '1% chance of a x100 click. The highest one.' },
      },
      magnets: {
        key_magnet: {
          name: 'Key magnet',
          desc: 'While active, every click has a small chance of also granting an extra key.',
        },
        gem_magnet: {
          name: 'Gem magnet',
          desc: 'While active, every click has a small chance of also granting an extra gem.',
        },
      },
    },
    stats: {
      streakUnit: 'days',
      rewardLabel: 'Reward',
      claim: 'Claim',
      claiming: 'Claiming…',
      claimed: 'Claimed',
      rewardPowerup: (name) => `${name} powerup`,
      rewardClicks: (amount) => `+${amount} platinum`,
      rewardPermanent: (mult) => `×${mult} to all your clicks`,
      categories: {
        totalClicks: { label: 'Real taps', unit: 'taps' },
        bestCps: { label: 'Peak speed', unit: 't/s' },
        longestStreak: { label: 'Longest streak', unit: 'days' },
        casesOpened: { label: 'Chests opened', unit: 'chests' },
      },
      milestoneTiers: {
        bronze: 'Bronze',
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum',
      },
      milestoneDescriptions: {
        totalClicks: (amount) => `Make ${amount} taps`,
        bestCps: (amount) => `Reach ${amount} t/s`,
        longestStreak: (amount) => `Click ${amount} days in a row`,
        casesOpened: (amount) => `Open ${amount} chests`,
      },
    },
    tree: {
      placeholder: 'Preview of the upgrade tree — drag and zoom to explore it.',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      resetView: 'Reset view',
      level: 'Lv.',
      autoClickName: 'Drones',
      autoClickDesc: 'Each drone produces 0.5 platinum per second.',
      dronesUnit: 'drones',
      currentRate: 'Current drones:',
      nextLevelRate: 'Next level drones:',
      upgrading: 'Upgrading…',
      premiumDesc: 'A permanent multiplier applied to every click, forever. Doesn\'t stack with other levels — only the highest one you own counts.',
      currentMultiplier: 'Current multiplier:',
      nextMultiplier: 'Next level multiplier:',
      luckName: 'Luck',
      luckDesc: 'Chance for a click to count for the multiplier instead.',
      multiplierName: 'Productivity',
      multiplierDesc: "Raises the clicks earned per tap. Each level adds on top of the current value.",
      currentClickValue: 'Current platinum per tap:',
      nextClickValue: 'Next level platinum per tap:',
      luckChanceName: 'Chance',
      luckChanceDesc: "Raises the odds that a click counts for Suerte's multiplier.",
      currentChance: 'Current chance:',
      nextChance: 'Next level chance:',
      legendaryEaseName: 'Pace',
      legendaryEaseDesc: 'Lowers how many clicks it takes to level up while in Legendary mode.',
      currentStreakClicks: 'Current clicks:',
      nextStreakClicks: 'Next level clicks:',
      legendaryGrowthName: 'Boost',
      legendaryGrowthDesc: "Raises how much Legendary's multiplier increases each time it levels up.",
      currentBonusStep: 'Current increase:',
      nextBonusStep: 'Next level increase:',
      fortunaName: 'Fortune',
      fortunaDesc: "Auto-click's production has a chance to count for a multiplier — same as Luck, but for auto-click.",
      azarName: 'Odds',
      azarDesc: "Raises Fortune's chance.",
      turboName: 'Overload',
      turboDesc: "Guaranteed multiplier on auto-click's production.",
      tapMultiplierName: 'Multiplier',
      tapMultiplierDesc: "Multiplies clicks per tap. Each level raises the multiplier a bit further.",
    },
    prestige: {
      confirmTitle: 'Reset and earn prestige points?',
      confirmBody: (points) =>
        `You'll earn ${points} prestige points. Your platinum and every tree level go back to 0 — lifetime stats and prestige points stay forever.`,
      confirmButton: 'Reset',
      cancelButton: 'Cancel',
      shopTitle: 'Prestige',
      pointsLabel: 'Prestige points:',
      reactorName: 'Reactor',
      reactorDesc: 'Permanent multiplier on all your production. Survives every reset.',
      currentMultiplier: 'Current multiplier:',
      nextMultiplier: 'Next level multiplier:',
      notEnoughPoints: "You're short on prestige points",
    },
  },
}
