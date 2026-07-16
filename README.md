# custom-dev-tools

Personal toolkit distilled from real Nuxt projects.

## Contents

- **`packages/eslint-config-nuxt`** — `@oleh-khomenko/eslint-config-nuxt`,
  ESLint flat config enforcing Nuxt layer-architecture conventions.
- **`plugins/nuxt-conventions`** — Claude Code plugin: `nuxt-style-guide`
  skill + `/nuxt-review` command.

## Install

ESLint config (in a Nuxt project):

    pnpm add -D @oleh-khomenko/eslint-config-nuxt

Claude plugin:

    /plugin marketplace add <git-url-of-this-repo>
    /plugin install nuxt-conventions@custom-dev-tools
