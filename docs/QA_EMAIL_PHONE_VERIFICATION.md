# QA — Verificación de email y teléfono en el perfil

## Alcance

Verificación de identidad del usuario en la sección **Identidad** del editor de perfil
(`/profile/[nickname]/edit`) mediante código OTP de 6 dígitos para **email** y **teléfono**,
más un enlace alternativo de verificación por email (`/verify-email?token=`).

## Flujo de estados

### Teléfono (`profile.phone`, `phone_verified`)

```
pendiente                                      verificado
└── campo phone + botón "Verificar"            └── Chip verde "Verificado" + opción "Cambiar"
    └── POST /profiles/verify-phone              └── "Cambiar" → diálogo → PUT /profiles/me
        (usa user.phone guardado)                    → phone_verified = false (vuelve a pendiente)
        ├── 200 → OTP enviado, se abre diálogo 6 dígitos
        └── 429 → snackbar "espera unos segundos"
            └── POST /profiles/confirm-phone {code}
                ├── 200 → phone_verified = true → Chip verde
                ├── 400 → error inline "código inválido"
                └── reenvío: POST /profiles/resend-verification {channel:"phone"} (60 s)
```

### Email (`profile.email`, `email_verified`)

Ruta principal (OTP, idéntica a teléfono, con `POST /profiles/verify-email`,
`POST /profiles/confirm-email {code}`, reenvío con `channel:"email"`).

Ruta alternativa (enlace): el correo enviado incluye un enlace a
`/verify-email?token=<token>`; la página consume:
`POST /auth/verify-email-token {token}` → `200 {"email_verified":true}`.
La UI muestra el hint "también enviamos un enlace…" dentro del diálogo OTP.
Al verificar por enlace, `email_verified` quedará en `true` y el chip en el editor se mostrará verde.

### Tabla de transición pendiente → verificado

| Estado origen | Acción UI | Endpoint | Respuesta | Estado destino |
|---|---|---|---|---|
| Pendiente | Botón "Verificar" (email) | `POST /profiles/verify-email` | 200 | OTP enviado (diálogo abierto) |
| Pendiente | Botón "Verificar" (teléfono) | `POST /profiles/verify-phone` | 200 | OTP enviado (diálogo abierto) |
| OTP enviado | Enviar código | `POST /profiles/confirm-email` / `confirm-phone` `{code}` | 200 | **Verificado** |
| OTP enviado | Enviar código incorrecto | idem | 400 | Sigue pendiente + error inline |
| OTP enviado | Reenviar | `POST /profiles/resend-verification {channel}` | 200 | OTP reenviado (cooldown 60 s) |
| Pendiente (email) | Abrir enlace del correo | `POST /auth/verify-email-token {token}` | 200 | **Verificado** |
| Verificado | "Cambiar" (teléfono) | diálogo + `PUT /profiles/me` | 200 | Pendiente (hay que reverificar) |
| Cualquiera | Enviar antes de cooldown | cualquiera de envío | 429 | snackbar "espera unos segundos" |

## Comandos de verificación

```bash
docker exec redthread-backend pytest tests/test_verification.py -q   # 22 passed
docker exec redthread-backend pytest tests/test_profile_completion.py -q   # 3 fallos preexistentes (no relacionados)
```

Frontend (en `frontend/`): `npm run typecheck` (0 errores) y `npm run lint`
(0 errores; warnings preexistentes ajenos al feature).

## Catálogo i18n

32 claves nuevas, añadidas a `frontend/public/locales/{20 idiomas}/common.json`
(`am,ar,bn,de,en,es,fr,ha,hi,it,ja,ko,mi,ms,nl,pt,ru,sv,sw,tl,zh`), formateadas con
i18next-scanner (2 espacios, LF, sin BOM).

### `profile.sections.identity.verification.*` (24)

| Clave | Ejemplo (es) |
|---|---|
| `verified` | Verificado |
| `verifiedTooltip` | Tus datos están verificados |
| `verify` | Verificar |
| `change` | Cambiar |
| `changePhoneTitle` | ¿Cambiar número de teléfono? |
| `changePhoneBody` | Si cambias el número, tendrás que verificar el nuevo de nuevo. |
| `changeConfirm` | Aceptar |
| `cancel` | Cancelar |
| `verifyPhoneTitle` | Verificar número de teléfono |
| `verifyEmailTitle` | Verificar dirección de email |
| `codeBody` | Introduce el código de 6 dígitos que enviamos a {{target}} |
| `codeLabel` | Código de verificación |
| `confirmCode` | Verificar |
| `resend` | Reenviar código |
| `resendIn` | Reenviar en {{seconds}}s |
| `linkHint` | También enviamos un enlace de verificación a {{target}}. Puedes usarlo como alternativa. |
| `otpSent` | Código enviado a {{target}} |
| `phoneVerifiedSuccess` | Número de teléfono verificado con éxito |
| `emailVerifiedSuccess` | Dirección de email verificada con éxito |
| `invalidCode` | Código no válido o caducado |
| `genericError` | Algo salió mal. Inténtalo de nuevo. |
| `resendCooldown` | Espera unos segundos antes de reenviar el código. |
| `resendFailed` | No se pudo reenviar el código. Inténtalo de nuevo. |
| `sendFailed` | No se pudo enviar el código. Inténtalo de nuevo. |

### `auth.emailVerify*` (8)

| Clave | Ejemplo (es) |
|---|---|
| `emailVerifyTitle` | Verifica tu dirección de email |
| `emailVerifySubtitle` | Confirma tu dirección de email para verificar tu cuenta |
| `emailVerifySuccess` | ¡Tu dirección de email se ha verificado con éxito! |
| `emailVerifyError` | No pudimos verificar tu dirección de email. Inténtalo de nuevo. |
| `emailVerifyInvalid` | Este enlace de verificación no es válido o ha caducado. |
| `emailVerifyMissingToken` | El enlace de verificación no está en la dirección. |
| `emailVerifyGoToProfile` | Ir a mi perfil |
| `emailVerifyResendHint` | Si el enlace expiró, solicita un nuevo enlace desde la sección de identidad de tu perfil. |

## Archivos implicados

- Frontend: `frontend/src/pages/verify-email.tsx`, `frontend/src/components/profile/ProfileEdit.tsx`,
  `frontend/src/components/profile/edit/VerificationCodeDialog.tsx` (nuevo),
  `frontend/src/components/profile/edit/sections/BasicInfoSection.tsx`,
  `frontend/src/components/profile/edit/types.ts`, `frontend/public/locales/*/common.json`.
- Backend: `backend/src/api/profiles.py` (verify/confirm/resend), `backend/src/api/auth.py`
  (`verify-email-token`), `backend/src/services/verification_service.py`,
  `backend/src/services/sms_service.py`, `backend/src/services/mail_service.py`,
  `backend/src/models/user.py`, `backend/src/models/profile.py`, `backend/tests/test_verification.py`.