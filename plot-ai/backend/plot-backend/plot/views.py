import logging
import os
from collections import defaultdict
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Optional, Tuple

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai import types as genai_types
from pydub import AudioSegment
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Optional whisper import for audio transcription
try:
    import whisper
    WHISPER_MODEL = whisper.load_model("turbo")
except ImportError:
    logger.warning("Whisper not installed - audio transcription will be unavailable")
    WHISPER_MODEL = None
except Exception as exc:
    logger.warning("Failed to load Whisper model: %s", exc)
    WHISPER_MODEL = None

try:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
    GENAI_CLIENT = genai  # Use the module directly
except Exception as exc:
    logger.warning("Failed to initialize Gemini client: %s", exc)
    GENAI_CLIENT = None


def _load_system_prompt() -> str:
    search_paths = [
        Path(settings.BASE_DIR) / "system_prompt.txt",
        Path(settings.BASE_DIR) / "gemini_conversation" / "system_prompt.txt",
        Path(settings.BASE_DIR)
        / "gemini_conversation"
        / "gemini_stuff"
        / "system_prompt.txt",
    ]
    for candidate in search_paths:
        if candidate.exists():
            return candidate.read_text()
    raise FileNotFoundError("system_prompt.txt not found in expected locations")


try:
    SYSTEM_PROMPT = _load_system_prompt()
except FileNotFoundError:
    SYSTEM_PROMPT = (
        "You are a voice-based AI assistant helping a user.\n\nUser: {user_input}"
    )
    logger.warning(
        "Falling back to default system prompt; expected system_prompt.txt not found."
    )


def _build_prompt(transcript: str) -> str:
    template_values = defaultdict(str, user_input=transcript)
    template_values.setdefault("conversation_context", "")
    template_values.setdefault("current_question_number", "1")
    template_values.setdefault("max_questions", "5")
    template_values.setdefault("pacing_guidance", "")
    return SYSTEM_PROMPT.format_map(template_values)


def _extract_text(
    response: genai_types.GenerateContentResponse,
) -> str:
    text_attr = getattr(response, "text", None)
    if text_attr:
        return text_attr

    candidates = getattr(response, "candidates", None)
    if candidates:
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            if not content:
                continue
            parts = getattr(content, "parts", None)
            if parts:
                for part in parts:
                    part_text = getattr(part, "text", None)
                    if part_text:
                        return part_text

    return str(response)


def _prepare_audio(input_path: Path) -> Path:
    try:
        audio = AudioSegment.from_file(input_path)
        wav_path = input_path.with_suffix(".wav")
        audio.set_frame_rate(16000).set_channels(1).export(wav_path, format="wav")
        return wav_path
    except Exception as exc:
        logger.info(
            "Audio conversion failed; continuing with original file: %s", exc
        )
        return input_path


def _run_pipeline(
    recording: Path,
) -> Tuple[str, genai_types.GenerateContentResponse]:
    if WHISPER_MODEL is None:
        raise RuntimeError("Whisper model is not available")
    if GENAI_CLIENT is None:
        raise RuntimeError("Gemini client is not available")

    transcript = WHISPER_MODEL.transcribe(str(recording))["text"]
    combined_prompt = _build_prompt(transcript)
    model = GENAI_CLIENT.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(combined_prompt)
    return transcript, response


def new_main(recording: str):
    _, response = _run_pipeline(Path(recording))
    return response


class AudioTranscriptionView(APIView):
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        if WHISPER_MODEL is None or GENAI_CLIENT is None:
            return Response(
                {"error": "Audio transcription service is unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        audio_file = request.FILES.get("audio")
        if not audio_file:
            return Response(
                {"error": "Audio file is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        suffix = Path(audio_file.name or "recording.webm").suffix or ".webm"

        with NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
            temp_path = Path(temp_file.name)

        prepared_path = _prepare_audio(temp_path)

        try:
            transcript, genai_response = _run_pipeline(prepared_path)
            ai_response_text = _extract_text(genai_response)
            return Response(
                {
                    "transcript": transcript,
                    "ai_response": ai_response_text,
                }
            )
        except Exception:
            logger.exception("Failed to process audio recording")
            return Response(
                {"error": "Failed to process audio recording"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            if prepared_path != temp_path:
                prepared_path.unlink(missing_ok=True)
            temp_path.unlink(missing_ok=True)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)
        if user:
            # Create or get token
            token, created = Token.objects.get_or_create(user=user)

            # Also login for session-based auth
            login(request, user)

            return Response({
                'success': True,
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            })
        else:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        return login_view(request)

class LogoutAPIView(APIView):
    def post(self, request):
        logout(request)
        return Response({'success': True})

class UserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
        })
