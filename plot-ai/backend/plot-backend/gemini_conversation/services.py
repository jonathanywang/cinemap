import os
import wave
import whisper
from django.conf import settings
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

class GeminiService:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client()

    def get_system_prompt(self):
        """Load system prompt from file"""
        prompt_file = os.path.join(
            settings.BASE_DIR,
            'gemini_conversation',
            'gemini_stuff',
            'system_prompt.txt'
        )
        with open(prompt_file, "r") as f:
            return f.read()

    def generate_text_response(self, user_input, conversation_history=None):
        """Generate text response from Gemini"""
        system_prompt = self.get_system_prompt()

        # Build conversation context if history provided
        conversation_context = ""
        current_question_number = 1
        max_questions = 10

        if conversation_history and conversation_history.exists():
            context_parts = []
            for msg in conversation_history:
                context_parts.append(f"User: {msg.user_text}")
                context_parts.append(f"Assistant: {msg.gemini_response}")

            conversation_context = f"Previous conversation history:\n{chr(10).join(context_parts)}\n"
            current_question_number = conversation_history.count() + 1
        else:
            conversation_context = "This is the beginning of your conversation with the user.\n"

        # Generate pacing guidance based on current question number
        if current_question_number <= 3:
            pacing_guidance = "EARLY STAGE: Focus on broad, foundational questions about the overall concept and vision."
        elif current_question_number <= 7:
            pacing_guidance = "MIDDLE STAGE: Dive deeper into specifics like characters, key scenes, and emotional tone."
        elif current_question_number <= 9:
            pacing_guidance = "LATE STAGE: Focus on final details, nuances, and any remaining gaps in the story vision."
        else:
            pacing_guidance = "FINAL QUESTION: This should be your last discovery question before moving to the storyboard creation phase."

        # Format the full prompt with all parameters
        full_prompt = system_prompt.format(
            conversation_context=conversation_context,
            current_question_number=current_question_number,
            max_questions=max_questions,
            pacing_guidance=pacing_guidance,
            user_input=user_input
        )

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=full_prompt,
        )
        return response.text

    def generate_audio_response(self, text_response, output_path="out.wav"):
        """Generate audio from text using Gemini TTS"""
        response = self.client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=text_response,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name='Kore',
                        )
                    )
                ),
            )
        )

        audio_data = response.candidates[0].content.parts[0].inline_data.data
        self._save_wave_file(output_path, audio_data)
        return output_path

    def _save_wave_file(self, filename, pcm_data, channels=1, rate=24000, sample_width=2):
        """Save PCM data to wave file"""
        with wave.open(filename, "wb") as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(sample_width)
            wf.setframerate(rate)
            wf.writeframes(pcm_data)

class WhisperService:
    def __init__(self):
        self.model = whisper.load_model("turbo")

    def transcribe_audio(self, audio_file_path):
        """Transcribe audio file to text"""
        result = self.model.transcribe(audio_file_path)
        return result["text"]