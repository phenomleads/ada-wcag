# Lesson 1 • 250 credits

Spec-driven development
Feature Specs provide a structured approach to building new features, guiding you through requirements gathering, technical design, and implementation planning. They work best for complex features, multi-step implementations, collaborative projects, or features needing requirements or design iteration.

WHEN a user submits a form with invalid data
THE SYSTEM SHALL display validation errors next to the relevant fields
About this example

This example uses EARS (Easy Approach to Requirements Syntax) notation to write structured, testable requirements for a form validation feature. You can also use your preferred syntax, or just natural language, when giving Kiro an idea to turn into a spec. Find more guidance in the tech doc linked below.

# Lesson 2 • 250 credits

Steering documents
Give Kiro persistent knowledge about your project through markdown files in your ~/.kiro/steering/ directory. Steering files tell Kiro how to behave, so its output consistently follows your established patterns, libraries, and standards without you having to repeat yourself.

Create a steering file to enforce [insert a convention or standard you want Kiro to enforce], so that [insert context for Kiro to understand your intent behind this prompt]. For example, [insert example of this convention or standard as a code output] ensures [repeat initial convention or standard] is followed.
About this example

This is a template prompt for creating a steering file in Kiro. It follows best practices to 1. define the standard or convention you want Kiro to enforce, 2. help Kiro understand the intent behind this enforcement with context, and 3. improve quality of this enforcement with a code-based comparison. Find more best practices and guidance in the tech doc linked below.

# Lesson 3 • 250 credits

Hooks
Run a command or agent prompt automatically when specific events happen in your session - the agent modifies a file, invokes a tool, or completes an action. Hooks are great for automating a trigger and corresponding action, so Kiro can handle the execution.


{
  "version": "v1",
  "hooks": [{
    "name": "Lint on save",
    "trigger": "PostFileSave",
    "matcher": "\\.(ts|tsx)$",
    "action": { "type": "command", "command": "npx eslint --fix" }
  }]
}

About this example

This shows a simple PostFileSave hook that runs ESLint whenever the agent saves or edits a TypeScript file. Hooks are JSON files stored in .kiro/hooks/ and can include a trigger event, optional matcher pattern, and an action. You can create hooks from a guided form or just using natural language.

# Lesson 4 • 500 credits

Property-based testing (IDE only)
Property-based testing (PBT) increases confidence in AI-generated code by moving away from example-based tests and instead enforcing a general rule that must always hold. Kiro extracts properties from your spec requirements, determining what can be logically tested, and creates and runs hundreds of tests against the high-level intent of that requirement. Since PBTs are optional by default, you can get your core implementation right, and then run property checks to ensure the output matches your intent.


Kiro will generate PBTs by default during the design phase of your project. All PBTs are optional, so you can apply correctness to requirements and behavior that matter in your own project. PBT is only available in the Kiro IDE, so start your project there or import your .kiro configuration from your preferred Kiro tool.

# Lesson 5 • 500 credits

Powers
Install a Kiro power and let Kiro load packaged tools, agent skills, and best practices on demand when you mention a matching keyword. Kiro powers can be created by anyone, and we also have a registry of verified powers by experts of those use cases. This means you get those experts' relevant knowledge context, automations and workflows, and tools just by installing that given Kiro power, all loading dynamically for more efficiency.


Hide
Example

my-power/
├── plugin.json          # Required manifest
├── skills/              # Agent Skills
│   └── setup/
│       ├── SKILL.md
│       └── references/
└── mcp.json             # MCP server configuration
About this example

This demonstrates how a power is packaged as a directory with a required manifest and various optional components. For your final project, you can use any Kiro power, and they work with any language or stack. Kiro powers are third-party tools that may be subject to separate terms. Only install powers from trusted sources and review their documentation and licensing.

# Lesson 6 • 1,000 credits

Model Context Protocol (MCP)
MCP is a protocol that allows you to extend Kiro's capabilities by connecting to external servers that provide access to specialized tools, prompts, and resources. Kiro can communicate with a given MCP server to call APIs, access domain-specific tools and external services, and respond to server elicitation requests if additional inputs are required during execution. You can also specify which agents can access a defined MCP server in your workspace.


{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "disabled": false
    }
  }
}

About this example

This example registers an MCP server called fetch that gives Kiro the ability to retrieve content from URLs on the web. MCP servers will list any prerequisites to install in their documentation and may be subject to third party terms. Only install MCP servers from sources you trust and have reviewed. You are responsible for evaluating the security of any MCP server you configure. Kiro does not vet, sandbox, or restrict the behavior of third-party MCP servers. Once installed, you can register the MCP server to your mcp.json Config file from the Kiro panel.

# Lesson 7 • 1,000 credits

Custom agents
Create purpose-built Kiro configurations with customized tools, permissions, context, and instructions. Connect custom agents with built-in tools like Kiro powers and hooks, external tools from MCP servers, control workspace and tool access, and configure parameters for tool behavior for each agent. This means you can securely optimize your workflows and streamline execution with pre-approvals and enhanced context, all in a sharable configuration file.


{
  "name": "my-agent",
  "description": "A custom agent for my workflow",
  "tools": ["read", "write", "shell"],
  "excludedTools": ["knowledge"],
  "includeMcpJson": true,
  "includePowers": false,
  "resources": [
    "file://./ARCHITECTURE.md",
    "skill://backend-patterns"
  ],
  "permissions": {
    "rules": [
      { "capability": "shell", "match": ["npm *", "git *"], "effect": "allow" }
    ]
  },
  "prompt": "You are a helpful coding assistant",
  "model": "claude-sonnet-5",
  "welcomeMessage": "Ready to help. What are you working on?"
}

About this example

This shows a custom coding-assistant agent that can read, write, and run shell commands (limited to npm and git), pre-loaded with your ARCHITECTURE.md and backend-patterns skill. It runs on claude-sonnet-5 and greets you with "Ready to help. What are you working on?"


# Bonus lesson 1 • 250 credits

Kiro Web, cloud sessions, and cloud configuration

Explore agentic engineering in the cloud with Kiro Web, cloud sessions, and cloud configuration, shifting your work off your local machine. Kiro Web introduced working with Kiro in a cloud sandbox, and cloud sessions extend that to the CLI and IDE, so your Kiro sessions stay with your account and follow you across Kiro tools. Cloud configuration complements this by syncing your local Kiro setup into your cloud sessions, so your steering files, hooks, skills, powers, and custom agents can follow you as well.

Push through a broad refactor or upgrade. Start a cloud session from the IDE or CLI for a framework upgrade, dependency migration, large API replacement, or test-heavy refactor. Upload your local .kiro configuration to cloud configuration, and that cloud work uses the same setup you've built locally while the work runs.

Bonus lesson 2 • 250 credits

Package a Kiro power
Include the Kiro power you create in your final project submission to earn an extra 250 Kiro credits.

In addition to our curated Kiro powers from the powers registry, developers can build their own Kiro powers to bundle relevant tools and resources for a given use case. Powers can be shared as public GitHub repositories without special approvals for publishing. Powers can be optionally submitted for review and consideration for inclusion on the curated Kiro powers registry here.

{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "supabase",
  "version": "1.0.0",
  "description": "Build fullstack applications with Supabase's Postgres database, authentication, storage, and real-time subscriptions",
  "author": {
    "name": "Supabase"
  },
  "keywords": ["database", "postgres", "auth", "storage", "realtime", "backend", "supabase", "rls"]
}

About this example

This example shows the plugin.json manifest that identifies the Kiro power and tells Kiro when to activate it. Included are the minimum required fields for the manifest. Every power needs a plugin.json manifest and can include Agent Skills, MCP server configuration, and Kiro-specific extensions.

# Final
Record a demo video of 30 seconds to 3 minutes, showing your project working and highlighting how each lesson is included.

# Others
Description of challenge
From September 21, 2026 at 09:00 PT to September 25, 2026 at 23:59 PT, follow the daily lessons, then build and submit a project for the Final by October 5, 2026 at 23:59 PT to earn Kiro credits. NO PURCHASE NECESSARY. VOID WHERE PROHIBITED. Terms and conditions apply.

Contest terms and conditions
By submitting your entry to the Kiro University Challenge (the “Challenge”), you agree to be bound by these Terms and Conditions. NO PURCHASE NECESSARY. VOID WHERE PROHIBITED.

The Challenge runs from September 21, 2026 at 09:00 PT to October 5, 2026 at 23:59 PT (the “Challenge Period”). Daily lessons are posted during the week of September 21. Follow the daily lessons and submit one project that showcases what you learned (the “Final”) to earn Kiro credits. You must be 18 years of age or older. The GitHub account used to participate must be at least 3 months old. Excludes individuals living in Argentina, Australia, Brazil, Hong Kong, Indonesia, Italy, Malaysia, Philippines, Thailand, Vietnam, Singapore, Russia, Cuba, Iran, North Korea, Syria, Belarus, the region of Crimea, the so-called Donetsk People's Republic region (DNR), the so-called Luhansk People's Republic region (LNR), and the United Arab Emirates. You must have a Kiro account, and either an X or LinkedIn account, to be eligible for participation in the Challenge. Amazon Web Services (“AWS”), employees of AWS, and their immediate family members and members of their households are not eligible to participate. Limit one entry per person.

The syllabus
The Challenge follows a one-week syllabus. Each day, new lessons introduce a Kiro capability or feature the project is built on, for seven total lessons, plus two optional extra-credit Bonus Lessons. The daily lessons are for learning only and are not submitted, judged, or credited on their own. There is one graded submission, the Final, scored on all seven lessons. The Final can be started at any point on or after September 21st at 09:00 PT and must be submitted by October 5th at 23:59 PT. Daily lessons post on the official Kiro social channels (X @kirodotdev and LinkedIn @kiro) and the Kiro Discord server (#kiro-university-challenge channel).

How to participate
Follow the daily lessons posted on the official Kiro social channels (X @kirodotdev and LinkedIn @kiro) and the Kiro Discord server (#kiro-university-challenge channel). The daily lessons teach the Kiro techniques the project is built on. They are for learning only and are not submitted or graded. Lessons will also be updated and referable on the challenge landing page https://kiro.dev/2026/university.
Two optional extra-credit Bonus Lessons post on Thursday, September 24th. You must include all detailed requirements in your Final submission for each Bonus Lesson to be eligible for the extra credits. The graded Final opens for submission on Friday, September 25th, and your project is due by Monday, October 5th at 23:59 PT.
Build your project using Kiro as your primary development tool.
Push your code to a public GitHub repository owned by you. GitHub accounts not matching social accounts may be disqualified. GitHub accounts must be at least 3 months old.
Include the .kiro folder in your repository with all required lesson content as relevant to show how required Kiro features and capabilities were configured.
Record a demo video of 30 seconds to 3 minutes, showing your project working and highlighting how each lesson is included. Videos will not be viewed past 3 minutes.
Post your submission on either X or LinkedIn with #KiroUniversity and #BuildWithKiro, and tag @kirodotdev on X or @kiro on LinkedIn.
Your post must include: public GitHub repo link, short description (2-3 sentences), required hashtags, and a publicly accessible demo video of 30 seconds to 3 minutes.
Submit your project through the entry form at https://kiro.dev/2026/university and include your GitHub repo link, publicly accessible demo video, and live social post link. You must enter your email correctly in the entry form to be contacted and receive any credit awards you may be eligible for.
Submission criteria
All eligible entries received during the Challenge Period will be reviewed by a qualified reviewer against the following criteria:

Your project must be submitted prior to the close of the Final submission window: 23:59 PT Monday, October 5, 2026.
Entrants must work individually.
Must include a public GitHub repository with source code.
Must have the .kiro folder included in the repository that showcases clearly the features and capabilities required from the daily lessons.
The GitHub repo must have at least one commit made on or after Monday, September 21, 2026 at 09:00 PT (the start of the Challenge Period). No commits are permitted prior to the start of the Challenge Period. Repos with earlier commits are subject to disqualification.
The GitHub repo must not have commits after the submission window has ended on October 5, 2026 at 23:59 PT until judging has concluded, by October 19th 2026 at 23:59 PT or you receive an email with your challenge award, whichever is sooner.
The GitHub account used to participate must be at least 3 months old.
The GitHub account must only be used with one accompanying social account. Multiple submissions from different individuals or social accounts using the same GitHub account may be disqualified.
Must be a working project (functional, not a static mockup) that follows the Final challenge prompt.
Must include a 30 second to 3 minute demo video showing the project working. Videos will not be viewed past 3 minutes.
You must make a public social post on either X or LinkedIn with #KiroUniversity and #BuildWithKiro, tagging @kirodotdev on X or @kiro on LinkedIn.
Must include a short description (2-3 sentences) of what was built, both in the social post and in your submission form.
Submission form must include a writeup of how each lesson was incorporated in the project.
Must include all challenge-specific requirements as posted for the Final.
You must submit the entry form at https://kiro.dev/2026/university by 23:59 PT Monday, October 5, 2026 to be eligible.
One entry per person.
Credit awards
Credit awards are earned per Kiro lesson your project uses and demonstrates, scored once from your single graded submission (the Final). Each of Lessons 1-3 is worth 250 credits, for up to 750 credits. Each of Lessons 4-5 is worth 500 credits, for up to 1,000 credits. Each of Lessons 6-7 is worth 1,000 credits, for up to 2,000 credits. If your project demonstrates all seven lessons, you earn an additional 1,000-credit completion award. There are two extra-credit Bonus Lessons, each worth 250 credits. The maximum total is 5,250 credits.

There is one graded submission per participant, due Monday, October 5, 2026 at 23:59 PT.

No purchase is necessary to participate or to earn the full base award. The seven required lessons cover Kiro features or capabilities that are available to a user on a free Kiro plan. One of the two Bonus Lessons (250 credits) is available to paid-plan participants only. The other Bonus Lesson (250 credits) is available to all Kiro users. Neither Bonus Lesson is required for or counted towards the 1,000-credit completion award for showing all seven required lessons.

Milestone credit table
Milestone	Credits
Lessons 1-3	250 credits each, up to 750
Lessons 4-5	500 credits each, up to 1,000
Lessons 6-7	1,000 credits each, up to 2,000
All 7 required lessons in final submission	1,000-credit completion award
Bonus Lesson 1 (paid plans only)	250 additional credits
Bonus Lesson 2	250 additional credits
Maximum total	5,250 credits
Verification
AWS reserves the right to verify any submission. Submissions may be disqualified if:

The GitHub repository is not public
The .kiro folder or a required file for a given lesson is missing
The project does not function as described
The submission appears to be fraudulent, copied, or generated without meaningful Kiro usage
The social post does not include the required Kiro tag, hashtags, and links
Challenge-specific requirements are not met
Entries that do not meet the requirements set forth in these Terms and Conditions may be disqualified in AWS's sole discretion. Submissions will be reviewed within 10 business days following the Challenge Period. If you are selected to receive a credit award, AWS will contact you via the email you submitted to enter the Challenge. Credit awards will be emailed to the email address you provide within 10 business days after the Challenge Period ends. All Kiro credit awards will be eligible to redeem upon delivery of awards and may be redeemed until November 30, 2026 at 23:59 PT. Once redeemed, credit awards will remain on an account until fully used or expire by March 31st, 2027 at 23:59 PT. Kiro Credits are non-transferable and cannot be exchanged for cash. A winners list will be available at https://kiro.dev/2026/university/winners for up to a year after the Challenge Period. AWS reserves the right to substitute a prize (or portion thereof) for an item of comparable or greater value, at AWS's sole discretion.

Failure to provide the requested information or to respond to communications about the Challenge within a reasonable period of time, as determined by AWS in its sole discretion, may result in the forfeiture of the prize.

By accepting the prize, you confirm that your receipt is neither prohibited nor inconsistent with any applicable laws, regulations, or binding orders, including applicable ethics or procurement rules, your receipt will not create a conflict of interest for AWS, and there are no ongoing competitive procurements for which your receipt of this benefit could conflict AWS from participating in the competition.

The following personal information will be collected by AWS for the Challenge solely for the purposes of administering the Challenge and verifying participant eligibility: name, city, state, country, email address. Failure to provide all necessary personal information may result in participants' participation in the Challenge being deemed ineligible. AWS handles your information in accordance with the AWS Privacy Notice.

Acceptance of prize by the winner constitutes permission for AWS to use winners' names or likenesses, and city, state or province, and country, if submitted to AWS, for any disclosures required by law, including a winners list, and for advertising and promotional purposes relating to the Challenge in any and all media now or hereafter devised, worldwide in perpetuity (or to the maximum extent permissible under applicable law), without additional compensation, notification or permission, unless prohibited by law.

By submitting your submission to the Challenge, you represent and warrant that your submission does not: (i) perform or promote activities that are illegal; (ii) violate or infringe the intellectual property, proprietary, or other rights of others; (iii) perform or promote activities that are offensive or disparaging in any manner; or (iv) cause harm to others or to AWS's operations or reputation.

The Challenge is sponsored by AWS. AWS reserves the right to cancel or modify the Challenge at any time and for any reason. AWS and its affiliates and licensors will not be liable to you under any cause of action or theory of liability relating to the Challenge, even if a party has been advised of the possibility of such damages, for (a) indirect, incidental, special, consequential, or exemplary damages, or (b) lost profits, revenues, customers, opportunities, or goodwill. In any case, AWS and its affiliates' and licensors' aggregate liability under these Terms and Conditions will not exceed USD $100. The limitations in this paragraph shall apply only to the maximum extent permitted by applicable law.

You will be responsible, as required under applicable law, for identifying, filing and paying all taxes and other governmental fees and charges (and any penalties, interest, and other additions thereto) that may be imposed on them with respect to the transactions under this Terms and Conditions. AWS may deduct or withhold any taxes that the AWS may be legally obligated to deduct or withhold from any benefits provided to you under this Terms and Conditions, and benefits provided to you as reduced by such deductions or withholdings will constitute full award of benefits to you under this Terms and Conditions. You may also be required to sign and return certain tax documentation. Where applicable, Amazon may require winners to provide additional tax information, as required by law to Amazon before receiving their prize and tax reporting may be required. Tax identity information may be collected by completion of IRS Forms W-8/W-9 which each winner will be required to complete and sign to verify certain tax information to Amazon before receiving their Prize. Failure to return such tax documentation will result in forfeiture of the Prize.

