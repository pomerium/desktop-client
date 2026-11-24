# Starting Development

## Get all the dependencies

```bash
npm install
```

## Development checkout of pomerium-cli

### Set up repo clone and symlink

```bash
npm run dev-setup
```

This will internally check out the default branch of `pomerium/cli`

### Change branch/tag/commit for cli checkout

```bash
( cd cli && git checkout [commit-ish] )
```

### Pull branch updates (if any) and rebuild cli

To fetch branch updates and rebuild the cli binary

```bash
npm run build-cli
```

## Run a dev build

Start the app in the `dev` environment:

```bash
npm run start
```

# Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

# Releasing

Releases are built and drafted by the [Publish workflow](.github/workflows/publish.yml) on every push to `main`. Publishing is manual.

1. Bump `version` in `package.json` and merge to `main`. This creates a draft release for `v<version>` with the binaries for every platform and generated release notes.
2. Each later push to `main` rebuilds the binaries and regenerates the notes on the draft, so PRs merged before you publish are included.
3. Release notes are grouped by PR label (`bug`, `enhancement`, `dependencies` and so on), as configured in [`.github/release.yml`](.github/release.yml). PRs without a matching label go under "Changed", and PRs labeled `ci`, `docs` or `github_actions` are left out. Label PRs before they merge.
4. Review the draft and publish it from the GitHub releases page. Edit the notes right before publishing, because the next push to `main` overwrites a draft's notes. Published releases are never changed by the workflow, and their notes can still be edited afterwards.
