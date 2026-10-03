# Kiro University Project Plan - ADA Accessibility Checker

**Project**: WCAG Accessibility Compliance Checker  
**Goal**: Score 100% (all 7 required lessons) + Bonus lessons = 4,750 credits total

---

## Project Overview

A working CLI tool that fetches live websites and analyzes them for WCAG 2.1 Level AA accessibility compliance, demonstrating all Kiro University lessons.

**Tech Stack**: Node.js, cheerio/jsdom for HTML parsing, MCP for fetching URLs

---

## Complete Step-by-Step Plan

### ✅ LESSON 1: Spec-driven Development (250 credits)

**Objective**: Use Feature Specs with EARS-style requirements

**Steps**:
1. Create a feature spec using Kiro's spec workflow
2. Write structured requirements using EARS notation:
   - `WHEN a user provides a URL`
   - `THE SYSTEM SHALL fetch the HTML content via MCP`
   - `WHEN analyzing HTML`
   - `THE SYSTEM SHALL identify all WCAG 2.1 AA violations`
   - `THE SYSTEM SHALL output a JSON report with severity levels`
3. Go through: Requirements → Design → Implementation phases
4. Let Kiro generate tasks from the spec

**Deliverable**: Complete spec file with requirements, design, and task breakdown

---

### ✅ LESSON 2: Steering Documents (250 credits)

**Objective**: Create persistent knowledge files in `.kiro/steering/`

**Steps**:
1. **Create `.kiro/steering/accessibility-standards.md`**
   - Enforce WCAG 2.1 Level AA compliance in all generated code
   - Context: "When generating HTML examples or test fixtures, always include semantic HTML, ARIA labels, and alt text"
   - Example code showing compliant vs non-compliant HTML

2. **Create `.kiro/steering/error-report-format.md`**
   - Enforce consistent JSON error structure
   - Example: `{ "severity": "error", "wcag": "1.1.1", "element": "<img>", "issue": "Missing alt text", "line": 45, "fix": "Add alt attribute" }`
   - Context: "All violation reports must follow this exact schema"

3. **Create `.kiro/steering/testing-patterns.md`**
   - Enforce both positive and negative test cases
   - Example: Test with compliant HTML (should pass) and non-compliant HTML (should detect violations)
   - Context: "Every checker function needs passing and failing test cases"

4. **Create `.kiro/steering/documentation-style.md`**
   - Enforce JSDoc comments with WCAG criterion references
   - Example: `/** @wcag 1.1.1 - Checks all images have alt text */`
   - Context: "Every validation function must document which WCAG success criterion it validates"

**Deliverable**: 4 steering files in `.kiro/steering/` directory

---

### ✅ LESSON 3: Hooks (250 credits)

**Objective**: Create automation hooks in `.kiro/hooks/`

**Steps**:
1. **Create `.kiro/hooks/lint-on-save.json`**
   - Trigger: `PostFileSave`
   - Matcher: `\\.(js|html)$`
   - Action: Run linter/formatter on save
   - Command: `npx eslint --fix` or similar

2. **Create `.kiro/hooks/test-after-task.json`**
   - Trigger: `PostTaskExec`
   - Action: Auto-run tests after completing spec tasks
   - Command: `npm test`

3. **Create `.kiro/hooks/validate-docs.json`**
   - Trigger: `PreToolUse`
   - Matcher: `fs_write|str_replace`
   - Action: Check that code includes proper JSDoc comments
   - Type: `agent` with prompt to verify documentation

**Deliverable**: 3 working hook files demonstrating different triggers and actions

---

### ✅ LESSON 4: Property-Based Testing (500 credits)

**Objective**: Generate and run PBTs during spec design phase (IDE only)

**Steps**:
1. During spec design phase, enable property-based testing
2. Define properties that must always hold:
   - "All `<img>` elements MUST have an alt attribute OR role='presentation'"
   - "All `<input>` elements MUST have an associated `<label>`"
   - "Heading hierarchy MUST be sequential (no skipping levels)"
3. Let Kiro generate PBT tests
4. Run hundreds of test cases against requirements
5. Mark some PBTs as optional, keep critical ones enabled

**Deliverable**: PBT test suite generated and executed successfully

**Note**: Must use Kiro IDE (not CLI/Web) for this lesson

---

### ✅ LESSON 5: Powers (500 credits)

**Objective**: Install and use at least one Kiro power

**Steps**:
1. Browse available Kiro powers registry
2. Install a relevant power (suggestions):
   - Web scraping/fetching power
   - Testing/validation power
   - HTML/DOM manipulation power
3. Use the power's tools/skills in project development
4. Demonstrate it loading dynamically when keywords are mentioned

**Deliverable**: Installed power + demonstration of using its tools

---

### ✅ LESSON 6: Model Context Protocol (1,000 credits)

**Objective**: Configure MCP server in `.kiro/settings/mcp.json`

**Steps**:
1. Install `uv` and `uvx` (Python package manager)
   - macOS: `brew install uv` or `pip install uv`

2. **Create `.kiro/settings/mcp.json`**
   ```json
   {
     "mcpServers": {
       "fetch": {
         "command": "uvx",
         "args": ["mcp-server-fetch"],
         "disabled": false
       }
     }
   }
   ```

3. Test MCP connection from Kiro panel

4. **Use MCP in code**: Fetch live website HTML via MCP
   - Let Kiro call the MCP fetch tool to download HTML
   - Pass HTML to our checker functions

5. Demonstrate MCP server calling external tools/APIs

**Deliverable**: Working MCP configuration + code that uses MCP to fetch URLs

---

### ✅ LESSON 7: Custom Agents (1,000 credits)

**Objective**: Create custom agent in `.kiro/agents/`

**Steps**:
1. **Create `.kiro/agents/accessibility-auditor.json`**
   ```json
   {
     "name": "accessibility-auditor",
     "description": "Specialized agent for WCAG accessibility auditing",
     "tools": ["read_file", "fs_write", "execute_bash", "grep_search"],
     "excludedTools": [],
     "includeMcpJson": true,
     "includePowers": true,
     "resources": [
       "file://.kiro/steering/accessibility-standards.md",
       "file://./docs/WCAG-2.1-reference.md"
     ],
     "permissions": {
       "rules": [
         { "capability": "shell", "match": ["node *", "npm *"], "effect": "allow" }
       ]
     },
     "prompt": "You are an accessibility auditing expert. Focus on WCAG 2.1 Level AA compliance. Always reference specific success criteria.",
     "model": "claude-sonnet-4.5",
     "welcomeMessage": "Ready to audit accessibility. Provide a URL or HTML file."
   }
   ```

2. Test the custom agent
3. Show it loading your steering files automatically
4. Demonstrate restricted tool access and permissions

**Deliverable**: Working custom agent configuration file

---

### 🎁 BONUS LESSON 1: Cloud Sessions (250 bonus credits)

**Objective**: Use Kiro Web/cloud sessions with cloud configuration

**Steps**:
1. Start a cloud session from Kiro IDE
2. Upload local `.kiro/` configuration to cloud
3. Run part of development in cloud session
4. Show steering files, hooks, and custom agents syncing to cloud
5. Demonstrate seamless transition between local and cloud work

**Deliverable**: Screenshots/recording of cloud session with synced config

---

### 🎁 BONUS LESSON 2: Package a Kiro Power (250 bonus credits)

**Objective**: Create your own Kiro power for accessibility checking

**Steps**:
1. **Create power directory structure**:
   ```
   accessibility-checker-power/
   ├── plugin.json
   ├── skills/
   │   └── wcag-validator/
   │       └── SKILL.md
   ├── mcp.json (optional)
   └── README.md
   ```

2. **Create `plugin.json` manifest**:
   ```json
   {
     "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
     "name": "accessibility-checker",
     "version": "1.0.0",
     "description": "WCAG 2.1 accessibility compliance checker with automated auditing and reporting",
     "author": {
       "name": "Your Name"
     },
     "keywords": ["accessibility", "wcag", "a11y", "ada", "compliance", "audit"]
   }
   ```

3. **Create Agent Skill** in `skills/wcag-validator/SKILL.md`
   - Document WCAG 2.1 success criteria
   - Provide validation patterns
   - Include example checks

4. Publish to GitHub as public repository
5. (Optional) Submit for curated registry review

**Deliverable**: Packaged power with plugin.json and skills

---

## Project Implementation Checklist

### Core Functionality (The Actual Working Product)

1. **Project Setup**
   - [ ] Initialize Node.js project (`npm init`)
   - [ ] Install dependencies: `cheerio` or `jsdom`, `commander` (CLI)
   - [ ] Create project structure:
     ```
     kiro-ada/
     ├── src/
     │   ├── checker.js       # Main checker logic
     │   ├── validators/      # Individual WCAG checks
     │   │   ├── images.js    # WCAG 1.1.1 - Alt text
     │   │   ├── forms.js     # WCAG 1.3.1 - Form labels
     │   │   ├── headings.js  # WCAG 1.3.1 - Heading hierarchy
     │   │   ├── links.js     # WCAG 2.4.4 - Link text
     │   │   └── contrast.js  # WCAG 1.4.3 - Color contrast
     │   ├── reporter.js      # JSON report generator
     │   └── cli.js           # CLI interface
     ├── tests/
     │   └── *.test.js
     ├── .kiro/
     │   ├── steering/
     │   ├── hooks/
     │   ├── agents/
     │   └── settings/
     ├── docs/
     └── package.json
     ```

2. **WCAG Validators to Implement**
   - [ ] **WCAG 1.1.1**: Check all `<img>` have alt text
   - [ ] **WCAG 1.3.1**: Check form `<input>` have associated `<label>`
   - [ ] **WCAG 1.3.1**: Check heading hierarchy (h1→h2→h3, no skips)
   - [ ] **WCAG 2.4.4**: Check links have descriptive text (not "click here")
   - [ ] **WCAG 1.4.3**: Basic color contrast check (if feasible)

3. **CLI Tool**
   - [ ] `node src/cli.js <url>` - Analyze live website
   - [ ] `node src/cli.js <file.html>` - Analyze local file
   - [ ] Output JSON report to console and file
   - [ ] Pretty-print summary with violation counts

4. **Testing**
   - [ ] Unit tests for each validator
   - [ ] Integration test with sample HTML
   - [ ] Test with real websites
   - [ ] Property-based tests (via Kiro during spec phase)

---

## Final Deliverable Requirements

### Demo Video (30 seconds to 3 minutes)

**Must Show**:
1. **Lesson 1**: Spec file with EARS requirements
2. **Lesson 2**: 4 steering files in `.kiro/steering/`
3. **Lesson 3**: 3 hooks working (show auto-run on save/task completion)
4. **Lesson 4**: Property-based test results (hundreds of test cases)
5. **Lesson 5**: Installed power and usage
6. **Lesson 6**: MCP configuration + live URL fetch
7. **Lesson 7**: Custom agent configuration + usage
8. **Working Product**: 
   - Run `node src/cli.js https://example.com`
   - Show HTML being fetched via MCP
   - Show violations detected and reported
   - Show JSON output with WCAG references
9. **Bonus 1** (optional): Cloud session screenshot
10. **Bonus 2** (optional): Packaged power with plugin.json

---

## Success Criteria Checklist

- [ ] All 7 required lessons completed
- [ ] Working CLI tool that actually checks accessibility
- [ ] Real WCAG violations detected and reported
- [ ] MCP successfully fetches live URLs
- [ ] Steering files enforce conventions during development
- [ ] Hooks automate tasks (lint, test, validate)
- [ ] Custom agent works with configured tools/permissions
- [ ] Property-based tests run successfully
- [ ] Demo video shows all features working
- [ ] (Optional) Bonus lessons for extra 500 credits

**Total Credits**: 4,000 (required) + up to 500 (bonus) = **4,500-4,750 credits**

---

## Estimated Timeline

1. **Day 1**: Lesson 1 (Spec creation) + Project setup
2. **Day 2**: Lesson 2 (Steering) + Lesson 6 (MCP setup) + Core checker logic
3. **Day 3**: Lesson 3 (Hooks) + Lesson 4 (PBT) + Validators implementation
4. **Day 4**: Lesson 5 (Powers) + Lesson 7 (Custom agent) + Testing
5. **Day 5**: Bonus lessons + Demo video + Final testing

---

## Next Steps

1. Start with Lesson 1: Create the feature spec
2. Set up project structure
3. Configure MCP (Lesson 6) early so we can test fetching
4. Implement core functionality while other lessons get configured
5. Record demo video showing everything working

**Ready to begin?** Start with: "Create a spec for an accessibility checker that validates WCAG 2.1 Level AA compliance"
