# Manual Testing Checklist

This document outlines manual testing procedures for features that require visual verification or browser-specific behavior that cannot be fully automated with Jest.

## Prerequisites

1. Open `v1/index.html` in a web browser (Chrome, Firefox, Safari, or Edge)
2. Open browser DevTools Console (F12) to check for any errors
3. Ensure terminal aesthetic is visible: green text on black background

---

## Test Suite 1: Visual Appearance

### Terminal Aesthetic
- [ ] Background is solid black (#0a0a0a)
- [ ] Text is bright green (#00ff00)
- [ ] Font is monospace (Courier New, Consolas, etc.)
- [ ] No boxes or borders around output (except input bar border)
- [ ] Separators use `═══` and `───` characters only

### Layout and Spacing
- [ ] Output starts at top with initial welcome message
- [ ] Input bar is fixed at bottom of viewport
- [ ] Input bar has green border-top
- [ ] Body has extra padding at bottom (100px) to prevent content overlap
- [ ] Text is left-aligned throughout
- [ ] Line spacing is consistent (1.6 line-height)

### Responsive Design
- [ ] Layout works on desktop viewport (1920x1080)
- [ ] Layout works on laptop viewport (1366x768)
- [ ] Layout works on tablet viewport (768x1024)
- [ ] Input bar stays at bottom when resizing window
- [ ] Text wraps properly on narrow viewports

---

## Test Suite 2: Scrolling Behavior

### Auto-Scroll on Output
1. [ ] Enter command `loadout` and press Enter
   - **Expected**: Page auto-scrolls to show latest output at bottom
   - **Verify**: New loadout is fully visible without manual scrolling

2. [ ] Enter command `help` and press Enter
   - **Expected**: Page auto-scrolls to show entire help text
   - **Verify**: Last line of help text is visible

3. [ ] Enter 10 commands in rapid succession (any valid commands)
   - **Expected**: Page auto-scrolls after each command
   - **Verify**: Latest output always visible at bottom

4. [ ] Generate enough output to exceed viewport height (20+ commands)
   - **Expected**: Page scrolls smoothly after each command
   - **Verify**: No "jumping" or flickering during scroll
   - **Verify**: Browser scrollbar shows full document height

### Manual Scroll vs Auto-Scroll
1. [ ] Scroll to middle of output history manually
2. [ ] Enter new command
   - **Expected**: Page auto-scrolls back to bottom
   - **Verify**: User's manual scroll position is overridden

### Clear Command
1. [ ] Generate several outputs (5+ commands)
2. [ ] Enter `clear` command
   - **Expected**: Output clears, page shows only input bar
   - **Verify**: No unnecessary scrolling (page stays at top)

---

## Test Suite 3: Input and Interaction

### Keyboard Navigation
- [ ] Pressing Tab moves focus to "random" button
- [ ] Pressing Tab again moves focus to "clear" button
- [ ] Pressing Tab again returns focus to input field
- [ ] Pressing Enter in input field submits command
- [ ] Input field auto-focuses after command submission

### Input Constraints
1. [ ] Type 150 characters into input field
   - **Expected**: Input stops at 100 characters (maxlength enforced)
   - **Verify**: Remaining characters are not entered

2. [ ] Paste 200 characters into input field
   - **Expected**: Only first 100 characters are pasted
   - **Verify**: Input displays "maxlength exceeded" browser behavior

### Button Functionality
- [ ] Click "random" button → generates random loadout
- [ ] Click "clear" button → clears all output
- [ ] Both buttons respond to click without delay

---

## Test Suite 4: Command Processing

### Valid Commands
- [ ] `loadout` → generates random agent with random budget
- [ ] `agent:jett` → generates loadout for Jett
- [ ] `agent:sage` → generates loadout for Sage
- [ ] `3000` → generates loadout with $3000 budget
- [ ] `9000` → generates loadout with $9000 budget
- [ ] `help` → displays help text
- [ ] `agents` → lists all 29 agents
- [ ] `clear` → clears output

### Invalid Commands
- [ ] Empty command → shows error message
- [ ] `invalidcommand` → shows "Unknown command" error
- [ ] `agent:notanagent` → shows "Unknown agent" error
- [ ] `-500` → shows budget error
- [ ] `99999` → shows budget error

### Case Sensitivity
- [ ] `LOADOUT` (uppercase) → works correctly
- [ ] `LoAdOuT` (mixed case) → works correctly
- [ ] `agent:JETT` (uppercase agent) → works correctly
- [ ] `agent:JeTt` (mixed case agent) → works correctly

---

## Test Suite 5: Output Formatting

### Loadout Display
1. [ ] Generate loadout with `loadout` command
   - **Verify**: Output shows AGENT, PRIMARY, SIDEARM, SHIELD, ABILITIES sections
   - **Verify**: Each section is properly labeled
   - **Verify**: Budget bar uses `█` characters
   - **Verify**: Total cost is displayed
   - **Verify**: Separators (`═══` and `───`) are properly aligned

2. [ ] Generate loadout with `3000` budget
   - **Verify**: Total cost ≤ $3000
   - **Verify**: Budget bar shows reasonable proportion
   - **Verify**: Loadout includes appropriate weapons for budget tier

3. [ ] Generate loadout with `300` budget (eco round)
   - **Verify**: Primary weapon may be "None"
   - **Verify**: Sidearm is typically Classic or Shorty
   - **Verify**: Shield may be "No Shield"
   - **Verify**: Total cost ≤ $300

### Ability Display
- [ ] Abilities show correct costs (e.g., "Barrier Orb ($300)")
- [ ] Abilities show "FREE" if cost is 0
- [ ] Abilities are listed with separators between them

### Help Text Display
- [ ] Help text shows all command categories
- [ ] Examples are properly formatted
- [ ] ASCII art (if any) is properly aligned

### Agent List Display
- [ ] `agents` command shows all 29 agents
- [ ] Agents are organized by role (Duelist, Controller, Initiator, Sentinel)
- [ ] Each agent name is properly capitalized

---

## Test Suite 6: Security Verification

### XSS Prevention (Visual Check)
1. [ ] Enter command: `<script>alert("XSS")</script>`
   - **Expected**: Shows error message with escaped HTML
   - **Verify**: NO alert popup appears
   - **Verify**: Output shows literal text `<script>alert("XSS")</script>`

2. [ ] Enter command: `<img src=x onerror=alert(1)>`
   - **Expected**: Shows error message
   - **Verify**: NO alert popup appears
   - **Verify**: NO broken image icon appears

3. [ ] Enter command: `agent:<svg onload=alert(1)>`
   - **Expected**: Shows "Unknown agent" error
   - **Verify**: NO alert popup appears

### CSP Verification
1. [ ] Open Browser DevTools Console
2. [ ] Check for CSP violations
   - **Expected**: NO CSP violation errors
   - **Verify**: CSP policy is loaded (check Network tab → index.html headers)

### Event Handler Safety
- [ ] Right-click "random" button → Inspect element
  - **Verify**: NO `onclick` attribute in HTML
- [ ] Right-click "clear" button → Inspect element
  - **Verify**: NO `onclick` attribute in HTML
- [ ] View page source
  - **Verify**: NO inline event handlers (onclick, onload, onerror, etc.)

---

## Test Suite 7: Performance and Edge Cases

### Large Output Volume
1. [ ] Generate 50+ loadouts in succession
   - **Expected**: Page remains responsive
   - **Verify**: No memory leaks (check DevTools Memory tab)
   - **Verify**: Scroll performance remains smooth

2. [ ] Generate 100+ commands
   - **Expected**: Page still scrolls correctly
   - **Verify**: Input field remains responsive

### Long Session
1. [ ] Keep page open for 10+ minutes
2. [ ] Continue using commands intermittently
   - **Expected**: No performance degradation
   - **Verify**: Commands still process correctly

### Browser Refresh
1. [ ] Generate several outputs
2. [ ] Refresh page (F5 or Cmd+R)
   - **Expected**: Output clears, welcome message appears
   - **Verify**: Input field is focused and ready

---

## Test Suite 8: Cross-Browser Compatibility

Run all above tests in each browser:

### Chrome/Chromium
- [ ] All visual tests pass
- [ ] All scrolling tests pass
- [ ] All interaction tests pass
- [ ] No console errors

### Firefox
- [ ] All visual tests pass
- [ ] All scrolling tests pass
- [ ] All interaction tests pass
- [ ] No console errors

### Safari
- [ ] All visual tests pass
- [ ] All scrolling tests pass
- [ ] All interaction tests pass
- [ ] No console errors

### Edge
- [ ] All visual tests pass
- [ ] All scrolling tests pass
- [ ] All interaction tests pass
- [ ] No console errors

---

## Test Suite 9: Accessibility

### Keyboard-Only Navigation
1. [ ] Close all browser windows except test page
2. [ ] Navigate using only keyboard (Tab, Enter, Shift+Tab)
   - **Verify**: Can reach all interactive elements
   - **Verify**: Focus indicators are visible
   - **Verify**: Can submit commands without mouse

### Screen Reader (Optional)
1. [ ] Enable screen reader (NVDA, JAWS, VoiceOver)
2. [ ] Navigate through page
   - **Verify**: Input field is announced
   - **Verify**: Buttons are announced
   - **Verify**: Output text is readable

---

## Bug Reporting Template

If any test fails, report using this template:

```
**Test Suite**: [e.g., Scrolling Behavior]
**Test Case**: [e.g., Auto-Scroll on Output #1]
**Browser**: [e.g., Chrome 120.0.6099.109]
**OS**: [e.g., Windows 11]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]

**Screenshots**: [Attach if applicable]
**Console Errors**: [Paste any errors from DevTools]
```

---

## Sign-Off

After completing all tests:

- **Tester Name**: _________________
- **Date**: _________________
- **Browser Versions Tested**: _________________
- **All Tests Passed**: ☐ Yes ☐ No (specify failures above)
- **Notes**: _________________

---

## Notes for Developers

- These tests should be run before each release
- Pay special attention to scrolling behavior in Test Suite 2
- Security tests in Test Suite 6 are critical - never skip these
- If adding new commands, update Test Suite 4 accordingly
- Cross-browser testing (Test Suite 8) can be done on final release candidates
