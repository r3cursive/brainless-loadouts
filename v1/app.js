// ==================== CONSTANTS ====================

const BUDGET_TIERS = { ECO_MAX: 1500, HALF_MAX: 3500 };
const MAX_ATTEMPTS = 100;
const ABILITY_PROB = { eco: 0.3, half: 0.6, full: 0.8 };

// ==================== DATA ====================

const AGENTS = {
    // CONTROLLERS
    "astra": { role: "Controller", c: 150, q: 0, e: 0, signature: "e", charges: { c: 4 } },
    "brimstone": { role: "Controller", c: 100, q: 250, e: 0, signature: "e" },
    "omen": { role: "Controller", c: 150, q: 300, e: 0, signature: "e" },
    "viper": { role: "Controller", c: 200, q: 200, e: 0, signature: "e" },
    "harbor": { role: "Controller", c: 150, q: 350, e: 0, signature: "e" },
    "clove": { role: "Controller", c: 100, q: 250, e: 0, signature: "e" },

    // DUELISTS
    "jett": { role: "Duelist", c: 200, q: 150, e: 0, signature: "e" },
    "phoenix": { role: "Duelist", c: 200, q: 250, e: 0, signature: "e" },
    "reyna": { role: "Duelist", c: 250, q: 0, e: 0, signature: "q" },
    "raze": { role: "Duelist", c: 400, q: 200, e: 0, signature: "e" },
    "yoru": { role: "Duelist", c: 100, q: 250, e: 0, signature: "e" },
    "neon": { role: "Duelist", c: 300, q: 200, e: 0, signature: "e" },
    "iso": { role: "Duelist", c: 250, q: 300, e: 0, signature: "e" },

    // INITIATORS
    "sova": { role: "Initiator", c: 400, q: 150, e: 0, signature: "e" },
    "breach": { role: "Initiator", c: 250, q: 200, e: 0, signature: "e" },
    "skye": { role: "Initiator", c: 200, q: 250, e: 0, signature: "e" },
    "kayo": { role: "Initiator", c: 200, q: 250, e: 0, signature: "e" },
    "fade": { role: "Initiator", c: 250, q: 200, e: 0, signature: "e" },
    "gekko": { role: "Initiator", c: 250, q: 300, e: 0, signature: "e" },
    "tejo": { role: "Initiator", c: 400, q: 200, e: 0, signature: "e" },

    // SENTINELS
    "sage": { role: "Sentinel", c: 400, q: 200, e: 0, signature: "e" },
    "cypher": { role: "Sentinel", c: 200, q: 100, e: 0, signature: "e" },
    "killjoy": { role: "Sentinel", c: 200, q: 200, e: 0, signature: "e" },
    "chamber": { role: "Sentinel", c: 150, q: 0, e: 0, signature: "q" },
    "deadlock": { role: "Sentinel", c: 200, q: 200, e: 0, signature: "e" },
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
    if (credits < BUDGET_TIERS.ECO_MAX) return 'eco';
    if (credits < BUDGET_TIERS.HALF_MAX) return 'half';
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
    const affordable = getAllPrimaryWeapons().filter(w => w.cost <= budget);
    if (affordable.length === 0) return { name: "None", cost: 0 };

    const weights = affordable.map(weapon => {
        if (tier === 'eco') {
            if (weapon.cost === 0) return 70;
            if (weapon.cost <= 1100) return 25;
            return 5;
        } else if (tier === 'half') {
            if (weapon.cost === 0) return 10;
            if (weapon.cost <= 1000) return 20;
            if (weapon.cost <= 2000) return 50;
            if (weapon.cost <= 3000) return 30;
            return 10;
        } else {
            if (weapon.cost === 0) return 5;
            if (weapon.cost < 1600) return 10;
            if (weapon.cost < 2500) return 20;
            return 70;
        }
    });

    return getWeightedRandomElement(affordable, weights);
}

function getWeightedSidearm(budget, tier) {
    const affordable = WEAPONS.sidearms.filter(s => s.cost <= budget);
    if (affordable.length === 0) return WEAPONS.sidearms[0]; // Classic

    const weights = affordable.map(sidearm => {
        if (tier === 'eco') {
            if (sidearm.cost === 0) return 50;
            if (sidearm.cost <= 300) return 30;
            return 20;
        } else if (tier === 'half') {
            if (sidearm.cost === 0) return 30;
            if (sidearm.cost <= 500) return 40;
            return 30;
        } else {
            if (sidearm.cost === 0) return 10;
            if (sidearm.cost >= 500) return 60;
            return 30;
        }
    });

    return getWeightedRandomElement(affordable, weights);
}

function getWeightedShield(budget, tier) {
    const affordable = SHIELDS.filter(s => s.cost <= budget);
    if (affordable.length === 0) return SHIELDS[0]; // No Shield

    const weights = affordable.map(shield => {
        if (tier === 'eco') {
            if (shield.cost === 0) return 60;
            if (shield.cost === 400) return 30;
            return 10;
        } else if (tier === 'half') {
            if (shield.cost === 0) return 30;
            if (shield.cost === 400) return 50;
            return 20;
        } else {
            if (shield.cost === 0) return 5;
            if (shield.cost === 400) return 15;
            return 80;
        }
    });

    return getWeightedRandomElement(affordable, weights);
}

function getWeightedAbilities(agentName, budget, tier) {
    const agent = AGENTS[agentName.toLowerCase()];
    if (!agent) return { abilities: [], cost: 0 };

    const abilities = [];
    let totalCost = 0;

    const probability = ABILITY_PROB[tier];

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

function optimizeLoadoutBudget(loadout, remainingBudget, agentName, tier) {
    let primary = loadout.primary;
    let sidearm = loadout.sidearm;
    let shield = loadout.shield;
    let abilities = [...loadout.abilities];
    let budget = remainingBudget;

    // 1. Try buying missing abilities first (small costs, high value)
    const currentAbilities = new Set(abilities);
    ['c', 'q', 'e'].forEach(ability => {
        const abilityUpper = ability.toUpperCase();
        if (!currentAbilities.has(abilityUpper)) {
            const cost = getAbilityCost(agentName, ability);
            if (cost > 0 && cost <= budget) {
                abilities.push(abilityUpper);
                abilities.sort();
                currentAbilities.add(abilityUpper);
                budget -= cost;
            }
        }
    });

    // 2. Try upgrading sidearm to most expensive affordable option
    const affordableSidearms = WEAPONS.sidearms.filter(s =>
        s.cost > sidearm.cost && s.cost <= budget + sidearm.cost
    );
    if (affordableSidearms.length > 0) {
        const bestSidearm = affordableSidearms.reduce((best, current) =>
            current.cost > best.cost ? current : best
        );
        budget += sidearm.cost;
        sidearm = bestSidearm;
        budget -= sidearm.cost;
    }

    // 3. Try upgrading shield to most expensive affordable option
    const affordableShields = SHIELDS.filter(s =>
        s.cost > shield.cost && s.cost <= budget + shield.cost
    );
    if (affordableShields.length > 0) {
        const bestShield = affordableShields.reduce((best, current) =>
            current.cost > best.cost ? current : best
        );
        budget += shield.cost;
        shield = bestShield;
        budget -= shield.cost;
    }

    // 4. Try upgrading primary weapon to most expensive affordable option
    const affordablePrimaries = getAllPrimaryWeapons().filter(p =>
        p.cost > primary.cost && p.cost <= budget + primary.cost
    );
    if (affordablePrimaries.length > 0) {
        const bestPrimary = affordablePrimaries.reduce((best, current) =>
            current.cost > best.cost ? current : best
        );
        budget += primary.cost;
        primary = bestPrimary;
        budget -= primary.cost;
    }

    return { primary, sidearm, shield, abilities, remainingBudget: budget };
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
        return getRandomElement(getAllPrimaryWeapons());
    } else {
        return getRandomElement([
            ...WEAPONS.smgs,
            ...WEAPONS.shotguns,
            ...WEAPONS.rifles,
            ...WEAPONS.snipers,
            ...WEAPONS.lmgs
        ]);
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

    if (agentData.signature === ability.toLowerCase()) {
        return 0;
    }

    return agentData[ability.toLowerCase()] || 0;
}

// Unconstrained mode: flat 70% per ability (no budget awareness by design)
function getRandomAbilities(agentName) {
    const agent = AGENTS[agentName.toLowerCase()];
    if (!agent) return { abilities: [], cost: 0 };

    const abilities = [];
    let totalCost = 0;

    ['c', 'q', 'e'].forEach(ability => {
        if (Math.random() > 0.3) {
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
        agent = getRandomElement(Object.keys(AGENTS));
    }

    agent = agent.toLowerCase();

    if (!AGENTS[agent]) {
        return null;
    }

    let primary, sidearm, shield, abilities;
    let totalCost;

    if (maxBudget !== null) {
        const result = generateBudgetLoadout(agent, maxBudget);
        if (!result) return null;
        ({ primary, sidearm, shield, abilities, totalCost } = result);
    } else {
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

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        let remainingBudget = maxBudget;

        let primary = getWeightedPrimaryWeapon(remainingBudget, tier);
        remainingBudget -= primary.cost;

        let sidearm = getWeightedSidearm(remainingBudget, tier);
        remainingBudget -= sidearm.cost;

        let shield = getWeightedShield(remainingBudget, tier);
        remainingBudget -= shield.cost;

        const abilityData = getWeightedAbilities(agent, remainingBudget, tier);
        let abilities = [...abilityData.abilities];
        remainingBudget -= abilityData.cost;

        const totalCost = maxBudget - remainingBudget;

        if (totalCost <= maxBudget && remainingBudget >= 0) {
            if (remainingBudget > 0) {
                const optimized = optimizeLoadoutBudget(
                    { primary, sidearm, shield, abilities },
                    remainingBudget,
                    agent,
                    tier
                );
                primary = optimized.primary;
                sidearm = optimized.sidearm;
                shield = optimized.shield;
                abilities = optimized.abilities;
                remainingBudget = optimized.remainingBudget;
            }

            return { primary, sidearm, shield, abilities, totalCost: maxBudget - remainingBudget };
        }
    }

    console.warn(`[loadout] Could not satisfy budget ${maxBudget} for ${agent} after ${MAX_ATTEMPTS} attempts`);
    return null;
}

function getAllAffordableAgents(budget) {
    return Object.keys(AGENTS)
        .map(agent => generateLoadout(agent, budget))
        .filter(loadout => loadout !== null)
        .sort((a, b) => a.agent.localeCompare(b.agent));
}

// ==================== COMMAND HANDLING ====================

// Returns { type: 'loadout'|'list'|'help'|'agents'|'error'|'clear', data: ... }
function processCommand(command) {
    command = command.trim().toLowerCase();

    if (!command) {
        return { type: 'error', data: "Empty command. Type 'help' for available commands." };
    }

    if (command === 'help') {
        return { type: 'help', data: getHelpText() };
    }

    if (command === 'clear') {
        return { type: 'clear', data: null };
    }

    if (command === 'loadout' || command === 'random') {
        const loadout = generateLoadout();
        if (!loadout) return { type: 'error', data: 'Could not generate loadout.' };
        return { type: 'loadout', data: loadout };
    }

    if (command.startsWith('agent:')) {
        const agentName = command.substring(6).trim();
        if (!agentName) {
            return { type: 'error', data: "Please specify an agent name. Example: agent:jett" };
        }
        if (!AGENTS[agentName.toLowerCase()]) {
            return { type: 'error', data: `Unknown agent '${agentName}'. Type 'agents' to see all agents.` };
        }
        const loadout = generateLoadout(agentName);
        if (!loadout) return { type: 'error', data: 'Could not generate loadout.' };
        return { type: 'loadout', data: loadout };
    }

    if (command === 'agents') {
        return { type: 'agents', data: getAgentsByRole() };
    }

    const budget = Number(command);
    if (Number.isInteger(budget)) {
        if (budget < 0 || budget > 9000) {
            return { type: 'error', data: 'Budget must be between 0 and 9000 credits.' };
        }
        const affordable = getAllAffordableAgents(budget);
        return { type: 'list', data: { budget, loadouts: affordable } };
    }

    return { type: 'error', data: `Unknown command '${command}'. Type 'help' for available commands.` };
}

function getAgentsByRole() {
    const roles = { Controller: [], Duelist: [], Initiator: [], Sentinel: [] };
    Object.keys(AGENTS).forEach(agent => {
        const role = AGENTS[agent].role;
        roles[role].push(agent.charAt(0).toUpperCase() + agent.slice(1));
    });
    return roles;
}

function getHelpText() {
    return `AVAILABLE COMMANDS
${'═'.repeat(50)}

loadout
  Generate a completely random loadout

agent:<name>
  Generate loadout for a specific agent
  Example: agent:jett, agent:sage, agent:omen

<number>
  Show all agents affordable at that budget
  Example: 800, 3000, 5500

agents
  List all available agents by role

help
  Show this help message

clear
  Clear the output

${'─'.repeat(50)}
COMMON BUDGETS:
  800  - Pistol round
  2500 - Eco/save round
  3500 - Half buy
  5500 - Full buy
${'═'.repeat(50)}`;
}

// ==================== UI FUNCTIONS ====================

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const outputDiv = document.getElementById('output');
        const commandInput = document.getElementById('commandInput');

        function renderCommandEcho(command) {
            const echo = document.createElement('div');
            echo.className = 'command-echo';

            const prompt = document.createElement('span');
            prompt.className = 'prompt-char';
            prompt.textContent = '>';

            const text = document.createElement('span');
            text.className = 'command-text';
            text.textContent = command;

            echo.appendChild(prompt);
            echo.appendChild(text);
            outputDiv.appendChild(echo);
        }

        function renderResult(result) {
            if (result.type === 'clear') {
                outputDiv.innerHTML = '';
                renderWelcome();
                return;
            }

            let el;
            switch (result.type) {
                case 'loadout': el = buildLoadoutCard(result.data); break;
                case 'list':    el = buildAgentList(result.data);   break;
                case 'help':    el = buildHelpBlock(result.data);   break;
                case 'agents':  el = buildAgentsBlock(result.data); break;
                case 'error':   el = buildErrorBanner(result.data); break;
                default:        el = buildErrorBanner('Unknown response type.');
            }

            outputDiv.appendChild(el);
            requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
        }

        function buildLoadoutCard(loadout) {
            const card = document.createElement('div');
            card.className = `card loadout-card card--${loadout.role.toLowerCase()}`;

            const header = document.createElement('div');
            header.className = 'card__header';

            const agentName = document.createElement('span');
            agentName.className = 'card__agent';
            agentName.textContent = loadout.agent.toUpperCase();

            const roleBadge = document.createElement('span');
            roleBadge.className = `badge badge--${loadout.role.toLowerCase()}`;
            roleBadge.textContent = loadout.role;

            header.appendChild(agentName);
            header.appendChild(roleBadge);
            card.appendChild(header);

            const body = document.createElement('div');
            body.className = 'card__body';

            [
                { label: 'Primary',  value: loadout.primary.name,  cost: loadout.primary.cost },
                { label: 'Sidearm',  value: loadout.sidearm.name,  cost: loadout.sidearm.cost },
                { label: 'Shield',   value: loadout.shield.name,   cost: loadout.shield.cost },
            ].forEach(({ label, value, cost }) => {
                const row = document.createElement('div');
                row.className = 'card__row';

                const lbl = document.createElement('span');
                lbl.className = 'card__label';
                lbl.textContent = label;

                const val = document.createElement('span');
                val.className = 'card__value';
                val.textContent = value;

                const costEl = document.createElement('span');
                costEl.className = 'card__cost';
                costEl.textContent = cost > 0 ? `$${cost.toLocaleString()}` : 'Free';

                row.appendChild(lbl);
                row.appendChild(val);
                row.appendChild(costEl);
                body.appendChild(row);
            });

            const abilRow = document.createElement('div');
            abilRow.className = 'card__row';

            const abilLbl = document.createElement('span');
            abilLbl.className = 'card__label';
            abilLbl.textContent = 'Abilities';

            const abilVal = document.createElement('span');
            abilVal.className = 'card__value card__value--abilities';
            abilVal.textContent = loadout.abilities.length > 0
                ? loadout.abilities.join(' + ')
                : 'None';

            abilRow.appendChild(abilLbl);
            abilRow.appendChild(abilVal);
            body.appendChild(abilRow);
            card.appendChild(body);

            const footer = document.createElement('div');
            footer.className = 'card__footer';

            const totalLbl = document.createElement('span');
            totalLbl.className = 'card__label';
            totalLbl.textContent = 'Total Cost';

            const totalVal = document.createElement('span');
            totalVal.className = 'card__total';
            totalVal.textContent = `$${loadout.totalCost.toLocaleString()}`;

            footer.appendChild(totalLbl);
            footer.appendChild(totalVal);
            card.appendChild(footer);

            return card;
        }

        function buildAgentList(data) {
            const container = document.createElement('div');
            container.className = 'agent-list';

            const heading = document.createElement('div');
            heading.className = 'list-heading';
            heading.textContent = data.loadouts.length === 0
                ? `No agents affordable at $${data.budget.toLocaleString()}`
                : `${data.loadouts.length} agent${data.loadouts.length !== 1 ? 's' : ''} affordable at $${data.budget.toLocaleString()}`;
            container.appendChild(heading);

            if (data.loadouts.length === 0) return container;

            const grid = document.createElement('div');
            grid.className = 'agent-grid';

            data.loadouts.forEach(loadout => {
                const card = document.createElement('div');
                card.className = `agent-card agent-card--${loadout.role.toLowerCase()}`;

                const name = document.createElement('div');
                name.className = 'agent-card__name';
                name.textContent = loadout.agent.toUpperCase();

                const role = document.createElement('div');
                role.className = `badge badge--${loadout.role.toLowerCase()}`;
                role.textContent = loadout.role;

                const primary = document.createElement('div');
                primary.className = 'agent-card__primary';
                primary.textContent = loadout.primary.name;

                const cost = document.createElement('div');
                cost.className = 'agent-card__cost';
                cost.textContent = `$${loadout.totalCost.toLocaleString()}`;

                card.appendChild(name);
                card.appendChild(role);
                card.appendChild(primary);
                card.appendChild(cost);
                grid.appendChild(card);
            });

            container.appendChild(grid);
            return container;
        }

        function buildHelpBlock(text) {
            const block = document.createElement('div');
            block.className = 'help-block';
            const pre = document.createElement('pre');
            pre.className = 'help-text';
            pre.textContent = text;
            block.appendChild(pre);
            return block;
        }

        function buildAgentsBlock(roles) {
            const block = document.createElement('div');
            block.className = 'agents-block';

            const heading = document.createElement('div');
            heading.className = 'agents-heading';
            heading.textContent = `All Agents (${Object.keys(AGENTS).length})`;
            block.appendChild(heading);

            Object.keys(roles).forEach(role => {
                const section = document.createElement('div');
                section.className = `role-section role-section--${role.toLowerCase()}`;

                const roleHeading = document.createElement('div');
                roleHeading.className = 'role-heading';

                const badge = document.createElement('span');
                badge.className = `badge badge--${role.toLowerCase()}`;
                badge.textContent = role;

                const count = document.createElement('span');
                count.className = 'role-count';
                count.textContent = `(${roles[role].length})`;

                roleHeading.appendChild(badge);
                roleHeading.appendChild(count);
                section.appendChild(roleHeading);

                const agentList = document.createElement('div');
                agentList.className = 'role-agents';
                agentList.textContent = roles[role].join(', ');
                section.appendChild(agentList);

                block.appendChild(section);
            });

            return block;
        }

        function buildErrorBanner(message) {
            const banner = document.createElement('div');
            banner.className = 'error-banner';
            banner.setAttribute('role', 'alert');

            const icon = document.createElement('span');
            icon.className = 'error-icon';
            icon.textContent = '!';

            const text = document.createElement('span');
            text.className = 'error-text';
            text.textContent = message;

            banner.appendChild(icon);
            banner.appendChild(text);
            return banner;
        }

        function renderWelcome() {
            const welcome = document.createElement('div');
            welcome.className = 'welcome-block';

            const title = document.createElement('div');
            title.className = 'welcome-title';
            title.textContent = 'VALORANT LOADOUT RANDOMIZER v1.0';

            const hint = document.createElement('div');
            hint.className = 'welcome-hint';
            hint.textContent = 'Type "loadout" or press RANDOM · "agent:jett" for a specific agent · a number like "3500" for budget mode · "help" for all commands';

            welcome.appendChild(title);
            welcome.appendChild(hint);
            outputDiv.appendChild(welcome);
        }

        function submitCommand() {
            const command = String(commandInput.value).substring(0, 100);
            renderCommandEcho(command);
            const result = processCommand(command);
            renderResult(result);
            commandInput.value = '';
            commandInput.focus();
        }

        function randomLoadout() {
            commandInput.value = 'loadout';
            submitCommand();
        }

        function clearOutput() {
            renderResult({ type: 'clear' });
            commandInput.value = '';
            commandInput.focus();
        }

        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitCommand();
        });

        const randomBtn = document.getElementById('randomBtn');
        const clearBtn = document.getElementById('clearBtn');

        if (randomBtn) randomBtn.addEventListener('click', randomLoadout);
        if (clearBtn) clearBtn.addEventListener('click', clearOutput);

        renderWelcome();
        commandInput.focus();
    });
}

// ==================== EXPORTS FOR TESTING ====================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AGENTS,
        WEAPONS,
        SHIELDS,
        BUDGET_TIERS,
        MAX_ATTEMPTS,
        ABILITY_PROB,
        getBudgetTier,
        getWeightedPrimaryWeapon,
        getWeightedSidearm,
        getWeightedShield,
        getWeightedAbilities,
        optimizeLoadoutBudget,
        generateLoadout,
        generateBudgetLoadout,
        getAllAffordableAgents,
        processCommand,
        getAbilityCost,
        getAgentsByRole
    };
}
