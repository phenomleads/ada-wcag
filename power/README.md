# ada-wcag — Kiro Power

A Kiro Power that validates HTML content against WCAG 2.1 Level AA success criteria: image alternative text (1.1.1), form label association (1.3.1), heading hierarchy (1.3.1), link text descriptiveness (2.4.4), and color contrast (1.4.3). Mention WCAG, accessibility, a11y, or ADA in a conversation and Kiro loads this power's guidance automatically.

This power packages the domain knowledge behind the [ada-wcag accessibility checker CLI](https://github.com/phenomleads/ada-wcag), a working TypeScript tool built for the Kiro University Challenge. This power lives in the `power/` folder of that same repository.

## What it does

- Explains the exact rule, severity (`error`/`warning`), and canonical remediation text for each of the five WCAG checks
- Documents the JSON report schema used by the reference CLI implementation
- Documents CLI usage and exit codes for the reference implementation

See `skills/wcag-validator/SKILL.md` for the full rule set and `skills/wcag-validator/references/report-schema.json` for the machine-readable report schema.

## Installation

**From a local folder:**
1. Open Kiro → Powers panel → **Add Custom Power**
2. Select **Import power from a folder**
3. Select this directory

**From GitHub:**
1. Open Kiro → Powers panel → **Add Custom Power**
2. Select **Import power from GitHub**
3. Enter: `https://github.com/phenomleads/ada-wcag/tree/main/power`

## Usage

Once installed, mention any of the trigger keywords (`wcag`, `a11y`, `accessibility`, `ada`) in a Kiro conversation — for example, "check this page for wcag issues" — and the power's guidance loads automatically.

## License

MIT — see [LICENSE](./LICENSE).

## Privacy Policy

See [PRIVACY.md](./PRIVACY.md).

## Support

Open an [Issue](https://github.com/phenomleads/ada-wcag/issues) on this repository, or contact: phenomleads@gmail.com
