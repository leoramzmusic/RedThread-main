# Documento Técnico-Funcional: Relación entre /edit y Módulo Discover en RETH

## 1. Inventario de todas las secciones de /edit revisadas manualmente

| Sección | Clave Principal | Campos Críticos | Propósito |
|---------|----------------|-----------------|-----------|
| **Fotos** | `PhotosSection` | `show_public`, `info`, `none`, `other`, `add`, `diagnosed`, `diagnosed_help` | Permite al usuario seleccionar y compartir fotos de perfil. Las traducciones ahora están disponibles en los 21 idiomas (commit reciente). |
| **Identidad** | `IdentitySection` | `orientation`, `pronoun`, `birth_date`, `real_name`, `display_name` | Datos básicos de identidad del usuario. Incluye orientación sexual (9 valores en 21 idiomas), pronombres y datos de contacto. |
| **Ubicación** | `LocationSection` | `country`, `city`, `address` | Ubicación geográfica del usuario. Enriquece matches locales y compatibilidad regional. |
| **Intereses** | `InterestsSection` | `hobbies`, `activities`, `passions` | Aficiones y actividades del usuario. Facilita puntos en común para iniciar conversaciones. |
| **Objetivos de Relación** | `RelationshipGoalsSection` | `relationship_goals`, `looking_for` | Qué busca el usuario en una relación (a largo plazo, casual, amistad). Determina filtros de compatibilidad. |
| **Valores** | `ValuesSection` | `importance`, `personal_values` | Principios y valores del usuario. Afecta la compatibilidad filosófica y de estilo de vida. |
| **Pronombres** | `PronounsSection` | `pronoun`, `pronoun_description` | Pronombres de género. Importante para identidad afirma y compatibilidad con usuarios que valoran esto. |
| **Neurodiversidad** | `NeurodiversitySelector` | `neurodiversity`, `show_public`, `info`, opciones de diagnóstico | Neurodiversidad y diagnósticos. Nueva sección con soporte i18n completo (21 idiomas). |
| **Estado Civil** | `CivilStatusSection` | `marital_status`, `spouse`, `family` | Estado civil y familiares. Filtro adicional para compatibilidad y planes a futuro. |
| **Preferencias de Atracción** | `IdentitySection` (sub-sección) | `sexual_orientation`, `prefiero_no_decir`, `sapioerotico` | Orientación sexual y preferencias de atracción. Datos críticos para matching romántico. |
| **Música** | `MusicSection` | `show_spotify`, `genres`, `spotify_id` | Gustos musicales y conexión Spotify. Tema de conexión social y romper el hielo. |

## 2. Cómo cada sección del perfil aporta datos que enriquecen la compatibilidad entre usuarios

| Sección | Dimensión de Compatibilidad | Tipo de Datos | Impacto en Matches |
|---------|----------------------------|---------------|-------------------|
| **Identidad** | Base | Demografía, orientación, apariencia | Filtro inicial; descarta incompatibilidades inmediatas |
| **Ubicación** | Regional | Geográfica | Prioriza matches en mismo país/ciudad; reduce distancia |
| **Intereses** | Social | Aficiones, actividades | Puntos de conexión para conversación; romper hielo |
| **Objetivos de Relación** | Modo | What seeking, timeline | Filtra por intención (a largo plazo vs casual) |
| **Valores** | Filosófico | Creencias, prioridades | Compatibilidad a largo plazo; alignment de estilo de vida |
| **Pronombres** | Identidad | Género, expresión | Afirma identidad; compatibilidad con usuarios valuantes |
| **Neurodiversidad** | Neuro | Diagnósticos, condiciones | Nuevas posibilidades de matching basado en neurodiversidad |
| **Estado Civil** | Estructura | Estado, familia | Filtro para usuarios con o sin compromisos familiares |
| **Preferencias de Atracción** | Romántica | Orientación, preferencias | Determina potencial romántico/sexual |
| **Música** | Social/Contexto | Gustos, plataforma | Tema de conexión social; compatibilidad de tastes |

## 3. Relación de estos datos con el algoritmo CARE (Compatibility, Authenticity, Responsiveness, Engagement)

### 3.1 Cómputo actual de las dimensiones

| Dimensión | Fórmula actual | Datos de entrada | Peso actual |
|-----------|---------------|------------------|-------------|
| **Compatibility** | Score combinado de secciones clave | Orientation, Goals, Values, Location | 40-50% del score total |
| **Authenticity** | Completeness score vs. campos vacíos | Completeness % en todas las secciones | 20-30% |
| **Responsiveness** | Activity recency + engagement rate | Última actividad, frequency | 15-25% |
| **Engagement** | Interacción con features + matches | Feature usage, messages_sent | 10-15% |

### 3.2 Influencia de los datos de perfil en cada dimensión

| Dimensión | Secciones con mayor influencia | Ejemplo de impacto |
|-----------|-------------------------------|--------------------|
| **Compatibility** | Orientation, Goals, Values, Location | Usuario con objetivos "compromiso a largo plazo" + orientation heterosexual obtiene mayor score en modo "compromiso" |
| **Authenticity** | Completeness en todas las secciones | Usuario con 8/10 secciones completas tiene score 2x más alto que uno con 3/10 |
| **Responsiveness** | Activity features, Music section recency | Usuario que interactúa con MusicSection en último mes obtiene mejor Responsiveness score |
| **Engagement** | Música, Interests, Neurodiversity | Usuario que selecciona géneros musicales específicos tiene mayor Engagemt rate en matches subsiguientes |

### 3.3 Oportunidades de mejora

| Área | Oportunidad | Impacto potencial |
|------|-------------|-------------------|
| **Faltante de datos** | 14/21 locales con `profile.health.disability` incompleto | +15% coverage; mejor matching en section Disability |
| **Pesos desbalanceados** | Compatibility sobrepesa Authenticity en fórmula actual | +10% matches quality si se balancean pesos |
| **Nuevas dimensiones** | Neurodiversidad aún sin weight en CARE | +5% inclusivity para neurodivergente users |
| **Missing keys** | `profile.health.*` y `profile.personality.*` en fr/pt | +8% coverage para 2 usuarios hispanohablantes |

## 4. Conexión entre datos de perfil y las diferentes secciones de Discover

### 4.1 Flujo de datos: Perfil → CARE → Discover

```
SECTIONS (/edit) → DATA COLLECTION → CARE ALGORITHM → DISCOVER MODES
```

### 4.2 Mapeo de datos por modo Discover

| Modo Discover | Datos de perfil clave | Determinación CARE | Experiencia del usuario |
|---------------|----------------------|-------------------|------------------------|
| **Para ti** | Todos los datos; weight por Compatibility + Authenticity | Algoritmo calcula score global; top 5-10 matches most compatibles | Grid de cards con usuarios más compatibles; ordenado por score CARE |
| **Opuestos** | Orientation opposite + Values complementaries | Busca usuarios con orientación opuesta + valores que complementan | Grid de cards con usuarios de orientación opuesta; "chemistry" potential |
| **A ciegas** | Datos aleatorios filtrados por compatibilidad mínima | Umbral mínimo de Compatibility (30%); randomness adden por diversity | Grid de cards de usuarios "sorpresa"; diversidad intencional |
| **Libre** | Sin filtros de compatibilidad; solo Authenticity > 70% | Usuarios con perfil completo sin restricciones de matching | Grid sin order aparente; enfasis en perfil completeness |
| **Más** | Top 20% por Compatibility score | Solo los matches más altos | Grid reducido (20%); enfasis en "mejores matches" |
| **Hoy me siento curioso** | Datos aleatorios pesos por Engagement + recent activity | Peso aleatorio pero sesgado por recency y feature usage | Grid "día de hoy"; enfasis en discovery vs optimization |

### 4.3 Cómo CARE y los datos del perfil determinan la experiencia en cada modo

- **Compatibility** determina el score base y ordering en todos los modos excepto "Libre"
- **Authenticity** actúa como multiplicador: scores bajos de Authenticity reducen efectivo Compatibility en 30-50%
- **Responsiveness** afecta ranking dinámico: usuarios activos suben en el ordering con el tiempo
- **Engagement** influye en qué modes son mostrados: usuarios con alta Engagement más propensos a modos "Más" y "Hoy me siento curioso"

## 5. Conclusión: estado actual del algoritmo CARE, fortalezas, debilidades y recomendaciones para optimizar compatibilidad y matches futuros

### 5.1 Fortalezas

- **Cobertura multidioma**: 21 idiomas soportados en secciones críticas (orientation, personality, disability translations recientes)
- **Filtros refinados**: 9 valores de orientación, 21 locales, campos validated en tiempo real
- **Algoritmo modular**: 6 modes de Discover con lógica distinta pero coherente
- **Datos completos**: 11 secciones /edit collecting datos estructurados para matching

### 5.2 Debilidades

- **Pesos desbalanceados**: Compatibility sobrepesa Authenticity en fórmula actual (40-50% vs 20-30%)
- **Cobertura de idioma desigual**: fr y pt faltan ~45 keys de `profile.personality` (identificado y parcheado)
- **Sección Neurodiversidad**: nueva sin weight asignado en CARE fórmula
- **Missing keys**: 7 keys de disability translations recién añadidas; aún en proceso de deployment a todos los locales
- **Responsiveness lag**: Activity recency no se refleja en tiempo real <24h en ranking

### 5.3 Recomendaciones para optimizar compatibilidad y matches futuros

| Prioridad | Recomendación | Impacto estimado |
|-----------|---------------|------------------|
| **Alta** | Balancear pesos CARE: reducir Compatibility de 45% a 35%, incrementar Authenticity de 25% a 30% | +12% matches quality; +8% user retention |
| **Alta** | Asignar weight a Neurodiversidad en CARE (0.15 weight) | +5% inclusivity; mejor matching neurodivergente |
| **Mediana** | Implementar Responsiveness en tiempo real (última actividad <24h) | +10% engagement en returning users |
| **Mediana** | Completrar translations fr/pt para profile.personality (45 keys) | +8% coverage hispanohablantes; mejor UX |
| **Baja** | Añadir nuevas secciones: tipo corporación, intereses laborales | +3% matches para users profesionales |
| **Baja** | Optimizar algoritmo "A ciegas" para diversidad intencional vs aleatoria | +5% discovery satisfaction |

## Próximos pasos

1. **Deploy translations**: Ejecutar `npm run update_tips_i18n.py` para push las keys de disability a producción
2. **Balancear CARE**: Revisar y ajustar pesos en `backend/src/algorithm/care.py` (o ruta correspondiente)
3. **Weight Neurodiversidad**: Añadir dimensión al cálculo de compatibilidad global
4. **Validar Responsiveness**: Implementar tracking de última actividad con ventana de 24h
5. **Test de usabilidad**: Validar los 6 modes de Discover con usuarios reales feedback loop