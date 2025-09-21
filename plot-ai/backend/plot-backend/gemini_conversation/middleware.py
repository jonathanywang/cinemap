import json
import logging
from django.conf import settings
from django.http import JsonResponse
from generation.services.mermaid_service import MermaidService
from .models import Conversation, Message

logger = logging.getLogger(__name__)


class ConversationMermaidMiddleware:
    """
    Middleware that checks message count before generating Gemini responses
    and triggers mermaid flowchart generation when conversation reaches 10+ messages.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.mermaid_service = None

    def __call__(self, request):
        # Check if this is an audio processing request BEFORE processing
        if (request.path == '/api/conversation/process-audio/' and
            request.method == 'POST'):

            self._check_conversation_before_processing(request)

        response = self.get_response(request)
        return response

    def _check_conversation_before_processing(self, request):
        """Check message count before generating new Gemini response"""
        try:
            # Get conversation_id from request data
            conversation_id = None

            if hasattr(request, 'data'):
                conversation_id = request.data.get('conversation_id')
            elif request.POST:
                conversation_id = request.POST.get('conversation_id')

            if not conversation_id:
                return

            # Get the conversation and count existing messages
            try:
                conversation = Conversation.objects.get(id=conversation_id)
                current_message_count = conversation.messages.count()

                logger.info(f"Conversation {conversation_id} currently has {current_message_count} messages")

                # If we're about to create the 10th message (or any subsequent), generate mermaid
                if current_message_count >= 9:  # 9 because we're about to add the 10th
                    logger.info(f"Triggering mermaid generation for conversation {conversation_id} (will have {current_message_count + 1} messages)")
                    self._generate_conversation_mermaid(conversation)

            except Conversation.DoesNotExist:
                logger.warning(f"Conversation {conversation_id} not found")
                return

        except Exception as e:
            logger.error(f"Error in ConversationMermaidMiddleware._check_conversation_before_processing: {e}")

    def _generate_conversation_mermaid(self, conversation):
        """Generate mermaid flowcharts for the conversation"""
        try:
            # Initialize mermaid service if needed
            if not self.mermaid_service:
                self.mermaid_service = MermaidService()

            # Build conversation text from all existing messages
            messages = conversation.messages.all().order_by('created_at')
            conversation_text = self._build_conversation_text(messages)

            # Extract character names from conversation for multiple flowcharts
            character_names = self._extract_character_names(messages)

            logger.info(f"Generating mermaid flowcharts for conversation {conversation.id}")

            # Generate multiple flowcharts (ensemble + character-specific)
            mermaid_result = self.mermaid_service.generate_multiple_flowcharts(
                description=conversation_text,
                character_names=character_names
            )

            # Store the generated mermaid data
            self._store_mermaid_data(conversation, mermaid_result)

            logger.info(f"Successfully generated {mermaid_result['total_flowcharts']} flowcharts for conversation {conversation.id}")

        except Exception as e:
            logger.error(f"Error generating mermaid for conversation {conversation.id}: {e}")

    def _build_conversation_text(self, messages):
        """Build a narrative text from conversation messages"""
        conversation_parts = []

        for i, message in enumerate(messages):
            user_part = f"User {i+1}: {message.user_text}"
            assistant_part = f"Assistant {i+1}: {message.gemini_response}"
            conversation_parts.append(f"{user_part}\n{assistant_part}")

        full_text = "\n\n".join(conversation_parts)

        # Create a story-like description for mermaid generation
        description = f"""
This is a conversation-based story development session with the following flow:

{full_text}

Create flowcharts that capture:
1. The overall narrative arc and story development
2. Key story elements, characters, and plot points discussed
3. Creative decisions and story branching points
4. Character development and interactions mentioned
5. The progression from initial concept to developed story elements
"""
        return description

    def _extract_character_names(self, messages, max_characters=3):
        """Extract potential character names from conversation"""
        # Simple character name extraction - you might want to improve this
        # Look for common character-related keywords in the conversation

        character_names = []
        default_names = ["Protagonist", "Supporting Character", "Antagonist"]

        # Basic keyword extraction (you could make this more sophisticated)
        conversation_text = " ".join([f"{msg.user_text} {msg.gemini_response}" for msg in messages])
        conversation_lower = conversation_text.lower()

        # Look for character-related keywords
        if "hero" in conversation_lower or "protagonist" in conversation_lower:
            character_names.append("Hero/Protagonist")
        if "villain" in conversation_lower or "antagonist" in conversation_lower:
            character_names.append("Villain/Antagonist")
        if "friend" in conversation_lower or "companion" in conversation_lower:
            character_names.append("Companion")
        if "mentor" in conversation_lower or "teacher" in conversation_lower:
            character_names.append("Mentor")

        # Fill with defaults if we don't have enough
        while len(character_names) < max_characters:
            for default in default_names:
                if default not in character_names and len(character_names) < max_characters:
                    character_names.append(default)

        return character_names[:max_characters]

    def _store_mermaid_data(self, conversation, mermaid_result):
        """Store mermaid generation results"""
        # Log the results for now
        logger.info(f"Mermaid data generated for conversation {conversation.id}:")
        logger.info(f"- Total flowcharts: {mermaid_result['total_flowcharts']}")
        logger.info(f"- Flowchart types: {list(mermaid_result['flowcharts'].keys())}")

        # You could extend the Conversation model to store this data
        # For example, add a JSONField called 'mermaid_data' to the model
        # conversation.mermaid_data = mermaid_result
        # conversation.save()