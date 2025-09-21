import sounddevice as sd
import numpy as np 
import wave 
import keyboard
import time
from whisper_transcription import transcribe

RATE = 44100
CHANNELS = 1

recording = []
is_recording = False
space_pressed = False
esc_pressed = False

def callback(indata, frames, time, status): 
    if is_recording: 
        recording.append(indata.copy())

stream = sd.InputStream(
    callback=callback, 
    channels=CHANNELS, 
    samplerate=RATE,
)
stream.start()

print("Press SPACE to start recording, press SPACE again to stop and save, ESC to exit without saving")

try:
    while True: 
        # Handle space key with debouncing
        if keyboard.is_pressed("space"):
            if not space_pressed:  # Only trigger on key press, not hold
                space_pressed = True
                if not is_recording:
                    # Start recording
                    is_recording = True
                    print("Recording started...")
                    recording = []
                else:
                    # Stop recording and exit
                    is_recording = False
                    print("Recording stopped - saving and transcribing...")
                    break
        else:
            space_pressed = False
            
        # Handle escape key with debouncing
        if keyboard.is_pressed("esc"):
            if not esc_pressed:
                esc_pressed = True
                print("Exiting without saving...")
                recording = []  # Clear recording so it won't be saved
                break
        else:
            esc_pressed = False
            
        # Small delay to prevent excessive CPU usage
        time.sleep(0.01)

except KeyboardInterrupt:
    print("\nInterrupted by user")

finally:
    # Ensure stream is properly closed
    stream.stop()
    stream.close()

# Save recording if any data was captured
if recording:
    print("Saving recording...")
    recording_np = np.concatenate(recording, axis=0)
    
    # Ensure we're working with the right data type and range
    if recording_np.dtype != np.float32:
        recording_np = recording_np.astype(np.float32)
    
    # Clamp values to valid range
    recording_np = np.clip(recording_np, -1.0, 1.0)
    
    filepath = 'recording.wav'
    with wave.open(filepath, 'wb') as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(RATE)
        # Convert float32 [-1, 1] to int16 [-32767, 32767]
        audio_data = (recording_np * 32767).astype(np.int16)
        wf.writeframes(audio_data.tobytes())
    
    print(f"Recording saved as '{filepath}' ({len(recording_np)/RATE:.2f} seconds)")
    
    # Call transcribe function with the filepath
    transcribe(filepath)
else:
    print("No recording data to save")