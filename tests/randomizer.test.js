const {
    AGENTS,
    WEAPONS,
    SHIELDS,
    getBudgetTier,
    generateLoadout,
    generateBudgetLoadout,
    getAllAffordableAgents,
    processCommand,
    getAbilityCost
} = require('../v1/app.js');

describe('Randomizer Core Functions', () => {
    describe('getBudgetTier', () => {
        test('should return eco for budgets under 1500', () => {
            expect(getBudgetTier(0)).toBe('eco');
            expect(getBudgetTier(800)).toBe('eco');
            expect(getBudgetTier(1499)).toBe('eco');
        });

        test('should return half for budgets 1500-3499', () => {
            expect(getBudgetTier(1500)).toBe('half');
            expect(getBudgetTier(2500)).toBe('half');
            expect(getBudgetTier(3499)).toBe('half');
        });

        test('should return full for budgets 3500+', () => {
            expect(getBudgetTier(3500)).toBe('full');
            expect(getBudgetTier(5500)).toBe('full');
            expect(getBudgetTier(9000)).toBe('full');
        });
    });

    describe('getAbilityCost', () => {
        test('should return correct cost for paid abilities', () => {
            expect(getAbilityCost('jett', 'c')).toBe(200);
            expect(getAbilityCost('sage', 'q')).toBe(200);
        });

        test('should return 0 for signature abilities', () => {
            expect(getAbilityCost('jett', 'e')).toBe(0);
            expect(getAbilityCost('sage', 'e')).toBe(0);
        });

        test('should return 0 for invalid agents', () => {
            expect(getAbilityCost('invalid', 'c')).toBe(0);
        });
    });

    describe('generateLoadout', () => {
        test('should generate a valid loadout without budget', () => {
            const loadout = generateLoadout();
            expect(loadout).toBeDefined();
            expect(loadout).toHaveProperty('agent');
            expect(loadout).toHaveProperty('primary');
            expect(loadout).toHaveProperty('sidearm');
            expect(loadout).toHaveProperty('shield');
            expect(loadout).toHaveProperty('abilities');
            expect(loadout).toHaveProperty('totalCost');
        });

        test('should generate loadout for specific agent', () => {
            const loadout = generateLoadout('jett');
            expect(loadout.agent).toBe('Jett');
            expect(loadout.role).toBe('Duelist');
        });

        test('should return null for invalid agent', () => {
            const loadout = generateLoadout('invalid');
            expect(loadout).toBeNull();
        });

        test('should generate budget-constrained loadout', () => {
            const loadout = generateLoadout('sage', 3000);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBeLessThanOrEqual(3000);
        });
    });

    describe('generateBudgetLoadout', () => {
        test('should generate loadout within budget', () => {
            const loadout = generateBudgetLoadout('jett', 5000);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBeLessThanOrEqual(5000);
        });

        test('should handle low budget scenarios', () => {
            const loadout = generateBudgetLoadout('sage', 500);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBeLessThanOrEqual(500);
        });

        test('should return null for impossible budgets', () => {
            // Try 100 times, should still be able to generate with 0 budget (all free items)
            const loadout = generateBudgetLoadout('jett', 0);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBe(0);
        });
    });

    describe('getAllAffordableAgents', () => {
        test('should return array of loadouts', () => {
            const affordable = getAllAffordableAgents(3000);
            expect(Array.isArray(affordable)).toBe(true);
            expect(affordable.length).toBeGreaterThan(0);
        });

        test('should return only affordable agents', () => {
            const affordable = getAllAffordableAgents(1000);
            affordable.forEach(loadout => {
                expect(loadout.totalCost).toBeLessThanOrEqual(1000);
            });
        });

        test('should sort alphabetically by agent name', () => {
            const affordable = getAllAffordableAgents(5000);
            for (let i = 0; i < affordable.length - 1; i++) {
                expect(affordable[i].agent.localeCompare(affordable[i + 1].agent)).toBeLessThanOrEqual(0);
            }
        });
    });

    describe('processCommand', () => {
        test('should handle loadout command', () => {
            const result = processCommand('loadout');
            expect(result.type).toBe('loadout');
            expect(result.data.agent).toBeDefined();
            expect(result.data.primary).toBeDefined();
        });

        test('should handle agent command', () => {
            const result = processCommand('agent:jett');
            expect(result.type).toBe('loadout');
            expect(result.data.agent).toBe('Jett');
            expect(result.data.role).toBe('Duelist');
        });

        test('should handle budget command', () => {
            const result = processCommand('3000');
            expect(result.type).toBe('list');
            expect(result.data.budget).toBe(3000);
            expect(Array.isArray(result.data.loadouts)).toBe(true);
        });

        test('should handle help command', () => {
            const result = processCommand('help');
            expect(result.type).toBe('help');
            expect(result.data).toContain('AVAILABLE COMMANDS');
        });

        test('should handle agents command', () => {
            const result = processCommand('agents');
            expect(result.type).toBe('agents');
            expect(result.data).toBeDefined();
            expect(result.data.Controller).toBeDefined();
        });

        test('should handle invalid commands', () => {
            const result = processCommand('invalid');
            expect(result.type).toBe('error');
        });

        test('should handle empty commands', () => {
            const result = processCommand('');
            expect(result.type).toBe('error');
        });

        test('should handle invalid budget range', () => {
            const result1 = processCommand('-100');
            const result2 = processCommand('10000');
            expect(result1.type).toBe('error');
            expect(result2.type).toBe('error');
        });
    });
});
