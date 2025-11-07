const {
    getBudgetTier,
    getWeightedPrimaryWeapon,
    getWeightedSidearm,
    getWeightedShield,
    generateBudgetLoadout
} = require('../v1/app.js');

describe('Smart Weighted Budget Allocation', () => {
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
            expect(classicCount).toBeGreaterThan(30);
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

            // Full buy should typically have reasonably expensive weapons (or heavy shields)
            // Due to randomness, we'll check total cost is reasonable rather than just weapon
            expect(loadout.totalCost).toBeGreaterThan(2000);
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
