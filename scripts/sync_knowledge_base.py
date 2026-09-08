"""
Sync Knowledge Base and generate Obsidian Canvas with typed relationship edges.
Purple/Blue lines: Code-to-code calls and imports.
Yellow/Green lines: Code-to-ADR/docs and architectural notes.
"""

import json
import os
import sys
import subprocess

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def create_obsidian_config():
    """Create .obsidian folder configuration so Graph View is pre-configured with color groups"""
    os.makedirs(".obsidian", exist_ok=True)
    
    app_config = {
        "showLineNumber": True,
        "useMarkdownLinks": False,
        "promptDelete": False
    }
    with open(".obsidian/app.json", "w", encoding="utf-8") as f:
        json.dump(app_config, f, indent=2)
        
    # Pre-configure Obsidian native Graph View filters and color groups
    graph_config = {
        "collapse-filter": False,
        "search": "",
        "localJumps": 1,
        "colorGroups": [
            {
                "query": "path:knowledge/adrs",
                "color": {"a": 1, "rgb": 16766720}  # Yellow/Gold for ADRs
            },
            {
                "query": "path:knowledge/audits",
                "color": {"a": 1, "rgb": 52377}     # Green for Audits
            },
            {
                "query": "path:backend",
                "color": {"a": 1, "rgb": 10040319}   # Purple for Backend Code
            },
            {
                "query": "path:frontend",
                "color": {"a": 1, "rgb": 3394815}    # Blue/Cyan for Frontend Code
            }
        ]
    }
    with open(".obsidian/graph.json", "w", encoding="utf-8") as f:
        json.dump(graph_config, f, indent=2)
    print("✅ .obsidian vault configuration generated.")


def build_unified_canvas():
    """Generate redthread_architecture.canvas with strict visual relationship typing"""
    
    nodes = [
        # ============================================================
        # 1. KNOWLEDGE & ADR LAYER (TOP: Y: -600 to -150)
        # ============================================================
        {
            "id": "grp-adrs",
            "type": "group",
            "label": "📜 DECISIONES DE ARQUITECTURA (@adr) & NOTAS TÉCNICAS",
            "x": -1150,
            "y": -580,
            "width": 4200,
            "height": 450,
            "color": "3" # Yellow
        },
        {
            "id": "adr-hub",
            "type": "text",
            "text": "## 🧠 RedThread Unified Knowledge Base\n- **Index**: `knowledge/index.md`\n- **Base de Datos Semántica**: `.codegraph/codegraph.db`\n- **Regla de Relación Visual**:\n  - 🟣/🔵 **Líneas Moradas/Azules**: Código -> Código (importaciones y llamadas)\n  - 🟡/🟢 **Líneas Amarillas/Verdes**: Código -> ADRs & Documentación Viva (@adr)",
            "x": -1100,
            "y": -520,
            "width": 520,
            "height": 260,
            "color": "3"
        },
        {
            "id": "adr-001",
            "type": "text",
            "text": "### @adr [[ADR-001]]\n**FastAPI + Beanie + MongoDB**\n- ODM asíncrono con Pydantic v2.\n- Soporte GeoJSON `2dsphere` nativo.\n- [Ver nota](file:///knowledge/adrs/ADR-001-fastapi-beanie-mongodb.md)",
            "x": -530,
            "y": -520,
            "width": 420,
            "height": 220,
            "color": "3"
        },
        {
            "id": "adr-002",
            "type": "text",
            "text": "### @adr [[ADR-002]]\n**Stateless JWT + Redis Blacklist**\n- Tokens duales (Access + Refresh).\n- Revocación instantánea por JTI en Redis.\n- [Ver nota](file:///knowledge/adrs/ADR-002-jwt-redis-session-management.md)",
            "x": -60,
            "y": -520,
            "width": 420,
            "height": 220,
            "color": "3"
        },
        {
            "id": "adr-003",
            "type": "text",
            "text": "### @adr [[ADR-003]]\n**Motor CARE & Matching Híbrido**\n- Proximidad espacial + Afinidad musical/intereses.\n- A/B Testing y ranking equilibrado.\n- [Ver nota](file:///knowledge/adrs/ADR-003-care-matching-geo-engine.md)",
            "x": 410,
            "y": -520,
            "width": 420,
            "height": 220,
            "color": "3"
        },
        {
            "id": "adr-004",
            "type": "text",
            "text": "### @adr [[ADR-004]]\n**Next.js 16 (Turbopack) + Redux**\n- Fast HMR y bundle splitting.\n- Estado reactivo centralizado desacoplado de UI.\n- [Ver nota](file:///knowledge/adrs/ADR-004-nextjs-turbopack-redux.md)",
            "x": 880,
            "y": -520,
            "width": 420,
            "height": 220,
            "color": "3"
        },
        {
            "id": "adr-005",
            "type": "text",
            "text": "### @adr [[ADR-005]]\n**RBAC & Portal de Empleados**\n- Separación estricta User vs Employee.\n- Pistas de auditoría inmutables.\n- [Ver nota](file:///knowledge/adrs/ADR-005-rbac-multi-tier-admin.md)",
            "x": 1350,
            "y": -520,
            "width": 420,
            "height": 220,
            "color": "3"
        },
        {
            "id": "adr-006",
            "type": "text",
            "text": "### @adr [[ADR-006]]\n**Apache Kafka Event Bus**\n- 6 tópicos desacoplados + 4 consumers.\n- acks='all', idempotencia, gzip.\n- [Ver nota](file:///knowledge/adrs/ADR-006-kafka-event-bus.md)",
            "x": 1820,
            "y": -520,
            "width": 420,
            "height": 220,
            "color": "3"
        },
        {
            "id": "node-audit",
            "type": "text",
            "text": "### 🔍 [[Architecture_Audit]]\n**Auditoría de Salud Técnica**\n- 0 acoplamientos circulares.\n- Geoespacial indexado.\n- WebSockets con Redis Broker.\n- [Ver auditoría](file:///knowledge/audits/Architecture_Audit.md)",
            "x": 2290,
            "y": -520,
            "width": 420,
            "height": 220,
            "color": "4" # Green
        },

        # ============================================================
        # 2. CODE LAYERS (Y: 0 to 1100)
        # ============================================================
        # --- FRONTEND GROUP ---
        {
            "id": "grp-frontend",
            "type": "group",
            "label": "🖥️ FRONTEND (Next.js 16 + Turbopack)",
            "x": -1150,
            "y": 0,
            "width": 900,
            "height": 1050,
            "color": "5" # Cyan
        },
        {
            "id": "fn-app",
            "type": "text",
            "text": "### App Root & Providers\n- `frontend/src/pages/_app.tsx`\n- Redux Provider, MUI Theme, Auth Guard.",
            "x": -1100,
            "y": 60,
            "width": 380,
            "height": 130,
            "color": "5"
        },
        {
            "id": "fn-store",
            "type": "text",
            "text": "### Redux Global Store\n- `frontend/src/store/index.ts`\n- Slices: `authSlice.ts`, `chatSlice.ts`",
            "x": -670,
            "y": 60,
            "width": 380,
            "height": 130,
            "color": "5"
        },
        {
            "id": "fn-api-client",
            "type": "text",
            "text": "### Axios API Client\n- `frontend/src/services/api.ts`\n- JWT Bearer interceptor, base `:8000`",
            "x": -880,
            "y": 230,
            "width": 380,
            "height": 140,
            "color": "5"
        },
        {
            "id": "fn-pages-auth",
            "type": "text",
            "text": "### Auth Pages\n- `frontend/src/pages/auth/login.tsx`\n- Formik + Yup validaciones.",
            "x": -1100,
            "y": 420,
            "width": 380,
            "height": 130,
            "color": "5"
        },
        {
            "id": "fn-pages-discovery",
            "type": "text",
            "text": "### Discovery & Radar\n- `frontend/src/pages/discover/index.tsx`\n- Leaflet Geolocation & Swiping.",
            "x": -670,
            "y": 420,
            "width": 380,
            "height": 130,
            "color": "5"
        },
        {
            "id": "fn-pages-chat",
            "type": "text",
            "text": "### Chat UI & WS\n- `frontend/src/pages/chat/index.tsx`\n- WebSocket en tiempo real.",
            "x": -1100,
            "y": 590,
            "width": 380,
            "height": 130,
            "color": "5"
        },
        {
            "id": "fn-pages-portal",
            "type": "text",
            "text": "### Admin Portal UI\n- `frontend/src/pages/portal-redthread/index.tsx`\n- Dashboards, moderación y empleados.",
            "x": -670,
            "y": 590,
            "width": 380,
            "height": 130,
            "color": "5"
        },

        # --- BACKEND API GROUP ---
        {
            "id": "grp-api",
            "type": "group",
            "label": "🌐 BACKEND API & ROUTERS (FastAPI)",
            "x": -150,
            "y": 0,
            "width": 850,
            "height": 1050,
            "color": "2" # Orange
        },
        {
            "id": "api-main",
            "type": "text",
            "text": "### FastAPI Main Entrypoint\n- `backend/src/main.py`\n- Lifespan, CORS, Middleware, Routers.",
            "x": -100,
            "y": 60,
            "width": 350,
            "height": 140,
            "color": "2"
        },
        {
            "id": "api-auth",
            "type": "text",
            "text": "### Auth Router\n- `backend/src/api/auth.py`\n- `/auth/login`, `/auth/register`, `/auth/refresh`",
            "x": 300,
            "y": 60,
            "width": 350,
            "height": 140,
            "color": "2"
        },
        {
            "id": "api-discovery",
            "type": "text",
            "text": "### Discovery & Matching Router\n- `backend/src/api/discovery.py`\n- `/discovery/candidates`, `/discovery/radar`",
            "x": -100,
            "y": 240,
            "width": 350,
            "height": 140,
            "color": "2"
        },
        {
            "id": "api-chat",
            "type": "text",
            "text": "### Chat Router\n- `backend/src/api/chat.py`\n- WS `/ws/chat/{user_id}`, mensajes y conversaciones.",
            "x": 300,
            "y": 240,
            "width": 350,
            "height": 140,
            "color": "2"
        },
        {
            "id": "api-profiles",
            "type": "text",
            "text": "### Profiles & Users Router\n- `backend/src/api/profiles.py`\n- `backend/src/api/users.py`",
            "x": -100,
            "y": 420,
            "width": 350,
            "height": 140,
            "color": "2"
        },
        {
            "id": "api-admin",
            "type": "text",
            "text": "### Admin & RBAC Router\n- `backend/src/api/admin_portal.py`\n- `admin_usuarios.py`, `admin_empleados.py`",
            "x": 300,
            "y": 420,
            "width": 350,
            "height": 140,
            "color": "2"
        },

        # --- BACKEND SERVICES GROUP ---
        {
            "id": "grp-services",
            "type": "group",
            "label": "⚙️ BACKEND SERVICES & BUSINESS LOGIC",
            "x": 800,
            "y": 0,
            "width": 850,
            "height": 1050,
            "color": "3" # Yellow
        },
        {
            "id": "srv-core",
            "type": "text",
            "text": "### Core Config & DB Init\n- `backend/src/core/config.py`\n- `backend/src/core/database.py`\n- `backend/src/core/utils/security.py`",
            "x": 850,
            "y": 60,
            "width": 350,
            "height": 140,
            "color": "3"
        },
        {
            "id": "srv-redis",
            "type": "text",
            "text": "### Redis Service\n- `backend/src/services/redis_service.py`\n- Blacklist JWT, presencia, rate limiting.",
            "x": 1250,
            "y": 60,
            "width": 350,
            "height": 140,
            "color": "3"
        },
        {
            "id": "srv-discovery",
            "type": "text",
            "text": "### CARE Matching Service\n- `backend/src/services/matching_service.py`\n- `src/care/ranking/`",
            "x": 850,
            "y": 240,
            "width": 350,
            "height": 140,
            "color": "3"
        },
        {
            "id": "srv-chat",
            "type": "text",
            "text": "### Realtime Chat Service\n- `backend/src/services/chat/`\n- Conexiones WebSocket y broadcast.",
            "x": 1250,
            "y": 240,
            "width": 350,
            "height": 140,
            "color": "3"
        },
        {
            "id": "srv-employee",
            "type": "text",
            "text": "### Employee & RBAC Service\n- `backend/src/services/employee_service.py`\n- Validación de permisos y auditoría.",
            "x": 850,
            "y": 420,
            "width": 350,
            "height": 140,
            "color": "3"
        },
        {
            "id": "srv-kafka",
            "type": "text",
            "text": "### Apache Kafka Service\n- `backend/src/services/kafka_service.py`\n- `src/services/kafka_topics.py`\n- Consumers: `src/services/kafka_consumers/`",
            "x": 1250,
            "y": 420,
            "width": 350,
            "height": 140,
            "color": "3"
        },

        # --- DATA MODELS GROUP ---
        {
            "id": "grp-models",
            "type": "group",
            "label": "📦 DATA MODELS (MongoDB / Beanie ODM)",
            "x": 1750,
            "y": 0,
            "width": 800,
            "height": 1050,
            "color": "4" # Green
        },
        {
            "id": "mod-user",
            "type": "text",
            "text": "### User Model\n- `backend/src/models/user.py`\n- Colección: `users`",
            "x": 1800,
            "y": 60,
            "width": 330,
            "height": 130,
            "color": "4"
        },
        {
            "id": "mod-profile",
            "type": "text",
            "text": "### Profile Model\n- `backend/src/models/profile.py`\n- Colección: `profiles` (GeoJSON Point)",
            "x": 2180,
            "y": 60,
            "width": 330,
            "height": 130,
            "color": "4"
        },
        {
            "id": "mod-match",
            "type": "text",
            "text": "### Match & Relationship\n- `backend/src/models/match.py`\n- `backend/src/models/relationship.py`",
            "x": 1800,
            "y": 240,
            "width": 330,
            "height": 130,
            "color": "4"
        },
        {
            "id": "mod-chat",
            "type": "text",
            "text": "### Conversation & Message\n- `backend/src/models/conversation.py`\n- `backend/src/models/message.py`",
            "x": 2180,
            "y": 240,
            "width": 330,
            "height": 130,
            "color": "4"
        },
        {
            "id": "mod-admin",
            "type": "text",
            "text": "### Admin & Employee RBAC\n- `backend/src/models/admin_rbac.py`\n- `backend/src/models/employee.py`",
            "x": 1800,
            "y": 420,
            "width": 330,
            "height": 130,
            "color": "4"
        },

        # --- INFRASTRUCTURE GROUP ---
        {
            "id": "grp-infra",
            "type": "group",
            "label": "🐳 INFRAESTRUCTURA & STORAGE",
            "x": 300,
            "y": 1100,
            "width": 1850,
            "height": 380,
            "color": "1" # Red
        },
        {
            "id": "inf-docker",
            "type": "text",
            "text": "### Docker Compose\n- `docker/docker-compose.local.yml`",
            "x": 350,
            "y": 1160,
            "width": 380,
            "height": 120,
            "color": "1"
        },
        {
            "id": "inf-mongo",
            "type": "text",
            "text": "### MongoDB Database\n- Host: `localhost:27017` / DB: `redthread`",
            "x": 800,
            "y": 1160,
            "width": 420,
            "height": 120,
            "color": "1"
        },
        {
            "id": "inf-redis",
            "type": "text",
            "text": "### Redis Cache & PubSub\n- Host: `localhost:6379` / DB: `0`",
            "x": 1280,
            "y": 1160,
            "width": 380,
            "height": 120,
            "color": "1"
        },
        {
            "id": "inf-kafka",
            "type": "text",
            "text": "### Apache Kafka Broker\n- Host: `localhost:9092` / Zookeeper: `2181`",
            "x": 1720,
            "y": 1160,
            "width": 380,
            "height": 120,
            "color": "1"
        }
    ]

    edges = []
    edge_idx = 1

    # ============================================================
    # RULE 1: PURPLE / BLUE EDGES (color: "6" or "5")
    # CODE-TO-CODE: Imports, Function Calls, Endpoints, Persistence
    # ============================================================
    code_relations = [
        # Frontend code-to-code
        ("fn-app", "fn-api-client", "bottom", "top", "configures axios", "5"),
        ("fn-pages-auth", "fn-api-client", "top", "left", "dispatches login", "5"),
        ("fn-pages-discovery", "fn-api-client", "top", "right", "queries candidates", "5"),
        ("fn-pages-portal", "fn-api-client", "top", "bottom", "admin requests", "5"),
        
        # Frontend to Backend API
        ("fn-api-client", "api-main", "right", "left", "HTTP REST :8000", "6"),
        ("fn-pages-chat", "api-chat", "right", "left", "WebSocket /ws/chat", "6"),

        # Backend Main to Routers
        ("api-main", "api-auth", "right", "left", "includes router", "6"),
        ("api-main", "api-discovery", "bottom", "top", "includes router", "6"),
        ("api-main", "api-chat", "bottom", "top", "includes router", "6"),
        ("api-main", "api-profiles", "bottom", "top", "includes router", "6"),
        ("api-main", "api-admin", "right", "left", "includes router", "6"),

        # Routers to Services
        ("api-auth", "srv-core", "right", "left", "calls verify_pwd", "6"),
        ("api-discovery", "srv-discovery", "right", "left", "calls get_matches", "6"),
        ("api-chat", "srv-chat", "right", "left", "calls handle_ws", "6"),
        ("api-admin", "srv-employee", "right", "left", "checks permission", "6"),
        ("api-main", "srv-redis", "right", "left", "connect on startup", "6"),

        # Services to Models
        ("srv-core", "mod-user", "right", "left", "User.find_one()", "6"),
        ("srv-discovery", "mod-profile", "right", "left", "Profile.find()", "6"),
        ("srv-discovery", "mod-match", "right", "left", "Match.insert()", "6"),
        ("srv-chat", "mod-chat", "right", "left", "Message.insert()", "6"),
        ("srv-employee", "mod-admin", "right", "left", "AdminUser.find()", "6"),

        # Services/Models to Infra
        ("srv-core", "inf-mongo", "bottom", "top", "init_beanie()", "6"),
        ("srv-redis", "inf-redis", "bottom", "top", "redis.ping()", "6"),
        ("inf-docker", "inf-mongo", "right", "left", "provisions", "5"),
        ("inf-docker", "inf-redis", "right", "left", "provisions", "5"),

        # Kafka Event Bus connections
        ("api-discovery", "srv-kafka", "bottom", "top", "publishes rt.swipes & rt.matches", "6"),
        ("api-chat", "srv-kafka", "bottom", "top", "publishes rt.chat.messages", "6"),
        ("api-auth", "srv-kafka", "bottom", "top", "publishes rt.user.events", "6"),
        ("srv-kafka", "inf-kafka", "bottom", "top", "TCP 9092 : produce/consume", "6"),
        ("inf-docker", "inf-kafka", "right", "left", "provisions", "5")
    ]

    for src, dst, s_side, d_side, lbl, clr in code_relations:
        edges.append({
            "id": f"edge-code-{edge_idx}",
            "fromNode": src,
            "fromSide": s_side,
            "toNode": dst,
            "toSide": d_side,
            "label": lbl,
            "color": clr  # "6" Purple or "5" Blue
        })
        edge_idx += 1

    # ============================================================
    # RULE 2: YELLOW / GREEN EDGES (color: "3" or "4")
    # CODE-TO-ADR & DOCUMENTATION VIVA: (@adr [[Nota]], Audits)
    # ============================================================
    doc_relations = [
        # ADR-001: FastAPI, Beanie, MongoDB
        ("api-main", "adr-001", "top", "bottom", "@adr [[ADR-001]] Implements async app", "3"),
        ("srv-core", "adr-001", "top", "bottom", "@adr [[ADR-001]] Beanie ODM setup", "3"),
        ("mod-user", "adr-001", "top", "bottom", "@adr [[ADR-001]] Document schema", "3"),

        # ADR-002: JWT & Redis Session Management
        ("api-auth", "adr-002", "top", "bottom", "@adr [[ADR-002]] Dual token issuing", "3"),
        ("srv-redis", "adr-002", "top", "bottom", "@adr [[ADR-002]] Token blacklist & presence", "3"),

        # ADR-003: CARE Matching Engine
        ("api-discovery", "adr-003", "top", "bottom", "@adr [[ADR-003]] Geo-filtered search", "3"),
        ("srv-discovery", "adr-003", "top", "bottom", "@adr [[ADR-003]] Heuristic scoring", "3"),

        # ADR-004: Next.js Turbopack & Redux
        ("fn-app", "adr-004", "top", "bottom", "@adr [[ADR-004]] Next.js 16 root", "3"),
        ("fn-store", "adr-004", "top", "bottom", "@adr [[ADR-004]] Redux state architecture", "3"),

        # ADR-005: RBAC & Employee Portal
        ("api-admin", "adr-005", "top", "bottom", "@adr [[ADR-005]] Role-based authorization", "3"),
        ("srv-employee", "adr-005", "top", "bottom", "@adr [[ADR-005]] Employee audit trails", "3"),
        ("mod-admin", "adr-005", "top", "bottom", "@adr [[ADR-005]] AdminUser RBAC schema", "3"),

        # ADR-006: Apache Kafka Event Bus
        ("srv-kafka", "adr-006", "top", "bottom", "@adr [[ADR-006]] Event Bus & Topics", "3"),
        ("api-main", "adr-006", "top", "bottom", "@adr [[ADR-006]] Lifespan background consumers", "3"),

        # Architecture & Health Audit (Green - "4")
        ("node-audit", "srv-discovery", "bottom", "top", "Audits geo-spatial index", "4"),
        ("node-audit", "srv-chat", "bottom", "top", "Audits WebSocket scalability", "4"),
        ("node-audit", "inf-mongo", "bottom", "top", "Audits collection health", "4"),
        ("node-audit", "inf-redis", "bottom", "top", "Audits session cache TTL", "4")
    ]

    for src, dst, s_side, d_side, lbl, clr in doc_relations:
        edges.append({
            "id": f"edge-doc-{edge_idx}",
            "fromNode": src,
            "fromSide": s_side,
            "toNode": dst,
            "toSide": d_side,
            "label": lbl,
            "color": clr  # "3" Yellow or "4" Green
        })
        edge_idx += 1

    canvas_file = "redthread_architecture.canvas"
    with open(canvas_file, "w", encoding="utf-8") as f:
        json.dump({"nodes": nodes, "edges": edges}, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Canvas generado con tipado visual: {canvas_file}")
    print(f"   Total Nodos: {len(nodes)}")
    print(f"   Total Aristas: {len(edges)}")
    print(f"   - Aristas Código (Moradas/Azules): {len(code_relations)}")
    print(f"   - Aristas ADR/Documentación (Amarillas/Verdes): {len(doc_relations)}")


def sync_codegraph():
    """Sync CodeGraph index with the new markdown files and scripts"""
    print("\n🔄 Sincronizando CodeGraph...")
    try:
        res = subprocess.run(["codegraph", "sync"], capture_output=True, text=True, check=True, shell=True)
        print(res.stdout)
    except Exception as e:
        print(f"Error sincronizando codegraph: {e}")


if __name__ == "__main__":
    create_obsidian_config()
    build_unified_canvas()
    sync_codegraph()
    print("\n🎉 Base de conocimiento unificada sincronizada exitosamente!")
