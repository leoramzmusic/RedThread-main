from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
from src.api.auth import get_current_user
from src.models.user import User


router = APIRouter()


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    category: str  # account, safety, matching, premium, technical, other
    message: str


@router.get("/faq")
async def get_faq(category: str = None):
    """
    Get FAQ items, optionally filtered by category.
    Categories: account, safety, matching, premium, technical
    """
    
    # FAQ data structure - in production, this would come from database
    faq_data = {
        "account": [
            {
                "question": "¿Cómo creo una cuenta?",
                "answer": "Puedes crear una cuenta usando tu email, teléfono, o mediante Google/Facebook/Apple. Solo necesitas proporcionar información básica y crear un perfil.",
                "question_en": "How do I create an account?",
                "answer_en": "You can create an account using your email, phone, or via Google/Facebook/Apple. You just need to provide basic information and create a profile."
            },
            {
                "question": "¿Cómo elimino mi cuenta?",
                "answer": "Ve a Configuración > Seguridad > Eliminar Cuenta. Ten en cuenta que esta acción es permanente.",
                "question_en": "How do I delete my account?",
                "answer_en": "Go to Settings > Security > Delete Account. Note that this action is permanent."
            },
            {
                "question": "¿Puedo cambiar mi nombre de usuario?",
                "answer": "Sí, puedes cambiar tu nombre de usuario en Configuración > Perfil. Solo puedes cambiarlo una vez cada 30 días.",
                "question_en": "Can I change my username?",
                "answer_en": "Yes, you can change your username in Settings > Profile. You can only change it once every 30 days."
            }
        ],
        "safety": [
            {
                "question": "¿Cómo reporto a un usuario?",
                "answer": "Toca el menú de tres puntos en el perfil del usuario y selecciona 'Reportar'. Proporciona detalles sobre el problema.",
                "question_en": "How do I report a user?",
                "answer_en": "Tap the three-dot menu on the user's profile and select 'Report'. Provide details about the issue."
            },
            {
                "question": "¿Cómo bloqueo a alguien?",
                "answer": "Ve al perfil del usuario y selecciona 'Bloquear'. No podrán verte ni contactarte.",
                "question_en": "How do I block someone?",
                "answer_en": "Go to the user's profile and select 'Block'. They won't be able to see you or contact you."
            },
            {
                "question": "¿Mis datos están seguros?",
                "answer": "Sí, usamos encriptación de extremo a extremo para mensajes y protegemos tu información personal. Lee nuestra Política de Privacidad para más detalles.",
                "question_en": "Is my data safe?",
                "answer_en": "Yes, we use end-to-end encryption for messages and protect your personal information. Read our Privacy Policy for more details."
            }
        ],
        "matching": [
            {
                "question": "¿Cómo funciona el algoritmo de matching?",
                "answer": "Nuestro algoritmo considera tus intereses, valores, ubicación y preferencias para sugerir personas compatibles.",
                "question_en": "How does the matching algorithm work?",
                "answer_en": "Our algorithm considers your interests, values, location, and preferences to suggest compatible people."
            },
            {
                "question": "¿Puedo deshacer un 'no me gusta'?",
                "answer": "Con Red Thread Premium, puedes deshacer acciones recientes. Los usuarios gratuitos no pueden deshacer.",
                "question_en": "Can I undo a 'dislike'?",
                "answer_en": "With Red Thread Premium, you can undo recent actions. Free users cannot undo."
            }
        ],
        "premium": [
            {
                "question": "¿Qué incluye Red Thread Premium?",
                "answer": "Premium incluye: likes ilimitados, ver quién te dio like, deshacer acciones, modo incógnito, y filtros avanzados.",
                "question_en": "What does Red Thread Premium include?",
                "answer_en": "Premium includes: unlimited likes, see who liked you, undo actions, incognito mode, and advanced filters."
            },
            {
                "question": "¿Cuánto cuesta Premium?",
                "answer": "Premium cuesta $9.99/mes o $99.99/año. Puedes cancelar en cualquier momento.",
                "question_en": "How much does Premium cost?",
                "answer_en": "Premium costs $9.99/month or $99.99/year. You can cancel anytime."
            }
        ],
        "technical": [
            {
                "question": "La app no carga, ¿qué hago?",
                "answer": "Intenta cerrar y abrir la app, verifica tu conexión a internet, o reinstala la app. Si el problema persiste, contáctanos.",
                "question_en": "The app won't load, what do I do?",
                "answer_en": "Try closing and reopening the app, check your internet connection, or reinstall the app. If the problem persists, contact us."
            },
            {
                "question": "¿En qué dispositivos funciona Red Thread?",
                "answer": "Red Thread funciona en iOS 14+, Android 8+, y navegadores web modernos.",
                "question_en": "What devices does Red Thread work on?",
                "answer_en": "Red Thread works on iOS 14+, Android 8+, and modern web browsers."
            }
        ]
    }
    
    if category:
        if category not in faq_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category '{category}' not found"
            )
        return {
            "category": category,
            "items": faq_data[category]
        }
    
    # Return all categories
    return {
        "categories": [
            {"id": cat, "name": cat.capitalize(), "count": len(items)}
            for cat, items in faq_data.items()
        ],
        "all_items": faq_data
    }


@router.get("/contact")
async def get_contact_info():
    """Get contact information"""
    return {
        "email": "support@redthread.app",
        "social": {
            "twitter": "@redthread",
            "instagram": "@redthread_app",
            "facebook": "redthreadapp"
        },
        "hours": "Lun-Vie 9:00-18:00 (GMT-6)"
    }


@router.post("/contact")
async def submit_contact_form(
    request: ContactRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Submit a contact form.
    In production, this would send an email or create a support ticket.
    """
    
    # TODO: Implement email sending or ticket creation
    # For now, just log and return success
    
    print(f"Contact form submitted by {current_user.email}:")
    print(f"  Name: {request.name}")
    print(f"  Email: {request.email}")
    print(f"  Category: {request.category}")
    print(f"  Message: {request.message}")
    
    return {
        "success": True,
        "message": "Tu mensaje ha sido enviado. Te responderemos pronto."
    }

