const {
    getBudgetTier,
    getWeightedPrimaryWeapon,
    getWeightedSidearm,
    getWeightedShield,
    getWeightedAbilities,
    optimizeLoadoutBudget,
    generateBudgetLoadout,
    getAbilityCost,
    AGENTS,
    WEAPONS,
    SHIELDS
} = require('../v1/app.js');

describe('Smart Weighted Budget Allocation', () => {
    describe('Primary Weapon Validation', () => {
        test('should never return sidearms as primary weapons', () => {
            const sidearmNames = ['Classic', 'Shorty', 'Frenzy', 'Ghost', 'Sheriff'];
            const tiers = ['eco', 'half', 'full'];
            const budgets = [300, 800, 1500, 3000, 5500, 9000];

            // Test all combinations of budget and tier
            tiers.forEach(tier => {
                budgets.forEach(budget => {
                    for (let i = 0; i < 50; i++) {
                        const weapon = getWeightedPrimaryWeapon(budget, tier);

                        // Assert that the weapon is NOT a sidearm
                        expect(sidearmNames).not.toContain(weapon.name);
                    }
                });
            });
        });

        test('should never generate loadouts with sidearms as primary', () => {
            const sidearmNames = ['Classic', 'Shorty', 'Frenzy', 'Ghost', 'Sheriff'];
            const budgets = [300, 800, 1500, 3000, 5500];

            budgets.forEach(budget => {
                for (let i = 0; i < 20; i++) {
                    const loadout = generateBudgetLoadout('jett', budget);

                    if (loadout) {
                        // Assert primary is not a sidearm
                        expect(sidearmNames).not.toContain(loadout.primary.name);

                        // Assert sidearm IS actually a sidearm
                        expect(sidearmNames).toContain(loadout.sidearm.name);
                    }
                }
            });
        });
    });

    describe('Eco Tier (< $1500)', () => {
        test('should have no primary weapon at 300 credits', () => {
            const iterations = 100;
            const weapons = [];

            for (let i = 0; i < iterations; i++) {
                const weapon = getWeightedPrimaryWeapon(300, 'eco');
                weapons.push(weapon.name);
            }

            // Count occurrences
            const noneCount = weapons.filter(w => w === 'None').length;

            // At 300 credits, no primary weapons are affordable (cheapest is Bucky at 850)
            // So 100% should be "None"
            expect(noneCount).toBe(100);
        });

        test('should prefer Shorty or Classic sidearm at 300 credits', () => {
            const iterations = 100;
            const sidearms = [];

            for (let i = 0; i < iterations; i++) {
                const sidearm = getWeightedSidearm(300, 'eco');
                sidearms.push(sidearm.name);
            }

            const classicCount = sidearms.filter(s => s === 'Classic').length;
            const shortyCount = sidearms.filter(s => s === 'Shorty').length;

            // At 300 credits, only Classic and Shorty are affordable
            // Classic (50% weight) and Shorty (30% weight) should dominate
            expect(classicCount + shortyCount).toBe(100);
            expect(classicCount).toBeGreaterThan(40); // Classic weighted higher
        });

        test('should prefer Classic sidearm in eco', () => {
            const iterations = 100;
            const sidearms = [];

            for (let i = 0; i < iterations; i++) {
                const sidearm = getWeightedSidearm(800, 'eco');
                sidearms.push(sidearm.name);
            }

            const classicCount = sidearms.filter(s => s === 'Classic').length;

            // Classic should appear most frequently (50% weight)
            expect(classicCount).toBeGreaterThan(25);
        });

        test('should prefer no shield in eco', () => {
            const iterations = 100;
            const shields = [];

            for (let i = 0; i < iterations; i++) {
                const shield = getWeightedShield(1000, 'eco');
                shields.push(shield.name);
            }

            const noShieldCount = shields.filter(s => s === 'No Shield').length;

            // No Shield should appear most frequently (60% weight)
            expect(noShieldCount).toBeGreaterThan(40);
        });

        test('should generate valid eco loadouts at 800 credits', () => {
            const loadout = generateBudgetLoadout('jett', 800);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBeLessThanOrEqual(800);
        });

        test('should generate valid eco loadouts at 580 credits', () => {
            const loadout = generateBudgetLoadout('sage', 580);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBeLessThanOrEqual(580);
        });
    });

    describe('Half Buy Tier ($1500-$3499)', () => {
        test('should prefer SMGs and cheap rifles at 2500 credits', () => {
            const iterations = 100;
            const weapons = [];

            for (let i = 0; i < iterations; i++) {
                const weapon = getWeightedPrimaryWeapon(2500, 'half');
                weapons.push(weapon.name);
            }

            const smgCount = weapons.filter(w => ['Stinger', 'Spectre'].includes(w)).length;
            const cheapRifleCount = weapons.filter(w => ['Bulldog', 'Guardian'].includes(w)).length;

            // SMGs and cheap rifles should dominate half-buy (50% + 30% weights)
            expect(smgCount + cheapRifleCount).toBeGreaterThan(35);
        });

        test('should prefer light shield in half buy', () => {
            const iterations = 100;
            const shields = [];

            for (let i = 0; i < iterations; i++) {
                const shield = getWeightedShield(1000, 'half');
                shields.push(shield.name);
            }

            const lightShieldCount = shields.filter(s => s === 'Light Shield').length;

            // Light Shield should appear most frequently (50% weight)
            expect(lightShieldCount).toBeGreaterThan(30);
        });

        test('should generate valid half-buy loadouts at 3000 credits', () => {
            const loadout = generateBudgetLoadout('cypher', 3000);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBeLessThanOrEqual(3000);
        });
    });

    describe('Full Buy Tier ($3500+)', () => {
        test('should prefer expensive weapons at 5500 credits', () => {
            const iterations = 100;
            const weapons = [];

            for (let i = 0; i < iterations; i++) {
                const weapon = getWeightedPrimaryWeapon(5500, 'full');
                weapons.push(weapon.name);
            }

            const expensiveCount = weapons.filter(w =>
                ['Phantom', 'Vandal', 'Operator', 'Odin'].includes(w)
            ).length;

            // Expensive weapons should dominate full-buy (70% weight)
            expect(expensiveCount).toBeGreaterThan(50);
        });

        test('should prefer Ghost/Sheriff sidearms in full buy', () => {
            const iterations = 100;
            const sidearms = [];

            for (let i = 0; i < iterations; i++) {
                const sidearm = getWeightedSidearm(9000, 'full');
                sidearms.push(sidearm.name);
            }

            const goodSidearmCount = sidearms.filter(s =>
                ['Ghost', 'Sheriff'].includes(s)
            ).length;

            // Ghost/Sheriff should appear most frequently (60% weight)
            expect(goodSidearmCount).toBeGreaterThan(40);
        });

        test('should prefer heavy shield in full buy', () => {
            const iterations = 100;
            const shields = [];

            for (let i = 0; i < iterations; i++) {
                const shield = getWeightedShield(1000, 'full');
                shields.push(shield.name);
            }

            const heavyShieldCount = shields.filter(s => s === 'Heavy Shield').length;

            // Heavy Shield should appear most frequently (80% weight)
            expect(heavyShieldCount).toBeGreaterThan(60);
        });

        test('should generate valid full-buy loadouts at 5500 credits', () => {
            const loadout = generateBudgetLoadout('jett', 5500);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBeLessThanOrEqual(5500);

            // Full buy should typically have reasonably expensive loadouts
            // Due to randomness, threshold is lenient but ensures non-trivial spending
            expect(loadout.totalCost).toBeGreaterThan(1000);
        });
    });

    describe('Edge Cases', () => {
        test('should handle 0 credits', () => {
            const loadout = generateBudgetLoadout('sage', 0);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBe(0);
            expect(loadout.primary.name).toBe('None');
            expect(loadout.sidearm.name).toBe('Classic');
            expect(loadout.shield.name).toBe('No Shield');
        });

        test('should handle maximum credits (9000)', () => {
            const loadout = generateBudgetLoadout('raze', 9000);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBeLessThanOrEqual(9000);
        });

        test('should handle tight budget scenarios', () => {
            // With 300 credits, should be able to buy Shorty
            const loadout = generateBudgetLoadout('omen', 300);
            expect(loadout).toBeDefined();
            expect(loadout.totalCost).toBeLessThanOrEqual(300);
        });
    });

    describe('Budget Allocation Logic', () => {
        test('should allocate budget prioritizing weapons > shields > abilities', () => {
            // Run multiple iterations to verify prioritization
            const loadouts = [];
            for (let i = 0; i < 50; i++) {
                const loadout = generateBudgetLoadout('jett', 2000);
                if (loadout) loadouts.push(loadout);
            }

            expect(loadouts.length).toBeGreaterThan(0);

            // Count how many loadouts have weapons vs shields vs abilities
            const withWeapon = loadouts.filter(l => l.primary.cost > 0).length;
            const withShield = loadouts.filter(l => l.shield.cost > 0).length;

            // Most loadouts should prioritize weapons
            expect(withWeapon).toBeGreaterThan(loadouts.length * 0.5);
        });

        test('should generate diverse loadouts within same budget', () => {
            const loadouts = new Set();

            for (let i = 0; i < 50; i++) {
                const loadout = generateBudgetLoadout('sage', 3000);
                if (loadout) {
                    const key = `${loadout.primary.name}-${loadout.sidearm.name}-${loadout.shield.name}`;
                    loadouts.add(key);
                }
            }

            // Should generate at least 10 different combinations
            expect(loadouts.size).toBeGreaterThan(10);
        });
    });
});

// ==================== GETWEIGHTEDABILITIES ====================

describe('getWeightedAbilities', () => {
    test('should never exceed budget constraint', () => {
        const budgets = [0, 200, 500, 1000, 9000];
        const tiers = ['eco', 'half', 'full'];
        budgets.forEach(budget => {
            tiers.forEach(tier => {
                for (let i = 0; i < 30; i++) {
                    const result = getWeightedAbilities('sage', budget, tier);
                    expect(result.cost).toBeLessThanOrEqual(budget);
                }
            });
        });
    });

    test('should always return cost 0 when budget is 0', () => {
        const agents = ['jett', 'sage', 'omen', 'sova', 'chamber'];
        agents.forEach(agent => {
            for (let i = 0; i < 20; i++) {
                const result = getWeightedAbilities(agent, 0, 'eco');
                expect(result.cost).toBe(0);
            }
        });
    });

    test('should never contain duplicate abilities', () => {
        for (let i = 0; i < 100; i++) {
            const result = getWeightedAbilities('phoenix', 9000, 'full');
            const unique = new Set(result.abilities);
            expect(unique.size).toBe(result.abilities.length);
        }
    });

    test('should always return abilities sorted alphabetically', () => {
        for (let i = 0; i < 50; i++) {
            const result = getWeightedAbilities('sage', 9000, 'full');
            const sorted = [...result.abilities].sort();
            expect(result.abilities).toEqual(sorted);
        }
    });

    test('reported cost should exactly equal sum of individual ability costs', () => {
        const testCases = [
            { agent: 'sage', budget: 9000, tier: 'full' },
            { agent: 'jett', budget: 500, tier: 'half' },
            { agent: 'omen', budget: 9000, tier: 'eco' },
        ];
        testCases.forEach(({ agent, budget, tier }) => {
            for (let i = 0; i < 20; i++) {
                const result = getWeightedAbilities(agent, budget, tier);
                const manualCost = result.abilities.reduce((sum, ability) => {
                    return sum + getAbilityCost(agent, ability.toLowerCase());
                }, 0);
                expect(result.cost).toBe(manualCost);
            }
        });
    });

    test('should return { abilities: [], cost: 0 } for an invalid agent', () => {
        const result = getWeightedAbilities('invalid_agent_xyz', 9000, 'full');
        expect(result.abilities).toEqual([]);
        expect(result.cost).toBe(0);
    });

    test('abilities should only contain C, Q, or E entries', () => {
        for (let i = 0; i < 50; i++) {
            const result = getWeightedAbilities('sage', 9000, 'full');
            result.abilities.forEach(ability => {
                expect(['C', 'Q', 'E']).toContain(ability);
            });
        }
    });

    test('eco tier should select fewer abilities on average than full tier', () => {
        const iterations = 300;
        let ecoTotal = 0;
        let fullTotal = 0;
        for (let i = 0; i < iterations; i++) {
            ecoTotal += getWeightedAbilities('sage', 9000, 'eco').abilities.length;
            fullTotal += getWeightedAbilities('sage', 9000, 'full').abilities.length;
        }
        expect(ecoTotal).toBeLessThan(fullTotal);
    });

    test('abilities array should never exceed 3 entries', () => {
        for (let i = 0; i < 100; i++) {
            const result = getWeightedAbilities('sage', 9000, 'full');
            expect(result.abilities.length).toBeLessThanOrEqual(3);
        }
    });
});

// ==================== OPTIMIZELOADOUTBUDGET ====================

describe('optimizeLoadoutBudget', () => {
    const emptyLoadout = () => ({
        primary: { name: 'None', cost: 0 },
        sidearm: { name: 'Classic', cost: 0 },
        shield: { name: 'No Shield', cost: 0 },
        abilities: []
    });

    test('should return object with primary, sidearm, shield, abilities, remainingBudget', () => {
        const result = optimizeLoadoutBudget(emptyLoadout(), 0, 'jett', 'eco');
        expect(result).toHaveProperty('primary');
        expect(result).toHaveProperty('sidearm');
        expect(result).toHaveProperty('shield');
        expect(result).toHaveProperty('abilities');
        expect(result).toHaveProperty('remainingBudget');
    });

    test('should make no changes when remaining budget is 0', () => {
        const loadout = emptyLoadout();
        const result = optimizeLoadoutBudget(loadout, 0, 'jett', 'eco');
        expect(result.primary.name).toBe('None');
        expect(result.sidearm.name).toBe('Classic');
        expect(result.shield.name).toBe('No Shield');
        expect(result.abilities).toEqual([]);
        expect(result.remainingBudget).toBe(0);
    });

    test('should buy abilities before upgrading weapons', () => {
        // Jett C=200, Q=150, E=0(sig). Budget of 400 should buy abilities (C+Q=350)
        // rather than buying a Ghost sidearm (500 - too expensive anyway)
        const result = optimizeLoadoutBudget(emptyLoadout(), 400, 'jett', 'full');
        expect(result.abilities.length).toBeGreaterThan(0);
    });

    test('should upgrade sidearm when all affordable abilities are already purchased', () => {
        // All Jett abilities purchased; 800 left should upgrade sidearm to Sheriff (800)
        const loadout = { ...emptyLoadout(), abilities: ['C', 'E', 'Q'] };
        const result = optimizeLoadoutBudget(loadout, 800, 'jett', 'full');
        expect(result.sidearm.cost).toBeGreaterThan(0);
    });

    test('should upgrade shield when sidearm is already maxed', () => {
        // Sheriff already purchased, no abilities left, 1000 budget → Heavy Shield
        const loadout = {
            primary: { name: 'None', cost: 0 },
            sidearm: { name: 'Sheriff', cost: 800 },
            shield: { name: 'No Shield', cost: 0 },
            abilities: ['C', 'E', 'Q']
        };
        const result = optimizeLoadoutBudget(loadout, 1000, 'jett', 'full');
        expect(result.shield.cost).toBeGreaterThan(0);
    });

    test('remainingBudget should always be >= 0 regardless of starting budget', () => {
        const budgets = [0, 50, 200, 500, 1000, 5000, 9000];
        budgets.forEach(budget => {
            const result = optimizeLoadoutBudget(emptyLoadout(), budget, 'sage', 'full');
            expect(result.remainingBudget).toBeGreaterThanOrEqual(0);
        });
    });

    test('should never downgrade any item', () => {
        // Start with an already-maxed loadout at 0 remaining budget
        const maxedLoadout = {
            primary: { name: 'Vandal', cost: 2900 },
            sidearm: { name: 'Sheriff', cost: 800 },
            shield: { name: 'Heavy Shield', cost: 1000 },
            abilities: ['C', 'E', 'Q']
        };
        const result = optimizeLoadoutBudget(maxedLoadout, 0, 'sage', 'full');
        expect(result.primary.cost).toBeGreaterThanOrEqual(2900);
        expect(result.sidearm.cost).toBeGreaterThanOrEqual(800);
        expect(result.shield.cost).toBeGreaterThanOrEqual(1000);
    });

    test('upgraded items should always be affordable within given budget', () => {
        for (let i = 0; i < 20; i++) {
            const budget = Math.floor(Math.random() * 3000);
            const loadout = emptyLoadout();
            const result = optimizeLoadoutBudget(loadout, budget, 'omen', 'half');
            const spent = (result.primary.cost - loadout.primary.cost)
                + (result.sidearm.cost - loadout.sidearm.cost)
                + (result.shield.cost - loadout.shield.cost)
                + result.abilities.reduce((s, a) => s + getAbilityCost('omen', a.toLowerCase()), 0);
            expect(spent).toBeLessThanOrEqual(budget);
        }
    });

    test('should not add more than 3 abilities total', () => {
        const result = optimizeLoadoutBudget(emptyLoadout(), 9000, 'sage', 'full');
        expect(result.abilities.length).toBeLessThanOrEqual(3);
    });

    test('should not create duplicate abilities', () => {
        // Start with one ability already purchased
        const loadout = { ...emptyLoadout(), abilities: ['C'] };
        const result = optimizeLoadoutBudget(loadout, 9000, 'sage', 'full');
        const unique = new Set(result.abilities);
        expect(unique.size).toBe(result.abilities.length);
    });
});
