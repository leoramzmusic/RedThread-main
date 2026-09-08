from typing import List, Optional, Dict
from datetime import datetime
from src.models.message import Message, MessageType
from src.models.profile import Profile
from src.models.conversation import Conversation
from beanie import PydanticObjectId

# 36 Questions categorized by level (set)
QUESTIONS_36 = [
    # Level 1
    {"id": "q_1", "set": 1, "text": "Si pudieras elegir a cualquier persona en el mundo, ¿a quién invitarías a cenar?"},
    {"id": "q_2", "set": 1, "text": "¿Te gustaría ser famoso? ¿De qué manera?"},
    {"id": "q_3", "set": 1, "text": "Antes de hacer una llamada telefónica, ¿ensayas lo que vas a decir? ¿Por qué?"},
    {"id": "q_4", "set": 1, "text": "¿Qué sería un “día perfecto” para ti?"},
    {"id": "q_5", "set": 1, "text": "¿Cuándo fue la última vez que cantaste para ti mismo? ¿Y para otra persona?"},
    {"id": "q_6", "set": 1, "text": "Si pudieras vivir hasta los 90 años y conservar la mente o el cuerpo de alguien de 30 durante los últimos 60 años de tu vida, ¿qué elegirías?"},
    {"id": "q_7", "set": 1, "text": "¿Tienes una corazonada secreta sobre cómo vas a morir?"},
    {"id": "q_8", "set": 1, "text": "Nombra tres cosas que tú y tu interlocutor parecen tener en común."},
    {"id": "q_9", "set": 1, "text": "¿Por qué aspecto de tu vida te sientes más agradecido?"},
    {"id": "q_10", "set": 1, "text": "Si pudieras cambiar algo de la forma en que fuiste criado, ¿qué sería?"},
    {"id": "q_11", "set": 1, "text": "Tómate cuatro minutos para contar la historia de tu vida con el mayor detalle posible."},
    {"id": "q_12", "set": 1, "text": "Si mañana pudieras despertar con una cualidad o habilidad nueva, ¿cuál sería?"},
    
    # Level 2
    {"id": "q_13", "set": 2, "text": "Si una bola de cristal pudiera decirte la verdad sobre ti, tu vida, tu futuro o cualquier otra cosa, ¿qué querrías saber?"},
    {"id": "q_14", "set": 2, "text": "¿Hay algo que hayas soñado hacer desde hace mucho tiempo? ¿Por qué no lo has hecho?"},
    {"id": "q_15", "set": 2, "text": "¿Cuál es el mayor logro de tu vida?"},
    {"id": "q_16", "set": 2, "text": "¿Qué valoras más en una amistad?"},
    {"id": "q_17", "set": 2, "text": "¿Cuál es tu recuerdo más preciado?"},
    {"id": "q_18", "set": 2, "text": "¿Cuál es tu recuerdo más terrible?"},
    {"id": "q_19", "set": 2, "text": "Si supieras que en un año morirías de repente, ¿cambiarías algo en tu forma de vivir? ¿Por qué?"},
    {"id": "q_20", "set": 2, "text": "¿Qué significa la amistad para ti?"},
    {"id": "q_21", "set": 2, "text": "¿Qué papel juegan el amor y el afecto en tu vida?"},
    {"id": "q_22", "set": 2, "text": "Comparte de manera alternada cinco características positivas de tu interlocutor."},
    {"id": "q_23", "set": 2, "text": "¿Tu familia es cercana y cariñosa? ¿Crees que tu infancia fue más feliz que la de la mayoría de la gente?"},
    {"id": "q_24", "set": 2, "text": "¿Cómo te sientes respecto a tu relación con tu madre?"},

    # Level 3
    {"id": "q_25", "set": 3, "text": "Haz tres afirmaciones verdaderas que empiecen con “nosotros”."},
    {"id": "q_26", "set": 3, "text": "Completa esta frase: “Desearía tener alguien con quien compartir…”."},
    {"id": "q_27", "set": 3, "text": "Si te volvieras cercano a tu interlocutor, ¿qué sería importante que él/ella supiera?"},
    {"id": "q_28", "set": 3, "text": "Dile a tu interlocutor lo que te gusta de él/ella; sé muy honesto y di cosas que no dirías a alguien que acabas de conocer."},
    {"id": "q_29", "set": 3, "text": "Comparte un momento embarazoso de tu vida."},
    {"id": "q_30", "set": 3, "text": "¿Cuándo fue la última vez que lloraste frente a otra persona? ¿Y solo?"},
    {"id": "q_31", "set": 3, "text": "Dile a tu interlocutor algo que ya te guste de él/ella."},
    {"id": "q_32", "set": 3, "text": "¿Qué, si es que hay algo, es demasiado serio como para bromear al respecto?"},
    {"id": "q_33", "set": 3, "text": "Si esta noche murieras sin posibilidad de comunicarte con nadie, ¿qué lamentarías no haber dicho? ¿Por qué no lo has dicho todavía?"},
    {"id": "q_34", "set": 3, "text": "Tu casa se incendia con todas tus posesiones dentro. Después de salvar a tus seres queridos y mascotas, tienes tiempo para salvar un solo objeto. ¿Cuál sería? ¿Por qué?"},
    {"id": "q_35", "set": 3, "text": "De todos los miembros de tu familia, ¿la muerte de quién te afectaría más? ¿Por qué?"},
    {"id": "q_36", "set": 3, "text": "Comparte un problema personal y pide consejo a tu interlocutor sobre cómo lo manejaría. Además, pregúntale cómo cree que te sientes respecto a ese problema."}
]

class IcebreakerService:
    
    @staticmethod
    def get_questions() -> List[dict]:
        """Return the list of 36 questions"""
        return QUESTIONS_36

    @staticmethod
    def get_question_by_id(question_id: str) -> Optional[dict]:
        return next((q for q in QUESTIONS_36 if q["id"] == question_id), None)

    @staticmethod
    async def save_profile_answers(user_id: str, answers: List[dict]):
        """Save answers to the user's profile (Creative Identity)"""
        profile = await Profile.find_one(Profile.user_id == user_id)
        if not profile:
            return None
        
        # Merge existing with new answers
        existing_map = {a["question_id"]: a for a in profile.icebreaker_answers}
        for ans in answers:
            existing_map[ans["question_id"]] = ans
            
        profile.icebreaker_answers = list(existing_map.values())
        await profile.save()
        return profile

    @staticmethod
    async def process_chat_answer(message_id: str, user_id: str, answer_text: str):
        """
        Process an answer submitted in chat.
        - If other user hasn't answered: Save answer but keep hidden. Update state to 'answering'.
        - If other user HAS answered: Reveal both answers. Update state to 'revealed'.
        """
        message = await Message.get(message_id)
        if not message or message.message_type != MessageType.ICEBREAKER:
            raise ValueError("Invalid message")
            
        data = message.icebreaker_data or {}
        current_answers = data.get("answers", {})
        
        # Save this user's answer
        current_answers[user_id] = answer_text
        data["answers"] = current_answers
        
        # Check if we have answers from both participants
        participants = [str(message.sender_id), str(message.receiver_id)]
        
        # Check if all participants have answered
        all_answered = all(uid in current_answers for uid in participants)
        
        if all_answered:
            data["stage"] = "revealed"
            message.content = "✨ ¡Respuestas reveladas! ✨" # Update snippet
        else:
            data["stage"] = "answering"
            # Update content to indicate progress without showing answer
            message.content = "Esperando la respuesta de la otra persona..."
            
        message.icebreaker_data = data
        await message.save()
        return message

    @staticmethod
    async def get_profile_answer(user_id: str, question_id: str) -> Optional[str]:
        """Retrieve a specific answer from user profile if available"""
        profile = await Profile.find_one(Profile.user_id == user_id)
        if not profile:
            return None
            
        for ans in profile.icebreaker_answers:
            if ans["question_id"] == question_id:
                return ans["answer"]
        return None
