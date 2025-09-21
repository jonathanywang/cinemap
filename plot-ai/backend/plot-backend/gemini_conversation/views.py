import os
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from django.http import FileResponse, Http404
from django.conf import settings
from pydub import AudioSegment
from pydub.playback import play

from .models import Conversation, Message
from .services import GeminiService, WhisperService

class StartConversationView(APIView):
    """Start a new conversation"""
    permission_classes = [AllowAny]

    def post(self, request):
        conversation = Conversation.objects.create()
        return Response({
            'conversation_id': conversation.id,
            'message': 'Conversation started'
        }, status=status.HTTP_201_CREATED)

class ProcessAudioView(APIView):
    """Process uploaded audio: transcribe -> generate response -> return audio"""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        conversation_id = request.data.get('conversation_id')
        audio_file = request.FILES.get('audio')

        if not conversation_id or not audio_file:
            return Response({
                'error': 'conversation_id and audio file are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Save uploaded audio to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
            temp_audio_path = temp_file.name

        try:
            # Transcribe audio
            whisper_service = WhisperService()
            user_text = whisper_service.transcribe_audio(temp_audio_path)

            # Get conversation history for context
            conversation_history = conversation.messages.all()

            # Generate Gemini response
            gemini_service = GeminiService()
            gemini_response = gemini_service.generate_text_response(
                user_text,
                conversation_history
            )

            # Save message to database
            message = Message.objects.create(
                conversation=conversation,
                user_text=user_text,
                gemini_response=gemini_response
            )

            # Generate audio response
            audio_output_path = os.path.join(
                settings.BASE_DIR,
                'media',
                'conversation_audio',
                f'response_{message.id}.wav'
            )

            # Ensure directory exists
            os.makedirs(os.path.dirname(audio_output_path), exist_ok=True)

            gemini_service.generate_audio_response(gemini_response, audio_output_path)

            # Play the audio response locally (for testing)
            try:
                audio = AudioSegment.from_file(audio_output_path)
                play(audio)
            except Exception as e:
                print(f"Audio playback failed: {e}")

            return Response({
                'message_id': message.id,
                'user_text': user_text,
                'gemini_response': gemini_response,
                'audio_url': f'/api/conversation/audio/{message.id}/'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Processing failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Clean up temp file
            if os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)

class GetAudioView(APIView):
    """Serve audio response files"""
    permission_classes = [AllowAny]

    def get(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id)
            audio_path = os.path.join(
                settings.BASE_DIR,
                'media',
                'conversation_audio',
                f'response_{message.id}.wav'
            )

            if not os.path.exists(audio_path):
                raise Http404("Audio file not found")

            return FileResponse(
                open(audio_path, 'rb'),
                content_type='audio/wav',
                filename=f'response_{message_id}.wav'
            )
        except Message.DoesNotExist:
            raise Http404("Message not found")

class ConversationHistoryView(APIView):
    """Get conversation history"""
    permission_classes = [AllowAny]

    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            messages = conversation.messages.all()

            message_data = []
            for msg in messages:
                message_data.append({
                    'id': msg.id,
                    'user_text': msg.user_text,
                    'gemini_response': msg.gemini_response,
                    'created_at': msg.created_at,
                    'audio_url': f'/api/conversation/audio/{msg.id}/'
                })

            return Response({
                'conversation_id': conversation.id,
                'messages': message_data
            }, status=status.HTTP_200_OK)

        except Conversation.DoesNotExist:
            return Response({
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
