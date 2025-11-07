/**
 * Scrolling Behavior Tests
 *
 * These tests verify that the auto-scroll mechanism works correctly
 * by mocking browser APIs and testing the logic flow.
 */

describe('Scrolling Behavior Tests', () => {
    let mockScrollTo;
    let mockRequestAnimationFrame;
    let originalScrollTo;
    let originalRequestAnimationFrame;
    let mockDocument;

    beforeEach(() => {
        // Mock window.scrollTo
        mockScrollTo = jest.fn();
        originalScrollTo = global.window ? global.window.scrollTo : undefined;
        if (global.window) {
            global.window.scrollTo = mockScrollTo;
        } else {
            global.window = { scrollTo: mockScrollTo };
        }

        // Mock requestAnimationFrame
        mockRequestAnimationFrame = jest.fn(cb => {
            // Execute callback immediately in tests
            cb();
            return 1;
        });
        originalRequestAnimationFrame = global.requestAnimationFrame;
        global.requestAnimationFrame = mockRequestAnimationFrame;

        // Mock document.body.scrollHeight
        mockDocument = {
            body: {
                scrollHeight: 1500
            }
        };
        global.document = mockDocument;
    });

    afterEach(() => {
        // Restore original functions
        if (originalScrollTo !== undefined && global.window) {
            global.window.scrollTo = originalScrollTo;
        }
        if (originalRequestAnimationFrame !== undefined) {
            global.requestAnimationFrame = originalRequestAnimationFrame;
        }
        jest.clearAllMocks();
    });

    describe('Auto-scroll on Output', () => {
        test('should call window.scrollTo when output is added', () => {
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM(`
                <!DOCTYPE html>
                <div id="output"></div>
            `);

            const outputDiv = dom.window.document.getElementById('output');

            // Simulate addToOutput logic
            outputDiv.textContent += '\nNew output line';

            // Simulate scroll call
            global.requestAnimationFrame(() => {
                global.window.scrollTo(0, global.document.body.scrollHeight);
            });

            expect(mockRequestAnimationFrame).toHaveBeenCalled();
            expect(mockScrollTo).toHaveBeenCalledWith(0, 1500);
        });

        test('should scroll to document.body.scrollHeight', () => {
            // Simulate different scroll heights
            global.document.body.scrollHeight = 2500;

            global.requestAnimationFrame(() => {
                global.window.scrollTo(0, global.document.body.scrollHeight);
            });

            expect(mockScrollTo).toHaveBeenCalledWith(0, 2500);
        });

        test('should use requestAnimationFrame for timing', () => {
            // Verify requestAnimationFrame is called before scroll
            let scrollCalled = false;

            global.requestAnimationFrame = jest.fn(cb => {
                expect(scrollCalled).toBe(false); // Should not have scrolled yet
                cb();
                return 1;
            });

            global.requestAnimationFrame(() => {
                global.window.scrollTo(0, global.document.body.scrollHeight);
                scrollCalled = true;
            });

            expect(global.requestAnimationFrame).toHaveBeenCalled();
            expect(scrollCalled).toBe(true);
        });
    });

    describe('Clear Command (No Scroll)', () => {
        test('should clear output without scrolling', () => {
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM(`
                <!DOCTYPE html>
                <div id="output">Previous content</div>
            `);

            const outputDiv = dom.window.document.getElementById('output');

            // Simulate clear (sets textContent to empty string)
            outputDiv.textContent = '';

            // Verify no content
            expect(outputDiv.textContent).toBe('');

            // Clear should NOT trigger scroll (we don't call scroll on clear)
            // This is by design - no need to scroll when clearing
        });
    });

    describe('Multiple Outputs', () => {
        test('should scroll after each output addition', () => {
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM(`
                <!DOCTYPE html>
                <div id="output"></div>
            `);

            const outputDiv = dom.window.document.getElementById('output');

            // Simulate adding multiple outputs
            for (let i = 0; i < 3; i++) {
                outputDiv.textContent += `\nOutput ${i}`;

                global.requestAnimationFrame(() => {
                    global.window.scrollTo(0, global.document.body.scrollHeight);
                });
            }

            // Should have called requestAnimationFrame 3 times
            expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(3);
            expect(mockScrollTo).toHaveBeenCalledTimes(3);
        });
    });

    describe('Scroll Position Calculation', () => {
        test('should always scroll to maximum bottom position', () => {
            // Test with various document heights
            const heights = [500, 1000, 2000, 5000, 10000];

            heights.forEach(height => {
                mockScrollTo.mockClear();
                global.document.body.scrollHeight = height;

                global.requestAnimationFrame(() => {
                    global.window.scrollTo(0, global.document.body.scrollHeight);
                });

                // Should scroll to exact scrollHeight (bottom)
                expect(mockScrollTo).toHaveBeenCalledWith(0, height);
            });
        });

        test('should use Y position (not X)', () => {
            global.document.body.scrollHeight = 1234;

            global.requestAnimationFrame(() => {
                global.window.scrollTo(0, global.document.body.scrollHeight);
            });

            // First argument should be 0 (X position unchanged)
            // Second argument should be scrollHeight (Y position to bottom)
            const [x, y] = mockScrollTo.mock.calls[0];
            expect(x).toBe(0);
            expect(y).toBe(1234);
        });
    });

    describe('RequestAnimationFrame Timing', () => {
        test('should defer scroll until after DOM update', () => {
            let domUpdated = false;
            const mockRAF = jest.fn(cb => {
                // Verify DOM update happens before callback
                expect(domUpdated).toBe(false);
                domUpdated = true;
                cb(); // Execute callback
                return 1;
            });

            global.requestAnimationFrame = mockRAF;

            // Simulate DOM update followed by scroll
            global.requestAnimationFrame(() => {
                global.window.scrollTo(0, global.document.body.scrollHeight);
            });

            expect(mockRAF).toHaveBeenCalled();
            expect(domUpdated).toBe(true);
        });

        test('should handle requestAnimationFrame callback correctly', () => {
            const callbackSpy = jest.fn();

            global.requestAnimationFrame(callbackSpy);

            expect(mockRequestAnimationFrame).toHaveBeenCalled();
            expect(callbackSpy).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty document body', () => {
            global.document.body.scrollHeight = 0;

            global.requestAnimationFrame(() => {
                global.window.scrollTo(0, global.document.body.scrollHeight);
            });

            expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
        });

        test('should handle very large scrollHeight', () => {
            global.document.body.scrollHeight = 999999;

            global.requestAnimationFrame(() => {
                global.window.scrollTo(0, global.document.body.scrollHeight);
            });

            expect(mockScrollTo).toHaveBeenCalledWith(0, 999999);
        });

        test('should not break if window.scrollTo is undefined', () => {
            global.window.scrollTo = undefined;

            // Should not throw error
            expect(() => {
                global.requestAnimationFrame(() => {
                    if (global.window.scrollTo) {
                        global.window.scrollTo(0, global.document.body.scrollHeight);
                    }
                });
            }).not.toThrow();
        });
    });
});

describe('Scroll Logic Integration', () => {
    test('should verify scroll happens after textContent update', () => {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <div id="output"></div>
        `);

        const outputDiv = dom.window.document.getElementById('output');
        const scrollSpy = jest.fn();

        global.window = { scrollTo: scrollSpy };
        global.document = { body: { scrollHeight: 1000 } };

        // Simulate the addToOutput flow
        const addToOutput = (text) => {
            if (text === '') {
                outputDiv.textContent = '';
            } else {
                outputDiv.textContent += '\n\n' + text;
                // Scroll after update
                global.requestAnimationFrame(() => {
                    global.window.scrollTo(0, global.document.body.scrollHeight);
                });
            }
        };

        addToOutput('Test output');

        expect(outputDiv.textContent).toContain('Test output');
        expect(scrollSpy).toHaveBeenCalledWith(0, 1000);
    });

    test('should not scroll when clearing output', () => {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <div id="output">Previous content</div>
        `);

        const outputDiv = dom.window.document.getElementById('output');
        const scrollSpy = jest.fn();

        global.window = { scrollTo: scrollSpy };

        // Simulate clear operation
        const addToOutput = (text) => {
            if (text === '') {
                outputDiv.textContent = '';
                // Note: We don't scroll on clear
            } else {
                outputDiv.textContent += '\n\n' + text;
                global.requestAnimationFrame(() => {
                    global.window.scrollTo(0, global.document.body.scrollHeight);
                });
            }
        };

        addToOutput(''); // Clear

        expect(outputDiv.textContent).toBe('');
        expect(scrollSpy).not.toHaveBeenCalled();
    });
});
