import logging
from typing import List, Optional
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from src.core.config import settings

logger = logging.getLogger(__name__)

class MailService:
    """Service to handle sending emails"""
    
    def __init__(self):
        # Determine if we should use credentials
        use_credentials = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
        
        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USER if use_credentials else "",
            MAIL_PASSWORD=settings.SMTP_PASSWORD if use_credentials else "",
            MAIL_FROM=settings.EMAILS_FROM_EMAIL,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=settings.SMTP_HOST,
            MAIL_FROM_NAME=settings.EMAILS_FROM_NAME,
            MAIL_STARTTLS=settings.SMTP_STARTTLS,
            MAIL_SSL_TLS=settings.SMTP_SSL_TLS,
            USE_CREDENTIALS=use_credentials,
            VALIDATE_CERTS=True if not settings.ENVIRONMENT == "local" else False
        )
        self.fm = FastMail(self.conf)

    async def send_password_change_notification(self, email_to: str):
        """Send a notification email after a successful password change"""
        
        if settings.MAIL_CONSOLE_LOG:
            print(f"\n[EMAIL MOCK] To: {email_to}\nSubject: Tu contraseña ha sido cambiada\n")
            if settings.ENVIRONMENT == "local":
                return

        message = MessageSchema(
            subject="Seguridad de RedThread: Tu contraseña ha sido cambiada",
            recipients=[email_to],
            body=f"""
            <html>
                <body>
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #ff4d4f; text-align: center;">Tu contraseña ha sido actualizada</h2>
                        <p>Hola,</p>
                        <p>Te informamos que la contraseña de tu cuenta en <strong>RedThread</strong> ha sido cambiada con éxito.</p>
                        <p>Si tú no realizaste este cambio, por favor ponte en contacto con nuestro equipo de soporte de inmediato o utiliza la opción de recuperación de contraseña.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{settings.FRONTEND_URL}/auth" style="background-color: #ff4d4f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ir a mi cuenta</a>
                        </div>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 0.8em; color: #777;">Este es un mensaje automático para proteger tu cuenta. Por favor no respondas a este correo.</p>
                    </div>
                </body>
            </html>
            """,
            subtype=MessageType.html
        )
        
        try:
            await self.fm.send_message(message)
            logger.info(f"Password change notification sent to {email_to}")
        except Exception as e:
            logger.error(f"Failed to send email to {email_to}: {str(e)}")

    async def send_password_reset_email(self, email_to: str, token: str):
        """Send a password reset link to the user"""
        reset_link = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
        
        # Always log to console if enabled
        if settings.MAIL_CONSOLE_LOG:
            logger.info(f"PASSWORD RESET LINK for {email_to}: {reset_link}")
            print(f"\n[EMAIL MOCK] To: {email_to}\nLink: {reset_link}\n")
            
            # If ONLY console log is intended, we return here
            # We assume if SMTP_HOST is 'localhost' and no credentials, it might be MailHog or Just Mock
            # But let's check a more explicit condition if we want to skip actual sending
            if settings.SMTP_HOST == "localhost" and not settings.SMTP_USER:
                 # Check if we should still try to send to local SMTP (like MailHog)
                 # If MAIL_CONSOLE_LOG is True, we might still want to skip actual send to avoid errors if no server is running
                 # Unless explicitly configured otherwise. For now, let's keep it simple:
                 # If we are in local and MAIL_CONSOLE_LOG is True, we skip sending to avoid "Connection Refused" noise.
                 if settings.ENVIRONMENT == "local":
                     return

        message = MessageSchema(
            subject="Restablece tu contraseña en RedThread",
            recipients=[email_to],
            body=f"""
            <html>
                <body>
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #ff4d4f; text-align: center;">Recupera tu contraseña</h2>
                        <p>Hola,</p>
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>RedThread</strong>.</p>
                        <p>Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace expirará en {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} horas:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{reset_link}" style="background-color: #ff4d4f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer contraseña</a>
                        </div>
                        <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 0.8em; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
                    </div>
                </body>
            </html>
            """,
            subtype=MessageType.html
        )
        
        try:
            await self.fm.send_message(message)
            logger.info(f"Password reset email sent to {email_to}")
        except Exception as e:
            logger.error(f"Failed to send email to {email_to}: {str(e)}")
            if not settings.MAIL_CONSOLE_LOG:
                # If console log was disabled and sending failed, we should probably know
                raise e

mail_service = MailService()
