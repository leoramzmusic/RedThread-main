# Automatización RedThread (Telegram + GitHub + Copilot + OpenCode)

## 1. Configuración local

Crea/abre `backend/config/local.env` (ya ignorado por git) y añade:

```env
TELEGRAM_BOT_TOKEN=8926665255:AAH...      # token del bot @reth_admin_bot
GITHUB_TOKEN=ghp_...                       # PAT con scopes repo, workflow
GITHUB_REPO=tu-usuario/RedThread-main      # de `git remote -v`
ALLOWED_TELEGRAM_USERS=123456789           # tu user id de Telegram
NOTIFY_CHAT_IDS=123456789                  # chat a notificar (puede ser el mismo)
AUTOMATION_WEBHOOK_SECRET=<genera-uno>     # python -c "import secrets; print(secrets.token_hex(32))"
```

## 2. Modo local (long-polling)

1. Arranca el backend: `cd backend && uvicorn src.main:app --reload`
2. En otra terminal: `python scripts/automation_poller.py`
3. Usa el bot: `/help`, `/idea "..."`, `/task "..."`, `/status`, `/list`, `/done <n>`

## 3. Webhooks (producción / red pública)

Telegram:
```
POST {BASE}/automation/telegram/webhook
Header: X-Telegram-Bot-Api-Secret-Token: <AUTOMATION_WEBHOOK_SECRET>
```
Registra el webhook en Telegram:
```
curl -s -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d url="https://TU-DOMINIO/automation/telegram/webhook" \
  -d secret_token="<AUTOMATION_WEBHOOK_SECRET>"
```

GitHub: repositorio > Settings > Webhooks > Add webhook
- URL: `https://TU-DOMINIO/automation/github/webhook`
- Content type: `application/json`
- Secret: `<AUTOMATION_WEBHOOK_SECRET>` (mismo)
- Events: `Pull requests` + `Issues`

## 4. Pipeline de Copilot (GitHub Actions)

1. `/task "descripción"` crea un issue con label `task`.
2. El workflow `copilot-generation.yml` instala `@github/copilot`, ejecuta
   `copilot -p ... --no-ask-user` (auth con `GITHUB_TOKEN`, permiso
   `copilot-requests: write`) y abre un PR con label `copilot-generated`.
3. `notify-telegram.yml` (o el webhook de GitHub) avisa por Telegram.
4. Aplica el PR localmente: `python scripts/pull_copilot_pr.py <pr>`.
5. Prueba, mergea y cierra con `/done <issue>`.

> Requisito: tu cuenta GitHub debe tener activa una suscripción de Copilot en
> repo personal (o políticas de organización con `copilot-requests` habilitado).

## 5. Secretos de GitHub (solo para notify-telegram.yml)

Si usas el workflow de notificación (recomendado, no depende de URL pública):
- `TELEGRAM_BOT_TOKEN` → token del bot
- `TELEGRAM_CHAT_ID` → chat de destino

## 6. Verificación rápida

- `GET /automation/health` → `{"status": "ok", "telegram": "configurado", ...}`
- Desde Telegram: `/idea "probar pipeline"` → debe crear un issue.
- `/status` → muestra el resumen.
