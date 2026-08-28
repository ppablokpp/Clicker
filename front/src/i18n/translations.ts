export type Language = 'es' | 'en'

export interface TranslationStrings {
  signIn: {
    tagline: string
    continueWithGoogle: string
    redirecting: string
    genericError: string
  }
  home: {
    objectLabel: (n: string) => string
    objectsProgress: (broken: string, target: string) => string
    prestigeReady: string
    changePrestige: string
    cps: string
    tps: string
    totalLabel: string
    hudPlatinoLabel: string
    hudProdLabel: string
    hudHeatLabel: string
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
    ship: string
    commandCenterTitle: string
    shipSection: string
    fleetSection: string
    shipDroneProduction: string
    shipDroneProductionDesc: string
    shipDroneCount: string
    shipDroneCountDesc: string
    shipDronePerUnitDesc: string
    shipLuckChance: string
    shipLuckPowerDesc: string
    shipLuckChanceDesc: string
    shipScoutDrones: string
    shipScoutDronesCountDesc: string
    shipScoutDronesPerUnitDesc: string
    shipPower: string
    shipPowerDesc: string
    shipMultiShot: string
    shipMultiShotDesc: string
    shipNotInstalled: string
    tasks: string
    tasksTitle: string
    tasksEmpty: string
    log: string
    logTitle: string
    logEmpty: string
    trajectoryTierNames: readonly [string, string, string, string, string]
    trajectoryExtraction: (current: string, target: string) => string
    trajectoryExtractionUnknown: string
    trajectoryCurrent: string
    trajectoryLocked: string
    trajectoryComingSoon: string
    trajectoryPrestigeTitle: string
    trajectoryPrestigeBody: (nextTierName: string) => string
    trajectoryPrestigeConfirm: string
    trajectoryPrestigeCancel: string
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
    legendaryUnlockName: string
    legendaryUnlockDesc: string
    legendaryEaseName: string
    legendaryEaseDesc: string
    currentStreakClicks: string
    nextStreakClicks: string
    legendaryGrowthName: string
    legendaryGrowthDesc: string
    currentBonusStep: string
    nextBonusStep: string
    scoutDroneName: string
    scoutDroneDesc: string
    scoutDroneCurrentLabel: string
    scoutDroneNextLabel: string
    scoutFrequencyName: string
    scoutFrequencyDesc: string
    turboName: string
    turboDesc: string
    tapMultiplierName: string
    tapMultiplierDesc: string
    multiShotName: string
    multiShotDesc: string
    currentMultiShot: string
    nextMultiShot: string
    currentProduction: string
    nextProduction: string
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
  battle: {
    buttonLabel: string
    modalTitle: string
    description: (wager: string, seconds: number) => string
    newBattle: string
    incomingSection: string
    historySection: string
    noIncoming: string
    noHistory: string
    pickOpponent: string
    challengeButton: (wager: string) => string
    acceptButton: (wager: string) => string
    notEnoughPlatinum: string
    waitingForYou: string
    waitingForOpponent: string
    youWon: string
    youLost: string
    tieResult: string
    vsLabel: (name: string) => string
    tapToStart: string
    yourTaps: string
    submitting: string
    sentResult: (taps: string) => string
    backButton: string
    resultTapsLine: (yours: string, theirs: string) => string
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
      objectLabel: (n) => `Objeto #${n}`,
      objectsProgress: (broken, target) => `${broken} / ${target} niveles`,
      prestigeReady: '¡Prestigio disponible!',
      changePrestige: 'Cambiar de prestigio',
      cps: 'pt/s',
      tps: 't/s',
      hudPlatinoLabel: 'Tu platino',
      hudProdLabel: 'Producción',
      hudHeatLabel: 'Ritmo',
      totalLabel: 'Total:',
      heat: {
        onFire: 'Moderado',
        unstoppable: 'Imparable',
        legendary: 'Legendario',
      },
      inventory: 'Inventario',
      inventoryTitle: 'Inventario',
      openButton: 'Abrir',
      activateButton: 'Activar',
      inventoryEmpty: 'Aquí se guardan tus objetos. Cuando consigas alguno, aparecerá aquí.',
      durationLabel: (seconds) => `Dura ${seconds}s`,
      ship: 'Tu nave',
      commandCenterTitle: 'Centro de mando',
      shipSection: 'Tu nave',
      fleetSection: 'Flota',
      shipDroneProduction: 'Producción de la flota',
      shipDroneProductionDesc: 'Producción total:',
      shipDroneCount: 'Drones',
      shipDroneCountDesc: 'Drones activos:',
      shipDronePerUnitDesc: 'Producción de cada dron:',
      shipLuckChance: 'Destello',
      shipLuckPowerDesc: 'Potencia de destello:',
      shipLuckChanceDesc: 'Probabilidad de destello:',
      shipScoutDrones: 'Drones buscadores',
      shipScoutDronesCountDesc: 'Drones buscadores activos:',
      shipScoutDronesPerUnitDesc: 'Producción de cada dron buscador:',
      shipPower: 'Potencia',
      shipPowerDesc: 'Platino que se extrae por cada disparo:',
      shipMultiShot: 'Multidisparo',
      shipMultiShotDesc: 'Cañones de la nave principal:',
      shipNotInstalled: 'No instalado',
      tasks: 'Tareas',
      tasksTitle: 'Tareas pendientes',
      tasksEmpty: 'No tienes tareas pendientes.',
      log: 'Trayectoria',
      logTitle: 'Trayectoria',
      logEmpty: 'Todavía no hay datos de trayectoria.',
      trajectoryTierNames: ['Platino', 'Amatista', 'Esmeralda', 'Oro', 'Diamante'],
      trajectoryExtraction: (current, target) => `Extracción: ${current}/${target}`,
      trajectoryExtractionUnknown: 'Extracción: ???',
      trajectoryCurrent: 'Actual',
      trajectoryLocked: 'Bloqueado',
      trajectoryComingSoon: 'Próximamente',
      trajectoryPrestigeTitle: '¿Cambiar de prestigio?',
      trajectoryPrestigeBody: (nextTierName) =>
        `Tu platino actual se reseteará, se eliminará todo el progreso de tu árbol de mejoras, y tu nave viajará hacia otro asteroide para hacer una extracción de ${nextTierName}. Tu puntuación total de la clasificación nunca se pierde.`,
      trajectoryPrestigeConfirm: 'Cambiar',
      trajectoryPrestigeCancel: 'Cancelar',
    },
    nav: {
      home: 'Nave',
      leaderboard: 'Clasificación',
      tree: 'Progreso',
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
      moneyUpgradesTitle: 'Núcleo de gemas',
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
        totalClicks: { label: 'Disparos', unit: 'disparos' },
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
        totalClicks: (amount) => `Dispara ${amount} veces`,
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
      autoClickDesc: 'Cada dron produce 0.5 pt/s.',
      dronesUnit: 'drones',
      currentRate: 'Drones actuales:',
      nextLevelRate: 'Drones siguiente nivel:',
      upgrading: 'Mejorando…',
      premiumDesc: 'Multiplicador permanente aplicado a la potencia de cada disparo, para siempre. No se acumula con otros niveles — solo cuenta el más alto que tengas.',
      currentMultiplier: 'Multiplicador actual:',
      nextMultiplier: 'Multiplicador siguiente nivel:',
      luckName: 'Destello',
      luckDesc: 'Cada disparo tiene una probabilidad de encontrar un destello y multiplicar su potencia.',
      multiplierName: 'Potencia',
      multiplierDesc: 'Aumenta la potencia de cada disparo.',
      currentClickValue: 'Potencia actual:',
      nextClickValue: 'Potencia siguiente nivel:',
      luckChanceName: 'Telescopio',
      luckChanceDesc: 'Aumenta la probabilidad de detectar un destello al disparar.',
      currentChance: 'Probabilidad actual:',
      nextChance: 'Probabilidad siguiente nivel:',
      legendaryUnlockName: 'Modo Legendario',
      legendaryUnlockDesc:
        'Desbloquea un multiplicador de la potencia de cada disparo al sobrecalentar el cañón a 20 disparos por segundo.',
      legendaryEaseName: 'Catalizador',
      legendaryEaseDesc: 'Reduce los disparos necesarios para sobrecalentar el cañón y subir de nivel en modo Legendario.',
      currentStreakClicks: 'Disparos actuales:',
      nextStreakClicks: 'Disparos siguiente nivel:',
      legendaryGrowthName: 'Impulso',
      legendaryGrowthDesc: 'Aumenta la subida del multiplicador de modo Legendario cada vez que sube de nivel.',
      currentBonusStep: 'Subida actual:',
      nextBonusStep: 'Subida siguiente nivel:',
      scoutDroneName: 'Dron buscador',
      scoutDroneDesc: 'Drones capaces de encontrar destellos para mejorar su producción.',
      scoutDroneCurrentLabel: 'Drones buscadores actuales:',
      scoutDroneNextLabel: 'Drones buscadores siguiente nivel:',
      scoutFrequencyName: 'Frecuencia',
      scoutFrequencyDesc: 'Sintoniza el radar de tus drones buscadores para aumentar su producción.',
      turboName: 'Sobrecarga',
      turboDesc: 'Sobrecarga el reactor de tus drones, aumentando su producción.',
      tapMultiplierName: 'Amplificador',
      tapMultiplierDesc: 'Multiplica la potencia de cada disparo.',
      multiShotName: 'Multidisparo',
      multiShotDesc: 'Aumenta los cañones de la nave principal.',
      currentMultiShot: 'Cañones actuales:',
      nextMultiShot: 'Cañones siguiente nivel:',
      currentProduction: 'Producción actual:',
      nextProduction: 'Producción siguiente nivel:',
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
    battle: {
      buttonLabel: 'Duelo',
      modalTitle: 'Duelo estelar',
      description: (wager, seconds) =>
        `Reta a quien quieras a un duelo de disparos. Tenéis ${seconds} segundos para clicar todo lo que podáis — quien haga más se lleva ${wager} de platino del otro.`,
      newBattle: 'Nuevo duelo',
      incomingSection: 'Duelos pendientes',
      historySection: 'Historial',
      noIncoming: 'No tienes duelos pendientes.',
      noHistory: 'Todavía no has jugado ningún duelo.',
      pickOpponent: 'Elige a tu rival',
      challengeButton: (wager) => `Retar por ${wager}`,
      acceptButton: (wager) => `Aceptar por ${wager}`,
      notEnoughPlatinum: 'Te falta platino para esto',
      waitingForYou: 'Esperando a que juegues tu ronda',
      waitingForOpponent: 'Esperando a tu rival',
      youWon: '¡Has ganado!',
      youLost: 'Has perdido.',
      tieResult: 'Empate — se ha devuelto tu apuesta.',
      vsLabel: (name) => `vs ${name}`,
      tapToStart: 'Toca para empezar',
      yourTaps: 'Tus disparos:',
      submitting: 'Enviando resultado…',
      sentResult: (taps) => `¡Duelo enviado! ${taps} disparos. Esperando a tu rival.`,
      backButton: 'Volver',
      resultTapsLine: (yours, theirs) => `Tú: ${yours} · Rival: ${theirs}`,
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
      objectLabel: (n) => `Object #${n}`,
      objectsProgress: (broken, target) => `${broken} / ${target} levels`,
      prestigeReady: 'Prestige available!',
      changePrestige: 'Change prestige',
      cps: 'pt/s',
      tps: 't/s',
      hudPlatinoLabel: 'Your platinum',
      hudProdLabel: 'Production',
      hudHeatLabel: 'Pace',
      totalLabel: 'Total:',
      heat: {
        onFire: 'Moderate',
        unstoppable: 'Unstoppable',
        legendary: 'Legendary',
      },
      inventory: 'Inventory',
      inventoryTitle: 'Inventory',
      openButton: 'Open',
      activateButton: 'Activate',
      inventoryEmpty: "Your items live here. Once you get one, it'll show up here.",
      durationLabel: (seconds) => `Lasts ${seconds}s`,
      ship: 'Your Ship',
      commandCenterTitle: 'Command Center',
      shipSection: 'Your Ship',
      fleetSection: 'Fleet',
      shipDroneProduction: 'Fleet production',
      shipDroneProductionDesc: 'Total production:',
      shipDroneCount: 'Drones',
      shipDroneCountDesc: 'Active drones:',
      shipDronePerUnitDesc: 'Production per drone:',
      shipLuckChance: 'Glimmer',
      shipLuckPowerDesc: 'Glimmer power:',
      shipLuckChanceDesc: 'Glimmer odds:',
      shipScoutDrones: 'Scout drones',
      shipScoutDronesCountDesc: 'Active scout drones:',
      shipScoutDronesPerUnitDesc: 'Production per scout drone:',
      shipPower: 'Power',
      shipPowerDesc: 'Platinum pulled out with every shot:',
      shipMultiShot: 'Multi-shot',
      shipMultiShotDesc: 'Main ship cannons:',
      shipNotInstalled: 'Not installed',
      tasks: 'Tasks',
      tasksTitle: 'Pending tasks',
      tasksEmpty: "You don't have any pending tasks.",
      log: 'Trajectory',
      logTitle: 'Trajectory',
      logEmpty: 'No trajectory data yet.',
      trajectoryTierNames: ['Platinum', 'Amethyst', 'Emerald', 'Gold', 'Diamond'],
      trajectoryExtraction: (current, target) => `Extraction: ${current}/${target}`,
      trajectoryExtractionUnknown: 'Extraction: ???',
      trajectoryCurrent: 'Current',
      trajectoryLocked: 'Locked',
      trajectoryComingSoon: 'Coming soon',
      trajectoryPrestigeTitle: 'Change prestige?',
      trajectoryPrestigeBody: (nextTierName) =>
        `Your current platino will reset, all of your upgrade tree progress will be wiped, and your ship will travel to another asteroid to mine ${nextTierName}. Your total leaderboard score is never lost.`,
      trajectoryPrestigeConfirm: 'Change',
      trajectoryPrestigeCancel: 'Cancel',
    },
    nav: {
      home: 'Ship',
      leaderboard: 'Leaderboard',
      tree: 'Progress',
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
      moneyUpgradesTitle: 'Gem Core',
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
        totalClicks: { label: 'Shots', unit: 'shots' },
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
        totalClicks: (amount) => `Fire ${amount} times`,
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
      autoClickDesc: 'Each drone produces 0.5 pt/s.',
      dronesUnit: 'drones',
      currentRate: 'Current drones:',
      nextLevelRate: 'Next level drones:',
      upgrading: 'Upgrading…',
      premiumDesc: 'A permanent multiplier applied to the power of every shot, forever. Doesn\'t stack with other levels — only the highest one you own counts.',
      currentMultiplier: 'Current multiplier:',
      nextMultiplier: 'Next level multiplier:',
      luckName: 'Glimmer',
      luckDesc: 'Each shot has a chance to find a glimmer and multiply its power.',
      multiplierName: 'Power',
      multiplierDesc: "Raises the power of each shot.",
      currentClickValue: 'Current power:',
      nextClickValue: 'Next level power:',
      luckChanceName: 'Telescope',
      luckChanceDesc: "Raises the odds of detecting a glimmer when you fire.",
      currentChance: 'Current chance:',
      nextChance: 'Next level chance:',
      legendaryUnlockName: 'Legendary Mode',
      legendaryUnlockDesc: 'Unlocks a multiplier on the power of every shot by overheating the cannon at 20 shots per second.',
      legendaryEaseName: 'Catalyst',
      legendaryEaseDesc: 'Lowers how many shots it takes to overheat the cannon and level up within Legendary mode.',
      currentStreakClicks: 'Current shots:',
      nextStreakClicks: 'Next level shots:',
      legendaryGrowthName: 'Boost',
      legendaryGrowthDesc: "Raises how much Legendary's multiplier increases each time it levels up.",
      currentBonusStep: 'Current increase:',
      nextBonusStep: 'Next level increase:',
      scoutDroneName: 'Scout Drone',
      scoutDroneDesc: 'Drones able to find glimmers to boost their production.',
      scoutDroneCurrentLabel: 'Current scout drones:',
      scoutDroneNextLabel: 'Next level scout drones:',
      scoutFrequencyName: 'Frequency',
      scoutFrequencyDesc: "Tunes your scout drones' radar to boost their production.",
      turboName: 'Overload',
      turboDesc: "Overloads your drones' reactor, increasing their production.",
      tapMultiplierName: 'Amplifier',
      tapMultiplierDesc: "Multiplies the power of each shot.",
      multiShotName: 'Multi-shot',
      multiShotDesc: "Increases the main ship's cannons.",
      currentMultiShot: 'Current cannons:',
      nextMultiShot: 'Next level cannons:',
      currentProduction: 'Current production:',
      nextProduction: 'Next level production:',
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
    battle: {
      buttonLabel: 'Duel',
      modalTitle: 'Stellar Duel',
      description: (wager, seconds) =>
        `Challenge anyone to a shooting duel. You both get ${seconds} seconds to click as much as you can — whoever taps more takes ${wager} platinum from the other.`,
      newBattle: 'New duel',
      incomingSection: 'Pending duels',
      historySection: 'History',
      noIncoming: "You don't have any pending duels.",
      noHistory: "You haven't played any duels yet.",
      pickOpponent: 'Pick your rival',
      challengeButton: (wager) => `Challenge for ${wager}`,
      acceptButton: (wager) => `Accept for ${wager}`,
      notEnoughPlatinum: "You're short on platinum for this",
      waitingForYou: 'Waiting for you to play your round',
      waitingForOpponent: "Waiting for your rival",
      youWon: 'You won!',
      youLost: 'You lost.',
      tieResult: 'Tie — your wager was refunded.',
      vsLabel: (name) => `vs ${name}`,
      tapToStart: 'Tap to start',
      yourTaps: 'Your shots:',
      submitting: 'Sending result…',
      sentResult: (taps) => `Duel sent! ${taps} shots. Waiting for your rival.`,
      backButton: 'Back',
      resultTapsLine: (yours, theirs) => `You: ${yours} · Rival: ${theirs}`,
    },
  },
}
