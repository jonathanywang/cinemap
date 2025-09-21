import whisper 
from pydub import AudioSegment
from pydub.playback import play
from main import get_gemini_audio_response

model = whisper.load_model("turbo")


def transcribe(audio_filepath): 
    result = model.transcribe(audio_filepath)
    get_gemini_audio_response(result["text"])
    audio = AudioSegment.from_file("out.wav")
    play(audio)
