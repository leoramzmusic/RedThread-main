#!/usr/bin/env python3
"""
Automatic Version Bumping Script for RedThread

Counts modified files and bumps version according to rules:
- < 20 files: No change (hotfix)
- 20-50 files: Patch increment (v1.0.x)
- 50-500 files: Minor increment (v1.x.0)
- > 500 files: Major increment (vX.0.0)
"""

import subprocess
import json
import sys
import argparse
from pathlib import Path
from typing import Tuple, Optional


def count_modified_files(base_branch: str = 'main') -> int:
    """Count files modified in current branch vs base branch"""
    try:
        # Try to get diff from base branch
        result = subprocess.run(
            ['git', 'diff', '--name-only', f'{base_branch}...HEAD'],
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode != 0:
            # Fallback: count staged and unstaged files
            result = subprocess.run(
                ['git', 'diff', '--name-only', 'HEAD'],
                capture_output=True,
                text=True,
                check=True
            )
        
        files = [f for f in result.stdout.strip().split('\n') if f]
        return len(files)
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Error counting files: {e}", file=sys.stderr)
        return 0


def determine_version_bump(file_count: int, rules: dict) -> str:
    """Determine version bump type based on file count and rules"""
    if file_count < rules['hotfix']['max_files']:
        return 'none'
    elif file_count < rules['patch']['max_files']:
        return 'patch'
    elif file_count < rules['minor']['max_files']:
        return 'minor'
    else:
        return 'major'


def parse_version(version_str: str) -> Tuple[int, int, int]:
    """Parse version string into (major, minor, patch) tuple"""
    parts = version_str.strip().split('.')
    if len(parts) != 3:
        raise ValueError(f"Invalid version format: {version_str}")
    return tuple(map(int, parts))


def bump_version(current_version: str, bump_type: str) -> str:
    """Increment version based on bump type"""
    major, minor, patch = parse_version(current_version)
    
    if bump_type == 'major':
        return f"{major + 1}.0.0"
    elif bump_type == 'minor':
        return f"{major}.{minor + 1}.0"
    elif bump_type == 'patch':
        return f"{major}.{minor}.{patch + 1}"
    else:  # none
        return current_version


def update_version_file(new_version: str) -> None:
    """Update VERSION file"""
    version_file = Path('VERSION')
    version_file.write_text(new_version + '\n')
    print(f"✅ Updated VERSION file")


def update_package_json(new_version: str) -> bool:
    """Update version in package.json if it exists"""
    package_json_path = Path('frontend/package.json')
    
    if not package_json_path.exists():
        print(f"ℹ️  package.json not found, skipping")
        return False
    
    try:
        data = json.loads(package_json_path.read_text())
        data['version'] = new_version
        package_json_path.write_text(json.dumps(data, indent=2) + '\n')
        print(f"✅ Updated package.json")
        return True
    except Exception as e:
        print(f"⚠️  Error updating package.json: {e}", file=sys.stderr)
        return False


def create_git_tag(version: str, tag_prefix: str = 'v') -> Optional[str]:
    """Create Git tag for version"""
    tag = f"{tag_prefix}{version}"
    
    try:
        # Check if tag already exists
        result = subprocess.run(
            ['git', 'tag', '-l', tag],
            capture_output=True,
            text=True,
            check=True
        )
        
        if result.stdout.strip():
            print(f"ℹ️  Tag {tag} already exists")
            return None
        
        # Create tag
        subprocess.run(
            ['git', 'tag', '-a', tag, '-m', f'Release {tag}'],
            check=True
        )
        print(f"✅ Created tag: {tag}")
        return tag
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Error creating tag: {e}", file=sys.stderr)
        return None


def commit_version_changes(version: str, config: dict) -> bool:
    """Commit version file changes"""
    if not config.get('auto_commit', False):
        return False
    
    try:
        # Stage files
        files_to_commit = ['VERSION']
        if Path('frontend/package.json').exists():
            files_to_commit.append('frontend/package.json')
        if Path('CHANGELOG.md').exists():
            files_to_commit.append('CHANGELOG.md')
        
        subprocess.run(['git', 'add'] + files_to_commit, check=True)
        
        # Commit
        message = config.get('commit_message_template', 'chore: bump version to {version}')
        message = message.format(version=version)
        
        subprocess.run(['git', 'commit', '-m', message], check=True)
        print(f"✅ Committed version changes")
        
        # Push if configured
        if config.get('auto_push', False):
            subprocess.run(['git', 'push', 'origin', 'HEAD', '--tags'], check=True)
            print(f"✅ Pushed changes and tags")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Error committing changes: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description='Automatic version bumping for RedThread')
    parser.add_argument('--type', choices=['patch', 'minor', 'major'], help='Force specific bump type')
    parser.add_argument('--dry-run', action='store_true', help='Show what would happen without making changes')
    parser.add_argument('--base-branch', default='main', help='Base branch for comparison (default: main)')
    args = parser.parse_args()
    
    # Load configuration
    config_path = Path('.versionrc.json')
    if not config_path.exists():
        print(f"❌ Configuration file not found: {config_path}", file=sys.stderr)
        sys.exit(1)
    
    config = json.loads(config_path.read_text())
    
    # Get current version
    version_file = Path('VERSION')
    if not version_file.exists():
        print(f"❌ VERSION file not found", file=sys.stderr)
        sys.exit(1)
    
    current_version = version_file.read_text().strip()
    print(f"📦 Current version: {current_version}")
    
    # Determine bump type
    if args.type:
        bump_type = args.type
        print(f"🔧 Forced bump type: {bump_type}")
    else:
        file_count = count_modified_files(args.base_branch)
        print(f"📊 Files modified: {file_count}")
        bump_type = determine_version_bump(file_count, config['rules'])
        print(f"🔄 Determined bump type: {bump_type}")
    
    # Calculate new version
    new_version = bump_version(current_version, bump_type)
    
    if new_version == current_version:
        print(f"ℹ️  Version unchanged: {current_version}")
        if bump_type == 'none':
            print(f"💡 Tip: Less than {config['rules']['hotfix']['max_files']} files modified (hotfix threshold)")
        sys.exit(0)
    
    print(f"⬆️  Version bump: {current_version} → {new_version}")
    
    if args.dry_run:
        print(f"🔍 Dry run mode - no changes made")
        sys.exit(0)
    
    # Update version files
    update_version_file(new_version)
    update_package_json(new_version)
    
    # Create Git tag
    tag = create_git_tag(new_version, config.get('tag_prefix', 'v'))
    
    # Commit changes if configured
    commit_version_changes(new_version, config)
    
    print(f"\n✅ Version bumped successfully to {new_version}!")
    if tag:
        print(f"🏷️  Git tag created: {tag}")


if __name__ == '__main__':
    main()
