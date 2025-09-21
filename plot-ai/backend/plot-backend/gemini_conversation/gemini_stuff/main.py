import os 
from dotenv import load_dotenv

load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")

from google import genai
from google.genai import types
import wave

client = genai.Client()

# Set up the wave file to save the output:
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)


def get_gemini_audio_response(input_text):
    with open("system_prompt.txt", "r") as f:
        system_prompt = f.read()

    combined_prompt = system_prompt.format(user_input=input_text)

    response = client.models.generate_content(
      model='gemini-2.5-flash',
      contents=combined_prompt,
    )
    response = client.models.generate_content(
    model="gemini-2.5-flash-preview-tts",
    contents=response.text,
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
    data = response.candidates[0].content.parts[0].inline_data.data
    wave_file("out.wav", data)


