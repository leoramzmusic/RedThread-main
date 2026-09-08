#!/usr/bin/env python3
"""
Changelog Generator for RedThread

Generates changelog entries from Git commits since last version tag.
Supports conventional commit format for better categorization.
"""

import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict
import re


def get_last_tag() -> str:
    """Get the last version tag"""
    try:
        result = subprocess.run(
            ['git', 'describe', '--tags', '--abbrev=0'],
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return None


def get_commits_since_tag(tag: str = None) -> List[str]:
    """Get commit messages since last tag"""
    if tag:
        cmd = ['git', 'log', f'{tag}..HEAD', '--pretty=format:%s']
    else:
        cmd = ['git', 'log', '--pretty=format:%s']
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', check=True)
        commits = [c for c in result.stdout.split('\n') if c.strip()]
        return commits
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Error getting commits: {e}", file=sys.stderr)
        return []


def categorize_commits(commits: List[str]) -> Dict[str, List[str]]:
    """Categorize commits by conventional commit type"""
    categories = {
        '✨ Features': [],
        '🐛 Bug Fixes': [],
        '⚡ Performance': [],
        '📝 Documentation': [],
        '♻️  Refactoring': [],
        '✅ Tests': [],
        '🔧 Configuration': [],
        '🎨 Style': [],
        '📦 Other': []
    }
    
    # Conventional commit patterns
    patterns = {
        r'^feat(\(.+\))?:': '✨ Features',
        r'^fix(\(.+\))?:': '🐛 Bug Fixes',
        r'^perf(\(.+\))?:': '⚡ Performance',
        r'^docs(\(.+\))?:': '📝 Documentation',
        r'^refactor(\(.+\))?:': '♻️  Refactoring',
        r'^test(\(.+\))?:': '✅ Tests',
        r'^chore(\(.+\))?:': '🔧 Configuration',
        r'^style(\(.+\))?:': '🎨 Style',
    }
    
    for commit in commits:
        categorized = False
        
        for pattern, category in patterns.items():
            if re.match(pattern, commit, re.IGNORECASE):
                # Remove the prefix for cleaner changelog
                clean_commit = re.sub(r'^[a-z]+(\(.+\))?:\s*', '', commit, flags=re.IGNORECASE)
                categories[category].append(clean_commit)
                categorized = True
                break
        
        if not categorized:
            categories['📦 Other'].append(commit)
    
    return categories


def generate_changelog_entry(version: str, categories: Dict[str, List[str]]) -> str:
    """Generate markdown changelog entry for version"""
    date = datetime.now().strftime('%Y-%m-%d')
    entry = f"\n## [{version}] - {date}\n\n"
    
    for category, items in categories.items():
        if items:
            entry += f"### {category}\n\n"
            for item in items:
                entry += f"- {item}\n"
            entry += "\n"
    
    return entry


def update_changelog(version: str, entry: str) -> None:
    """Update CHANGELOG.md with new version entry"""
    changelog_path = Path('CHANGELOG.md')
    
    if changelog_path.exists():
        content = changelog_path.read_text(encoding='utf-8')
        
        # Find where to insert (after header, before first version)
        lines = content.split('\n')
        insert_index = 0
        
        for i, line in enumerate(lines):
            if line.startswith('## ['):
                insert_index = i
                break
        
        if insert_index == 0:
            # No existing versions, insert after header
            for i, line in enumerate(lines):
                if line.strip() and not line.startswith('#'):
                    insert_index = i
                    break
        
        lines.insert(insert_index, entry.rstrip())
        changelog_path.write_text('\n'.join(lines), encoding='utf-8')
    else:
        # Create new changelog
        header = """# Changelog

All notable changes to RedThread will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

"""
        changelog_path.write_text(header + entry, encoding='utf-8')
    
    print(f"✅ Updated CHANGELOG.md")


def main():
    # Get current version
    version_file = Path('VERSION')
    if not version_file.exists():
        print(f"❌ VERSION file not found", file=sys.stderr)
        sys.exit(1)
    
    version = version_file.read_text(encoding='utf-8').strip()
    print(f"📦 Generating changelog for version {version}")
    
    # Get commits since last tag
    last_tag = get_last_tag()
    if last_tag:
        print(f"📊 Commits since {last_tag}")
    else:
        print(f"📊 All commits (no previous tags)")
    
    commits = get_commits_since_tag(last_tag)
    
    if not commits:
        print(f"ℹ️  No commits found")
        sys.exit(0)
    
    print(f"📝 Found {len(commits)} commits")
    
    # Categorize commits
    categories = categorize_commits(commits)
    
    # Generate changelog entry
    entry = generate_changelog_entry(version, categories)
    
    # Update changelog file
    update_changelog(version, entry)
    
    print(f"\n✅ Changelog generated successfully!")


if __name__ == '__main__':
    main()
