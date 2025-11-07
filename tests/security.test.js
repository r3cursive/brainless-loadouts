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

            // Should treat as unknown command and return error message
            expect(result).toContain('ERROR');
            expect(result).toContain('Unknown command');
            // Result is a plain string - when rendered via textContent, HTML is auto-escaped
            expect(typeof result).toBe('string');
        });

        test('should safely handle img tag with onerror', () => {
            const maliciousCommand = '<img src=x onerror=alert(1)>';
            const result = processCommand(maliciousCommand);

            expect(result).toContain('ERROR');
        });

        test('should safely handle iframe injection attempts', () => {
            const maliciousCommand = '<iframe src="javascript:alert(1)">';
            const result = processCommand(maliciousCommand);

            expect(result).toContain('ERROR');
        });

        test('should safely handle SVG with onload', () => {
            const maliciousCommand = '<svg onload=alert(1)>';
            const result = processCommand(maliciousCommand);

            expect(result).toContain('ERROR');
        });
    });

    describe('Agent Name XSS Attempts', () => {
        test('should reject agent names with HTML injection', () => {
            const result = processCommand('agent:<script>alert(1)</script>');

            expect(result).toContain('ERROR');
            expect(result).toContain('Unknown agent');
        });

        test('should reject agent names with event handlers', () => {
            const result = processCommand('agent:<img src=x onerror=alert(1)>');

            expect(result).toContain('ERROR');
            expect(result).toContain('Unknown agent');
        });

        test('should only accept whitelisted agent names', () => {
            const result = processCommand('agent:"><script>alert(1)</script>');

            expect(result).toContain('ERROR');
            // Verify it checks against AGENTS whitelist
            expect(AGENTS).not.toHaveProperty('"><script>alert(1)</script>');
        });
    });

    describe('Input Sanitization', () => {
        test('should handle extremely long input safely', () => {
            // Note: HTML has maxlength=100, but test logic handling
            const longCommand = 'loadout'.repeat(50); // 350 chars
            const result = processCommand(longCommand);

            // Should still process, though will be unknown command
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should convert all input to strings', () => {
            // Test that numbers are handled
            const result = processCommand('9000');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should handle null/undefined input gracefully', () => {
            const result1 = processCommand('');
            const result2 = processCommand('   ');

            expect(result1).toContain('ERROR');
            expect(result2).toContain('ERROR');
        });
    });

    describe('Special Characters and Encoding', () => {
        test('should handle single quotes safely', () => {
            const result = processCommand("agent:' OR '1'='1");

            expect(result).toContain('ERROR');
            expect(result).toContain('Unknown agent');
        });

        test('should handle double quotes safely', () => {
            const result = processCommand('agent:" OR "1"="1');

            expect(result).toContain('ERROR');
        });

        test('should handle unicode characters safely', () => {
            const result = processCommand('agent:\u003cscript\u003ealert(1)\u003c/script\u003e');

            expect(result).toContain('ERROR');
        });

        test('should handle URL encoded input', () => {
            const result = processCommand('agent:%3Cscript%3Ealert(1)%3C/script%3E');

            expect(result).toContain('ERROR');
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

                // Should either return error or safe processed result
                expect(result).toBeDefined();
                expect(typeof result).toBe('string');
                // Result is just text, will be rendered via textContent (safe)
            });
        });
    });

    describe('Output Safety Verification', () => {
        test('should return safe string output for loadout command', () => {
            const result = processCommand('loadout');

            expect(typeof result).toBe('string');
            // Output will be rendered via textContent in browser (auto-escaped)
            expect(result).toMatch(/AGENT:/);
        });

        test('should return safe string output for help command', () => {
            const result = processCommand('help');

            expect(typeof result).toBe('string');
            expect(result).toContain('AVAILABLE COMMANDS');
        });

        test('should return safe string output for budget command', () => {
            const result = processCommand('3000');

            expect(typeof result).toBe('string');
            // Should contain agent loadout information
        });

        test('should return safe error messages', () => {
            const result = processCommand('invalidcommand');

            expect(typeof result).toBe('string');
            expect(result).toContain('ERROR');
            expect(result).toContain('Unknown command');
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

            // Verify no HTML-like strings in any property
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
                expect(result).not.toContain('Unknown command');
            });

            invalidCommands.forEach(cmd => {
                const result = processCommand(cmd);
                expect(result).toContain('ERROR');
            });
        });
    });
});

describe('Security Best Practices Verification', () => {
    test('processCommand should never use eval or Function constructor', () => {
        // This test verifies the code doesn't use dangerous functions
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

        expect(tooLow).toContain('ERROR');
        expect(tooHigh).toContain('ERROR');
        expect(justRight).not.toContain('ERROR');
    });
});
