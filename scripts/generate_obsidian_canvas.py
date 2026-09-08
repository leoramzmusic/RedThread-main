"""
Generate Obsidian Canvas for RedThread architecture
"""
import json
import os

def build_canvas():
    nodes = [
        # --- HEADER / KNOWLEDGE HUB ---
        {
            "id": "node-codegraph-hub",
            "type": "text",
            "text": "## 🧠 RedThread CodeGraph Knowledge Hub\n\n- **Index**: `.codegraph/codegraph.db` (6,378 nodes, 11,324 edges)\n- **Propósito**: Relación semántica y de dependencias del proyecto.\n- **Ahorro de Tokens**: Al hacer cambios futuros, consulta con:\n  ```bash\n  codegraph explore \"<simbolo o archivo>\"\n  codegraph impact \"<simbolo>\"\n  codegraph callers \"<simbolo>\"\n  ```\n- **MCP Tool**: `codegraph_explore` para inspección en 1 sola llamada sin gastar tokens en lecturas redundantes.",
            "x": 200,
            "y": -380,
            "width": 800,
            "height": 260,
            "color": "6"
        },
        
        # --- GROUPS ---
        {
            "id": "grp-frontend",
            "type": "group",
            "label": "🖥️ FRONTEND (Next.js 16 + Turbopack + React 18)",
            "x": -1150,
            "y": 0,
            "width": 900,
            "height": 1100,
            "color": "5"
        },
        {
            "id": "grp-api",
            "type": "group",
            "label": "🌐 BACKEND API & ROUTERS (FastAPI)",
            "x": -150,
            "y": 0,
            "width": 850,
            "height": 1100,
            "color": "2"
        },
        {
            "id": "grp-services",
            "type": "group",
            "label": "⚙️ BACKEND SERVICES & LOGIC",
            "x": 800,
            "y": 0,
            "width": 850,
            "height": 1100,
            "color": "3"
        },
        {
            "id": "grp-models",
            "type": "group",
            "label": "📦 DATA MODELS (MongoDB / Beanie ODM)",
            "x": 1750,
            "y": 0,
            "width": 800,
            "height": 1100,
            "color": "4"
        },
        {
            "id": "grp-infra",
            "type": "group",
            "label": "🐳 INFRAESTRUCTURA & STORAGE",
            "x": 300,
            "y": 1200,
            "width": 1400,
            "height": 450,
            "color": "1"
        },

        # --- FRONTEND NODES ---
        {
            "id": "fn-app",
            "type": "text",
            "text": "### App Root & Providers\n- `frontend/src/pages/_app.tsx`\n- Redux Provider, MUI Theme, Auth Guard, i18n.",
            "x": -1100,
            "y": 60,
            "width": 380,
            "height": 140,
            "color": "5"
        },
        {
            "id": "fn-store",
            "type": "text",
            "text": "### Redux Store & Slices\n- `frontend/src/store/index.ts`\n- `authSlice.ts`, `chatSlice.ts`\n- Estado global reactivo.",
            "x": -670,
            "y": 60,
            "width": 380,
            "height": 140,
            "color": "5"
        },
        {
            "id": "fn-api-client",
            "type": "text",
            "text": "### Axios API Client\n- `frontend/src/services/api.ts`\n- Interceptores JWT (Bearer Token, Refresh),\n- Base URL: `http://localhost:8000`",
            "x": -880,
            "y": 240,
            "width": 380,
            "height": 150,
            "color": "5"
        },
        {
            "id": "fn-pages-auth",
            "type": "text",
            "text": "### Auth Pages\n- `frontend/src/pages/auth/login.tsx`\n- `frontend/src/pages/auth/register.tsx`\n- Formik + Yup validaciones.",
            "x": -1100,
            "y": 440,
            "width": 380,
            "height": 140,
            "color": "5"
        },
        {
            "id": "fn-pages-discovery",
            "type": "text",
            "text": "### Discovery / Radar\n- `frontend/src/pages/discover/index.tsx`\n- `frontend/src/pages/radar/index.tsx`\n- Swiping, Leaflet Map, Geolocation.",
            "x": -670,
            "y": 440,
            "width": 380,
            "height": 140,
            "color": "5"
        },
        {
            "id": "fn-pages-chat",
            "type": "text",
            "text": "### Chat & Messaging\n- `frontend/src/pages/chat/index.tsx`\n- WebSocket en tiempo real, Notistack.",
            "x": -1100,
            "y": 620,
            "width": 380,
            "height": 140,
            "color": "5"
        },
        {
            "id": "fn-pages-portal",
            "type": "text",
            "text": "### Admin & Employee Portal\n- `frontend/src/pages/portal-redthread/index.tsx`\n- Métricas, moderación, RBAC, auditoría.",
            "x": -670,
            "y": 620,
            "width": 380,
            "height": 140,
            "color": "5"
        },

        # --- BACKEND API NODES ---
        {
            "id": "api-main",
            "type": "text",
            "text": "### FastAPI Main Entrypoint\n- `backend/src/main.py`\n- Lifespan (init_db, Redis connect),\n- CORS, Security Middleware, Router registry.",
            "x": -100,
            "y": 60,
            "width": 350,
            "height": 150,
            "color": "2"
        },
        {
            "id": "api-auth",
            "type": "text",
            "text": "### Auth Router\n- `backend/src/api/auth.py`\n- `/auth/login`, `/auth/register`, `/auth/refresh`\n- JWT Bearer tokens, OAuth2.",
            "x": 300,
            "y": 60,
            "width": 350,
            "height": 150,
            "color": "2"
        },
        {
            "id": "api-discovery",
            "type": "text",
            "text": "### Discovery & Matching\n- `backend/src/api/discovery.py`\n- Filtros geográficos, radar, compatibilidad,\n- Algoritmo de Hilo Rojo.",
            "x": -100,
            "y": 260,
            "width": 350,
            "height": 150,
            "color": "2"
        },
        {
            "id": "api-chat",
            "type": "text",
            "text": "### Chat Router\n- `backend/src/api/chat.py`\n- WebSocket `/ws/chat/{user_id}`\n- Conversaciones, mensajes y recibos.",
            "x": 300,
            "y": 260,
            "width": 350,
            "height": 150,
            "color": "2"
        },
        {
            "id": "api-profiles",
            "type": "text",
            "text": "### Profiles & Users\n- `backend/src/api/profiles.py`\n- `backend/src/api/users.py`\n- Bio, intereses, fotos, verificación.",
            "x": -100,
            "y": 460,
            "width": 350,
            "height": 150,
            "color": "2"
        },
        {
            "id": "api-admin",
            "type": "text",
            "text": "### Admin & RBAC Routers\n- `backend/src/api/admin_portal.py`\n- `admin_usuarios.py`, `admin_empleados.py`\n- Permisos SUPER_ADMIN, auditoría.",
            "x": 300,
            "y": 460,
            "width": 350,
            "height": 150,
            "color": "2"
        },
        {
            "id": "api-premium",
            "type": "text",
            "text": "### Subscriptions & Payments\n- `backend/src/api/premium.py`\n- Stripe Webhooks, tiers FREE/PREMIUM/VIP.",
            "x": 100,
            "y": 660,
            "width": 350,
            "height": 140,
            "color": "2"
        },

        # --- BACKEND SERVICES NODES ---
        {
            "id": "srv-core",
            "type": "text",
            "text": "### Core Config & DB\n- `backend/src/core/config.py`\n- `backend/src/core/database.py`\n- `backend/src/core/utils/security.py`",
            "x": 850,
            "y": 60,
            "width": 350,
            "height": 150,
            "color": "3"
        },
        {
            "id": "srv-redis",
            "type": "text",
            "text": "### Redis Service\n- `backend/src/services/redis_service.py`\n- Sesiones activas, tokens revocados,\n- Caché de geoposicionamiento y presencia.",
            "x": 1250,
            "y": 60,
            "width": 350,
            "height": 150,
            "color": "3"
        },
        {
            "id": "srv-discovery",
            "type": "text",
            "text": "### Matching & Discovery Service\n- `backend/src/services/matching_service.py`\n- `compatibility_service.py`\n- Cálculo de score por intereses y proximidad.",
            "x": 850,
            "y": 260,
            "width": 350,
            "height": 150,
            "color": "3"
        },
        {
            "id": "srv-chat",
            "type": "text",
            "text": "### Chat & Realtime Service\n- `backend/src/services/chat/`\n- Handlers WebSocket, broadcast,\n- Persistencia de mensajes y notificaciones.",
            "x": 1250,
            "y": 260,
            "width": 350,
            "height": 150,
            "color": "3"
        },
        {
            "id": "srv-employee",
            "type": "text",
            "text": "### Employee & Security Service\n- `backend/src/services/employee_service.py`\n- `security_service.py`, `mail_service.py`",
            "x": 850,
            "y": 460,
            "width": 350,
            "height": 150,
            "color": "3"
        },
        {
            "id": "srv-moderation",
            "type": "text",
            "text": "### Moderation & Privacy Service\n- `backend/src/services/moderation_service.py`\n- `data_privacy_service.py`\n- Detección de contenido inapropiado.",
            "x": 1250,
            "y": 460,
            "width": 350,
            "height": 150,
            "color": "3"
        },

        # --- DATA MODELS NODES ---
        {
            "id": "mod-user",
            "type": "text",
            "text": "### User Model\n- `backend/src/models/user.py`\n- Colección: `users`\n- Credenciales, AuthProvider, SubscriptionTier, is_active.",
            "x": 1800,
            "y": 60,
            "width": 330,
            "height": 150,
            "color": "4"
        },
        {
            "id": "mod-profile",
            "type": "text",
            "text": "### Profile Model\n- `backend/src/models/profile.py`\n- Colección: `profiles`\n- GeoJSON Point `location`, bio, hobbies, intereses, género.",
            "x": 2180,
            "y": 60,
            "width": 330,
            "height": 150,
            "color": "4"
        },
        {
            "id": "mod-match",
            "type": "text",
            "text": "### Match & Relationship\n- `backend/src/models/match.py`\n- `backend/src/models/relationship.py`\n- Colecciones: `matches`, `relationships`",
            "x": 1800,
            "y": 260,
            "width": 330,
            "height": 150,
            "color": "4"
        },
        {
            "id": "mod-chat",
            "type": "text",
            "text": "### Conversation & Message\n- `backend/src/models/conversation.py`\n- `backend/src/models/message.py`\n- Colecciones: `conversations`, `messages`",
            "x": 2180,
            "y": 260,
            "width": 330,
            "height": 150,
            "color": "4"
        },
        {
            "id": "mod-admin",
            "type": "text",
            "text": "### Admin & Employee RBAC\n- `backend/src/models/admin_rbac.py`\n- `backend/src/models/employee.py`\n- Colecciones: `admin_users`, `employees`, `roles`",
            "x": 1800,
            "y": 460,
            "width": 330,
            "height": 150,
            "color": "4"
        },
        {
            "id": "mod-subscription",
            "type": "text",
            "text": "### Subscription & Session\n- `backend/src/models/subscription.py`\n- `backend/src/models/session.py`\n- Colecciones: `subscriptions`, `sessions`",
            "x": 2180,
            "y": 460,
            "width": 330,
            "height": 150,
            "color": "4"
        },

        # --- INFRASTRUCTURE NODES ---
        {
            "id": "inf-docker",
            "type": "text",
            "text": "### Docker Compose Local\n- `docker/docker-compose.local.yml`\n- Orquestación local: frontend, backend, mongodb, redis.",
            "x": 350,
            "y": 1260,
            "width": 380,
            "height": 140,
            "color": "1"
        },
        {
            "id": "inf-mongo",
            "type": "text",
            "text": "### MongoDB Database\n- Host: `localhost:27017`\n- DB Name: `redthread` (32 colecciones, GeoSpatial 2dsphere indexes)\n- GUI: MongoDB Compass",
            "x": 800,
            "y": 1260,
            "width": 420,
            "height": 140,
            "color": "1"
        },
        {
            "id": "inf-redis",
            "type": "text",
            "text": "### Redis Cache & Broker\n- Host: `localhost:6379`\n- TTL sessions, rate limiting, pub/sub realtime.",
            "x": 1280,
            "y": 1260,
            "width": 380,
            "height": 140,
            "color": "1"
        }
    ]

    edges = [
        # Frontend to API Client
        {"id": "e1", "fromNode": "fn-app", "fromSide": "bottom", "toNode": "fn-api-client", "toSide": "top", "label": "provides store/auth"},
        {"id": "e2", "fromNode": "fn-pages-auth", "fromSide": "top", "toNode": "fn-api-client", "toSide": "left", "label": "login/register"},
        {"id": "e3", "fromNode": "fn-pages-discovery", "fromSide": "top", "toNode": "fn-api-client", "toSide": "right", "label": "fetch matches"},
        {"id": "e4", "fromNode": "fn-pages-chat", "fromSide": "top", "toNode": "fn-api-client", "toSide": "bottom", "label": "send/recv messages"},
        {"id": "e5", "fromNode": "fn-pages-portal", "fromSide": "top", "toNode": "fn-api-client", "toSide": "bottom", "label": "admin ops"},

        # Frontend Client to Backend Main
        {"id": "e6", "fromNode": "fn-api-client", "fromSide": "right", "toNode": "api-main", "toSide": "left", "label": "HTTP/REST :8000"},
        {"id": "e7", "fromNode": "fn-pages-chat", "fromSide": "right", "toNode": "api-chat", "toSide": "left", "label": "WebSocket /ws/chat"},

        # Backend Main to Routers
        {"id": "e8", "fromNode": "api-main", "fromSide": "right", "toNode": "api-auth", "toSide": "left", "label": "mounts /auth"},
        {"id": "e9", "fromNode": "api-main", "fromSide": "bottom", "toNode": "api-discovery", "toSide": "top", "label": "mounts /discovery"},
        {"id": "e10", "fromNode": "api-main", "fromSide": "bottom", "toNode": "api-chat", "toSide": "top", "label": "mounts /chat"},
        {"id": "e11", "fromNode": "api-main", "fromSide": "bottom", "toNode": "api-profiles", "toSide": "top", "label": "mounts /profiles"},
        {"id": "e12", "fromNode": "api-main", "fromSide": "right", "toNode": "api-admin", "toSide": "left", "label": "mounts /admin"},

        # Routers to Services
        {"id": "e13", "fromNode": "api-auth", "fromSide": "right", "toNode": "srv-core", "toSide": "left", "label": "security.verify_pwd"},
        {"id": "e14", "fromNode": "api-discovery", "fromSide": "right", "toNode": "srv-discovery", "toSide": "left", "label": "find_candidates"},
        {"id": "e15", "fromNode": "api-chat", "fromSide": "right", "toNode": "srv-chat", "toSide": "left", "label": "process message"},
        {"id": "e16", "fromNode": "api-admin", "fromSide": "right", "toNode": "srv-employee", "toSide": "left", "label": "rbac authorize"},
        {"id": "e17", "fromNode": "api-main", "fromSide": "right", "toNode": "srv-redis", "toSide": "left", "label": "connect on startup"},

        # Services to Models
        {"id": "e18", "fromNode": "srv-core", "fromSide": "right", "toNode": "mod-user", "toSide": "left", "label": "queries User"},
        {"id": "e19", "fromNode": "srv-discovery", "fromSide": "right", "toNode": "mod-profile", "toSide": "left", "label": "queries Profile"},
        {"id": "e20", "fromNode": "srv-discovery", "fromSide": "right", "toNode": "mod-match", "toSide": "left", "label": "creates Match"},
        {"id": "e21", "fromNode": "srv-chat", "fromSide": "right", "toNode": "mod-chat", "toSide": "left", "label": "saves Message"},
        {"id": "e22", "fromNode": "srv-employee", "fromSide": "right", "toNode": "mod-admin", "toSide": "left", "label": "queries Employee"},

        # Models & Services to Infrastructure
        {"id": "e23", "fromNode": "srv-core", "fromSide": "bottom", "toNode": "inf-mongo", "toSide": "top", "label": "init_beanie connection"},
        {"id": "e24", "fromNode": "srv-redis", "fromSide": "bottom", "toNode": "inf-redis", "toSide": "top", "label": "Redis client"},
        {"id": "e25", "fromNode": "inf-docker", "fromSide": "right", "toNode": "inf-mongo", "toSide": "left", "label": "provisions"},
        {"id": "e26", "fromNode": "inf-docker", "fromSide": "right", "toNode": "inf-redis", "toSide": "left", "label": "provisions"},

        # CodeGraph Hub connecting the whole picture
        {"id": "e27", "fromNode": "node-codegraph-hub", "fromSide": "left", "toNode": "grp-frontend", "toSide": "top", "label": "indexes TSX/TS"},
        {"id": "e28", "fromNode": "node-codegraph-hub", "fromSide": "bottom", "toNode": "grp-api", "toSide": "top", "label": "indexes FastAPI"},
        {"id": "e29", "fromNode": "node-codegraph-hub", "fromSide": "bottom", "toNode": "grp-services", "toSide": "top", "label": "indexes Services"},
        {"id": "e30", "fromNode": "node-codegraph-hub", "fromSide": "right", "toNode": "grp-models", "toSide": "top", "label": "indexes Models"}
    ]

    canvas_data = {
        "nodes": nodes,
        "edges": edges
    }

    target_file = "redthread_architecture.canvas"
    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(canvas_data, f, indent=2, ensure_ascii=False)
    print(f"Canvas created successfully: {target_file}")
    print(f"Nodes: {len(nodes)}, Edges: {len(edges)}")

if __name__ == "__main__":
    build_canvas()
