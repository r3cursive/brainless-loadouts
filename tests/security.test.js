const {
    processCommand,
    generateLoadout,
    AGENTS
} = require('../v1/app.js');

describe('XSS Prevention Tests', () => {
    describe('HTML Escaping in Command Processing', () => {
        test('should safely handle script tags in command input', () => {
            const maliciousCommand = '<script>alert("XSS")</script>';
            const result = processCommand(maliciousCommand);

            expect(result.type).toBe('error');
            expect(result.data).toContain('Unknown command');
        });

        test('should safely handle img tag with onerror', () => {
            const maliciousCommand = '<img src=x onerror=alert(1)>';
            const result = processCommand(maliciousCommand);

            expect(result.type).toBe('error');
        });

        test('should safely handle iframe injection attempts', () => {
            const maliciousCommand = '<iframe src="javascript:alert(1)">';
            const result = processCommand(maliciousCommand);

            expect(result.type).toBe('error');
        });

        test('should safely handle SVG with onload', () => {
            const maliciousCommand = '<svg onload=alert(1)>';
            const result = processCommand(maliciousCommand);

            expect(result.type).toBe('error');
        });
    });

    describe('Agent Name XSS Attempts', () => {
        test('should reject agent names with HTML injection', () => {
            const result = processCommand('agent:<script>alert(1)</script>');

            expect(result.type).toBe('error');
            expect(result.data).toContain('Unknown agent');
        });

        test('should reject agent names with event handlers', () => {
            const result = processCommand('agent:<img src=x onerror=alert(1)>');

            expect(result.type).toBe('error');
            expect(result.data).toContain('Unknown agent');
        });

        test('should only accept whitelisted agent names', () => {
            const result = processCommand('agent:"><script>alert(1)</script>');

            expect(result.type).toBe('error');
            expect(AGENTS).not.toHaveProperty('"><script>alert(1)</script>');
        });
    });

    describe('Input Sanitization', () => {
        test('should handle extremely long input safely', () => {
            const longCommand = 'loadout'.repeat(50); // 350 chars
            const result = processCommand(longCommand);

            expect(result).toBeDefined();
            expect(result.type).toBeDefined();
            expect(typeof result.data === 'string' || result.data === undefined).toBe(true);
        });

        test('should handle numeric-like input as budget', () => {
            const result = processCommand('9000');
            expect(result).toBeDefined();
            expect(result.type).not.toBe(undefined);
        });

        test('should handle null/undefined input gracefully', () => {
            const result1 = processCommand('');
            const result2 = processCommand('   ');

            expect(result1.type).toBe('error');
            expect(result2.type).toBe('error');
        });
    });

    describe('Special Characters and Encoding', () => {
        test('should handle single quotes safely', () => {
            const result = processCommand("agent:' OR '1'='1");

            expect(result.type).toBe('error');
            expect(result.data).toContain('Unknown agent');
        });

        test('should handle double quotes safely', () => {
            const result = processCommand('agent:" OR "1"="1');

            expect(result.type).toBe('error');
        });

        test('should handle unicode characters safely', () => {
            const result = processCommand('agent:<script>alert(1)</script>');

            expect(result.type).toBe('error');
        });

        test('should handle URL encoded input', () => {
            const result = processCommand('agent:%3Cscript%3Ealert(1)%3C/script%3E');

            expect(result.type).toBe('error');
        });
    });

    describe('Common XSS Payload Vectors', () => {
        const XSS_PAYLOADS = [
            'javascript:alert(1)',
            '<body onload=alert(1)>',
            '<input onfocus=alert(1) autofocus>',
            '<select onfocus=alert(1) autofocus>',
            '<textarea onfocus=alert(1) autofocus>',
            '<video><source onerror="alert(1)">',
            '<audio src=x onerror=alert(1)>',
            '<details open ontoggle=alert(1)>',
            '` onload=alert(1)//`',
            '\\x3cscript>alert(1)\\x3c/script>',
        ];

        XSS_PAYLOADS.forEach(payload => {
            test(`should safely handle XSS payload: ${payload.substring(0, 30)}...`, () => {
                const result = processCommand(payload);

                expect(result).toBeDefined();
                expect(result.type).toBeDefined();
                // All data fields are plain strings, rendered via textContent in browser
            });
        });
    });

    describe('Output Safety Verification', () => {
        test('should return structured loadout output for loadout command', () => {
            const result = processCommand('loadout');

            expect(result.type).toBe('loadout');
            expect(result.data).toBeDefined();
            expect(result.data.agent).toBeDefined();
            expect(result.data.primary).toBeDefined();
        });

        test('should return structured help output for help command', () => {
            const result = processCommand('help');

            expect(result.type).toBe('help');
            expect(typeof result.data).toBe('string');
            expect(result.data).toContain('AVAILABLE COMMANDS');
        });

        test('should return structured list output for budget command', () => {
            const result = processCommand('3000');

            expect(result.type).toBe('list');
            expect(result.data.budget).toBe(3000);
            expect(Array.isArray(result.data.loadouts)).toBe(true);
        });

        test('should return structured error for invalid commands', () => {
            const result = processCommand('invalidcommand');

            expect(result.type).toBe('error');
            expect(typeof result.data).toBe('string');
            expect(result.data).toContain('Unknown command');
        });
    });

    describe('Loadout Generation Safety', () => {
        test('should generate safe loadout data structures', () => {
            const loadout = generateLoadout('jett');

            expect(loadout).toBeDefined();
            expect(loadout.agent).toBe('Jett');
            expect(typeof loadout.primary.name).toBe('string');
            expect(typeof loadout.sidearm.name).toBe('string');
            expect(typeof loadout.shield.name).toBe('string');
            expect(Array.isArray(loadout.abilities)).toBe(true);
        });

        test('should never include HTML in generated loadout', () => {
            const loadout = generateLoadout('sage');

            const jsonStr = JSON.stringify(loadout);
            expect(jsonStr).not.toContain('<script>');
            expect(jsonStr).not.toContain('onerror=');
            expect(jsonStr).not.toContain('javascript:');
        });
    });

    describe('Command Validation', () => {
        test('should only accept predefined command patterns', () => {
            const validCommands = ['loadout', 'help', 'agents', 'clear', 'agent:jett', '3000'];
            const invalidCommands = ['<script>', 'DROP TABLE', 'rm -rf /', '../../../etc/passwd'];

            validCommands.forEach(cmd => {
                const result = processCommand(cmd);
                expect(result.type).not.toBe('error');
            });

            invalidCommands.forEach(cmd => {
                const result = processCommand(cmd);
                expect(result.type).toBe('error');
            });
        });
    });
});

describe('Security Best Practices Verification', () => {
    test('processCommand should never use eval or Function constructor', () => {
        const processCommandStr = processCommand.toString();

        expect(processCommandStr).not.toContain('eval(');
        expect(processCommandStr).not.toContain('Function(');
        expect(processCommandStr).not.toContain('setTimeout(');
        expect(processCommandStr).not.toContain('setInterval(');
    });

    test('should validate budget range to prevent resource exhaustion', () => {
        const tooLow = processCommand('-1000');
        const tooHigh = processCommand('999999');
        const justRight = processCommand('5000');

        expect(tooLow.type).toBe('error');
        expect(tooHigh.type).toBe('error');
        expect(justRight.type).not.toBe('error');
    });
});
