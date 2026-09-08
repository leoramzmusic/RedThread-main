# Versioning Guide

## Automatic Versioning Rules

RedThread uses automatic versioning based on the number of files modified in a commit or merge:

| Files Modified | Version Change | Example | Use Case |
|---------------|----------------|---------|----------|
| < 20 | No change | v1.0.2 → v1.0.2 | Hotfixes, typos, minor tweaks |
| 20 - 50 | Patch (v1.0.x) | v1.0.2 → v1.0.3 | Bug fixes, small features |
| 50 - 500 | Minor (v1.x.0) | v1.0.2 → v1.1.0 | New features, medium changes |
| > 500 | Major (vX.0.0) | v1.0.2 → v2.0.0 | Breaking changes, major updates |

## How It Works

### Automatic Flow (on merge to main)

1. **Merge PR to main**: When you merge a pull request
2. **Post-merge hook triggers**: Git hook automatically runs
3. **Count modified files**: System counts files changed in the merge
4. **Determine bump type**: Applies versioning rules
5. **Update version**: Updates `VERSION` and `package.json`
6. **Create Git tag**: Tags the commit (e.g., `v1.0.3`)
7. **Generate changelog**: Updates `CHANGELOG.md` with commits
8. **Commit changes**: Optionally commits version files (if configured)

### Manual Version Bump

You can manually bump the version when needed:

```bash
# Automatic bump based on file count
python3 scripts/bump_version.py

# Force specific bump type
python3 scripts/bump_version.py --type patch
python3 scripts/bump_version.py --type minor
python3 scripts/bump_version.py --type major

# Dry run (see what would happen)
python3 scripts/bump_version.py --dry-run

# Compare against different base branch
python3 scripts/bump_version.py --base-branch develop
```

### Generate Changelog

Update the changelog manually:

```bash
python3 scripts/generate_changelog.py
```

This will:
- Get all commits since last version tag
- Categorize by conventional commit type
- Update `CHANGELOG.md` with formatted entry

## Commit Message Format

For better changelog generation, use **conventional commits**:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `perf:` Performance improvement
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks
- `style:` Code style changes (formatting, etc.)

### Examples

```bash
# Feature
git commit -m "feat: add session management UI"
git commit -m "feat(auth): implement Remember Me checkbox"

# Bug fix
git commit -m "fix: resolve theme persistence on login page"
git commit -m "fix(session): validate token expiration correctly"

# Performance
git commit -m "perf: optimize database queries for sessions"

# Documentation
git commit -m "docs: update versioning guide"

# Chore
git commit -m "chore: bump version to 1.0.3 [skip ci]"
```

## Configuration

### Version Rules

Edit `.versionrc.json` to customize versioning rules:

```json
{
  "rules": {
    "hotfix": { "max_files": 20, "increment": "none" },
    "patch": { "max_files": 50, "increment": "patch" },
    "minor": { "max_files": 500, "increment": "minor" },
    "major": { "max_files": 999999, "increment": "major" }
  },
  "tag_prefix": "v",
  "changelog": "CHANGELOG.md",
  "auto_commit": true,
  "auto_push": false
}
```

### Options

- `auto_commit`: Automatically commit version file changes
- `auto_push`: Automatically push commits and tags (use with caution)
- `tag_prefix`: Prefix for version tags (default: `v`)

## Installation

### Install Git Hooks

```bash
# Make script executable
chmod +x scripts/install_hooks.sh

# Install hooks
./scripts/install_hooks.sh
```

This will copy hooks from `.githooks/` to `.git/hooks/` and make them executable.

### Verify Installation

```bash
# Check installed hooks
ls -la .git/hooks/

# Test version bump (dry run)
python3 scripts/bump_version.py --dry-run
```

## CI/CD Integration

### Jenkins

The versioning system integrates with Jenkins pipeline. See `Jenkinsfile` for the version bump stage.

### GitHub Actions

Example workflow:

```yaml
name: Version Bump

on:
  push:
    branches: [main]

jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for version comparison
      
      - name: Bump version
        run: python3 scripts/bump_version.py
      
      - name: Generate changelog
        run: python3 scripts/generate_changelog.py
      
      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add VERSION frontend/package.json CHANGELOG.md
          git commit -m "chore: bump version [skip ci]" || exit 0
          git push origin main --tags
```

## Best Practices

### 1. Small, Focused Commits

Keep commits focused on single changes to maintain accurate file counts.

### 2. Use Conventional Commits

Follow conventional commit format for better changelogs.

### 3. Review Before Merge

Check file count before merging to ensure appropriate version bump.

### 4. Manual Override When Needed

Use `--type` flag to force specific version bump if automatic detection is incorrect.

### 5. Keep Changelog Updated

The changelog is automatically generated, but you can manually edit for clarity.

## Troubleshooting

### Hook Not Running

```bash
# Reinstall hooks
./scripts/install_hooks.sh

# Check hook is executable
chmod +x .git/hooks/post-merge
```

### Wrong Version Bump

```bash
# Manually set correct version
echo "1.0.3" > VERSION

# Update package.json manually
# Then create tag
git tag -a v1.0.3 -m "Release v1.0.3"
```

### Skip Auto-Versioning

Add `[skip ci]` or `[no version]` to commit message to skip automatic versioning.

## Version History

- **v1.0.2** (2025-12-03): Current version
  - Session management system
  - Automatic versioning implementation
  - Theme persistence fixes
