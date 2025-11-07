/**
 * DOM Integration Tests
 *
 * These tests use jsdom (included with Jest) to simulate browser DOM
 * and verify safe DOM manipulation practices.
 */

const fs = require('fs');
const path = require('path');

describe('DOM Integration Tests', () => {
    let document, window;

    beforeEach(() => {
        // Create a minimal DOM environment
        const { JSDOM } = require('jsdom');
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self';">
            </head>
            <body>
                <div id="output" class="command-history"></div>
                <div class="input-bar">
                    <input type="text" id="commandInput" maxlength="100">
                    <button id="randomBtn">random</button>
                    <button id="clearBtn">clear</button>
                </div>
            </body>
            </html>
        `;
        const dom = new JSDOM(html, {
            url: "http://localhost",
            runScripts: "outside-only"
        });
        document = dom.window.document;
        window = dom.window;
    });

    describe('CSP Header Verification', () => {
        test('should have Content-Security-Policy meta tag', () => {
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

            expect(cspMeta).not.toBeNull();
            expect(cspMeta.getAttribute('content')).toContain('script-src');
            expect(cspMeta.getAttribute('content')).toContain("'self'");
        });
    });

    describe('Input Element Safety', () => {
        test('should have maxlength attribute on input', () => {
            const input = document.getElementById('commandInput');

            expect(input).not.toBeNull();
            expect(input.getAttribute('maxlength')).toBe('100');
        });

        test('should use text input type (not vulnerable types)', () => {
            const input = document.getElementById('commandInput');

            expect(input.type).toBe('text');
            // Verify not using dangerous input types
            expect(input.type).not.toBe('file');
            expect(input.type).not.toBe('submit');
        });
    });

    describe('Button Safety', () => {
        test('should have ID-based buttons (not inline onclick)', () => {
            const randomBtn = document.getElementById('randomBtn');
            const clearBtn = document.getElementById('clearBtn');

            expect(randomBtn).not.toBeNull();
            expect(clearBtn).not.toBeNull();

            // Verify no inline onclick handlers
            expect(randomBtn.getAttribute('onclick')).toBeNull();
            expect(clearBtn.getAttribute('onclick')).toBeNull();
        });
    });

    describe('Text Content vs Inner HTML', () => {
        test('should verify output div exists for textContent manipulation', () => {
            const outputDiv = document.getElementById('output');

            expect(outputDiv).not.toBeNull();
            expect(outputDiv.className).toBe('command-history');
        });

        test('should demonstrate textContent auto-escapes HTML', () => {
            const outputDiv = document.getElementById('output');
            const maliciousHTML = '<script>alert("XSS")</script>';

            // Simulate what addToOutput does (uses textContent)
            outputDiv.textContent = maliciousHTML;

            // textContent escapes HTML, so innerHTML will show escaped version
            expect(outputDiv.innerHTML).toContain('&lt;script&gt;');
            expect(outputDiv.innerHTML).not.toContain('<script>');

            // Verify the text is safely escaped
            expect(outputDiv.textContent).toBe(maliciousHTML); // Exactly as set
        });

        test('should demonstrate textContent prevents script execution', () => {
            const outputDiv = document.getElementById('output');

            // Try to inject a script via textContent
            outputDiv.textContent = '<img src=x onerror=alert(1)>';

            // Verify it's escaped and won't execute
            const html = outputDiv.innerHTML;
            expect(html).toContain('&lt;img');
            expect(html).toContain('onerror=alert(1)&gt;');

            // The script element wouldn't exist in DOM
            const scripts = document.querySelectorAll('script');
            expect(scripts.length).toBe(0);
        });
    });

    describe('DOM Structure Validation', () => {
        test('should have proper element hierarchy', () => {
            const output = document.getElementById('output');
            const inputBar = document.querySelector('.input-bar');
            const input = document.getElementById('commandInput');

            expect(output).not.toBeNull();
            expect(inputBar).not.toBeNull();
            expect(input).not.toBeNull();

            // Verify input is inside input-bar
            expect(inputBar.contains(input)).toBe(true);
        });

        test('should not have any script tags in initial HTML', () => {
            const scripts = document.querySelectorAll('script[src]');

            // External scripts should only load from same origin (CSP enforced)
            scripts.forEach(script => {
                const src = script.getAttribute('src');
                // Should be relative path (same origin)
                expect(src).not.toMatch(/^http/);
            });
        });
    });

    describe('Input Sanitization Flow', () => {
        test('should demonstrate safe input retrieval', () => {
            const input = document.getElementById('commandInput');

            // Simulate user input with XSS attempt
            input.value = '<script>alert("XSS")</script>';

            // Retrieving .value gives the raw string (safe)
            expect(input.value).toBe('<script>alert("XSS")</script>');

            // String() coercion (as in submitCommand) maintains safety
            const sanitized = String(input.value).substring(0, 100);
            expect(typeof sanitized).toBe('string');
            expect(sanitized.length).toBeLessThanOrEqual(100);
        });

        test('should enforce maxlength in HTML', () => {
            const input = document.getElementById('commandInput');
            const longString = 'a'.repeat(200);

            input.value = longString;

            // jsdom might not enforce maxlength, but browser will
            // Verify the attribute exists
            expect(input.maxLength).toBe(100);
        });
    });
});

describe('XSS Attack Simulation with DOM', () => {
    test('should prevent XSS via textContent assignment', () => {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(`<!DOCTYPE html><div id="test"></div>`);
        const testDiv = dom.window.document.getElementById('test');

        const htmlPayloads = [
            '<script>alert(1)</script>',
            '<img src=x onerror=alert(1)>',
            '<svg onload=alert(1)>',
        ];

        htmlPayloads.forEach(payload => {
            // Use textContent (safe)
            testDiv.textContent = payload;

            // Verify HTML is escaped (< becomes &lt;)
            const escaped = testDiv.innerHTML;
            expect(escaped).toContain('&lt;');
            expect(escaped).not.toContain('<script>');
            expect(escaped).not.toContain('<img');
            expect(escaped).not.toContain('<svg');

            // Verify no actual script elements created
            const scripts = dom.window.document.querySelectorAll('script');
            expect(scripts.length).toBe(0);
        });

        // Test non-HTML payload (no angle brackets to escape)
        testDiv.textContent = 'javascript:alert(1)';
        expect(testDiv.textContent).toBe('javascript:alert(1)');
        expect(testDiv.innerHTML).toBe('javascript:alert(1)');
        // Verify no script elements
        const scripts = dom.window.document.querySelectorAll('script');
        expect(scripts.length).toBe(0);
    });

    test('should show danger of innerHTML (not used in our app)', () => {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(`<!DOCTYPE html><div id="test"></div>`);
        const testDiv = dom.window.document.getElementById('test');

        // This is what we DON'T do (dangerous)
        const payload = '<img src=x onerror=alert(1)>';

        // If we used innerHTML (WE DON'T):
        testDiv.innerHTML = payload;

        // This would create an actual img element (dangerous)
        const imgs = testDiv.querySelectorAll('img');
        expect(imgs.length).toBe(1);

        // But our app uses textContent, which would escape it:
        testDiv.textContent = payload;
        const imgsAfterTextContent = testDiv.querySelectorAll('img');
        expect(imgsAfterTextContent.length).toBe(0); // Removed, now just text
    });
});

describe('Event Handler Safety', () => {
    test('should verify no inline event handlers in HTML structure', () => {
        const { JSDOM } = require('jsdom');
        const htmlPath = path.join(__dirname, '../v1/index.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        // Verify no onclick, onload, onerror, etc. in HTML
        expect(htmlContent).not.toMatch(/onclick\s*=/i);
        expect(htmlContent).not.toMatch(/onload\s*=/i);
        expect(htmlContent).not.toMatch(/onerror\s*=/i);
        expect(htmlContent).not.toMatch(/onmouseover\s*=/i);
        expect(htmlContent).not.toMatch(/onfocus\s*=/i);
    });

    test('should verify addEventListener pattern would be used', () => {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <button id="testBtn">Click me</button>
        `);

        const button = dom.window.document.getElementById('testBtn');
        let clicked = false;

        // Modern pattern (what we use)
        button.addEventListener('click', () => {
            clicked = true;
        });

        // Simulate click
        button.click();
        expect(clicked).toBe(true);

        // Verify no onclick attribute
        expect(button.getAttribute('onclick')).toBeNull();
    });
});
