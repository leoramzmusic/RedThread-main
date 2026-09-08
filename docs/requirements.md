# Red Thread - Requisitos del Proyecto

Red social que combine lo mejor de Tinder, Instagram, Boo, Omegle y TikTok (sin video). La app debe permitir que cualquier persona mayor de edad pueda interactuar para diferentes fines (amor, amistad, citas, jugar videojuegos, o simplemente platicar) y debe ser segura para evitar delitos o abusos.

---

### Menús principales
- **Inicio / Dashboard**
  - Resumen de actividad (matches, conversaciones recientes, sugerencias).
  - Acceso rápido a la ruleta de conversación.
- **Perfil**
  - Bio, fotos, gustos, playlists (Spotify), integraciones (Instagram, Discord/Steam).
  - Configuración de visibilidad y privacidad.
  - Verificación opcional (foto gestual, documento).
- **Descubrimiento**
  - Swipe clásico (like/pass/superlike).
  - Filtros avanzados.
  - Afinidad mostrada en porcentaje.
  - **Función gratuita:** ver quién te dio like.
- **Ruleta de Conversación (tipo Omegle)**
  - Emparejamiento aleatorio con afinidad mínima.
  - Timer opcional (ej. 5 min).
  - Filtros por idioma/tema.
- **Chat**
  - Conversaciones activas.
  - Texto, audio breve, imágenes.
  - Traducción automática opcional.
  - Icebreakers seguros.
- **Radar / Cercanía**
  - Usuarios cercanos (opt-in).
  - Eventos sociales o grupos locales.
- **Comunidades**
  - Salas temáticas (música, gaming, anime, filosofía, psicología).
  - Posteo seguro con moderación.
- **Eventos Virtuales**
  - Sesiones temáticas exclusivas (cine, gaming, música).
- **Premium**
  - Filtros avanzados pro.
  - Super radar (alcance ampliado).
  - Rewind.
  - Afinidad detallada y estadísticas.
  - Traducción automática en chat.
  - Videollamadas.
  - Perfil Pro (más fotos, playlists, personalización).
- **Seguridad**
  - Bloqueo y reporte siempre visibles.
  - Lista de bloqueados.
  - Configuración granular de privacidad.
  - Auditoría de sesiones.
- **Ajustes**
  - Idioma y accesibilidad.
  - Notificaciones.
  - Tema claro/oscuro.
  - Audio/Video.
  - Exportación/eliminación de datos.

---

### Funcionalidades principales
- Autenticación 18+ con verificación de edad.
- Perfiles enriquecidos con intereses ilimitados.
- Integraciones con Instagram y Spotify.
- Descubrimiento híbrido (swipe + grid).
- Ruleta aleatoria segura con afinidad mínima.
- Chat en tiempo real con traducción y notas de voz.
- Radar de proximidad con consentimiento.
- Comunidades temáticas y eventos virtuales.
- Premium avanzado (sin “ver quién te dio like”).
- Moderación integral: detección de lenguaje ofensivo, spam, grooming, fraude.
- Privacidad y consentimiento explícito en cada función.
- Accesibilidad: multilenguaje, lector de pantalla, contraste alto.

---

### Algoritmo de afinidad
- **Intereses comunes:** coincidencia ponderada (favoritos > secundarios).
- **Música (Spotify):** coincidencia de artistas, playlists, géneros relacionados.
- **Personalidad (MBTI/Big Five):** compatibilidad tipológica y complementariedad de rasgos.
- **Actividad y horarios:** coincidencia de disponibilidad y patrones de uso.
- **Objetivo de interacción:** cita, amistad, gaming, conversación casual.
- **Proximidad (opt-in):** radar y comunidades compartidas.
- **Salud del perfil:** penalizadores por reportes válidos o spam; boost por verificación.
- **Score final 0–100:** mostrado en la card de descubrimiento con desglose simple.

---

### Seguridad integral
- Normas claras y consentimiento explícito.
- Bloqueo y reporte accesibles en todo momento.
- Moderación proactiva (texto, imágenes, audio).
- Rate limiting y anti-spam.
- Detección de fraude y scam.
- Reputación dinámica del perfil.
- Auditoría de acciones y logs.
- Autenticación reforzada (MFA opcional).
- Encriptación de datos sensibles.
- Gestión de secretos y permisos mínimos.
- Backups encriptados y pruebas de restauración.
- Educación in-app sobre seguridad y estafas comunes.

---

### Planes Premium
- **Gratuito:** ver quién te dio like, swipe, chat básico, radar básico, comunidades.
- **Premium:** filtros avanzados, rewind, super radar, afinidad detallada, traducción automática, videollamadas, perfil pro.
- **Avanzado (VIP):** acceso a eventos virtuales exclusivos, comunidades VIP, estadísticas sociales completas, apoyo a creadores (donaciones/tips estilo Twitch/Patreon, sin contenido sexual explícito).
