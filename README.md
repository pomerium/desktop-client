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
