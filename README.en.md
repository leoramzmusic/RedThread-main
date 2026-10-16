<div align="center">

**English** | [Español](README.md)

<img src="img/assets/mockup.jpg" alt="RedThread — application preview" width="100%">

# 🧵 Red Thread (RETH) — Meaningful Connections Platform

**Inspired by the legend of the red thread: an invisible bond ties those who are destined to find each other.**

[![CI](https://github.com/leoramzmusic/RedThread-main/actions/workflows/ci.yml/badge.svg)](https://github.com/leoramzmusic/RedThread-main/actions/workflows/ci.yml)
[![License: Copyright](https://img.shields.io/badge/license-Copyright-blue.svg)](LICENSE)

</div>

---

**Red Thread (RETH)** is an experimental social platform for creating **meaningful connections** —friendship, romance, projects, gaming and conversation— with digital wellbeing and self-care tools at the heart of the experience. Because meeting people shouldn't drain you.

## 🎯 Goals

- Offer a more **conscious and healthy** social experience.
- Ship unique discovery modes: **For You · Opposites · Blind · Free**.
- Build wellbeing tools like the **Temportalizador**.
- Foster **open collaboration** with the community.

## ✨ How it works

- **Dynamic profiles** with interests, playlists and vibes.
- **CARE** intelligent discovery engine: **C**ompatibility · **A**uthenticity · **R**esponsiveness · **E**ngagement → [Current state](docs/CARE_ALGORITHM.md) · [Roadmap](docs/CARE_ROADMAP.md).
- **Real-time chat**, proximity radar and a conversation roulette.
- **Rest and social energy** tools to manage your time in the app.
- 🌍 21 languages · user portal · admin panel with a visual landing-page editor.

## 🚀 Quick start

```bash
git clone https://github.com/leoramzmusic/RedThread-main.git
cd RedThread-main
docker compose -f docker/docker-compose.local.yml up --build
```

- 🌐 Frontend: http://localhost:3000
- ⚙️ API Gateway: http://localhost:8000

No Docker? Run MongoDB and Redis locally, then `cd frontend && npm ci && npm run dev`.

> 📖 **Developer?** The full technical guide —architecture, environment variables, tests, conventions— lives in **[docs/README.en.md](docs/README.en.md)**.

## 🤝 Community and support

This project is open to collaboration. You can contribute with **code, ideas or financial support** to help it grow:

- 🐛 **Open an [issue](https://github.com/leoramzmusic/RedThread-main/issues)** — bugs, ideas or questions.
- 💻 **Contribute**: fork it, create your branch and send a PR (guide in [docs/README.en.md](docs/README.en.md#contributing)).
- 👥 **Join the team** if you want to help on frontend, backend or design.
- 💛 **Donations**: coming soon via GitHub Sponsors / OpenCollective.
- 💬 **Live channels** (Discord/Telegram): coming soon.

## 📜 License

**Copyright © 2026 Roberto Leonel Pérez Ramírez** — All rights reserved. See [LICENSE](LICENSE).
