const {
    AGENTS,
    BUDGET_TIERS,
    MAX_ATTEMPTS,
    ABILITY_PROB,
    processCommand,
    getAgentsByRole,
    getAbilityCost
} = require('../v1/app.js');

// ==================== EXPORTED CONSTANTS ====================

describe('Exported Constants', () => {
    test('BUDGET_TIERS should be exported with ECO_MAX and HALF_MAX', () => {
        expect(BUDGET_TIERS).toBeDefined();
        expect(BUDGET_TIERS.ECO_MAX).toBe(1500);
        expect(BUDGET_TIERS.HALF_MAX).toBe(3500);
    });

    test('MAX_ATTEMPTS should be exported', () => {
        expect(MAX_ATTEMPTS).toBeDefined();
        expect(MAX_ATTEMPTS).toBe(100);
    });

    test('ABILITY_PROB should be exported with eco, half, full probabilities', () => {
        expect(ABILITY_PROB).toBeDefined();
        expect(ABILITY_PROB.eco).toBe(0.3);
        expect(ABILITY_PROB.half).toBe(0.6);
        expect(ABILITY_PROB.full).toBe(0.8);
    });

    test('BUDGET_TIERS thresholds should align with getBudgetTier boundaries', () => {
        // ECO_MAX is the upper boundary of eco (exclusive)
        expect(BUDGET_TIERS.ECO_MAX).toBeGreaterThan(0);
        // HALF_MAX is the upper boundary of half (exclusive)
        expect(BUDGET_TIERS.HALF_MAX).toBeGreaterThan(BUDGET_TIERS.ECO_MAX);
    });
});

// ==================== AGENT DATA INTEGRITY ====================

describe('Agent Data Integrity', () => {
    test('total agent count should be 27', () => {
        expect(Object.keys(AGENTS).length).toBe(27);
    });

    test('every agent should have c, q, e, role, and signature fields', () => {
        Object.entries(AGENTS).forEach(([name, agent]) => {
            expect(agent).toHaveProperty('c');
            expect(agent).toHaveProperty('q');
            expect(agent).toHaveProperty('e');
            expect(agent).toHaveProperty('role');
            expect(agent).toHaveProperty('signature');
        });
    });

    test('every agent signature field should be one of c, q, or e', () => {
        Object.entries(AGENTS).forEach(([name, agent]) => {
            expect(['c', 'q', 'e']).toContain(agent.signature);
        });
    });

    test('all agent ability costs should be non-negative integers', () => {
        Object.entries(AGENTS).forEach(([name, agent]) => {
            ['c', 'q', 'e'].forEach(ability => {
                expect(agent[ability]).toBeGreaterThanOrEqual(0);
                expect(Number.isInteger(agent[ability])).toBe(true);
            });
        });
    });

    test('every agent signature ability should have cost 0 in AGENTS data', () => {
        // Signature abilities are free in VALORANT - the data should reflect this.
        // If this test fails, the AGENTS object has inconsistent data for:
        // clove (e), iso (e), skye (e), tejo (e), chamber (q), deadlock (e)
        Object.entries(AGENTS).forEach(([name, agent]) => {
            const sig = agent.signature;
            expect(agent[sig]).toBe(0);
        });
    });

    test('getAbilityCost should always return 0 for signature abilities', () => {
        Object.entries(AGENTS).forEach(([name, agent]) => {
            const cost = getAbilityCost(name, agent.signature);
            expect(cost).toBe(0);
        });
    });

    test('all agents should belong to one of the four valid roles', () => {
        const validRoles = ['Controller', 'Duelist', 'Initiator', 'Sentinel'];
        Object.entries(AGENTS).forEach(([name, agent]) => {
            expect(validRoles).toContain(agent.role);
        });
    });
});

// ==================== PROCESSCOMMAND STRUCTURED RETURN CONSISTENCY ====================

describe('processCommand return type consistency', () => {
    const commandsWithData = [
        'loadout', 'help', 'agents', '3000', 'agent:jett', 'invalid'
    ];

    commandsWithData.forEach(cmd => {
        test(`processCommand('${cmd}') should return { type, data } shape`, () => {
            const result = processCommand(cmd);
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('data');
        });
    });

    test("processCommand('clear') should return { type: 'clear', data: null }", () => {
        const result = processCommand('clear');
        expect(result.type).toBe('clear');
        expect(result).toHaveProperty('data');
        expect(result.data).toBeNull();
    });

    test('all error responses should have a non-empty string in data', () => {
        const errorTriggers = ['invalid', '', '  ', '-1', '10000', 'agent:', 'agent:unknown'];
        errorTriggers.forEach(cmd => {
            const result = processCommand(cmd);
            expect(result.type).toBe('error');
            expect(typeof result.data).toBe('string');
            expect(result.data.length).toBeGreaterThan(0);
        });
    });

    test('loadout response data should be a valid loadout object', () => {
        const result = processCommand('loadout');
        expect(result.type).toBe('loadout');
        expect(result.data).toHaveProperty('agent');
        expect(result.data).toHaveProperty('role');
        expect(result.data).toHaveProperty('primary');
        expect(result.data).toHaveProperty('sidearm');
        expect(result.data).toHaveProperty('shield');
        expect(result.data).toHaveProperty('abilities');
        expect(result.data).toHaveProperty('totalCost');
    });

    test('list response data should contain budget and loadouts array', () => {
        const result = processCommand('3000');
        expect(result.type).toBe('list');
        expect(result.data).toHaveProperty('budget', 3000);
        expect(Array.isArray(result.data.loadouts)).toBe(true);
    });

    test('help response data should be a string with command documentation', () => {
        const result = processCommand('help');
        expect(result.type).toBe('help');
        expect(typeof result.data).toBe('string');
        expect(result.data).toContain('AVAILABLE COMMANDS');
    });

    test('agents response data should be an object with role arrays', () => {
        const result = processCommand('agents');
        expect(result.type).toBe('agents');
        expect(typeof result.data).toBe('object');
        expect(Array.isArray(result.data.Controller)).toBe(true);
        expect(Array.isArray(result.data.Duelist)).toBe(true);
    });
});

// ==================== GETAGENTSBYROLE ====================

describe('getAgentsByRole', () => {
    let roles;

    beforeAll(() => {
        roles = getAgentsByRole();
    });

    test('should return exactly the four valid roles', () => {
        const keys = Object.keys(roles);
        expect(keys).toContain('Controller');
        expect(keys).toContain('Duelist');
        expect(keys).toContain('Initiator');
        expect(keys).toContain('Sentinel');
        expect(keys.length).toBe(4);
    });

    test('should have correct agent count per role', () => {
        expect(roles.Controller.length).toBe(6);
        expect(roles.Duelist.length).toBe(7);
        expect(roles.Initiator.length).toBe(7);
        expect(roles.Sentinel.length).toBe(7);
    });

    test('total agents across all roles should equal AGENTS count', () => {
        const total = Object.values(roles).reduce((sum, arr) => sum + arr.length, 0);
        expect(total).toBe(Object.keys(AGENTS).length);
    });

    test('all agent names should start with an uppercase letter', () => {
        Object.values(roles).flat().forEach(name => {
            expect(name[0]).toBe(name[0].toUpperCase());
        });
    });

    test('all agent names should be unique across all roles', () => {
        const allNames = Object.values(roles).flat();
        expect(new Set(allNames).size).toBe(allNames.length);
    });

    test('known agents should be in correct roles', () => {
        expect(roles.Duelist).toContain('Jett');
        expect(roles.Sentinel).toContain('Sage');
        expect(roles.Controller).toContain('Omen');
        expect(roles.Initiator).toContain('Sova');
    });
});
