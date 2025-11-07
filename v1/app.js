// ==================== DATA ====================

const AGENTS = {
    // CONTROLLERS
    "astra": { role: "Controller", c: 150, q: 0, e: 0, signature: "e", charges: { c: 4 } },
    "brimstone": { role: "Controller", c: 100, q: 250, e: 0, signature: "e" },
    "omen": { role: "Controller", c: 150, q: 300, e: 0, signature: "e" },
    "viper": { role: "Controller", c: 200, q: 200, e: 0, signature: "e" },
    "harbor": { role: "Controller", c: 150, q: 350, e: 0, signature: "e" },
    "clove": { role: "Controller", c: 100, q: 250, e: 150, signature: "e" },

    // DUELISTS
    "jett": { role: "Duelist", c: 200, q: 150, e: 0, signature: "e" },
    "phoenix": { role: "Duelist", c: 200, q: 250, e: 0, signature: "e" },
    "reyna": { role: "Duelist", c: 250, q: 0, e: 0, signature: "q" },
    "raze": { role: "Duelist", c: 400, q: 200, e: 0, signature: "e" },
    "yoru": { role: "Duelist", c: 100, q: 250, e: 0, signature: "e" },
    "neon": { role: "Duelist", c: 300, q: 200, e: 0, signature: "e" },
    "iso": { role: "Duelist", c: 250, q: 300, e: 150, signature: "e" },

    // INITIATORS
    "sova": { role: "Initiator", c: 400, q: 150, e: 0, signature: "e" },
    "breach": { role: "Initiator", c: 250, q: 200, e: 0, signature: "e" },
    "skye": { role: "Initiator", c: 200, q: 250, e: 250, signature: "e" },
    "kayo": { role: "Initiator", c: 200, q: 250, e: 0, signature: "e" },
    "fade": { role: "Initiator", c: 250, q: 200, e: 0, signature: "e" },
    "gekko": { role: "Initiator", c: 250, q: 300, e: 0, signature: "e" },
    "tejo": { role: "Initiator", c: 400, q: 200, e: 150, signature: "e" },

    // SENTINELS
    "sage": { role: "Sentinel", c: 400, q: 200, e: 0, signature: "e" },
    "cypher": { role: "Sentinel", c: 200, q: 100, e: 0, signature: "e" },
    "killjoy": { role: "Sentinel", c: 200, q: 200, e: 0, signature: "e" },
    "chamber": { role: "Sentinel", c: 150, q: 100, e: 0, signature: "q" },
    "deadlock": { role: "Sentinel", c: 200, q: 200, e: 300, signature: "e" },
    "vyse": { role: "Sentinel", c: 150, q: 200, e: 0, signature: "e" },
    "veto": { role: "Sentinel", c: 200, q: 200, e: 0, signature: "e" }
};

const WEAPONS = {
    sidearms: [
        { name: "Classic", cost: 0 },
        { name: "Shorty", cost: 300 },
        { name: "Frenzy", cost: 450 },
        { name: "Ghost", cost: 500 },
        { name: "Sheriff", cost: 800 }
    ],
    smgs: [
        { name: "Stinger", cost: 1100 },
        { name: "Spectre", cost: 1600 }
    ],
    shotguns: [
        { name: "Bucky", cost: 850 },
        { name: "Judge", cost: 1850 }
    ],
    rifles: [
        { name: "Bulldog", cost: 2050 },
        { name: "Guardian", cost: 2250 },
        { name: "Phantom", cost: 2900 },
        { name: "Vandal", cost: 2900 }
    ],
    snipers: [
        { name: "Marshal", cost: 950 },
        { name: "Outlaw", cost: 2400 },
        { name: "Operator", cost: 4700 }
    ],
    lmgs: [
        { name: "Ares", cost: 1600 },
        { name: "Odin", cost: 3200 }
    ]
};

const SHIELDS = [
    { name: "No Shield", cost: 0 },
    { name: "Light Shield", cost: 400 },
    { name: "Heavy Shield", cost: 1000 }
];

// ==================== BUDGET TIER SYSTEM ====================

function getBudgetTier(credits) {
    if (credits < 1500) return 'eco';
    if (credits < 3500) return 'half';
    return 'full';
}

function getWeightedRandomElement(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }

    return items[items.length - 1];
}

function getWeightedPrimaryWeapon(budget, tier) {
    const allPrimaries = [
        { name: "None", cost: 0 },
        ...WEAPONS.sidearms.filter(w => w.cost > 0), // Exclude Classic, include other sidearms as primaries
        ...WEAPONS.smgs,
        ...WEAPONS.shotguns,
        ...WEAPONS.rifles,
        ...WEAPONS.snipers,
        ...WEAPONS.lmgs
    ];

    // Filter to affordable weapons
    const affordable = allPrimaries.filter(w => w.cost <= budget);
    if (affordable.length === 0) return { name: "None", cost: 0 };

    // Create weights based on budget tier
    const weights = affordable.map(weapon => {
        if (tier === 'eco') {
            // Eco: Prefer cheap options
            if (weapon.cost === 0) return 30; // None
            if (weapon.cost <= 500) return 40; // Cheap pistols
            if (weapon.cost <= 1000) return 20; // SMGs, shotguns, marshal
            return 10; // Everything else
        } else if (tier === 'half') {
            // Half buy: Balanced
            if (weapon.cost === 0) return 10; // None
            if (weapon.cost <= 1000) return 20; // Cheap weapons
            if (weapon.cost <= 2000) return 50; // SMGs, shotguns, bulldog
            if (weapon.cost <= 3000) return 30; // Rifles
            return 10; // Expensive weapons
        } else {
            // Full buy: Prefer expensive weapons
            if (weapon.cost === 0) return 5; // None
            if (weapon.cost < 1600) return 10; // Cheap weapons
            if (weapon.cost < 2500) return 20; // Mid-tier
            if (weapon.cost >= 2500) return 70; // Rifles, Operator, etc.
            return 15;
        }
    });

    return getWeightedRandomElement(affordable, weights);
}

function getWeightedSidearm(budget, tier) {
    const affordable = WEAPONS.sidearms.filter(s => s.cost <= budget);
    if (affordable.length === 0) return WEAPONS.sidearms[0]; // Classic

    const weights = affordable.map(sidearm => {
        if (tier === 'eco') {
            // Eco: Prefer Classic or cheap
            if (sidearm.cost === 0) return 50; // Classic
            if (sidearm.cost <= 300) return 30; // Shorty
            return 20; // Others
        } else if (tier === 'half') {
            // Half buy: Balanced
            if (sidearm.cost === 0) return 30; // Classic
            if (sidearm.cost <= 500) return 40; // Shorty, Frenzy, Ghost
            return 30; // Sheriff
        } else {
            // Full buy: Prefer better sidearms
            if (sidearm.cost === 0) return 10; // Classic
            if (sidearm.cost >= 500) return 60; // Ghost, Sheriff
            return 30; // Shorty, Frenzy
        }
    });

    return getWeightedRandomElement(affordable, weights);
}

function getWeightedShield(budget, tier) {
    const affordable = SHIELDS.filter(s => s.cost <= budget);
    if (affordable.length === 0) return SHIELDS[0]; // No Shield

    const weights = affordable.map(shield => {
        if (tier === 'eco') {
            // Eco: Mostly no shield
            if (shield.cost === 0) return 60; // No Shield
            if (shield.cost === 400) return 30; // Light
            return 10; // Heavy
        } else if (tier === 'half') {
            // Half buy: Prefer light shield
            if (shield.cost === 0) return 30; // No Shield
            if (shield.cost === 400) return 50; // Light
            return 20; // Heavy
        } else {
            // Full buy: Prefer heavy shield
            if (shield.cost === 0) return 5; // No Shield
            if (shield.cost === 400) return 15; // Light
            return 80; // Heavy
        }
    });

    return getWeightedRandomElement(affordable, weights);
}

function getWeightedAbilities(agentName, budget, tier) {
    const agent = AGENTS[agentName.toLowerCase()];
    if (!agent) return { abilities: [], cost: 0 };

    const abilities = [];
    let totalCost = 0;

    // Probability of buying each ability based on tier
    const probability = {
        'eco': 0.3,    // 30% chance per ability
        'half': 0.6,   // 60% chance per ability
        'full': 0.8    // 80% chance per ability
    }[tier];

    ['c', 'q', 'e'].forEach(ability => {
        if (Math.random() < probability) {
            const cost = getAbilityCost(agentName, ability);
            if (totalCost + cost <= budget && !abilities.includes(ability.toUpperCase())) {
                abilities.push(ability.toUpperCase());
                totalCost += cost;
            }
        }
    });

    return { abilities: abilities.sort(), cost: totalCost };
}

// ==================== UTILITY FUNCTIONS ====================

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getAllPrimaryWeapons() {
    return [
        { name: "None", cost: 0 },
        ...WEAPONS.smgs,
        ...WEAPONS.shotguns,
        ...WEAPONS.rifles,
        ...WEAPONS.snipers,
        ...WEAPONS.lmgs
    ];
}

function getRandomPrimaryWeapon(includingNone = true) {
    if (includingNone) {
        const allPrimaries = getAllPrimaryWeapons();
        return getRandomElement(allPrimaries);
    } else {
        const primariesOnly = [
            ...WEAPONS.smgs,
            ...WEAPONS.shotguns,
            ...WEAPONS.rifles,
            ...WEAPONS.snipers,
            ...WEAPONS.lmgs
        ];
        return getRandomElement(primariesOnly);
    }
}

function getRandomSidearm() {
    return getRandomElement(WEAPONS.sidearms);
}

function getRandomShield() {
    return getRandomElement(SHIELDS);
}

function getAbilityCost(agent, ability) {
    const agentData = AGENTS[agent.toLowerCase()];
    if (!agentData) return 0;

    // Signature abilities are free
    if (agentData.signature === ability.toLowerCase()) {
        return 0;
    }

    return agentData[ability.toLowerCase()] || 0;
}

function getRandomAbilities(agentName) {
    const agent = AGENTS[agentName.toLowerCase()];
    if (!agent) return { abilities: [], cost: 0 };

    const abilities = [];
    let totalCost = 0;

    ['c', 'q', 'e'].forEach(ability => {
        if (Math.random() > 0.3) { // 70% chance to buy each ability
            const cost = getAbilityCost(agentName, ability);
            if (!abilities.includes(ability.toUpperCase())) {
                abilities.push(ability.toUpperCase());
                totalCost += cost;
            }
        }
    });

    return { abilities: abilities.sort(), cost: totalCost };
}

// ==================== RANDOMIZER FUNCTIONS ====================

function generateLoadout(agentName = null, maxBudget = null) {
    let agent = agentName;
    if (!agent) {
        const agentNames = Object.keys(AGENTS);
        agent = getRandomElement(agentNames);
    }

    agent = agent.toLowerCase();

    if (!AGENTS[agent]) {
        return null;
    }

    let primary, sidearm, shield, abilities;
    let totalCost;

    if (maxBudget) {
        // Budget-constrained randomization with weighted selection
        const result = generateBudgetLoadout(agent, maxBudget);
        if (!result) return null;
        ({ primary, sidearm, shield, abilities, totalCost } = result);
    } else {
        // Free randomization - always include a primary weapon
        primary = getRandomPrimaryWeapon(false);
        sidearm = getRandomSidearm();
        shield = getRandomShield();
        const abilityData = getRandomAbilities(agent);
        abilities = abilityData.abilities;
        totalCost = primary.cost + sidearm.cost + shield.cost + abilityData.cost;
    }

    return {
        agent: agent.charAt(0).toUpperCase() + agent.slice(1),
        role: AGENTS[agent].role,
        primary,
        sidearm,
        shield,
        abilities,
        totalCost
    };
}

function generateBudgetLoadout(agent, maxBudget) {
    const agentData = AGENTS[agent.toLowerCase()];
    if (!agentData) return null;

    const tier = getBudgetTier(maxBudget);

    // Try multiple times to find a valid loadout with weighted randomization
    for (let attempt = 0; attempt < 100; attempt++) {
        let remainingBudget = maxBudget;

        // 1. Buy primary weapon (weighted by tier)
        const primary = getWeightedPrimaryWeapon(remainingBudget, tier);
        remainingBudget -= primary.cost;

        // 2. Buy sidearm (weighted by tier)
        const sidearm = getWeightedSidearm(remainingBudget, tier);
        remainingBudget -= sidearm.cost;

        // 3. Buy shield (weighted by tier)
        const shield = getWeightedShield(remainingBudget, tier);
        remainingBudget -= shield.cost;

        // 4. Buy abilities (weighted by tier)
        const abilityData = getWeightedAbilities(agent, remainingBudget, tier);
        remainingBudget -= abilityData.cost;

        const totalCost = maxBudget - remainingBudget;

        if (totalCost <= maxBudget && remainingBudget >= 0) {
            return {
                primary,
                sidearm,
                shield,
                abilities: abilityData.abilities,
                totalCost
            };
        }
    }

    return null;
}

function formatLoadout(loadout) {
    if (!loadout) return "ERROR: Could not generate loadout";

    const abilities = loadout.abilities.length > 0
        ? loadout.abilities.join(' + ')
        : 'None';

    return `
╔════════════════════════════════════════════════════════════════╗
  AGENT: ${loadout.agent.toUpperCase()} (${loadout.role})
╠════════════════════════════════════════════════════════════════╣
  PRIMARY:   ${loadout.primary.name.padEnd(15)} $${loadout.primary.cost.toLocaleString()}
  SIDEARM:   ${loadout.sidearm.name.padEnd(15)} $${loadout.sidearm.cost.toLocaleString()}
  SHIELD:    ${loadout.shield.name.padEnd(15)} $${loadout.shield.cost.toLocaleString()}
  ABILITIES: ${abilities}
╠════════════════════════════════════════════════════════════════╣
  TOTAL COST: $${loadout.totalCost.toLocaleString()}
╚════════════════════════════════════════════════════════════════╝`;
}

function formatCompactLoadout(loadout) {
    if (!loadout) return null;

    const abilities = loadout.abilities.length > 0
        ? loadout.abilities.join('+')
        : 'None';

    return `${loadout.agent.toUpperCase().padEnd(12)} | ${loadout.primary.name.padEnd(10)} | ${loadout.sidearm.name.padEnd(8)} | ${loadout.shield.name.padEnd(13)} | ${abilities.padEnd(15)} | $${loadout.totalCost.toLocaleString()}`;
}

function getAllAffordableAgents(budget) {
    const agentNames = Object.keys(AGENTS);
    const affordable = [];

    for (const agent of agentNames) {
        const loadout = generateLoadout(agent, budget);
        if (loadout) {
            affordable.push(loadout);
        }
    }

    return affordable.sort((a, b) => b.totalCost - a.totalCost);
}

// ==================== COMMAND HANDLING ====================

function processCommand(command) {
    command = command.trim().toLowerCase();

    if (!command) {
        return "ERROR: Empty command. Type 'help' for available commands.";
    }

    if (command === 'help') {
        return getHelpText();
    }

    if (command === 'clear') {
        return '';
    }

    if (command === 'loadout' || command === 'random') {
        const loadout = generateLoadout();
        return formatLoadout(loadout);
    }

    if (command.startsWith('agent:')) {
        const agentName = command.substring(6).trim();
        if (!agentName) {
            return "ERROR: Please specify an agent name. Example: agent:jett";
        }

        if (!AGENTS[agentName.toLowerCase()]) {
            return `ERROR: Unknown agent '${agentName}'. Type 'agents' to see all agents.`;
        }

        const loadout = generateLoadout(agentName);
        return formatLoadout(loadout);
    }

    if (command === 'agents') {
        return listAllAgents();
    }

    // Check if it's a number (budget)
    const budget = parseInt(command);
    if (!isNaN(budget)) {
        if (budget < 0 || budget > 9000) {
            return "ERROR: Budget must be between 0 and 9000 credits.";
        }

        const affordable = getAllAffordableAgents(budget);

        if (affordable.length === 0) {
            return `No agents can afford a full loadout with $${budget.toLocaleString()} budget.`;
        }

        let output = `\n${'═'.repeat(100)}\n`;
        output += `  AGENTS AFFORDABLE AT $${budget.toLocaleString()} (${affordable.length} agents)\n`;
        output += `${'═'.repeat(100)}\n`;
        output += `  AGENT        | PRIMARY    | SIDEARM  | SHIELD        | ABILITIES       | TOTAL\n`;
        output += `${'─'.repeat(100)}\n`;

        affordable.forEach(loadout => {
            output += `  ${formatCompactLoadout(loadout)}\n`;
        });

        output += `${'═'.repeat(100)}`;

        return output;
    }

    return `ERROR: Unknown command '${command}'. Type 'help' for available commands.`;
}

function getHelpText() {
    return `
╔═══════════════════════════════════════════════════════════════╗
║                     AVAILABLE COMMANDS                        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  loadout                                                      ║
║    Generate a completely random loadout                      ║
║                                                               ║
║  agent:<name>                                                 ║
║    Generate random loadout for specific agent                ║
║    Example: agent:jett, agent:sage, agent:omen               ║
║                                                               ║
║  <number>                                                     ║
║    Show all agents that can afford a loadout at that budget  ║
║    Example: 800, 3000, 5500                                  ║
║                                                               ║
║  agents                                                       ║
║    List all available agents                                 ║
║                                                               ║
║  help                                                         ║
║    Show this help message                                    ║
║                                                               ║
║  clear                                                        ║
║    Clear the output screen                                   ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║  COMMON BUDGETS:                                             ║
║    800  - Pistol round                                       ║
║    2500 - Eco/save round                                     ║
║    3500 - Half buy                                           ║
║    5500 - Full buy                                           ║
╚═══════════════════════════════════════════════════════════════╝`;
}

function listAllAgents() {
    let output = '\n╔═══════════════════════════════════════════════════════════════╗\n';
    output += '║                      ALL AGENTS (29)                         ║\n';
    output += '╠═══════════════════════════════════════════════════════════════╣\n\n';

    const roles = {
        "Controller": [],
        "Duelist": [],
        "Initiator": [],
        "Sentinel": []
    };

    Object.keys(AGENTS).forEach(agent => {
        const role = AGENTS[agent].role;
        roles[role].push(agent.charAt(0).toUpperCase() + agent.slice(1));
    });

    Object.keys(roles).forEach(role => {
        output += `  ${role.toUpperCase()} (${roles[role].length}):\n`;
        output += `    ${roles[role].join(', ')}\n\n`;
    });

    output += '╚═══════════════════════════════════════════════════════════════╝';

    return output;
}

// ==================== UI FUNCTIONS ====================

if (typeof document !== 'undefined') {
    // Browser environment - set up UI handlers
    document.addEventListener('DOMContentLoaded', () => {
        const outputDiv = document.getElementById('output');
        const commandInput = document.getElementById('commandInput');

        function addToOutput(text) {
            if (text === '') {
                outputDiv.textContent = '';
            } else {
                outputDiv.textContent += '\n\n' + text;
                outputDiv.scrollTop = outputDiv.scrollHeight;
            }
        }

        function randomLoadout() {
            commandInput.value = 'loadout';
            submitCommand();
        }

        function clearOutput() {
            outputDiv.textContent = '';
            commandInput.value = '';
            commandInput.focus();
        }

        function submitCommand() {
            const command = commandInput.value;
            addToOutput('> ' + command);
            const result = processCommand(command);
            addToOutput(result);
            commandInput.value = '';
            commandInput.focus();
        }

        // Handle Enter key
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitCommand();
            }
        });

        // Make functions available globally for onclick handlers
        window.randomLoadout = randomLoadout;
        window.clearOutput = clearOutput;

        // Focus input on page load
        commandInput.focus();
    });
}

// ==================== EXPORTS FOR TESTING ====================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AGENTS,
        WEAPONS,
        SHIELDS,
        getBudgetTier,
        getWeightedPrimaryWeapon,
        getWeightedSidearm,
        getWeightedShield,
        getWeightedAbilities,
        generateLoadout,
        generateBudgetLoadout,
        getAllAffordableAgents,
        processCommand,
        getAbilityCost
    };
}
