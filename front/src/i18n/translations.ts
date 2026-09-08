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
    viewModeLabel: string
    changePrestige: string
    tps: string
    totalLabel: string
    hudPlatinoLabel: (materialName: string) => string
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
    shipOfflineProductionDesc: string
    shipDroneCount: string
    shipDroneCountDesc: string
    shipDronePerUnitDesc: string
    shipLuckChance: string
    shipLuckPowerDesc: string
    shipLuckChanceDesc: string
    shipScoutDrones: string
    shipScoutDronesCountDesc: string
    shipScoutDronesPerUnitDesc: string
    shipGunners: string
    shipGunnersCountDesc: string
    shipGunnersPerUnitDesc: string
    shipPower: string
    shipPowerDesc: (materialName: string) => string
    shipMultiShot: string
    shipMultiShotDesc: string
    shipNotInstalled: string
    tasks: string
    tasksTitle: string
    tasksEmpty: string
    taskFirstDroneName: string
    taskFirstDroneDesc: string
    taskDroneSquadronName: string
    taskDroneSquadronDesc: string
    taskDroneSwarmName: string
    taskDroneSwarmDesc: string
    taskSecondCannonName: string
    taskSecondCannonDesc: string
    taskFullBatteryName: string
    taskFullBatteryDesc: string
    taskTotalArsenalName: string
    taskTotalArsenalDesc: string
    taskFirstScoutDroneName: string
    taskFirstScoutDroneDesc: string
    taskScoutSquadName: string
    taskScoutSquadDesc: string
    taskScoutFleetName: string
    taskScoutFleetDesc: string
    taskFirstAnomalyName: string
    taskFirstAnomalyDesc: string
    taskAnomalyHunterName: string
    taskAnomalyHunterDesc: string
    taskSectorGuardianName: string
    taskSectorGuardianDesc: string
    taskFirstGlimmersName: string
    taskFirstGlimmersDesc: string
    taskGlimmerStreakName: string
    taskGlimmerStreakDesc: string
    taskGlimmerMasterName: string
    taskGlimmerMasterDesc: string
    missionDronesName: string
    missionMultiShotName: string
    missionScoutName: string
    missionAnomalyName: string
    missionLuckyName: string
    tasksRewardsLabel: string
    tasksAllClaimed: string
    taskReward: (amount: string) => string
    taskClaim: string
    taskClaiming: string
    taskClaimed: string
    taskLocked: string
    tasksProgress: (done: string, total: string) => string
    log: string
    logTitle: string
    logEmpty: string
    trajectoryTierNames: readonly [string, string, string, string, string, string, string]
    trajectoryExtraction: (current: string, target: string) => string
    trajectoryExtractionUnknown: string
    trajectoryCurrent: string
    trajectoryLocked: string
    trajectoryComingSoon: string
    trajectoryPrestigeTitle: string
    trajectoryPrestigeBody: (currentTierName: string, nextTierName: string) => string
    trajectoryPrestigeConfirm: string
    trajectoryPrestigeCancel: string
    fleetAwayTitle: string
    fleetAwayPrefix: string
    fleetAwaySuffix: string
    fleetAwayAccept: string
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
  profile: {
    profileTab: string
    statsTab: string
    usernamePlaceholder: string
    save: string
    editName: string
    cancel: string
    emailLabel: string
    noEmail: string
    languageLabel: string
    soundLabel: string
    settingsLabel: string
    signOut: string
    signedOutTitle: string
    signedOutBody: string
    signInRewardTitle: string
    signInRewardBody: (style: number, rare: number) => string
    signIn: string
    errorUsernameTaken: string
    errorUsernameInvalid: string
    errorGeneric: string
    rankLabel: string
    rankOf: (total: string) => string
    rankUnranked: string
    rankFirst: string
    rankGap: (amount: string, name: string) => string
    rankViewAll: string
    joinedOn: (date: string) => string
    notFoundTitle: string
    notFoundBody: string
    backButton: string
    customizeTitle: string
    customizeAria: string
    slotHelmet: string
    slotSuit: string
    slotBoots: string
    slotBracelet: string
    slotBelt: string
    slotAccent: string
    slotAntenna: string
    slotPack: string
    slotTrail: string
    slotBadge: string
    slotVisor: string
    slotBackground: string
    slotPet: string
    slotPet1: string
    slotPet2: string
    tabHead: string
    tabBody: string
    /** The locker grid and the per-piece detail page it opens. */
    lockerCollection: string
    detailBack: string
    detailUnlock: string
    detailEquip: string
    detailEquipped: string
    detailMissingGems: string
    detailMissingGemsOne: string
    detailBuying: string
    detailError: string
    detailStock: string
    detailUnlockedNote: string
    styleNames: Record<string, string>
    /** One line per piece, keyed "slot:id". Shown on the detail page. */
    styleDescriptions: Record<string, string>
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
    notEnoughClicksForChest: (materialName: string) => string
    buyChest: string
    chestLimitReached: string
    claimDailyKey: string
    keyClaimedToday: string
    claimingKey: string
    buyClicksTitle: (materialName: string) => string
    buyKeysTitle: string
    buyGemsTitle: string
    savingsBadge: (pct: number) => string
    opening: string
    youWon: (amount: string, materialName: string) => string
    youWonGems: (amount: string) => string
    casePrizeNames: Record<string, string>
    caseCatalogButton: string
    caseCatalogTitle: string
    caseMythicLabel: string
    caseTitleClicks: (materialName: string) => string
    caseTitleGems: string
    // Cosmetics chest — front-only preview for now, see CosmeticCaseCard.
    cosmeticCaseSection: string
    cosmeticCaseSubtitle: string
    cosmeticCaseDemoBadge: string
    cosmeticCaseSoon: string
    cosmeticCaseTitleKeys: string
    cosmeticCaseTitleGems: string
    cosmeticCaseOpen: string
    cosmeticCaseCatalogTitle: string
    cosmeticRarityNames: Record<string, string>
    // Chest bench — the chest card's rack/batch flow, see ChestBench.tsx.
    chestBenchAdd: string
    chestGranted: string
    chestBenchSelected: (count: number, max: number) => string
    chestBenchClear: string
    chestBenchEmpty: string
    chestCollectionComplete: string
    chestBenchMissingKeys: (count: number) => string
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
    autoClickDesc: (rate: string, unit: string) => string
    dronesUnit: string
    currentRate: string
    nextLevelRate: string
    upgrading: string
    premiumDesc: string
    fleetCoreName: string
    fleetCoreDesc: string
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
    legendaryUnlockDesc: (tps: string) => string
    legendaryEaseName: string
    legendaryEaseDesc: string
    currentStreakClicks: string
    nextStreakClicks: string
    legendaryGrowthName: string
    legendaryGrowthDesc: string
    currentBonusStep: string
    nextBonusStep: string
    legendaryThresholdName: string
    legendaryThresholdDesc: string
    currentThresholdTps: string
    nextThresholdTps: string
    scoutDroneName: string
    scoutDroneDesc: string
    scoutDroneCurrentLabel: string
    scoutDroneNextLabel: string
    scoutFrequencyName: string
    scoutFrequencyDesc: string
    gunnerName: string
    gunnerDesc: string
    gunnerRateName: string
    gunnerRateDesc: string
    currentGunners: string
    nextGunners: string
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
    anomalyUnlockName: string
    anomalyUnlockDesc: (materialName: string) => string
    anomalyRewardName: string
    anomalyRewardDesc: (materialName: string) => string
    currentAnomalyReward: string
    nextAnomalyReward: string
    anomalyFrequencyName: string
    anomalyFrequencyDesc: string
    currentAnomalyFrequency: string
    nextAnomalyFrequency: string
    formatAnomalyWait: (seconds: number) => string
    offlineProductionName: string
    offlineProductionDesc: string
    currentOfflineProduction: string
    nextOfflineProduction: string
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
    description: (seconds: number) => string
    newBattle: string
    incomingSection: string
    historySection: string
    noIncoming: string
    noHistory: string
    pickOpponent: string
    searchOpponent: string
    noOpponentResults: string
    chooseWager: string
    lowerWager: string
    raiseWager: string
    payoutLine: (amount: string) => string
    challengeFailed: string
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
  event: {
    ariaLabel: string
    title: string
    subtitle: string
    successTitle: string
    successBody: (amount: string, materialName: string) => string
    failureTitle: string
    failureBody: string
    unclaimedTitle: string
    unclaimedBody: string
  }
  tutorial: {
    next: string
    finish: string
    freeLabel: string
    replayAriaLabel: string
    replayConfirmTitle: string
    replayConfirmYes: string
    replayConfirmNo: string
    introText: string
    pointAsteroidText: string
    pointTreeNavText: string
    pointTreeRootText: string
    pointTreeBuyText: string
    closingText: string
    droneFusionIntroText: string
    droneFusionHomeText: string
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
      prestigeReady: '¡Mineral disponible!',
      viewModeLabel: 'Ajustar vista',
      changePrestige: 'Abandonar asteroide',
      tps: 't/s',
      hudPlatinoLabel: (materialName) => `Tu ${materialName.toLowerCase()}`,
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
      shipOfflineProductionDesc: 'Producción offline:',
      shipDroneCount: 'Drones',
      shipDroneCountDesc: 'Drones activos:',
      shipDronePerUnitDesc: 'Producción de cada dron:',
      shipLuckChance: 'Destello',
      shipLuckPowerDesc: 'Potencia de destello:',
      shipLuckChanceDesc: 'Probabilidad de destello:',
      shipScoutDrones: 'Drones buscadores',
      shipScoutDronesCountDesc: 'Drones buscadores activos:',
      shipScoutDronesPerUnitDesc: 'Producción de cada dron buscador:',
      shipGunners: 'Artilleros',
      shipGunnersCountDesc: 'Artilleros en posición:',
      shipGunnersPerUnitDesc: 'Producción de cada artillero:',
      shipPower: 'Potencia',
      shipPowerDesc: (materialName) => `${materialName} que se extrae por cada disparo:`,
      shipMultiShot: 'Multidisparo',
      shipMultiShotDesc: 'Cañones de la nave principal:',
      shipNotInstalled: 'No instalado',
      tasks: 'Tareas',
      tasksTitle: 'Tareas pendientes',
      tasksEmpty: 'No tienes tareas pendientes.',
      taskFirstDroneName: 'Primer despegue',
      taskFirstDroneDesc: 'Desbloquea tu primer dron',
      taskDroneSquadronName: 'Escuadrón',
      taskDroneSquadronDesc: 'Consigue 10 drones',
      taskDroneSwarmName: 'Enjambre',
      taskDroneSwarmDesc: 'Consigue 30 drones',
      taskSecondCannonName: 'Doble cañón',
      taskSecondCannonDesc: 'Consigue el segundo cañón de tu nave',
      taskFullBatteryName: 'Batería completa',
      taskFullBatteryDesc: 'Consigue 5 cañones en tu nave',
      taskTotalArsenalName: 'Arsenal total',
      taskTotalArsenalDesc: 'Consigue los 10 cañones de tu nave',
      taskFirstScoutDroneName: 'Primer explorador',
      taskFirstScoutDroneDesc: 'Consigue tu primer dron buscador',
      taskScoutSquadName: 'Patrulla exploradora',
      taskScoutSquadDesc: 'Consigue 10 drones buscadores',
      taskScoutFleetName: 'Flota de reconocimiento',
      taskScoutFleetDesc: 'Consigue 20 drones buscadores',
      taskFirstAnomalyName: 'Primer contacto',
      taskFirstAnomalyDesc: 'Neutraliza tu primera anomalía',
      taskAnomalyHunterName: 'Cazador de anomalías',
      taskAnomalyHunterDesc: 'Neutraliza 5 anomalías',
      taskSectorGuardianName: 'Guardián del sector',
      taskSectorGuardianDesc: 'Neutraliza 15 anomalías',
      taskFirstGlimmersName: 'Primeros destellos',
      taskFirstGlimmersDesc: 'Encuentra 100 destellos',
      taskGlimmerStreakName: 'Racha de destellos',
      taskGlimmerStreakDesc: 'Encuentra 1.000 destellos',
      taskGlimmerMasterName: 'Maestro del destello',
      taskGlimmerMasterDesc: 'Encuentra 10.000 destellos',
      missionDronesName: 'Flota de drones',
      missionMultiShotName: 'Potencia de fuego',
      missionScoutName: 'Reconocimiento estelar',
      missionAnomalyName: 'Anomalías',
      missionLuckyName: 'Cazador de destellos',
      tasksRewardsLabel: 'Recompensas',
      tasksAllClaimed: '¡Misión completada!',
      taskReward: (amount) => `+${amount}`,
      taskClaim: 'Reclamar',
      taskClaiming: 'Reclamando…',
      taskClaimed: 'Reclamado',
      taskLocked: 'Bloqueado',
      tasksProgress: (done, total) => `${done}/${total} completadas`,
      log: 'Trayectoria',
      logTitle: 'Trayectoria',
      logEmpty: 'Todavía no hay datos de trayectoria.',
      trajectoryTierNames: ['Amatista', 'Platino', 'Zafiro', 'Esmeralda', 'Rubí', 'Oro', 'Diamante'],
      trajectoryExtraction: (current, target) => `Extracción: ${current}/${target}`,
      trajectoryExtractionUnknown: 'Extracción: ???',
      trajectoryCurrent: 'Actual',
      trajectoryLocked: 'Bloqueado',
      trajectoryComingSoon: 'Próximamente',
      trajectoryPrestigeTitle: '¿Abandonar el asteroide?',
      trajectoryPrestigeBody: (currentTierName, nextTierName) =>
        `Tu ${currentTierName.toLowerCase()} actual se reseteará, se eliminará todo el progreso de tu árbol de mejoras, y tu nave viajará hacia otro asteroide para hacer una extracción de ${nextTierName}. Tu puntuación total de la clasificación nunca se pierde.`,
      trajectoryPrestigeConfirm: 'Abandonar',
      trajectoryPrestigeCancel: 'Cancelar',
      fleetAwayTitle: 'Informe de la flota',
      fleetAwayPrefix: 'Tu flota ha extraído',
      fleetAwaySuffix: 'mientras no estabas.',
      fleetAwayAccept: 'Aceptar',
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
    profile: {
      profileTab: 'Perfil',
      statsTab: 'Estadísticas',
      usernamePlaceholder: 'Tu nombre',
      save: 'Guardar',
      editName: 'Editar nombre',
      cancel: 'Cancelar',
      emailLabel: 'Correo',
      noEmail: 'Sin correo',
      languageLabel: 'Idioma',
      soundLabel: 'Sonido',
      settingsLabel: 'Ajustes',
      signOut: 'Cerrar sesión',
      signedOutTitle: 'Inicia sesión para tener un perfil',
      signedOutBody:
        'Tu progreso ya se está guardando de forma local. Inicia sesión para guardarlo en la nube y poder competir contra otros jugadores en la clasificación.',
      signInRewardTitle: 'Regalo de bienvenida',
      signInRewardBody: (style, rare) =>
        `Al iniciar sesión recibes ${style} cofres de estilo y ${rare} cofre de estilo raro.`,
      signIn: 'Iniciar sesión',
      errorUsernameTaken: 'Ese nombre ya está en uso. Prueba con otro.',
      errorUsernameInvalid: 'Ese nombre no es válido. Usa entre 4 y 20 caracteres, sin símbolos ni acentos, y no solo números.',
      errorGeneric: 'Algo ha fallado. Inténtalo de nuevo.',
      rankLabel: 'Puesto mundial',
      rankOf: (total) => `de ${total} jugadores`,
      rankUnranked: 'Sin clasificar todavía',
      rankFirst: 'Nadie por delante',
      rankGap: (amount, name) => `${amount} para adelantar a ${name}`,
      rankViewAll: 'Ver clasificación',
      joinedOn: (date) => `Se unió en ${date}`,
      notFoundTitle: 'Jugador no encontrado',
      notFoundBody: 'Puede que esta cuenta ya no exista.',
      backButton: 'Volver',
      customizeTitle: 'Personalizar',
      customizeAria: 'Personalizar astronauta',
      slotHelmet: 'Casco',
      slotSuit: 'Traje',
      slotBoots: 'Botas',
      slotBracelet: 'Brazaletes',
      slotBelt: 'Cinturón',
      slotAccent: 'Detalles',
      slotAntenna: 'Antena',
      slotPack: 'Mochila',
      slotTrail: 'Propulsor',
      slotBadge: 'Insignia',
      slotPet: 'Mascotas',
      slotPet1: 'Primera mascota',
      slotPet2: 'Segunda mascota',
      slotVisor: 'Visor',
      slotBackground: 'Fondo',
      tabHead: 'Cabeza',
      tabBody: 'Cuerpo',
      lockerCollection: 'Colección',
      detailBack: 'Atrás',
      detailUnlock: 'DESBLOQUEAR',
      detailEquip: 'EQUIPAR',
      detailEquipped: 'EQUIPADO',
      detailMissingGems: 'Te faltan {n} gemas',
      detailMissingGemsOne: 'Te falta {n} gema',
      detailBuying: 'Comprando…',
      detailError: 'No se pudo completar la compra',
      detailStock: 'Equipo básico',
      detailUnlockedNote: 'Desbloqueado',
      styleNames: {
        estandar: 'Estándar',
        limpio: 'Limpio',
        reticula: 'Retícula',
        grieta: 'Grieta',
        agujero: 'Agujero negro',
        turbinas: 'Turbinas',
        estrellas: 'Estrellas',
        rejilla: 'Hangar',
        meteoros: 'Meteoros',
        doble: 'Doble',
        halo: 'Halo',
        cilindros: 'Cilindros',
        reactor: 'Reactor',
        alas: 'Alas',
        planeta: 'Planeta',
        carga: 'Carga',
        aletas: 'Aletas',
        llama: 'Llama',
        ionico: 'Iónico',
        anillos: 'Anillos',
        estrella: 'Estrella',
        rayo: 'Rayo',
        zafiro: 'Zafiro',
        esmeralda: 'Esmeralda',
        rubi: 'Rubí',
        oro: 'Oro',
        carmesi: 'Carmesí',
        grafito: 'Grafito',
        acero: 'Acero',
        marino: 'Marino',
        arena: 'Arena',
        diamante: 'Diamante',
        violeta: 'Violeta',
        ninguna: 'Ninguna',
        chispa: 'Chispa',
        mascota1: 'Vigía',
        satelite: 'Satélite',
        orbe: 'Orbe',
      },
      // Con clave "slot:id" porque los ids se repiten entre ranuras — unas
      // botas carmesí y un cinturón carmesí son piezas distintas.
      styleDescriptions: {
        'visor:limpio': 'El cristal de siempre, sin nada impreso encima.',
        'visor:reticula': 'Retícula de puntería con lecturas laterales. Vende «piloto» sin tocar la silueta.',
        'visor:grieta': 'El cristal roto de quien ya ha estado ahí fuera. Cuenta una historia con cuatro líneas.',
        'visor:agujero': 'El visor no refleja: absorbe. Disco negro, anillo de luz curvada y ni una estrella se salva.',
        'pack:turbinas': 'Dos rotores montados en los hombros, girando de verdad y en sentidos opuestos.',
        'background:estrellas': 'Un campo de estrellas fijo. El fondo más sobrio y el que combina con todo.',
        'background:rejilla': 'Suelo de hangar en perspectiva, con las líneas convergiendo detrás de ti.',
        'background:meteoros': 'Tu mismo cielo, pero cruzado sin parar por estrellas fugaces.',

        'helmet:estandar': 'Casco blanco de reglamento con visera violeta. El que llevan todos el primer día.',
        'helmet:diamante': 'Cristal diamante sobre el casco de siempre. Frío y limpio.',
        'helmet:zafiro': 'Visera de zafiro, azul profundo de vuelo nocturno.',
        'helmet:rubi': 'Visera de rubí, roja como la alarma que nunca suena.',
        'helmet:esmeralda': 'Visera esmeralda, la favorita de los pilotos de sonda.',
        'helmet:oro': 'Visera dorada con tratamiento antirreflejos. Cara, y se nota.',
        'helmet:carmesi': 'Cristal carmesí. Se ve venir desde el otro lado del hangar.',
        'helmet:grafito': 'Casco de grafito con cristal ahumado. El único donde el material es la elección.',

        'suit:estandar': 'El traje EVA blanco de reglamento. Sencillo y nunca equivocado.',
        'suit:acero': 'Acero pulido con reflejos duros. Recién salido del taller.',
        'suit:marino': 'Azul marino de vuelo, cortado como un mono de piloto.',
        'suit:arena': 'Tonos de arena marciana, curtidos por el polvo.',
        'suit:carmesi': 'Carmesí profundo con costuras marcadas. Nada discreto.',
        'suit:grafito': 'Grafito mate del cuello a la cintura. Se bebe la luz.',

        'boots:estandar': 'Botas blancas de reglamento con suela reforzada.',
        'boots:acero': 'Puntera de acero pulido. Pesan lo que parece.',
        'boots:marino': 'Botas azul marino a juego con el mono de vuelo.',
        'boots:arena': 'Cuero color arena, ya con polvo de superficie encima.',
        'boots:carmesi': 'Carmesí de caña alta. Combinan con poco y no les importa.',
        'boots:grafito': 'Grafito mate: la bota que no refleja nada.',

        'belt:violeta': 'Cinturón violeta de reglamento con hebilla cuadrada.',
        'belt:oro': 'Banda y hebilla doradas. Puro adorno, y esa es la idea.',
        'belt:diamante': 'Una banda diamante que parte el traje por la mitad.',
        'belt:zafiro': 'Azul zafiro con veta clara en el centro.',
        'belt:rubi': 'Rojo rubí, mate por fuera y encendido por dentro.',
        'belt:esmeralda': 'Verde esmeralda con brillo de resina.',
        'belt:grafito': 'Banda gunmetal, discreta a propósito.',
        'belt:carmesi': 'Rojo carmesí. La línea más visible del traje.',

        'bracelet:violeta': 'Muñequeras violeta a juego con el equipo básico.',
        'bracelet:oro': 'Puños dorados. Lo primero que se ve al saludar.',
        'bracelet:diamante': 'Diamante eléctrico en las dos muñecas.',
        'bracelet:zafiro': 'Azul zafiro con acabado esmaltado.',
        'bracelet:rubi': 'Rojo rubí pulido a mano.',
        'bracelet:esmeralda': 'Verde esmeralda con acabado esmaltado.',
        'bracelet:grafito': 'Gunmetal sobrio, para quien no quiere brillo.',
        'bracelet:carmesi': 'Carmesí intenso en los puños del traje.',

        'antenna:estandar': 'Antena corta de reglamento con luz en la punta.',
        'antenna:doble': 'Dos antenas en paralelo. El doble de cobertura, dicen.',
        'antenna:halo': 'Un aro suspendido sobre el casco. No hace nada, y lo hace muy bien.',

        'pack:estandar': 'Mochila de soporte vital estándar. Lo justo para respirar.',
        'pack:carga': 'Mochila de carga con bolsillos exteriores.',
        'pack:aletas': 'Aletas de estabilización a los lados. Cambia la silueta entera.',
        'pack:cilindros': 'Dos cilindros de oxígeno montados a la espalda.',
        'pack:reactor': 'Reactor compacto con toberas vectoriales.',
        'pack:alas': 'Alas desplegables. Innecesarias en el vacío, espectaculares igual.',

        'trail:llama': 'La llama clásica del propulsor.',
        'trail:ionico': 'Un chorro iónico, estrecho y azulado.',
        'trail:anillos': 'Anillos de plasma que se separan al acelerar.',

        'badge:planeta': 'Un planeta con su anillo: la insignia de partida.',
        'badge:estrella': 'Una estrella de cinco puntas sobre el pecho.',
        'badge:rayo': 'Un rayo. Sin explicación y sin necesitarla.',

        'pet:ninguna': 'Sin acompañante. El hombro libre también es un look.',
        'pet:chispa': 'Una mota de luz que te sigue, con tres motas girando a su alrededor. No es una máquina: es la más pequeña de todas.',
        'pet:mascota1': 'Vigía: un droide compacto que no se separa de tu hombro.',
        'pet:satelite': 'Un satélite con los paneles desplegados orbitando a tu lado.',
        'pet:orbe': 'Un orbe entre dos anillos que giran solos.',

        'accent:violeta': 'Violeta en vivos, mochila y propulsor. El color de la casa.',
        'accent:oro': 'Dorado en todos los detalles del traje.',
        'accent:diamante': 'Diamante frío recorriendo el equipo.',
        'accent:zafiro': 'Azul zafiro en los vivos y en la llama.',
        'accent:rubi': 'Rojo rubí en los vivos y en la llama.',
        'accent:esmeralda': 'Verde esmeralda en los vivos y en la llama.',
        'accent:grafito': 'Detalles gunmetal. Apaga el traje entero.',
        'accent:carmesi': 'Carmesí en cada vivo del equipo.',
      },
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
      casesSubtitle: 'Elige hasta 5 cofres y ábrelos con tus llaves.',
      openCase: 'Abrir cofre',
      openCaseMoney: 'Comprar cofre',
      openCaseGems: 'Abrir con gemas',
      notEnoughGems: 'Te faltan gemas',
      notEnoughKeys: 'Te falta una llave',
      notEnoughChests: 'Compra un cofre primero',
      notEnoughClicksForChest: (materialName) => `Te falta ${materialName.toLowerCase()}`,
      buyChest: 'Comprar cofre',
      chestLimitReached: 'Ya tienes el máximo de cofres',
      claimDailyKey: 'Reclamar llave gratis diaria',
      keyClaimedToday: 'Llave diaria reclamada',
      claimingKey: 'Reclamando…',
      buyClicksTitle: (materialName) => `Comprar ${materialName.toLowerCase()}`,
      buyKeysTitle: 'Comprar llaves',
      buyGemsTitle: 'Comprar gemas',
      savingsBadge: (pct) => `Ahorra ${pct}%`,
      opening: 'Abriendo…',
      youWon: (amount, materialName) => `+${amount} ${materialName.toLowerCase()}`,
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
      caseTitleClicks: (materialName) => `Cofre de ${materialName.toLowerCase()}`,
      caseTitleGems: 'Cofre de gemas',
      cosmeticCaseSection: 'Cofre de estilo',
      cosmeticCaseSubtitle: 'Piezas para tu astronauta: mascotas, mochilas, propulsores, brazaletes y más.',
      cosmeticCaseDemoBadge: 'Demo',
      cosmeticCaseSoon: 'Próximamente',
      cosmeticCaseTitleKeys: 'Cofre de estilo',
      cosmeticCaseTitleGems: 'Cofre de estilo raro',
      cosmeticCaseOpen: 'Girar (demo)',
      cosmeticCaseCatalogTitle: 'Contenido del cofre',
      cosmeticRarityNames: {
        consumer: 'Común',
        milspec: 'Poco común',
        restricted: 'Raro',
        classified: 'Épico',
        covert: 'Legendario',
        gold: 'Excepcional',
      },
      chestBenchAdd: 'Añadir',
      chestGranted: 'Gratis',
      chestBenchSelected: (count, max) => `${count}/${max} en la mesa`,
      chestBenchClear: 'Vaciar',
      chestBenchEmpty: 'Añade un cofre para empezar',
      chestCollectionComplete: 'Colección completa',
      chestBenchMissingKeys: (count) => (count === 1 ? 'Te falta 1 llave' : `Te faltan ${count} llaves`),
      powerupsSection: 'Potenciadores',
      powerupsCardTitle: 'Multiplicadores',
      powerupsSubtitle: 'Multiplica la potencia de tus disparos durante un tiempo.',
      upgradesSection: 'Mejoras permanentes',
      luckTitle: 'Destello',
      noUpgradeYet: 'Todavía ninguna',
      maxLevel: 'Nivel máximo',
      upgradeCta: 'Mejorar',
      infinity: '∞',
      moneyUpgradesTitle: 'Núcleo de gemas',
      purchaseError: 'No se pudo completar la compra. Inténtalo de nuevo.',
      timedLuckTitle: 'Destello',
      timedLuckSubtitle: 'Multiplica tu Destello permanente mientras esté activo.',
      powerups: {
        click_x2: {
          name: 'Disparo x2',
          desc: 'Duplica el valor de cada disparo. El más barato, ideal para probar.',
        },
        click_x3: {
          name: 'Disparo x3',
          desc: 'Triplica cada disparo durante más tiempo. Rinde bien en tiradas largas.',
        },
        click_x5: {
          name: 'Disparo x5',
          desc: 'Cada disparo cuenta x5 durante el tiempo activo.',
        },
        click_x10: {
          name: 'Disparo x10',
          desc: 'El multiplicador más alto, ráfaga corta. Solo rentable si aprietas a fondo.',
        },
      },
      upgrades: {
        luck_x2: {
          name: 'Destello x2',
          desc: 'Cada disparo tiene una pequeña probabilidad de contar x2.',
        },
        luck_x3: {
          name: 'Destello x3',
          desc: 'Cada disparo tiene una pequeña probabilidad de contar x3.',
        },
        luck_x5: {
          name: 'Destello x5',
          desc: 'Cada disparo tiene una pequeña probabilidad de contar x5.',
        },
        luck_x10: {
          name: 'Destello x10',
          desc: 'La mejora más alta. Pequeña probabilidad de un disparo x10.',
        },
      },
      moneyUpgrades: {
        x2_clicks: {
          name: 'Multiplicador x2',
          desc: 'Cada disparo cuenta x2, para siempre.',
        },
        x3_clicks: {
          name: 'Multiplicador x3',
          desc: 'Cada disparo cuenta x3, para siempre.',
        },
        x5_clicks: {
          name: 'Multiplicador x5',
          desc: 'Cada disparo cuenta x5, para siempre.',
        },
        x10_clicks: {
          name: 'Multiplicador x10',
          desc: 'El nivel más alto. Cada disparo cuenta x10, para siempre.',
        },
      },
      timedLuckPowerups: {
        luck_x10: { name: 'Destello x2', desc: 'Multiplica x2 tus disparos afortunados durante 20 s.' },
        luck_x25: { name: 'Destello x5', desc: 'Multiplica x5 tus disparos afortunados durante 20 s.' },
        luck_x50: { name: 'Destello x10', desc: 'Multiplica x10 tus disparos afortunados durante 20 s.' },
        luck_x100: { name: 'Destello x20', desc: 'Multiplica x20 tus disparos afortunados durante 20 s. El más alto.' },
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
      rewardPermanent: (mult) => `×${mult} a todos tus disparos`,
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
      autoClickDesc: (rate, unit) => `Cada dron produce ${rate} ${unit}.`,
      dronesUnit: 'drones',
      currentRate: 'Drones actuales:',
      nextLevelRate: 'Drones siguiente nivel:',
      upgrading: 'Mejorando…',
      fleetCoreName: 'Núcleo de flota',
      fleetCoreDesc:
        'Multiplicador permanente aplicado a la producción de toda tu flota — drones, buscadores y artilleros. No se acumula con otros niveles: solo cuenta el más alto que tengas.',
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
      legendaryUnlockDesc: (tps) =>
        `Desbloquea un multiplicador de la potencia de cada disparo al sobrecalentar el cañón a ${tps} disparos por segundo.`,
      legendaryEaseName: 'Catalizador',
      legendaryEaseDesc: 'Reduce los disparos necesarios para sobrecalentar el cañón y subir de nivel en modo Legendario.',
      currentStreakClicks: 'Disparos actuales:',
      nextStreakClicks: 'Disparos siguiente nivel:',
      legendaryGrowthName: 'Impulso',
      legendaryGrowthDesc: 'Aumenta la subida del multiplicador de modo Legendario cada vez que sube de nivel.',
      currentBonusStep: 'Subida actual:',
      nextBonusStep: 'Subida siguiente nivel:',
      legendaryThresholdName: 'Umbral',
      legendaryThresholdDesc: 'Reduce la velocidad de disparo necesaria para activar el modo Legendario.',
      currentThresholdTps: 'Umbral actual:',
      nextThresholdTps: 'Umbral siguiente nivel:',
      scoutDroneName: 'Dron buscador',
      scoutDroneDesc: 'Drones capaces de encontrar destellos para mejorar su producción.',
      scoutDroneCurrentLabel: 'Drones buscadores actuales:',
      scoutDroneNextLabel: 'Drones buscadores siguiente nivel:',
      scoutFrequencyName: 'Frecuencia',
      scoutFrequencyDesc: 'Sintoniza el radar de tus drones buscadores para aumentar su producción.',
      gunnerRateName: 'Calibre',
      gunnerRateDesc:
        'Amplía el calibre de los cañones de tus artilleros. Cada disparo arranca más material del asteroide.',
      gunnerName: 'Artillero',
      gunnerDesc:
        'Despliega un artillero que se queda apuntando al asteroide y disparando por sus dos cañones. Cada uno extrae por su cuenta.',
      currentGunners: 'Artilleros actuales:',
      nextGunners: 'Artilleros siguiente nivel:',
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
      anomalyUnlockName: 'Anomalías',
      anomalyUnlockDesc: (materialName) =>
        `Desbloquea las anomalías: fenómenos espaciales que aparecen cerca de tu nave y desprenden ${materialName.toLowerCase()} al neutralizarlas.`,
      anomalyRewardName: 'Extracción',
      anomalyRewardDesc: (materialName) =>
        `Aumenta el porcentaje de ${materialName.toLowerCase()} que obtienes al neutralizar una anomalía.`,
      currentAnomalyReward: 'Extracción actual:',
      nextAnomalyReward: 'Extracción siguiente nivel:',
      anomalyFrequencyName: 'Detección',
      anomalyFrequencyDesc: 'Reduce el tiempo de aparición de anomalías.',
      currentAnomalyFrequency: 'Detección actual:',
      nextAnomalyFrequency: 'Detección siguiente nivel:',
      formatAnomalyWait: (seconds) => {
        if (seconds < 60) return `${seconds} segundos`
        const minutes = seconds / 60
        if (minutes === 1) return '1 minuto'
        const label = Number.isInteger(minutes) ? `${minutes}` : minutes.toFixed(1).replace('.', ',')
        return `${label} minutos`
      },
      offlineProductionName: 'Autonomía',
      offlineProductionDesc: 'Aumenta la autonomía de tu nave para que tu flota siga produciendo mientras estás ausente.',
      currentOfflineProduction: 'Producción actual:',
      nextOfflineProduction: 'Producción siguiente nivel:',
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
      description: (seconds) =>
        `Reta a quien quieras a un duelo de disparos. Tenéis ${seconds} segundos para clicar todo lo que podáis — quien haga más se lleva la apuesta del otro. Tú eliges cuánto apostar en cada duelo.`,
      newBattle: 'Nuevo duelo',
      incomingSection: 'Duelos pendientes',
      historySection: 'Historial',
      noIncoming: 'No tienes duelos pendientes.',
      noHistory: 'Todavía no has jugado ningún duelo.',
      pickOpponent: 'Elige a tu rival',
      searchOpponent: 'Buscar jugador',
      noOpponentResults: 'Ningún jugador con ese nombre',
      chooseWager: 'Apuesta',
      lowerWager: 'Bajar la apuesta',
      raiseWager: 'Subir la apuesta',
      payoutLine: (amount) => `Te llevas ${amount} si ganas`,
      challengeFailed: 'No se ha podido lanzar el duelo',
      challengeButton: (wager) => `Retar por ${wager}`,
      acceptButton: (wager) => `Aceptar por ${wager}`,
      notEnoughPlatinum: 'Te falta mineral para esto',
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
    event: {
      ariaLabel: 'Anomalía detectada',
      title: 'Anomalía',
      subtitle: 'Neutralízala antes de que escape',
      successTitle: '¡Anomalía neutralizada!',
      successBody: (amount, materialName) => `Has recibido ${amount} de ${materialName.toLowerCase()}.`,
      failureTitle: 'Anomalía perdida',
      failureBody: 'Se te ha escapado. La próxima vez irá mejor.',
      unclaimedTitle: 'Neutralizada, sin cobrar',
      unclaimedBody: 'La has neutralizado, pero no se ha podido cobrar la recompensa. Inténtalo con la siguiente.',
    },
    tutorial: {
      next: 'Siguiente',
      finish: 'Finalizar',
      freeLabel: '¡Gratis!',
      replayAriaLabel: 'Ver tutorial',
      replayConfirmTitle: '¿Quieres ver el tutorial?',
      replayConfirmYes: 'Sí',
      replayConfirmNo: 'No',
      introText:
        'Bienvenido a bordo, comandante. Soy C0-PI, el asistente de tu nave. Estamos anclados junto a un asteroide cargado de Amatista, y tu misión es extraerla antes de que se agote. Vamos a repasar los mandos.',
      pointAsteroidText: 'Dispara al asteroide para empezar a extraer Amatista. Toca en cualquier parte de la pantalla.',
      pointTreeNavText: 'Bien hecho. Ahora ve a la sala de progreso de tu nave.',
      pointTreeRootText: 'Aquí gestionas tu flota de drones. Toca este núcleo.',
      pointTreeBuyText: 'Consigue tu primer dron. Te ayudará con la extracción.',
      closingText:
        'Esta es la sala de progreso de tu nave. Desde aquí irás mejorando cada sistema y ampliando tu flota. Buena suerte ahí fuera.',
      droneFusionIntroText:
        '¡Buen trabajo, comandante! Tu flota está creciendo. A partir de ahora, cada diez drones se fusionarán automáticamente en una unidad más grande y eficiente. Vamos a verlo.',
      droneFusionHomeText:
        '¡Mira! Tus diez drones se han fusionado en una unidad más grande y potente. Cada vez que reúnas diez más, se fusionarán en otra igual, así tu flota se mantiene ágil aunque no pare de crecer.',
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
      prestigeReady: 'Mineral available!',
      viewModeLabel: 'Adjust view',
      changePrestige: 'Leave asteroid',
      tps: 't/s',
      hudPlatinoLabel: (materialName) => `Your ${materialName.toLowerCase()}`,
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
      shipOfflineProductionDesc: 'Offline production:',
      shipDroneCount: 'Drones',
      shipDroneCountDesc: 'Active drones:',
      shipDronePerUnitDesc: 'Production per drone:',
      shipLuckChance: 'Glimmer',
      shipLuckPowerDesc: 'Glimmer power:',
      shipLuckChanceDesc: 'Glimmer odds:',
      shipScoutDrones: 'Scout drones',
      shipScoutDronesCountDesc: 'Active scout drones:',
      shipScoutDronesPerUnitDesc: 'Production per scout drone:',
      shipGunners: 'Gunners',
      shipGunnersCountDesc: 'Gunners on station:',
      shipGunnersPerUnitDesc: 'Production per gunner:',
      shipPower: 'Power',
      shipPowerDesc: (materialName) => `${materialName} pulled out with every shot:`,
      shipMultiShot: 'Multi-shot',
      shipMultiShotDesc: 'Main ship cannons:',
      shipNotInstalled: 'Not installed',
      tasks: 'Tasks',
      tasksTitle: 'Pending tasks',
      tasksEmpty: "You don't have any pending tasks.",
      taskFirstDroneName: 'First liftoff',
      taskFirstDroneDesc: 'Unlock your first drone',
      taskDroneSquadronName: 'Squadron',
      taskDroneSquadronDesc: 'Get 10 drones',
      taskDroneSwarmName: 'Swarm',
      taskDroneSwarmDesc: 'Get 30 drones',
      taskSecondCannonName: 'Twin cannon',
      taskSecondCannonDesc: "Get your ship's second cannon",
      taskFullBatteryName: 'Full battery',
      taskFullBatteryDesc: 'Get 5 cannons on your ship',
      taskTotalArsenalName: 'Total arsenal',
      taskTotalArsenalDesc: "Get all 10 of your ship's cannons",
      taskFirstScoutDroneName: 'First scout',
      taskFirstScoutDroneDesc: 'Get your first scout drone',
      taskScoutSquadName: 'Scout patrol',
      taskScoutSquadDesc: 'Get 10 scout drones',
      taskScoutFleetName: 'Recon fleet',
      taskScoutFleetDesc: 'Get 20 scout drones',
      taskFirstAnomalyName: 'First contact',
      taskFirstAnomalyDesc: 'Neutralize your first anomaly',
      taskAnomalyHunterName: 'Anomaly hunter',
      taskAnomalyHunterDesc: 'Neutralize 5 anomalies',
      taskSectorGuardianName: 'Sector guardian',
      taskSectorGuardianDesc: 'Neutralize 15 anomalies',
      taskFirstGlimmersName: 'First glimmers',
      taskFirstGlimmersDesc: 'Find 100 glimmers',
      taskGlimmerStreakName: 'Glimmer streak',
      taskGlimmerStreakDesc: 'Find 1,000 glimmers',
      taskGlimmerMasterName: 'Glimmer master',
      taskGlimmerMasterDesc: 'Find 10,000 glimmers',
      missionDronesName: 'Drone fleet',
      missionMultiShotName: 'Firepower',
      missionScoutName: 'Stellar recon',
      missionAnomalyName: 'Anomalies',
      missionLuckyName: 'Glimmer hunter',
      tasksRewardsLabel: 'Rewards',
      tasksAllClaimed: 'Mission complete!',
      taskReward: (amount) => `+${amount}`,
      taskClaim: 'Claim',
      taskClaiming: 'Claiming…',
      taskClaimed: 'Claimed',
      taskLocked: 'Locked',
      tasksProgress: (done, total) => `${done}/${total} complete`,
      log: 'Trajectory',
      logTitle: 'Trajectory',
      logEmpty: 'No trajectory data yet.',
      trajectoryTierNames: ['Amethyst', 'Platinum', 'Sapphire', 'Emerald', 'Ruby', 'Gold', 'Diamond'],
      trajectoryExtraction: (current, target) => `Extraction: ${current}/${target}`,
      trajectoryExtractionUnknown: 'Extraction: ???',
      trajectoryCurrent: 'Current',
      trajectoryLocked: 'Locked',
      trajectoryComingSoon: 'Coming soon',
      trajectoryPrestigeTitle: 'Leave this asteroid?',
      trajectoryPrestigeBody: (currentTierName, nextTierName) =>
        `Your current ${currentTierName.toLowerCase()} will reset, all of your upgrade tree progress will be wiped, and your ship will travel to another asteroid to mine ${nextTierName}. Your total leaderboard score is never lost.`,
      trajectoryPrestigeConfirm: 'Leave',
      trajectoryPrestigeCancel: 'Cancel',
      fleetAwayTitle: 'Fleet report',
      fleetAwayPrefix: 'Your fleet extracted',
      fleetAwaySuffix: 'while you were away.',
      fleetAwayAccept: 'Accept',
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
    profile: {
      profileTab: 'Profile',
      statsTab: 'Stats',
      usernamePlaceholder: 'Your name',
      save: 'Save',
      editName: 'Edit name',
      cancel: 'Cancel',
      emailLabel: 'Email',
      noEmail: 'No email',
      languageLabel: 'Language',
      soundLabel: 'Sound',
      settingsLabel: 'Settings',
      signOut: 'Sign out',
      signedOutTitle: 'Sign in to get a profile',
      signedOutBody:
        'Your progress is already being saved locally. Sign in to save it to the cloud and compete against other players on the leaderboard.',
      signInRewardTitle: 'Welcome gift',
      signInRewardBody: (style, rare) =>
        `Sign in and you get ${style} style chests and ${rare} rare style chest.`,
      signIn: 'Sign in',
      errorUsernameTaken: 'That name is already taken. Try another one.',
      errorUsernameInvalid: 'That name is not valid. Use 4-20 characters, no symbols or accents, and not only numbers.',
      errorGeneric: 'Something went wrong. Please try again.',
      rankLabel: 'World rank',
      rankOf: (total) => `of ${total} players`,
      rankUnranked: 'Not ranked yet',
      rankFirst: 'No one ahead of you',
      rankGap: (amount, name) => `${amount} to overtake ${name}`,
      rankViewAll: 'View leaderboard',
      joinedOn: (date) => `Joined ${date}`,
      notFoundTitle: 'Player not found',
      notFoundBody: 'This account may no longer exist.',
      backButton: 'Back',
      customizeTitle: 'Customize',
      customizeAria: 'Customize astronaut',
      slotHelmet: 'Helmet',
      slotSuit: 'Suit',
      slotBoots: 'Boots',
      slotBracelet: 'Bracelets',
      slotBelt: 'Belt',
      slotAccent: 'Details',
      slotAntenna: 'Antenna',
      slotPack: 'Backpack',
      slotTrail: 'Thruster',
      slotBadge: 'Badge',
      slotPet: 'Pets',
      slotPet1: 'First pet',
      slotPet2: 'Second pet',
      slotVisor: 'Visor',
      slotBackground: 'Backdrop',
      tabHead: 'Head',
      tabBody: 'Body',
      lockerCollection: 'Collection',
      detailBack: 'Back',
      detailUnlock: 'UNLOCK',
      detailEquip: 'EQUIP',
      detailEquipped: 'EQUIPPED',
      detailMissingGems: '{n} gems short',
      detailMissingGemsOne: '{n} gem short',
      detailBuying: 'Buying…',
      detailError: 'The purchase could not be completed',
      detailStock: 'Standard issue',
      detailUnlockedNote: 'Unlocked',
      styleNames: {
        estandar: 'Standard',
        limpio: 'Clear',
        reticula: 'Reticle',
        grieta: 'Crack',
        agujero: 'Black hole',
        turbinas: 'Turbines',
        estrellas: 'Stars',
        rejilla: 'Hangar',
        meteoros: 'Meteors',
        doble: 'Double',
        halo: 'Halo',
        cilindros: 'Canisters',
        reactor: 'Reactor',
        alas: 'Wings',
        planeta: 'Planet',
        carga: 'Cargo',
        aletas: 'Fins',
        llama: 'Flame',
        ionico: 'Ion',
        anillos: 'Rings',
        estrella: 'Star',
        rayo: 'Bolt',
        zafiro: 'Sapphire',
        esmeralda: 'Emerald',
        rubi: 'Ruby',
        oro: 'Gold',
        carmesi: 'Crimson',
        grafito: 'Graphite',
        acero: 'Steel',
        marino: 'Navy',
        arena: 'Sand',
        diamante: 'Diamond',
        violeta: 'Violet',
        ninguna: 'None',
        chispa: 'Spark',
        mascota1: 'Lookout',
        satelite: 'Satellite',
        orbe: 'Orb',
      },
      // Keyed "slot:id" because ids repeat across slots — crimson boots and a
      // crimson belt are different items and deserve different copy.
      styleDescriptions: {
        'visor:limpio': 'The usual glass, with nothing printed on it.',
        'visor:reticula': 'Targeting reticle with side readouts. Sells "pilot" without touching the silhouette.',
        'visor:grieta': 'The cracked glass of someone who has been out there. A whole story in four lines.',
        'visor:agujero': "The visor doesn't reflect: it swallows. Black disc, bent ring of light, no stars survive.",
        'pack:turbinas': 'Two shoulder-mounted rotors, actually spinning, and in opposite directions.',
        'background:estrellas': 'A fixed starfield. The plainest backdrop and the one that goes with everything.',
        'background:rejilla': 'A hangar floor in perspective, lines converging behind you.',
        'background:meteoros': 'Your same sky, crossed over and over by shooting stars.',

        'helmet:estandar': 'Standard-issue white shell with a violet visor. What everyone wears on day one.',
        'helmet:diamante': 'Diamond glass over the usual shell. Cold and clean.',
        'helmet:zafiro': 'Sapphire visor, deep night-flight blue.',
        'helmet:rubi': 'Ruby visor, red as the alarm that never sounds.',
        'helmet:esmeralda': 'Emerald visor, the probe pilots’ favourite.',
        'helmet:oro': 'Gold visor with an anti-glare coat. Expensive, and it shows.',
        'helmet:carmesi': 'Crimson glass. Visible from the far side of the hangar.',
        'helmet:grafito': 'Graphite shell with smoked glass. The only helmet where the material is the choice.',

        'suit:estandar': 'The regulation white EVA suit. Plain, and never wrong.',
        'suit:acero': 'Polished steel with hard highlights. Fresh out of the shop.',
        'suit:marino': 'Flight-deck navy, cut like a pilot’s coverall.',
        'suit:arena': 'Martian sand tones, weathered by dust.',
        'suit:carmesi': 'Deep crimson with pronounced seams. Nothing subtle about it.',
        'suit:grafito': 'Matte graphite from collar to waist. Drinks the light.',

        'boots:estandar': 'Regulation white boots with a reinforced sole.',
        'boots:acero': 'Polished steel toecaps. As heavy as they look.',
        'boots:marino': 'Navy boots to match the flight suit.',
        'boots:arena': 'Sand-coloured leather, already dusted from the surface.',
        'boots:carmesi': 'High-topped crimson. Goes with little, and doesn’t care.',
        'boots:grafito': 'Matte graphite — the boot that reflects nothing.',

        'belt:violeta': 'Regulation violet belt with a square buckle.',
        'belt:oro': 'Gold band and buckle. Pure decoration, which is the point.',
        'belt:diamante': 'A diamond band cutting the suit in half.',
        'belt:zafiro': 'Sapphire blue with a bright seam down the middle.',
        'belt:rubi': 'Ruby red, matte outside and lit within.',
        'belt:esmeralda': 'Emerald green with a resin sheen.',
        'belt:grafito': 'Gunmetal band, understated on purpose.',
        'belt:carmesi': 'Crimson red. The most visible line on the suit.',

        'bracelet:violeta': 'Violet cuffs matching the standard kit.',
        'bracelet:oro': 'Gold cuffs. The first thing people see when you wave.',
        'bracelet:diamante': 'Electric diamond on both wrists.',
        'bracelet:zafiro': 'Sapphire blue with an enamelled finish.',
        'bracelet:rubi': 'Hand-polished ruby red.',
        'bracelet:esmeralda': 'Emerald green with an enamelled finish.',
        'bracelet:grafito': 'Sober gunmetal, for anyone who’d rather not shine.',
        'bracelet:carmesi': 'Deep crimson at the cuffs of the suit.',

        'antenna:estandar': 'Short regulation antenna with a light at the tip.',
        'antenna:doble': 'Two antennas side by side. Twice the reception, they say.',
        'antenna:halo': 'A ring suspended above the helmet. Does nothing, and does it beautifully.',

        'pack:estandar': 'Standard life-support pack. Just enough to breathe.',
        'pack:carga': 'Cargo pack with external pockets.',
        'pack:aletas': 'Stabiliser fins on both sides. Changes the whole silhouette.',
        'pack:cilindros': 'Two oxygen cylinders mounted across the back.',
        'pack:reactor': 'Compact reactor with vectoring nozzles.',
        'pack:alas': 'Deployable wings. Useless in vacuum, spectacular anyway.',

        'trail:llama': 'The classic thruster flame.',
        'trail:ionico': 'An ion jet, narrow and blue.',
        'trail:anillos': 'Plasma rings that peel away under acceleration.',

        'badge:planeta': 'A ringed planet — the badge you start with.',
        'badge:estrella': 'A five-pointed star across the chest.',
        'badge:rayo': 'A lightning bolt. No explanation, none needed.',

        'pet:ninguna': 'No companion. An empty shoulder is a look too.',
        'pet:chispa': 'A speck of light that follows you, with three motes turning around it. Not a machine — the smallest companion there is.',
        'pet:mascota1': 'Lookout: a compact droid that never leaves your shoulder.',
        'pet:satelite': 'A satellite with its panels out, orbiting beside you.',
        'pet:orbe': 'An orb between two rings that turn on their own.',

        'accent:violeta': 'Violet on the trim, the pack and the thruster. The house colour.',
        'accent:oro': 'Gold across every detail of the suit.',
        'accent:diamante': 'Cold diamond running through the gear.',
        'accent:zafiro': 'Sapphire blue on the trim and the flame.',
        'accent:rubi': 'Ruby red on the trim and the flame.',
        'accent:esmeralda': 'Emerald green on the trim and the flame.',
        'accent:grafito': 'Gunmetal details. Turns the whole suit down.',
        'accent:carmesi': 'Crimson on every piece of trim.',
      },
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
      casesSubtitle: 'Pick up to 5 chests and open them with your keys.',
      openCase: 'Open chest',
      openCaseMoney: 'Buy chest',
      openCaseGems: 'Open with gems',
      notEnoughGems: "You're short on gems",
      notEnoughKeys: 'You need a key',
      notEnoughChests: 'Buy a chest first',
      notEnoughClicksForChest: (materialName) => `You're short on ${materialName.toLowerCase()}`,
      buyChest: 'Buy chest',
      chestLimitReached: "You've hit the chest limit",
      claimDailyKey: 'Claim free daily key',
      keyClaimedToday: 'Daily key claimed',
      claimingKey: 'Claiming…',
      buyClicksTitle: (materialName) => `Buy ${materialName.toLowerCase()}`,
      buyKeysTitle: 'Buy keys',
      buyGemsTitle: 'Buy gems',
      savingsBadge: (pct) => `Save ${pct}%`,
      opening: 'Opening…',
      youWon: (amount, materialName) => `+${amount} ${materialName.toLowerCase()}`,
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
      caseTitleClicks: (materialName) => `${materialName} chest`,
      caseTitleGems: 'Gem chest',
      cosmeticCaseSection: 'Style chest',
      cosmeticCaseSubtitle: 'Gear for your astronaut: companions, packs, thrusters, bracelets and more.',
      cosmeticCaseDemoBadge: 'Demo',
      cosmeticCaseSoon: 'Coming soon',
      cosmeticCaseTitleKeys: 'Style chest',
      cosmeticCaseTitleGems: 'Rare style chest',
      cosmeticCaseOpen: 'Spin (demo)',
      cosmeticCaseCatalogTitle: 'Chest contents',
      cosmeticRarityNames: {
        consumer: 'Common',
        milspec: 'Uncommon',
        restricted: 'Rare',
        classified: 'Epic',
        covert: 'Legendary',
        gold: 'Exceptional',
      },
      chestBenchAdd: 'Add',
      chestGranted: 'Free',
      chestBenchSelected: (count, max) => `${count}/${max} on the bench`,
      chestBenchClear: 'Clear',
      chestBenchEmpty: 'Add a chest to get started',
      chestCollectionComplete: 'Collection complete',
      chestBenchMissingKeys: (count) => (count === 1 ? 'You need 1 more key' : `You need ${count} more keys`),
      powerupsSection: 'Powerups',
      powerupsCardTitle: 'Multipliers',
      powerupsSubtitle: "Multiplies your shots' power for a while.",
      upgradesSection: 'Permanent upgrades',
      luckTitle: 'Glimmer',
      noUpgradeYet: 'None yet',
      maxLevel: 'Max level',
      upgradeCta: 'Upgrade',
      infinity: '∞',
      moneyUpgradesTitle: 'Gem Core',
      purchaseError: "Couldn't complete the purchase. Please try again.",
      timedLuckTitle: 'Glimmer',
      timedLuckSubtitle: 'Multiplies your permanent Glimmer while active.',
      powerups: {
        click_x2: {
          name: 'Shot x2',
          desc: 'Doubles the value of every shot. The cheapest one, great for trying it out.',
        },
        click_x3: {
          name: 'Shot x3',
          desc: 'Triples every shot for longer. Pays off well on long runs.',
        },
        click_x5: {
          name: 'Shot x5',
          desc: 'Every shot counts x5 while active.',
        },
        click_x10: {
          name: 'Shot x10',
          desc: 'The highest multiplier, short burst. Only worth it if you go all out.',
        },
      },
      upgrades: {
        luck_x2: {
          name: 'Glimmer x2',
          desc: 'Every shot has a small chance to count x2.',
        },
        luck_x3: {
          name: 'Glimmer x3',
          desc: 'Every shot has a small chance to count x3.',
        },
        luck_x5: {
          name: 'Glimmer x5',
          desc: 'Every shot has a small chance to count x5.',
        },
        luck_x10: {
          name: 'Glimmer x10',
          desc: 'The highest one. A small chance at a x10 shot.',
        },
      },
      moneyUpgrades: {
        x2_clicks: {
          name: 'Multiplier x2',
          desc: 'Every shot counts x2, forever.',
        },
        x3_clicks: {
          name: 'Multiplier x3',
          desc: 'Every shot counts x3, forever.',
        },
        x5_clicks: {
          name: 'Multiplier x5',
          desc: 'Every shot counts x5, forever.',
        },
        x10_clicks: {
          name: 'Multiplier x10',
          desc: 'The highest tier. Every shot counts x10, forever.',
        },
      },
      timedLuckPowerups: {
        luck_x10: { name: 'Glimmer x2', desc: 'Multiplies your lucky shots by 2 for 20s.' },
        luck_x25: { name: 'Glimmer x5', desc: 'Multiplies your lucky shots by 5 for 20s.' },
        luck_x50: { name: 'Glimmer x10', desc: 'Multiplies your lucky shots by 10 for 20s.' },
        luck_x100: { name: 'Glimmer x20', desc: 'Multiplies your lucky shots by 20 for 20s. The highest one.' },
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
      rewardPermanent: (mult) => `×${mult} to all your shots`,
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
      autoClickDesc: (rate, unit) => `Each drone produces ${rate} ${unit}.`,
      dronesUnit: 'drones',
      currentRate: 'Current drones:',
      nextLevelRate: 'Next level drones:',
      upgrading: 'Upgrading…',
      fleetCoreName: 'Fleet core',
      fleetCoreDesc:
        "A permanent multiplier applied to your whole fleet's output — drones, scouts and gunners alike. Doesn't stack with other levels: only the highest one you own counts.",
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
      legendaryUnlockDesc: (tps) =>
        `Unlocks a multiplier on the power of every shot by overheating the cannon at ${tps} shots per second.`,
      legendaryEaseName: 'Catalyst',
      legendaryEaseDesc: 'Lowers how many shots it takes to overheat the cannon and level up within Legendary mode.',
      currentStreakClicks: 'Current shots:',
      nextStreakClicks: 'Next level shots:',
      legendaryGrowthName: 'Boost',
      legendaryGrowthDesc: "Raises how much Legendary's multiplier increases each time it levels up.",
      currentBonusStep: 'Current increase:',
      nextBonusStep: 'Next level increase:',
      legendaryThresholdName: 'Threshold',
      legendaryThresholdDesc: 'Lowers the shooting speed needed to trigger Legendary mode.',
      currentThresholdTps: 'Current threshold:',
      nextThresholdTps: 'Next level threshold:',
      scoutDroneName: 'Scout Drone',
      scoutDroneDesc: 'Drones able to find glimmers to boost their production.',
      scoutDroneCurrentLabel: 'Current scout drones:',
      scoutDroneNextLabel: 'Next level scout drones:',
      scoutFrequencyName: 'Frequency',
      scoutFrequencyDesc: "Tunes your scout drones' radar to boost their production.",
      gunnerRateName: 'Caliber',
      gunnerRateDesc:
        "Bores out your gunners' cannons. Every shot tears more material off the asteroid.",
      gunnerName: 'Gunner',
      gunnerDesc:
        'Deploys a gunner that holds position aimed at the asteroid, firing from both cannons. Each one mines on its own.',
      currentGunners: 'Current gunners:',
      nextGunners: 'Gunners next level:',
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
      anomalyUnlockName: 'Anomalies',
      anomalyUnlockDesc: (materialName) =>
        `Unlocks anomalies: space phenomena that appear near your ship and release ${materialName.toLowerCase()} when neutralized.`,
      anomalyRewardName: 'Extraction',
      anomalyRewardDesc: (materialName) =>
        `Raises the percentage of ${materialName.toLowerCase()} you get for neutralizing an anomaly.`,
      currentAnomalyReward: 'Current extraction:',
      nextAnomalyReward: 'Next level extraction:',
      anomalyFrequencyName: 'Detection',
      anomalyFrequencyDesc: 'Shortens how often anomalies appear.',
      currentAnomalyFrequency: 'Current detection:',
      nextAnomalyFrequency: 'Next level detection:',
      formatAnomalyWait: (seconds) => {
        if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`
        const minutes = seconds / 60
        const label = Number.isInteger(minutes) ? `${minutes}` : minutes.toFixed(1)
        return `${label} minute${minutes === 1 ? '' : 's'}`
      },
      offlineProductionName: 'Autonomy',
      offlineProductionDesc: "Raises your ship's autonomy so your fleet keeps producing while you're away.",
      currentOfflineProduction: 'Current production:',
      nextOfflineProduction: 'Next level production:',
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
      description: (seconds) =>
        `Challenge anyone to a shooting duel. You both get ${seconds} seconds to click as much as you can — whoever taps more takes the other's stake. You pick how much to wager on each duel.`,
      newBattle: 'New duel',
      incomingSection: 'Pending duels',
      historySection: 'History',
      noIncoming: "You don't have any pending duels.",
      noHistory: "You haven't played any duels yet.",
      pickOpponent: 'Pick your rival',
      searchOpponent: 'Search players',
      noOpponentResults: 'No player by that name',
      chooseWager: 'Wager',
      lowerWager: 'Lower the wager',
      raiseWager: 'Raise the wager',
      payoutLine: (amount) => `You take ${amount} if you win`,
      challengeFailed: "Couldn't start the duel",
      challengeButton: (wager) => `Challenge for ${wager}`,
      acceptButton: (wager) => `Accept for ${wager}`,
      notEnoughPlatinum: "You're short on ore for this",
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
    event: {
      ariaLabel: 'Anomaly detected',
      title: 'Anomaly',
      subtitle: 'Neutralize it before it escapes',
      successTitle: 'Anomaly neutralized!',
      successBody: (amount, materialName) => `You received ${amount} ${materialName.toLowerCase()}.`,
      failureTitle: 'Anomaly lost',
      failureBody: "It got away. You'll get it next time.",
      unclaimedTitle: 'Neutralized, not collected',
      unclaimedBody: "You neutralized it, but the reward couldn't be collected. Try again on the next one.",
    },
    tutorial: {
      next: 'Next',
      finish: 'Finish',
      freeLabel: 'Free!',
      replayAriaLabel: 'Watch tutorial',
      replayConfirmTitle: 'Want to watch the tutorial?',
      replayConfirmYes: 'Yes',
      replayConfirmNo: 'No',
      introText:
        "Welcome aboard, commander. I'm C0-PI, your ship's assistant. We're anchored next to an asteroid loaded with Amatista, and your mission is to extract it before it runs out. Let's walk through the controls.",
      pointAsteroidText: 'Fire at the asteroid to start extracting Amatista. Tap anywhere on screen.',
      pointTreeNavText: "Nice work. Now head to your ship's progress room.",
      pointTreeRootText: 'This is where you manage your drone fleet. Tap this core.',
      pointTreeBuyText: "Get your first drone. It'll help with the extraction.",
      closingText:
        "This is your ship's progress room. From here you'll keep upgrading every system and growing your fleet. Good luck out there.",
      droneFusionIntroText:
        "Great work, commander! Your fleet is growing. From now on, every ten drones will automatically merge into one bigger, more efficient unit. Let's take a look.",
      droneFusionHomeText:
        "Look! Your ten drones have merged into one bigger, more powerful unit. Every time you gather ten more, they'll merge into another one just like it, keeping your fleet lean no matter how large it grows.",
    },
  },
}
