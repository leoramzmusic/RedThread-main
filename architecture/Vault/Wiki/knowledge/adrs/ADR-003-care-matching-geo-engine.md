# ADR-003: Motor CARE (Context-Aware Recommendation Engine) y Matching Híbrido

- **Estado**: Aceptado
- **Fecha**: 2026-02-20
- **Decisores**: Algoritmos & Producto
- **Código Relacionado**:
  - [[backend/src/api/discovery.py]]
  - [[backend/src/services/matching_service.py]]
  - [[backend/src/care/ranking/]]
  - [[backend/src/care/models/user_profile.py]]
  - [[backend/src/models/relationship.py]]

---

## 🎯 Contexto y Problema
El emparejamiento no debe ser simplemente un filtrado booleano de edad y distancia (estilo apps tradicionales), sino un sistema multidimensional que evalúe estilo de comunicación, valores, neurodiversidad, intereses compartidos y factores emocionales (música, rompehielos, metas de vida).

## ⚖️ Decisión
Diseñar el motor **CARE**:
1. **Fase 1 (Filtrado Duro)**: Exclusiones obligatorias (bloqueos, género incompatible, rango de edad estricto, fronteras geográficas basadas en el tier de usuario).
2. **Fase 2 (Scoring Heurístico Ponderado)**:
   - Proximidad espacial ($w_{geo}$)
   - Afinidad de valores e intereses ($w_{interests}$)
   - Estilo de comunicación y lenguaje de amor ($w_{lifestyle}$)
   - Compatibilidad musical / Spotify ($w_{music}$)
3. **Fase 3 (Diversidad y Ranking)**: Evitar monopolización de perfiles hipervisibles, distribuyendo visibilidad a perfiles nuevos o compatibles.

## 📊 Consecuencias
- Resultados de alta calidad emocional para los usuarios.
- Complejidad algorítmica mitigada mediante índices geoespaciales y precálculo de vectores de intereses.
