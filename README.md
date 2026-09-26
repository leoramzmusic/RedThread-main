<div align="center">

[English](README.en.md) | **Español**

<img src="img/assets/mockup.jpg" alt="RedThread — vista previa de la aplicación" width="100%">

# 🧵 Red Thread (RETH) — Plataforma de Conexiones Significativas

**Inspirada en la leyenda del hilo rojo: un lazo invisible une a quienes están destinados a encontrarse.**

[![CI](https://github.com/leoramzmusic/RedThread-main/actions/workflows/ci.yml/badge.svg)](https://github.com/leoramzmusic/RedThread-main/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

**Red Thread (RETH)** es una plataforma social experimental para crear **conexiones significativas** —amistad, romance, proyectos, gaming y conversación— con bienestar digital y herramientas de autocuidado en el centro de la experiencia. Porque conocer gente no debería agotarte.

## 🎯 Objetivos

- Ofrecer una experiencia social más **consciente y saludable**.
- Integrar modos de descubrimiento únicos: **Para ti · Opuestos · A ciegas · Libre**.
- Desarrollar herramientas de bienestar como el **Temportalizador**.
- Fomentar la **colaboración abierta** con la comunidad.

## ✨ Funcionamiento

- **Perfiles dinámicos** con intereses, playlists y vibras.
- Motor **CARE** de descubrimiento inteligente: **C**ompatibilidad · **A**utenticidad · **R**esponsividad · **E**ngagement → [Estado actual](docs/CARE_ALGORITHM.md) · [Hoja de ruta](docs/CARE_ROADMAP.md).
- **Chat en tiempo real**, radar de proximidad y ruleta de conversación.
- Herramientas de **descanso y energía social** para gestionar tu tiempo en la app.
- 🌍 21 idiomas · portal de usuario · panel admin con editor visual del landing.

## 🚀 Instalación rápida

```bash
git clone https://github.com/leoramzmusic/RedThread-main.git
cd RedThread-main
docker compose -f docker/docker-compose.local.yml up --build
```

- 🌐 Frontend: http://localhost:3000
- ⚙️ API Gateway: http://localhost:8000

¿Sin Docker? Levanta MongoDB y Redis en local y corre `cd frontend && npm ci && npm run dev`.

> 📖 **¿Eres desarrollador?** La guía técnica completa —arquitectura, variables de entorno, tests, convenciones— está en **[docs/README.md](docs/README.md)**.

## 🤝 Comunidad y apoyo

Este proyecto está abierto a colaboración. Puedes contribuir con **código, ideas o apoyo financiero** para ayudarlo a crecer:

- 🐛 **Abre un [issue](https://github.com/leoramzmusic/RedThread-main/issues)** — bugs, ideas o preguntas.
- 💻 **Contribuye**: haz *fork*, crea tu rama y envía un PR (guía en [docs/README.md](docs/README.md#cómo-contribuir)).
- 👥 **Únete al equipo** si quieres aportar en frontend, backend o diseño.
- 💛 **Donaciones**: próximamente vía GitHub Sponsors / OpenCollective.
- 💬 **Canales en vivo** (Discord/Telegram): próximamente.

## 📜 Licencia

**MIT License** © 2025 Roberto Leonel Pérez Ramírez — ver [LICENSE](LICENSE).
