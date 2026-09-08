"""
Seed script to populate legal documents in the database.
Run this script to create initial legal documents in Spanish and English.
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from src.core.config import settings
from src.models.legal_document import LegalDocument, DocumentType, Language


# Legal document content
PRIVACY_POLICY_ES = """
# Política de Privacidad de Red Thread

**Última actualización: 1 de diciembre de 2025**

## 1. Información que Recopilamos

En Red Thread, recopilamos la siguiente información:

- **Información de perfil**: Nombre, edad, género, fotos, biografía, intereses
- **Información de contacto**: Email, número de teléfono
- **Información de uso**: Interacciones, matches, mensajes
- **Información de ubicación**: Ubicación aproximada para sugerencias locales
- **Información del dispositivo**: Tipo de dispositivo, sistema operativo, ID único

## 2. Cómo Usamos tu Información

Usamos tu información para:

- Proporcionar y mejorar nuestros servicios
- Sugerir matches compatibles
- Comunicarnos contigo
- Personalizar tu experiencia
- Garantizar la seguridad de la plataforma

## 3. Compartir Información

No vendemos tu información personal. Podemos compartir información con:

- Otros usuarios (según tu configuración de privacidad)
- Proveedores de servicios que nos ayudan a operar la plataforma
- Autoridades legales cuando sea requerido por ley

## 4. Tus Derechos

Tienes derecho a:

- Acceder a tu información personal
- Corregir información incorrecta
- Eliminar tu cuenta y datos
- Exportar tus datos
- Optar por no recibir comunicaciones de marketing

## 5. Seguridad

Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo encriptación de extremo a extremo para mensajes.

## 6. Contacto

Para preguntas sobre privacidad, contáctanos en: privacy@redthread.app
"""

PRIVACY_POLICY_EN = """
# Red Thread Privacy Policy

**Last updated: December 1, 2025**

## 1. Information We Collect

At Red Thread, we collect the following information:

- **Profile information**: Name, age, gender, photos, bio, interests
- **Contact information**: Email, phone number
- **Usage information**: Interactions, matches, messages
- **Location information**: Approximate location for local suggestions
- **Device information**: Device type, operating system, unique ID

## 2. How We Use Your Information

We use your information to:

- Provide and improve our services
- Suggest compatible matches
- Communicate with you
- Personalize your experience
- Ensure platform safety

## 3. Sharing Information

We do not sell your personal information. We may share information with:

- Other users (according to your privacy settings)
- Service providers who help us operate the platform
- Legal authorities when required by law

## 4. Your Rights

You have the right to:

- Access your personal information
- Correct incorrect information
- Delete your account and data
- Export your data
- Opt out of marketing communications

## 5. Security

We implement technical and organizational security measures to protect your information, including end-to-end encryption for messages.

## 6. Contact

For privacy questions, contact us at: privacy@redthread.app
"""

TERMS_OF_SERVICE_ES = """
# Términos de Servicio de Red Thread

**Última actualización: 1 de diciembre de 2025**

## 1. Aceptación de Términos

Al usar Red Thread, aceptas estos Términos de Servicio. Si no estás de acuerdo, no uses la plataforma.

## 2. Elegibilidad

Debes tener al menos 18 años para usar Red Thread.

## 3. Tu Cuenta

- Eres responsable de mantener la seguridad de tu cuenta
- Debes proporcionar información precisa y actualizada
- No puedes compartir tu cuenta con otros
- Puedes tener solo una cuenta

## 4. Conducta del Usuario

Está prohibido:

- Acosar, intimidar o amenazar a otros usuarios
- Publicar contenido ofensivo, ilegal o inapropiado
- Hacerse pasar por otra persona
- Usar la plataforma para actividades comerciales no autorizadas
- Intentar acceder a cuentas de otros usuarios

## 5. Contenido

- Eres responsable del contenido que publicas
- Nos otorgas una licencia para usar tu contenido en la plataforma
- Podemos eliminar contenido que viole estos términos

## 6. Suscripción Premium

- Red Thread Premium es un servicio de suscripción opcional
- Los pagos se procesan de forma segura
- Puedes cancelar en cualquier momento
- No hay reembolsos por períodos parciales

## 7. Terminación

Podemos suspender o terminar tu cuenta si violas estos términos.

## 8. Limitación de Responsabilidad

Red Thread se proporciona "tal cual". No garantizamos resultados específicos de matches o relaciones.

## 9. Cambios a los Términos

Podemos actualizar estos términos. Te notificaremos de cambios significativos.

## 10. Contacto

Para preguntas, contáctanos en: legal@redthread.app
"""

TERMS_OF_SERVICE_EN = """
# Red Thread Terms of Service

**Last updated: December 1, 2025**

## 1. Acceptance of Terms

By using Red Thread, you accept these Terms of Service. If you disagree, do not use the platform.

## 2. Eligibility

You must be at least 18 years old to use Red Thread.

## 3. Your Account

- You are responsible for maintaining the security of your account
- You must provide accurate and up-to-date information
- You cannot share your account with others
- You can only have one account

## 4. User Conduct

Prohibited activities:

- Harassing, intimidating, or threatening other users
- Posting offensive, illegal, or inappropriate content
- Impersonating another person
- Using the platform for unauthorized commercial activities
- Attempting to access other users' accounts

## 5. Content

- You are responsible for the content you post
- You grant us a license to use your content on the platform
- We may remove content that violates these terms

## 6. Premium Subscription

- Red Thread Premium is an optional subscription service
- Payments are processed securely
- You can cancel anytime
- No refunds for partial periods

## 7. Termination

We may suspend or terminate your account if you violate these terms.

## 8. Limitation of Liability

Red Thread is provided "as is". We do not guarantee specific results from matches or relationships.

## 9. Changes to Terms

We may update these terms. We will notify you of significant changes.

## 10. Contact

For questions, contact us at: legal@redthread.app
"""

SECURITY_INFO_ES = """
# Información de Seguridad de Red Thread

**Última actualización: 1 de diciembre de 2025**

## Nuestro Compromiso con tu Seguridad

En Red Thread, tu seguridad es nuestra prioridad. Implementamos múltiples capas de protección para garantizar una experiencia segura.

## Medidas de Seguridad Técnica

### Encriptación
- **Mensajes**: Encriptación de extremo a extremo para todas las conversaciones
- **Datos en tránsito**: TLS/SSL para todas las comunicaciones
- **Datos en reposo**: Encriptación AES-256 para datos almacenados

### Autenticación
- Autenticación de dos factores (2FA) disponible
- Verificación de email y teléfono
- Detección de actividad sospechosa

### Infraestructura
- Servidores seguros con monitoreo 24/7
- Copias de seguridad regulares
- Pruebas de penetración periódicas

## Herramientas de Seguridad para Usuarios

### Control de Privacidad
- Controla quién puede ver tu perfil
- Modo incógnito (Premium)
- Bloqueo y reporte de usuarios

### Verificación de Perfil
- Verificación de fotos opcional
- Insignia de verificación visible

### Reportes y Moderación
- Sistema de reporte fácil de usar
- Equipo de moderación activo
- Respuesta rápida a reportes

## Consejos de Seguridad

1. **Protege tu información personal**: No compartas datos sensibles en mensajes
2. **Verifica identidades**: Usa videollamadas antes de conocer en persona
3. **Reúnete en lugares públicos**: Primera cita siempre en lugar público
4. **Confía en tu instinto**: Si algo se siente mal, reporta y bloquea
5. **Reporta comportamiento sospechoso**: Ayúdanos a mantener la comunidad segura

## Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, repórtala a: security@redthread.app

Tomamos en serio todos los reportes y respondemos rápidamente.
"""

SECURITY_INFO_EN = """
# Red Thread Security Information

**Last updated: December 1, 2025**

## Our Commitment to Your Safety

At Red Thread, your safety is our priority. We implement multiple layers of protection to ensure a safe experience.

## Technical Security Measures

### Encryption
- **Messages**: End-to-end encryption for all conversations
- **Data in transit**: TLS/SSL for all communications
- **Data at rest**: AES-256 encryption for stored data

### Authentication
- Two-factor authentication (2FA) available
- Email and phone verification
- Suspicious activity detection

### Infrastructure
- Secure servers with 24/7 monitoring
- Regular backups
- Periodic penetration testing

## User Safety Tools

### Privacy Controls
- Control who can see your profile
- Incognito mode (Premium)
- Block and report users

### Profile Verification
- Optional photo verification
- Visible verification badge

### Reports and Moderation
- Easy-to-use reporting system
- Active moderation team
- Quick response to reports

## Safety Tips

1. **Protect your personal information**: Don't share sensitive data in messages
2. **Verify identities**: Use video calls before meeting in person
3. **Meet in public places**: First date always in a public location
4. **Trust your instinct**: If something feels wrong, report and block
5. **Report suspicious behavior**: Help us keep the community safe

## Vulnerability Reporting

If you find a security vulnerability, report it to: security@redthread.app

We take all reports seriously and respond quickly.
"""


async def seed_legal_documents():
    """Seed legal documents in the database"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[LegalDocument]
    )
    
    print("🌱 Seeding legal documents...")
    
    # Delete existing documents to avoid duplicates
    await LegalDocument.find().delete()
    
    # Create documents
    documents = [
        # Privacy Policy
        LegalDocument(
            doc_type=DocumentType.PRIVACY,
            language=Language.ES,
            version="1.0",
            title="Política de Privacidad",
            content=PRIVACY_POLICY_ES,
            effective_date=datetime(2025, 12, 1),
            is_current=True
        ),
        LegalDocument(
            doc_type=DocumentType.PRIVACY,
            language=Language.EN,
            version="1.0",
            title="Privacy Policy",
            content=PRIVACY_POLICY_EN,
            effective_date=datetime(2025, 12, 1),
            is_current=True
        ),
        
        # Terms of Service
        LegalDocument(
            doc_type=DocumentType.TERMS,
            language=Language.ES,
            version="1.0",
            title="Términos de Servicio",
            content=TERMS_OF_SERVICE_ES,
            effective_date=datetime(2025, 12, 1),
            is_current=True
        ),
        LegalDocument(
            doc_type=DocumentType.TERMS,
            language=Language.EN,
            version="1.0",
            title="Terms of Service",
            content=TERMS_OF_SERVICE_EN,
            effective_date=datetime(2025, 12, 1),
            is_current=True
        ),
        
        # Security Information
        LegalDocument(
            doc_type=DocumentType.SECURITY,
            language=Language.ES,
            version="1.0",
            title="Información de Seguridad",
            content=SECURITY_INFO_ES,
            effective_date=datetime(2025, 12, 1),
            is_current=True
        ),
        LegalDocument(
            doc_type=DocumentType.SECURITY,
            language=Language.EN,
            version="1.0",
            title="Security Information",
            content=SECURITY_INFO_EN,
            effective_date=datetime(2025, 12, 1),
            is_current=True
        ),
    ]
    
    # Insert documents
    for doc in documents:
        await doc.insert()
        print(f"  ✅ Created: {doc.title} ({doc.language})")
    
    print(f"\n✅ Successfully seeded {len(documents)} legal documents!")
    
    # Close connection
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_legal_documents())

