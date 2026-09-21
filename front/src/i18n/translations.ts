export type Language = 'es' | 'en'

export interface TranslationStrings {
  signIn: {
    tagline: string
    /** The three things an account gives, one line each. */
    perks: readonly [string, string, string]
    continueAsGuest: string
    continueWithGoogle: string
    redirecting: string
    genericError: string
  }
  loading: {
    /** Shown one at a time under the rock while the save arrives. */
    steps: string[]
  }
  station: {
    /** The button on Home that opens the sheet for stepping out of the ship. */
    travelLabel: string
    travelTitle: string
    travelBody: string
    travelGo: string
    /** The button outside that opens the sheet for going back in. */
    returnLabel: string
    returnTitle: string
    returnBody: string
    returnGo: string
    cancel: string
    /** Status lines for the way out through the airlock and the way back in. */
    travelSteps: string[]
    returnSteps: string[]
    /** Status lines for the flight to the next asteroid. */
    prestigeSteps: string[]
  }
  diary: {
    title: string
    todayHead: string
    /** Three entries per asteroid, in tier order; the day picks one. */
    todayEntries: string[][]
    todayMined: (amount: string) => string
    todayFleet: (units: number) => string
    todayCapsules: (loaded: number, total: number) => string
    signature: string
    logHead: string
    /** One entry per asteroid, in tier order; shown up to the one you're on. */
    logEntries: string[]
    logToCome: string
    manualHead: string
    refineryNote: string
    capsulesCaption: (loaded: number, total: number, material: string) => string
    reactorNote: string
    reactorCaption: (whole: number, total: number) => string
    compendiumHead: string
    compendiumNote: string
    goalsTitle: string
    goalsNote: string
    goalUnknown: string
    goalsCaption: (extracted: number, total: number) => string
    /** One plate per asteroid, in tier order: the mineral as it really is, and what happened there. */
    specimens: readonly {
      /** The specimen label under the name: formula and hardness. */
      label: string
      facts: string
      story: string
      /** Before we get there: what the commander has heard, and supposes. */
      guess: string
    }[]
    specimenNumber: (n: number) => string
    calendarHead: string
    /** Monday first, one letter each. */
    calendarWeekdays: readonly [string, string, string, string, string, string, string]
    calendarNote: string
    calendarDaysOut: (days: number) => string
  }
  ship: {
    title: string
    reactor: string
    intro: string
    repairedPct: (pct: number) => string
    coresWhole: (n: number, total: number) => string
  }
  refinery: {
    title: string
    intro: (material: string) => string
    finishNow: string
    preparing: string
    coreOf: (material: string) => string
    repairedCount: (n: number, total: number) => string
    nextCore: string
    coreLabel: (i: number, total: number) => string
    seconds: (n: number) => string
    start: string
    refining: string
    notEnough: (material: string) => string
    complete: string
    /** After the core's name, up top, once it is whole. */
    repaired: string
    completeBody: (material: string) => string
    error: string
  }
  home: {
    objectLabel: (n: string) => string
    objectsProgress: (broken: string, target: string) => string
    prestigeReady: string
    /** The goal is met but the core isn't whole yet. */
    prestigeNeedsCore: string
    viewModeLabel: string
    /** The two stations found in adjust-view space. */
    stationNode: string
    stationRefinery: string
    stationDock: string
    stationMarket: string
    stationPodium: string
    stationNursery: string
    stationAstronaut: string
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
    trajectoryTierNames: readonly [string, string, string, string, string, string, string, string]
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
    /** "+2% de producción" — what the worn outfit adds, over the collection count. */
    lockerProduction: (pct: string) => string
    /** The same, on one piece's page. */
    detailProduction: (pct: string) => string
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
    subtitle: string
    costLabel: string
    buy: string
    buying: string
    availableIn: (time: string) => string
    active: string
    owned: string
    notEnoughClicks: string
    casesSection: string
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
    keysTitle: string
    gemsTitle: string
    gemsStallTagline: string
    /** Asked before spending gems on ore, once the lot has been picked. */
    orePurchaseTitle: (amount: string, materialName: string) => string
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
    /** Short form for the plate on the chest itself. */
    chestTagStyle: string
    chestTagStyleRare: string
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
    semiAutoName: string
    semiAutoDesc: () => string
    semiAutoHoldName: string
    semiAutoHoldDesc: string
    currentHold: string
    nextHold: string
    holdSeconds: (seconds: number) => string
    semiAutoRateName: string
    semiAutoRateDesc: string
    currentFireRate: string
    nextFireRate: string
    rateTps: (tps: number) => string
    multiShotExtraName: string
    multiShotExtraDesc: string
    multiShotExtraLocked: string
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
    stationIntroText: string
    stationExitText: string
    stationExitConfirmText: string
    stationArriveText: string
    stationRefineryText: string
    stationRefineryIntroText: string
    stationSmeltText: string
    stationSmeltingText: string
    stationPlanText: string
  }
}

export const translations: Record<Language, TranslationStrings> = {
  es: {
    signIn: {
      tagline: 'Tu progreso, a salvo en cualquier dispositivo.',
      perks: ['Guarda el asteroide y la flota', 'Compite en el ranking mundial', 'Compra y recibe recompensas'],
      continueAsGuest: 'Seguir como invitado',
      continueWithGoogle: 'Continuar con Google',
      redirecting: 'Redirigiendo…',
      genericError: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
    },
    loading: {
      steps: ['Localizando el asteroide', 'Sincronizando la flota', 'Contando el mineral', 'Abriendo la tienda'],
    },
    station: {
      travelLabel: 'Salir al exterior',
      travelTitle: 'Salir al exterior',
      travelBody: '¿Quieres salir al exterior? Tu flota seguirá produciendo mientras estás fuera.',
      travelGo: 'Salir',
      returnLabel: 'Volver a la nave',
      returnTitle: 'Volver a la nave',
      returnBody: '¿Quieres volver dentro de la nave?',
      returnGo: 'Entrar',
      cancel: 'Quedarme',
      travelSteps: ['Cerrando el casco', 'Despresurizando la esclusa', 'Abriendo la compuerta', 'Fuera de la nave'],
      returnSteps: ['Abriendo la compuerta', 'Presurizando la esclusa', 'Quitando el casco', 'Dentro de la nave'],
      prestigeSteps: ['Soltando amarras', 'Encendiendo propulsores', 'Rumbo al siguiente asteroide', 'En órbita'],
    },
    diary: {
      title: 'Diario',
      todayHead: 'Informe del día',
      todayEntries: [
        [
          'Seguimos varados junto al asteroide de Amatista. El reactor sigue frío y la nave cruje por las noches, sobre todo el pasillo de popa, como si alguien anduviera por él. No sé cuándo vamos a poder volver. C0-PI dice que el violeta de la roca es "de buen augurio". No sé de dónde saca esas cosas, pero hoy me viene bien creerle.',
          'Se ha atascado la compuerta de carga y he pasado la mañana con la llave inglesa mientras C0-PI me leía el manual en voz alta. A la tercera vez que ha dicho "apartado cuatro" he estado a punto de tirarle la llave. Ha cedido a mediodía. Solo quiero un día en que no se rompa nada. Confío en la flota; en mí, a ratos.',
          'Ya me sé cada cráter de este asteroide de memoria; les he puesto nombre a tres. He cenado mirando por la ventana de popa, con los drones yendo y viniendo como abejas de piedra, y por un momento ha parecido un sitio normal. Pienso en casa más de lo que admito en este cuaderno. C0-PI dice que es normal. C0-PI no tiene casa.',
        ],
        [
          'Hoy he apoyado la mano en el casco, por costumbre, y por primera vez desde la avería estaba tibio. Me he quedado quieto un buen rato para asegurarme de que no era mi mano. No lo he dicho en voz alta por no gafarlo. C0-PI lo ha visto y ha hecho un ruidito que creo que era alegría. Queda mucho. Hoy no me importa.',
          'Noche larga. El horno se ha parado a medianoche y he bajado en pijama a arrancarlo, con la linterna en la boca. Resulta que el Platino es tan denso que tarda el doble en fundirse y el horno se protege apagándose; C0-PI lo llama "mineral serio". Ahora ya lo sé. No sé cuánto vamos a estar aquí. Solo quiero dormir una noche entera.',
          'Día tranquilo, de los que se agradecen. La flota ha traído el Platino a placas, como escamas de un pez enorme, y las he apilado junto al horno por tener algo que hacer con las manos. C0-PI se ha pasado la tarde ordenándolas por tamaño y luego por brillo. Le he dejado. Cada uno lleva la espera como puede.',
        ],
        [
          'El reactor zumba por las noches, bajito, y me duermo con eso como quien se duerme con la lluvia. Es el mejor ruido de la nave desde la avería. C0-PI dice que el Zafiro "canta" al fundirse y que si me callo lo oiré; me he callado diez minutos y solo he oído el horno. No le he quitado la ilusión. Puede que él oiga mejor.',
          'He salido al exterior sin motivo, solo por sentir la roca bajo las botas. Desde fuera este asteroide es tan azul que el visor lo confunde con el espacio y me ha avisado dos veces de que "no había suelo". Un dron ha vuelto con un trozo de Zafiro perfecto y lo he dejado en el puente. No todo tiene que ir al horno.',
          'He discutido con C0-PI sobre si el azul del Zafiro es más azul que el del cielo de casa. Ha ganado él, tenía datos, gráficas y un tono insoportable. Luego me ha preparado el turno de noche sin que se lo pidiera y me ha dejado el café puesto. Creo que era su forma de disculparse. No sé cuándo volveremos, pero no vuelvo solo.',
        ],
        [
          'El pasillo de popa ya no está frío y hoy he desayunado sin la manta encima por primera vez en meses. Pequeñas victorias; las apunto todas porque los días malos hace falta releerlas. C0-PI asegura que llevamos la mitad del camino y me ha enseñado la ruta con una flechita. No le creo del todo, pero hoy me apetece creerle.',
          'La refinería ha estado toda la noche fundiendo y la luz verde salía por las ventanas y se colaba por debajo de mi puerta. He salido a verla desde la roca, con el café: desde fuera la estación parecía habitada, con alguien dentro esperando a alguien. Lo está. Solo quiero que otra persona la vea así algún día.',
          'Día de mantenimiento. Filtros, la cuna del muelle, una junta que silbaba, y C0-PI reprogramando la ruta de vuelta "por si acaso". Le he preguntado por si acaso qué. No ha contestado, que en él es raro. Luego he vuelto al horno, que es lo de siempre; la Esmeralda no se funde sola y las juntas no se cambian solas.',
        ],
        [
          'Esta mañana he visto el reactor girar a medias durante un segundo antes de pararse, con un chasquido que ha sonado a mucho. C0-PI ha aplaudido. No sabía que podía aplaudir; lo hace con unas pinzas y suena a lata. Nos hemos quedado mirándolo un rato en silencio, esperando que lo repitiera. No lo ha hecho. Confío en que mañana sí.',
          'El Cuarzo deja polvo en todo: en el suelo, en los drones, en el visor, en este cuaderno, entre las teclas del puente. He pasado la tarde limpiando y a la hora estaba igual, como si nevara hacia arriba. No sé cuándo vamos a volver, pero cuando lo hagamos esta nave va a brillar como una lámpara, quiera o no.',
          'Día raro. La refinería no se decide con el Cuarzo: se funde mal y bien a la vez, y se rompe si lo miras mal. He perdido una cápsula entera por impaciente, por abrir antes de tiempo. C0-PI no ha dicho nada, ni un "apartado cuatro", que es peor que si lo dice. Me he ido a dormir pronto. Mañana, más despacio.',
        ],
        [
          'El reactor ya calienta el pasillo entero y hoy la refinería ha trabajado con la puerta abierta, cosa que no pasaba desde que llegamos. He comido fuera, en la pasarela, con las piernas colgando y el Rubí brillando rojo hasta en la sombra. Me he permitido pensar que esto sale bien. Lo dejo escrito por si lo olvido.',
          'La flota ha traído más mineral que nunca; los drones volvían pesados, bajos, como abejas cargadas. Lo he apilado junto al horno y al apagar la luz para irme seguía brillando en la oscuridad. Cosas del Rubí. Me he quedado un rato en la puerta mirándolo, como quien mira una chimenea. Por aquí seguimos, pero ya no tan fríos.',
          'C0-PI ha empezado a hacer planes para la vuelta: qué ruta, qué velocidad, qué decir al llegar, en qué orden saludar. Le he dicho que no adelante acontecimientos. Ha dicho "anotado" y ha seguido. Luego he cerrado el cuaderno y he hecho los míos, en la cabeza, donde no se ven. Solo quiero que no se le olvide nada a él.',
        ],
        [
          'Nunca había visto tanta luz dentro de la nave. Todo lo que toca el horno sale dorado y la estación parece otra, más nueva, como recién comprada. He tenido que bajar el visor y aun así me deslumbra al pasar por la refinería. C0-PI dice que ahora "parecemos una nave de verdad". Ya lo éramos, pero entiendo lo que dice.',
          'Me he dado cuenta de que cuando el Oro se funde no huele a nada. Es lo único en esta nave que no huele: ni a metal caliente, ni a aceite, ni a nosotros. Lo apunto porque me parece importante y porque, después de tantos meses, un día sin olor a metal caliente es casi vacaciones. Confío en que las de verdad lleguen.',
          'El reactor da vueltas solo, aunque sin fuerza, como un motor que recuerda cómo se hacía pero no del todo. Me he sentado en el suelo a escucharlo con C0-PI al lado, los dos con la espalda contra la pared tibia. Ninguno ha dicho nada. No hacía falta. Por aquí seguimos, pero por poco tiempo, y hoy lo he sentido de verdad.',
        ],
        [
          'El último asteroide. Duro, claro, imposible de rayar; la refinería protesta con cada cápsula de Diamante y yo protesto con ella, en voz alta, para que C0-PI me oiga y me diga que me calle. No lo hace. Estamos tan cerca que da miedo escribirlo, como si el cuaderno pudiera gafarlo. Hoy no me sale nada más.',
          'He mirado el reactor un buen rato, más del que admitiría. Solo le falta este. Cuando esté, volvemos a casa. Lo escribo despacio, letra a letra, para creérmelo. Fuera, el Diamante refleja las luces de la nave como si nos devolviera el favor de haber venido hasta aquí a por él. C0-PI dice que eso es "poesía innecesaria". Puede.',
          'C0-PI ha limpiado el puente entero sin que se lo pidiera, hasta debajo de los asientos. Dice que es para la vuelta, que hay que llegar "presentables". Le he dicho que aún falta. Ha dicho que lo sabe. Yo he vuelto al horno, que es lo único que sé hacer bien últimamente, y he fundido una cápsula más. Una menos.',
        ],
      ],
      todayMined: (amount) => `${amount} de mineral extraído hasta hoy`,
      todayFleet: (units) => `${units} unidades en la flota`,
      todayCapsules: (loaded, total) => `${loaded} de ${total} cápsulas cargadas en este núcleo`,
      signature: '— C0-PI',
      logHead: 'Lo que ha pasado',
      logEntries: [
        'Explosión en el reactor en plena expedición. Nos quedamos sin propulsión y anclamos junto al primer asteroide que encontramos. Hay mineral. Con eso trabajaremos.',
        'Primer núcleo entero. Levamos anclas y llegamos a un asteroide blanco, denso, frío al tacto. La refinería tarda más con esto.',
        'Azul profundo. El mineral canta al fundirse. Dos núcleos y el reactor empieza a zumbar por las noches.',
        'Verde. C0-PI dice que la mitad del camino está hecha. No le creo del todo.',
        'Transparente y quebradizo. Se funde mal y se funde bien a la vez. Cinco núcleos.',
        'Rojo. El reactor ya calienta el pasillo de popa. Seis.',
        'Dorado. Nunca había visto tanta luz dentro de la nave. Uno más.',
        'El último asteroide. Cuando este núcleo esté entero, volvemos a casa.',
      ],
      logToCome: '(el resto de páginas están en blanco)',
      manualHead: 'Manual de a bordo',
      refineryNote:
        'Aquí se funde el mineral. Cada cápsula del núcleo se carga con una fundición y cuesta más que la anterior. Un núcleo, diez cápsulas.',
      capsulesCaption: (loaded, total, material) => `Núcleo de ${material}: ${loaded}/${total} cápsulas`,
      reactorNote:
        'El reactor de la nave está compuesto por ocho núcleos distintos, cada uno se repara con un mineral. Con los ocho núcleos reparados el reactor vuelve a funcionar y podremos volver a casa.',
      reactorCaption: (whole, total) => `${whole} de ${total} núcleos reparados`,
      compendiumHead: 'Trayectoria',
      compendiumNote:
        'Estos son los ocho minerales que necesitamos, C0\u2060-\u2060PI dice que el reactor no arranca con menos. Sin los ocho no hay vuelta a casa.',
      goalsTitle: 'Extracción',
      goalsNote: 'El reactor necesita una cantidad de cada mineral. Aquí apunto cuánto llevamos extraído de cada uno.',
      goalUnknown: '???',
      goalsCaption: (extracted, total) => `${extracted} de ${total} minerales extraídos.`,
      specimens: [
        {
          label: 'SiO₂ · dureza 7',
          facts:
            'Cuarzo violeta. El color se lo da un poco de hierro que la radiación de la roca ha ido tostando durante millones de años; si la calientas se vuelve amarilla.',
          story: 'Se parte con mirarla y el reactor la traga sin quejarse. Buen sitio para empezar a aprender.',
          guess: 'Dicen que es morada y que se rompe sola. Si es tan fácil como cuentan, no sé por qué nadie ha vuelto con las bodegas llenas.',
        },
        {
          label: 'Pt · dureza 4,5 · 21,4 g/cm³',
          facts:
            'Metal nativo, más denso que el oro y que el plomo. No se oxida ni con los siglos, por eso lo quiere el reactor para los contactos.',
          story: 'Pesa el doble de lo que parece. C0\u2060-\u2060PI dice que es el más noble; yo digo que es el que más cuesta cargar.',
          guess: 'Un metal gris que no se oxida, o eso pone en el manual. Supongo que pesará; C0\u2060-\u2060PI ya ha pedido que revise las grúas antes de ir.',
        },
        {
          label: 'Al₂O₃ · dureza 9',
          facts:
            'Corindón azul: óxido de aluminio con un poco de hierro y titanio. Solo lo raya el diamante; con él se hacen cristales de reloj y ventanas de sonda.',
          story: 'Corta como el vidrio. He tenido que pedir guantes nuevos dos veces.',
          guess: 'Azul, y de los duros. Un minero que lo vio me dijo que ni el taladro grande lo raya. Me imagino que lo dijo para asustarme.',
        },
        {
          label: 'Be₃Al₂Si₆O₁₈ · dureza 7,5',
          facts:
            'Berilo verde por el cromo. Casi ninguna sale limpia: dentro tiene fisuras y burbujas que los joyeros llaman jardín, y aquí se ven a simple vista.',
          story: 'Vetas que parecen hojas. Es lo primero vivo que veo en meses, aunque sea piedra.',
          guess: 'Verde, según todos. Nadie se pone de acuerdo en si es verde de bosque o verde de botella; supongo que ninguno de los dos, que ahí fuera no hay ni lo uno ni lo otro.',
        },
        {
          label: 'SiO₂ · dureza 7',
          facts:
            'El mineral más corriente de una corteza planetaria, y el más útil: si lo aprietas da corriente, y si le das corriente vibra siempre al mismo ritmo. Por eso marca la hora.',
          story: 'Casi transparente. Se me perdía en la bodega hasta que le puse cinta roja.',
          guess: 'Cristal blanco, corriente en todas partes menos donde hace falta. Me da que será fácil de encontrar y difícil de ver.',
        },
        {
          label: 'Al₂O₃ · dureza 9',
          facts:
            'La misma piedra que el zafiro, pero con cromo en vez de hierro, y el cromo la enciende en rojo. Con rubí se hizo el primer láser.',
          story: 'Rojo como un aviso. El reactor sube dos grados solo con acercárselo.',
          guess: 'Rojo. Es lo único que sé seguro. C0\u2060-\u2060PI cree que es pariente del zafiro, lo cual no me tranquiliza: ya sé lo que corta el zafiro.',
        },
        {
          label: 'Au · dureza 2,5 · 19,3 g/cm³',
          facts:
            'Blando como para marcarlo con la uña y tan dúctil que un gramo se estira en dos kilómetros de hilo. Casi todo el oro de un planeta llegó de fuera, en meteoritos.',
          story: 'Brilla hasta con las luces apagadas. C0\u2060-\u2060PI lo mira más de la cuenta.',
          guess: 'Todo el mundo sabe cómo es y nadie lo ha visto en bruto. Supongo que amarillo, blando y caro. Habrá que vigilar la bodega.',
        },
        {
          label: 'C · dureza 10',
          facts:
            'Carbono puro, apretado a más de cien kilómetros bajo una corteza hasta que cristaliza. Nada lo raya, y conduce el calor mejor que el cobre.',
          story: 'El último. Dicen que ni existe. Lo veremos.',
          guess: 'El último de la lista y el único del que nadie me ha contado nada de primera mano. Me imagino un asteroide pequeño, muy lejos, y una piedra que no se deja rayar por nada.',
        },
      ],
      specimenNumber: (n) => `Mineral nº ${n}`,
      calendarHead: 'Calendario',
      calendarWeekdays: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
      calendarNote:
        'Aquí no hay amaneceres, así que el día empieza cuando yo digo. Lo tacho cuando me quito las botas; hasta entonces sigue siendo hoy.',
      calendarDaysOut: (days) => (days === 1 ? '1 día de trabajo este mes.' : `${days} días de trabajo este mes.`),
    },
    ship: {
      title: 'Tu nave',
      reactor: 'Reactor',
      intro:
        'El reactor arranca cuando los ocho núcleos estén enteros. Cada uno se carga en la refinería con el mineral de su asteroide.',
      repairedPct: (pct) => `reparado al ${pct} %`,
      coresWhole: (n, total) => `${n} de ${total} núcleos enteros`,
    },
    refinery: {
      title: 'Refinería',
      intro: (material) =>
        `Carga todas las cápsulas del núcleo fundiendo ${material.toLowerCase()} para poder repararlo.`,
      finishNow: 'Terminar ahora',
      preparing: 'Preparando…',
      coreOf: (material) => `Núcleo de ${material}`,
      repairedCount: (n, total) => `${n} de ${total} cápsulas cargadas`,
      nextCore: 'Siguiente cápsula',
      coreLabel: (i, total) => `Cápsula ${i} / ${total}`,
      // Game-style: "45s", "2m", "2m 10s".
      seconds: (n) =>
        n < 60 ? `${n}s` : n % 60 === 0 ? `${Math.floor(n / 60)}m` : `${Math.floor(n / 60)}m ${n % 60}s`,
      start: 'Fundir',
      refining: 'Fundiendo',
      notEnough: (material) => `Falta ${material}`,
      complete: 'Núcleo reparado',
      repaired: 'Reparado',
      completeBody: (material) =>
        `El núcleo de ${material} está entero. Cuando lo estén los de todos los minerales, el reactor de la nave volverá a funcionar.`,
      error: 'No se pudo fundir. Inténtalo de nuevo.',
    },
    home: {
      objectLabel: (n) => `Objeto #${n}`,
      objectsProgress: (broken, target) => `${broken} / ${target} niveles`,
      prestigeReady: '¡Mineral disponible!',
      prestigeNeedsCore: 'Carga las 10 cápsulas del núcleo en la refinería para abandonar el asteroide',
      viewModeLabel: 'Ajustar vista',
      stationNode: 'Nodo',
      stationRefinery: 'Refinería',
      stationDock: 'Muelle',
      stationMarket: 'Tienda',
      stationPodium: 'Podio',
      stationNursery: 'Vivero',
      stationAstronaut: 'Tu astronauta',
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
      tasksTitle: 'Tareas',
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
      trajectoryTierNames: ['Amatista', 'Platino', 'Zafiro', 'Esmeralda', 'Cuarzo', 'Rubí', 'Oro', 'Diamante'],
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
      fleetAwayPrefix: 'Mientras no estabas tu flota ha extraído',
      fleetAwaySuffix: 'Ya está en la bodega.',
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
      errorUsernameInvalid:
        'Ese nombre no es válido. Usa entre 4 y 20 caracteres, sin símbolos ni acentos, y no solo números.',
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
      lockerProduction: (pct) => `${pct} de producción`,
      detailProduction: (pct) => `${pct} de producción`,
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
        cuarzo: 'Cuarzo',
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
        'belt:cuarzo': 'Blanco cuarzo, como recién pulido.',
        'belt:grafito': 'Banda gunmetal, discreta a propósito.',
        'belt:carmesi': 'Rojo carmesí. La línea más visible del traje.',

        'bracelet:violeta': 'Muñequeras violeta a juego con el equipo básico.',
        'bracelet:oro': 'Puños dorados. Lo primero que se ve al saludar.',
        'bracelet:diamante': 'Diamante eléctrico en las dos muñecas.',
        'bracelet:zafiro': 'Azul zafiro con acabado esmaltado.',
        'bracelet:rubi': 'Rojo rubí pulido a mano.',
        'bracelet:esmeralda': 'Verde esmeralda con acabado esmaltado.',
        'bracelet:cuarzo': 'Blanco cuarzo con veta translúcida.',
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
        'pet:chispa':
          'Una mota de luz que te sigue, con tres motas girando a su alrededor. No es una máquina: es la más pequeña de todas.',
        'pet:mascota1': 'Vigía: un droide compacto que no se separa de tu hombro.',
        'pet:satelite': 'Un satélite con los paneles desplegados orbitando a tu lado.',
        'pet:orbe': 'Un orbe entre dos anillos que giran solos.',

        'accent:violeta': 'Violeta en vivos, mochila y propulsor. El color de la casa.',
        'accent:oro': 'Dorado en todos los detalles del traje.',
        'accent:diamante': 'Diamante frío recorriendo el equipo.',
        'accent:zafiro': 'Azul zafiro en los vivos y en la llama.',
        'accent:rubi': 'Rojo rubí en los vivos y en la llama.',
        'accent:esmeralda': 'Verde esmeralda en los vivos y en la llama.',
        'accent:cuarzo': 'Blanco cuarzo en los vivos; la llama, al rojo blanco.',
        'accent:grafito': 'Detalles gunmetal. Apaga el traje entero.',
        'accent:carmesi': 'Carmesí en cada vivo del equipo.',
      },
    },
    store: {
      subtitle: 'Mejora tus clicks con potenciadores y mejoras permanentes.',
      costLabel: 'platino',
      buy: 'Comprar',
      buying: 'Comprando…',
      availableIn: (time) => `Disponible en ${time}`,
      active: 'Activo',
      owned: 'Comprado',
      notEnoughClicks: 'Te falta platino',
      casesSection: 'Cofres',
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
      keysTitle: 'Llaves',
      gemsTitle: 'Gemas',
      gemsStallTagline: 'Puesto de trueque',
      orePurchaseTitle: (amount, materialName) => `¿Comprar ${amount} de ${materialName.toLowerCase()}?`,
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
      chestTagStyle: 'Estilo',
      chestTagStyleRare: 'Estilo raro',
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
      premiumDesc:
        'Multiplicador permanente aplicado a la potencia de cada disparo, para siempre. No se acumula con otros niveles — solo cuenta el más alto que tengas.',
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
      legendaryEaseDesc:
        'Reduce los disparos necesarios para sobrecalentar el cañón y subir de nivel en modo Legendario.',
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
      semiAutoName: 'Cañón semiautomático',
      semiAutoDesc: () => 'Desbloquea un cañón semiautomático para la nave. Mantén pulsado para disparar.',
      semiAutoHoldName: 'Carga',
      semiAutoHoldDesc: 'Aumenta la carga del cañón semiautomático.',
      currentHold: 'Carga actual:',
      nextHold: 'Carga siguiente nivel:',
      holdSeconds: (seconds) => `${seconds} segundos`,
      semiAutoRateName: 'Cadencia',
      semiAutoRateDesc: 'Aumenta la velocidad de disparo del cañón semiautomático.',
      currentFireRate: 'Cadencia actual:',
      nextFireRate: 'Cadencia siguiente nivel:',
      rateTps: (tps) => `${tps} t/s`,
      multiShotExtraName: 'Sincronía',
      multiShotExtraDesc: 'Desbloquea cañones extra para la nave.',
      multiShotExtraLocked: 'Necesitas Multidisparo al máximo.',
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
      offlineProductionDesc:
        'Aumenta la autonomía de tu nave para que tu flota siga produciendo mientras estás ausente.',
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
        'Bienvenido a bordo, comandante. Soy C0-PI, el asistente de tu nave. Tengo malas noticias: el reactor de la nave se ha roto en plena expedición y estamos varados junto a un asteroide cargado de Amatista. La buena noticia es que ese mineral puede ser nuestra salida. Vamos a repasar los mandos.',
      pointAsteroidText:
        'Dispara al asteroide para empezar a extraer Amatista. Toca en cualquier parte de la pantalla.',
      pointTreeNavText: 'Bien hecho. Ahora ve a la sala de progreso de tu nave.',
      pointTreeRootText: 'Aquí gestionas tu flota de drones. Toca este núcleo.',
      pointTreeBuyText: 'Consigue tu primer dron. Te ayudará con la extracción.',
      closingText:
        'Esta es la sala de progreso de tu nave. Desde aquí irás mejorando cada sistema y ampliando tu flota. Buena suerte ahí fuera.',
      droneFusionIntroText:
        '¡Buen trabajo, comandante! Tu flota está creciendo. A partir de ahora, cada diez drones se fusionarán automáticamente en una unidad más grande y eficiente. Vamos a verlo.',
      droneFusionHomeText:
        '¡Mira! Tus diez drones se han fusionado en una unidad más grande y potente. Cada vez que reúnas diez más, se fusionarán en otra igual, así tu flota se mantiene ágil aunque no pare de crecer.',
      stationIntroText:
        'Tu flota está aumentando, comandante. Ya va siendo hora de que te cuente un par de cosas más sobre nuestra nave y sobre cómo vamos a salir de aquí.',
      stationExitText:
        'Con este botón puedes salir al exterior de la nave. Ahí fuera está todo lo que necesitamos para repararla. Púlsalo.',
      stationExitConfirmText: 'Ponte el casco. Sal.',
      stationArriveText:
        'Esto es la estación orbital. Aquí fuera encontrarás la nave, la tienda, el ranking, el árbol de mejoras… y lo más importante ahora mismo: la refinería.',
      stationRefineryText: 'Entra en la refinería.',
      stationRefineryIntroText:
        'Aquí fundimos el mineral que extraes. Cada núcleo del reactor lleva diez cápsulas, y cada cápsula se carga fundiendo mineral.',
      stationSmeltText: 'Pulsa Fundir para cargar tu primera cápsula.',
      stationSmeltingText:
        'Ya está fundiendo. Cuando termine tendrás una cápsula del núcleo cargada, y cuando las cargues todas habrás conseguido reparar el núcleo.',
      stationPlanText:
        'La nave tiene ocho núcleos como este y cada uno se carga con un mineral distinto. Cuando consigas cargar los ocho, el reactor volverá a funcionar y podremos volver a casa. Ese es el plan, comandante.',
    },
  },
  en: {
    signIn: {
      tagline: 'Your progress, safe on any device.',
      perks: ['Keep your asteroid and your fleet', 'Compete on the global leaderboard', 'Buy and receive rewards'],
      continueAsGuest: 'Keep playing as a guest',
      continueWithGoogle: 'Continue with Google',
      redirecting: 'Redirecting…',
      genericError: "Couldn't sign in with Google. Please try again.",
    },
    loading: {
      steps: ['Locating the asteroid', 'Syncing the fleet', 'Counting the ore', 'Opening the store'],
    },
    station: {
      travelLabel: 'Step outside',
      travelTitle: 'Step outside',
      travelBody: 'Step outside the ship? Your fleet will keep producing while you are out there.',
      travelGo: 'Step out',
      returnLabel: 'Back to the ship',
      returnTitle: 'Back to the ship',
      returnBody: 'Go back inside the ship?',
      returnGo: 'Go in',
      cancel: 'Stay',
      travelSteps: ['Sealing the helmet', 'Depressurising the airlock', 'Opening the hatch', 'Outside the ship'],
      returnSteps: ['Opening the hatch', 'Pressurising the airlock', 'Helmet off', 'Inside the ship'],
      prestigeSteps: ['Casting off', 'Firing thrusters', 'Bound for the next asteroid', 'In orbit'],
    },
    diary: {
      title: 'Diary',
      todayHead: 'Daily report',
      todayEntries: [
        [
          'Still stranded by the Amatista asteroid. The reactor is cold and the ship creaks at night, the aft corridor most of all, like someone is walking it. No idea when we will get to go back. C0-PI says the rock\'s violet is "a good omen". No idea where it gets these things, but today I could use believing it.',
          'The cargo hatch jammed and I spent the whole morning with a wrench while C0-PI read me the manual out loud, unasked. The third time it said "section four" I nearly threw the wrench at it. It gave at noon. All I want is one day where nothing breaks. I trust the fleet; myself, some of the time.',
          'I know every crater of this asteroid by heart now; I have named three. Ate dinner at the aft window, drones coming and going like stone bees, and for a moment it felt like a normal place. I think of home more than I admit in this notebook. C0-PI says that is normal. C0-PI has no home.',
        ],
        [
          'Put my hand on the hull today, out of habit, and for the first time since the breakdown it was warm. I stood still a long while to make sure it wasn\'t my hand. Didn\'t say it out loud, so as not to jinx it. C0-PI saw and made a little noise I think was joy. A long way to go. Today I don\'t mind.',
          'Long night. The furnace stopped at midnight and I went down in my pyjamas to restart it, torch in my teeth. Turns out Platino is so dense it takes twice as long to melt and the furnace shuts off to protect itself; C0-PI calls it "serious mineral". No idea how long we will be here. All I want is one full night\'s sleep.',
          'A quiet day, the kind you are grateful for. The fleet brought the Platino in plates, like the scales of some enormous fish, and I stacked them by the furnace just to have something to do with my hands. C0-PI spent the afternoon sorting them by size and then by shine. I let it. Everyone waits the way they can.',
        ],
        [
          'The reactor hums at night, quietly, and I fall asleep to it the way you fall asleep to rain. Best sound on the ship since the breakdown. C0-PI says the Zafiro "sings" when it melts and that if I hush I will hear it; I hushed for ten minutes and heard only the furnace. I let it have that. Maybe its ears are better.',
          'Went outside for no reason, just to feel the rock under my boots. From out there this asteroid is so blue the visor mistakes it for space and warned me twice that there was "no ground". A drone came back with a perfect piece of Zafiro and I left it on the bridge. Not everything has to go in the furnace.',
          'Argued with C0-PI over whether Zafiro blue is bluer than the sky back home. It won; it had data, charts and an unbearable tone. Then it set up my night shift at the furnace without being asked and left the coffee on. I think that was its way of apologising. No idea when we go back, but I am not going back alone.',
        ],
        [
          'The aft corridor isn\'t cold any more and today I had breakfast without the blanket for the first time in months. Small wins; I write them all down because on the bad days I need to reread them. C0-PI insists we are halfway and showed me the route with a little arrow. I don\'t quite believe it, but today I feel like believing.',
          'The refinery smelted all night and green light came out of the windows and crept under my door. I went out onto the rock with my coffee to look: from outside the station looked lived-in, like someone inside waiting for someone. It is. All I want is for someone else to see it like that one day.',
          'Maintenance day. Filters, the dock cradle, a seal that whistled, and C0-PI reprogramming the route home "just in case". I asked just in case of what. No answer, which for it is odd. Then back to the furnace, same as ever; the Esmeralda doesn\'t melt itself and seals don\'t change themselves.',
        ],
        [
          'This morning I saw the reactor half-turn for a second before it stopped, with a click that sounded like a lot. C0-PI applauded. I didn\'t know it could applaud; it does it with its clamps and it sounds like tin. We stood there a while in silence, waiting for it to do it again. It didn\'t. I trust tomorrow it will.',
          'The Cuarzo leaves dust on everything: the floor, the drones, the visor, this notebook, between the keys on the bridge. Spent the afternoon cleaning and an hour later it was the same, like snow falling upward. No idea when we go back, but when we do this ship is going to shine like a lamp whether it wants to or not.',
          'Odd day. The refinery can\'t make up its mind about Cuarzo: it melts badly and well at the same time, and breaks if you look at it wrong. Lost a whole capsule to impatience, to opening too soon. C0-PI said nothing, not even a "section four", which is worse than when it does. Went to bed early. Tomorrow, slower.',
        ],
        [
          'The reactor warms the whole corridor now and today the refinery worked with the door open, which hasn\'t happened since we arrived. Ate lunch outside on the gantry, legs dangling, the Rubí glowing red even in shadow. I let myself think, mouth full, that this is going to work. Writing it down in case I forget.',
          'The fleet brought more mineral than ever; the drones came back heavy and low, like laden bees. I stacked it by the furnace and when I turned off the light to leave it kept glowing in the dark. Rubí things. I stood in the doorway a while watching it, the way you watch a fire. Still here, but not so cold any more.',
          'C0-PI has started making plans for the trip back: which route, what speed, what to say when we land, who to greet first. I told it not to get ahead of itself. It said "noted" and carried on. Then I closed the notebook and made mine, in my head, where they don\'t show. All I want is for it not to forget anything.',
        ],
        [
          'I had never seen so much light inside the ship. Everything the furnace touches comes out golden and the station looks like another place, newer, like it was just bought. Had to turn the visor down and it still dazzles me by the refinery. C0-PI says we "look like a real ship now". We already were, but I know what it means.',
          'Realised today that when Oro melts it smells of nothing. It is the only thing on this ship that doesn\'t smell: not of hot metal, not of oil, not of us. Writing it down because it feels important and because, after all these months, a day without hot metal in the air is nearly a holiday. I trust the real one is coming.',
          'The reactor turns on its own, though with no strength, like an engine remembering how it was done but not quite. I sat on the floor listening to it with C0-PI beside me, both of us with our backs against the warm wall. Neither of us said anything. No need. Still here, but not for long, and today I really felt it.',
        ],
        [
          'The last asteroid. Hard, clear, impossible to scratch; the refinery complains with every capsule of Diamante and I complain with it, out loud, so C0-PI will hear and tell me to be quiet. It doesn\'t. We are so close it is frightening to write down, as if the notebook could jinx it. Nothing else will come today.',
          'Looked at the reactor a long while, longer than I would admit. Only this one left. When it is in, we go home. Writing it slowly, letter by letter, so I believe it. Outside, the Diamante throws the ship\'s lights back at us, like it is returning the favour of our coming all this way. C0-PI calls that "unnecessary poetry". Maybe.',
          'C0-PI cleaned the whole bridge without being asked, even under the seats. Says it is for the trip home, that we have to arrive "presentable". I said there is still a way to go. It said it knows. I went back to the furnace, the one thing I still do well lately, and melted one more capsule. One fewer.',
        ],
      ],
      todayMined: (amount) => `${amount} of mineral mined so far`,
      todayFleet: (units) => `${units} units in the fleet`,
      todayCapsules: (loaded, total) => `${loaded} of ${total} capsules loaded on this core`,
      signature: '— C0-PI',
      logHead: 'What has happened',
      logEntries: [
        'Reactor blew mid-expedition. No thrust; we anchored by the first asteroid we found. There is mineral. That is what we work with.',
        'First core whole. We cast off and reached a white asteroid, dense, cold to the touch. The refinery takes longer with this one.',
        'Deep blue. The mineral sings when it melts. Two cores and the reactor hums at night.',
        'Green. C0-PI says we are halfway. I do not quite believe it.',
        'Clear and brittle. Melts badly and well at the same time. Five cores.',
        'Red. The reactor already warms the aft corridor. Six.',
        'Golden. I had never seen so much light inside the ship. One more.',
        'The last asteroid. When this core is whole, we go home.',
      ],
      logToCome: '(the rest of the pages are blank)',
      manualHead: 'Ship manual',
      refineryNote:
        'Where the mineral is smelted. Each capsule of the core is loaded by one smelt and costs more than the last. One core, ten capsules.',
      capsulesCaption: (loaded, total, material) => `${material} core: ${loaded}/${total} capsules`,
      reactorNote:
        'The ship\'s reactor is made of eight different cores, each repaired with one mineral. With all eight repaired the reactor runs again and we can go home.',
      reactorCaption: (whole, total) => `${whole} of ${total} cores repaired`,
      compendiumHead: 'Trajectory',
      compendiumNote:
        'These are the eight minerals we need, C0\u2060-\u2060PI says the reactor will not start on fewer. Without all eight there is no way home.',
      goalsTitle: 'Extraction',
      goalsNote: 'The reactor needs a set amount of each mineral. This is where I keep how much of each one we have extracted.',
      goalUnknown: '???',
      goalsCaption: (extracted, total) => `${extracted} of ${total} minerals extracted.`,
      specimens: [
        {
          label: 'SiO₂ · hardness 7',
          facts:
            'Violet quartz. The colour comes from a trace of iron the rock\'s own radiation has been toasting for millions of years; heat it and it turns yellow.',
          story: 'It splits if you look at it and the reactor swallows it without complaint. A good place to learn.',
          guess: 'They say it is purple and breaks on its own. If it is as easy as they tell it, I do not know why nobody has come back with a full hold.',
        },
        {
          label: 'Pt · hardness 4.5 · 21.4 g/cm³',
          facts:
            'Native metal, denser than gold and than lead. It does not tarnish in centuries, which is why the reactor wants it for its contacts.',
          story: 'Twice as heavy as it looks. C0\u2060-\u2060PI calls it the noblest; I call it the hardest to load.',
          guess: 'A grey metal that does not rust, or so the manual says. I suppose it will be heavy; C0\u2060-\u2060PI has already asked me to check the cranes before we go.',
        },
        {
          label: 'Al₂O₃ · hardness 9',
          facts:
            'Blue corundum: aluminium oxide with a little iron and titanium. Only diamond scratches it; watch crystals and probe windows are made of it.',
          story: 'Cuts like glass. I have had to ask for new gloves twice.',
          guess: 'Blue, and one of the hard ones. A miner who saw it told me not even the big drill scratches it. I imagine he said it to scare me.',
        },
        {
          label: 'Be₃Al₂Si₆O₁₈ · hardness 7.5',
          facts:
            'Beryl, green from chromium. Almost none comes out clean: inside are fissures and bubbles the jewellers call the garden, and here you can see it with the naked eye.',
          story: 'Veined like leaves. The first living-looking thing I have seen in months, even if it is stone.',
          guess: 'Green, everyone agrees. Nobody agrees on whether it is forest green or bottle green; I suppose neither, since out here there are no forests and no bottles.',
        },
        {
          label: 'SiO₂ · hardness 7',
          facts:
            'The commonest mineral in a planet\'s crust, and the most useful: squeeze it and it gives a current, feed it a current and it vibrates at one steady beat. That is how it keeps time.',
          story: 'Nearly transparent. I kept losing it in the hold until I put red tape on it.',
          guess: 'White crystal, common everywhere except where it is needed. My guess is it will be easy to find and hard to see.',
        },
        {
          label: 'Al₂O₃ · hardness 9',
          facts:
            'The same stone as sapphire, with chromium in place of iron, and the chromium lights it red. The first laser was made with ruby.',
          story: 'Red like a warning. The reactor climbs two degrees just from bringing it near.',
          guess: 'Red. That is the only thing I know for sure. C0\u2060-\u2060PI thinks it is kin to sapphire, which does not reassure me: I already know what sapphire cuts.',
        },
        {
          label: 'Au · hardness 2.5 · 19.3 g/cm³',
          facts:
            'Soft enough to mark with a fingernail and so ductile a gram draws out into two kilometres of wire. Nearly all the gold on a planet arrived from outside, in meteorites.',
          story: 'Shines even with the lights off. C0\u2060-\u2060PI looks at it more than it should.',
          guess: 'Everyone knows what it looks like and nobody has seen it raw. Yellow, soft and dear, I suppose. The hold will want watching.',
        },
        {
          label: 'C · hardness 10',
          facts:
            'Pure carbon, squeezed more than a hundred kilometres under a crust until it crystallises. Nothing scratches it, and it carries heat better than copper.',
          story: 'The last one. They say it does not even exist. We will see.',
          guess: 'Last on the list and the only one nobody has told me about first-hand. I picture a small asteroid, very far out, and a stone nothing can scratch.',
        },
      ],
      specimenNumber: (n) => `Mineral no. ${n}`,
      calendarHead: 'Calendar',
      calendarWeekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      calendarNote:
        'There are no sunrises here, so the day starts when I say it does. I cross it off when I take my boots off; until then it is still today.',
      calendarDaysOut: (days) => (days === 1 ? '1 day of work this month.' : `${days} days of work this month.`),
    },
    ship: {
      title: 'Your ship',
      reactor: 'Reactor',
      intro:
        "The reactor starts once all eight cores are whole. Each one is loaded at the refinery with its asteroid's mineral.",
      repairedPct: (pct) => `${pct}% repaired`,
      coresWhole: (n, total) => `${n} of ${total} cores whole`,
    },
    refinery: {
      title: 'Refinery',
      intro: (material) => `Load every capsule of the core by smelting ${material.toLowerCase()} to repair it.`,
      finishNow: 'Finish now',
      preparing: 'Preparing…',
      coreOf: (material) => `${material} core`,
      repairedCount: (n, total) => `${n} of ${total} capsules loaded`,
      nextCore: 'Next capsule',
      coreLabel: (i, total) => `Capsule ${i} / ${total}`,
      seconds: (n) =>
        n < 60 ? `${n}s` : n % 60 === 0 ? `${Math.floor(n / 60)}m` : `${Math.floor(n / 60)}m ${n % 60}s`,
      start: 'Smelt',
      refining: 'Smelting',
      notEnough: (material) => `Not enough ${material}`,
      complete: 'Core repaired',
      repaired: 'Repaired',
      completeBody: (material) =>
        `The ${material} core is whole. Once every material's core is, the ship's reactor will run again.`,
      error: "Couldn't smelt. Please try again.",
    },
    home: {
      objectLabel: (n) => `Object #${n}`,
      objectsProgress: (broken, target) => `${broken} / ${target} levels`,
      prestigeReady: 'Mineral available!',
      prestigeNeedsCore: 'Load all 10 capsules of the core at the refinery to leave the asteroid',
      viewModeLabel: 'Adjust view',
      stationNode: 'Hub',
      stationRefinery: 'Refinery',
      stationDock: 'Dock',
      stationMarket: 'Store',
      stationPodium: 'Podium',
      stationNursery: 'Nursery',
      stationAstronaut: 'Your astronaut',
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
      tasksTitle: 'Tasks',
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
      trajectoryTierNames: ['Amethyst', 'Platinum', 'Sapphire', 'Emerald', 'Quartz', 'Ruby', 'Gold', 'Diamond'],
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
      fleetAwayPrefix: 'While you were away your fleet extracted',
      fleetAwaySuffix: 'Already in the hold.',
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
      signInRewardBody: (style, rare) => `Sign in and you get ${style} style chests and ${rare} rare style chest.`,
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
      lockerProduction: (pct) => `${pct} production`,
      detailProduction: (pct) => `${pct} production`,
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
        cuarzo: 'Quartz',
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
        'belt:cuarzo': 'Quartz white, freshly polished.',
        'belt:grafito': 'Gunmetal band, understated on purpose.',
        'belt:carmesi': 'Crimson red. The most visible line on the suit.',

        'bracelet:violeta': 'Violet cuffs matching the standard kit.',
        'bracelet:oro': 'Gold cuffs. The first thing people see when you wave.',
        'bracelet:diamante': 'Electric diamond on both wrists.',
        'bracelet:zafiro': 'Sapphire blue with an enamelled finish.',
        'bracelet:rubi': 'Hand-polished ruby red.',
        'bracelet:esmeralda': 'Emerald green with an enamelled finish.',
        'bracelet:cuarzo': 'Quartz white with a translucent vein.',
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
        'pet:chispa':
          'A speck of light that follows you, with three motes turning around it. Not a machine — the smallest companion there is.',
        'pet:mascota1': 'Lookout: a compact droid that never leaves your shoulder.',
        'pet:satelite': 'A satellite with its panels out, orbiting beside you.',
        'pet:orbe': 'An orb between two rings that turn on their own.',

        'accent:violeta': 'Violet on the trim, the pack and the thruster. The house colour.',
        'accent:oro': 'Gold across every detail of the suit.',
        'accent:diamante': 'Cold diamond running through the gear.',
        'accent:zafiro': 'Sapphire blue on the trim and the flame.',
        'accent:rubi': 'Ruby red on the trim and the flame.',
        'accent:esmeralda': 'Emerald green on the trim and the flame.',
        'accent:cuarzo': 'Quartz white on the trim; the flame burns white-hot.',
        'accent:grafito': 'Gunmetal details. Turns the whole suit down.',
        'accent:carmesi': 'Crimson on every piece of trim.',
      },
    },
    store: {
      subtitle: 'Boost your clicks with powerups and permanent upgrades.',
      costLabel: 'platinum',
      buy: 'Buy',
      buying: 'Buying…',
      availableIn: (time) => `Available in ${time}`,
      active: 'Active',
      owned: 'Owned',
      notEnoughClicks: "You're short on platinum",
      casesSection: 'Chests',
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
      keysTitle: 'Keys',
      gemsTitle: 'Gems',
      gemsStallTagline: 'Trading post',
      orePurchaseTitle: (amount, materialName) => `Buy ${amount} ${materialName.toLowerCase()}?`,
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
      chestTagStyle: 'Style',
      chestTagStyleRare: 'Rare style',
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
      premiumDesc:
        "A permanent multiplier applied to the power of every shot, forever. Doesn't stack with other levels — only the highest one you own counts.",
      currentMultiplier: 'Current multiplier:',
      nextMultiplier: 'Next level multiplier:',
      luckName: 'Glimmer',
      luckDesc: 'Each shot has a chance to find a glimmer and multiply its power.',
      multiplierName: 'Power',
      multiplierDesc: 'Raises the power of each shot.',
      currentClickValue: 'Current power:',
      nextClickValue: 'Next level power:',
      luckChanceName: 'Telescope',
      luckChanceDesc: 'Raises the odds of detecting a glimmer when you fire.',
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
      gunnerRateDesc: "Bores out your gunners' cannons. Every shot tears more material off the asteroid.",
      gunnerName: 'Gunner',
      gunnerDesc:
        'Deploys a gunner that holds position aimed at the asteroid, firing from both cannons. Each one mines on its own.',
      currentGunners: 'Current gunners:',
      nextGunners: 'Gunners next level:',
      turboName: 'Overload',
      turboDesc: "Overloads your drones' reactor, increasing their production.",
      tapMultiplierName: 'Amplifier',
      tapMultiplierDesc: 'Multiplies the power of each shot.',
      multiShotName: 'Multi-shot',
      multiShotDesc: "Increases the main ship's cannons.",
      currentMultiShot: 'Current cannons:',
      nextMultiShot: 'Next level cannons:',
      semiAutoName: 'Semi-automatic cannon',
      semiAutoDesc: () => 'Unlocks a semi-automatic cannon for the ship. Hold to fire.',
      semiAutoHoldName: 'Charge',
      semiAutoHoldDesc: 'Increases the semi-automatic cannon\'s charge.',
      currentHold: 'Current charge:',
      nextHold: 'Next level charge:',
      holdSeconds: (seconds) => `${seconds} seconds`,
      semiAutoRateName: 'Fire rate',
      semiAutoRateDesc: "Increases the semi-automatic cannon's fire rate.",
      currentFireRate: 'Current fire rate:',
      nextFireRate: 'Next level fire rate:',
      rateTps: (tps) => `${tps} t/s`,
      multiShotExtraName: 'Sync',
      multiShotExtraDesc: 'Unlocks extra cannons for the ship.',
      multiShotExtraLocked: 'Requires Multi-shot at max level.',
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
      waitingForOpponent: 'Waiting for your rival',
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
        "Welcome aboard, commander. I'm C0-PI, your ship's assistant. Bad news: the reactor broke mid-expedition and we're stranded next to an asteroid loaded with Amatista. The good news is that mineral might be our way out. Let's walk through the controls.",
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
      stationIntroText:
        "Your fleet is growing, commander. It's about time I told you a couple more things about our ship, and about how we're getting out of here.",
      stationExitText:
        'This button takes you outside the ship. Everything we need to repair it is out there. Press it.',
      stationExitConfirmText: 'Helmet on. Step out.',
      stationArriveText:
        "This is the orbital station. Out here you'll find the ship, the store, the ranking, the upgrade tree… and what matters most right now: the refinery.",
      stationRefineryText: 'Go into the refinery.',
      stationRefineryIntroText:
        'This is where we smelt the mineral you mine. Each reactor core holds ten capsules, and each capsule is loaded by smelting mineral.',
      stationSmeltText: 'Press Smelt to load your first capsule.',
      stationSmeltingText:
        "It's smelting. When it's done you'll have one capsule of the core loaded, and once you've loaded them all you'll have repaired the core.",
      stationPlanText:
        "The ship has eight cores like this one, each loaded with a different mineral. Once you've loaded all eight, the reactor will run again and we can go home. That's the plan, commander.",
    },
  },
}
