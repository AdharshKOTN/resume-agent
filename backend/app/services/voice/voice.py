import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.services.openvoice import se_extractor
from app.services.openvoice.api import ToneColorConverter
import torch
from melo.api import TTS

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

CKPT_CONVERTER = BASE_DIR / '..' / '..' / 'services' / 'voice' / 'checkpoints' / 'converter'
OUTPUT_DIR = BASE_DIR / '..' / '..' / 'services' / 'voice' / 'outputs'

BASE_SPEAKER = BASE_DIR / '..' / '..' / 'services' / 'voice' / 'checkpoints' / 'base_speakers'
EN_BASE_SPEAKER = BASE_SPEAKER / 'EN' / 'en_default_se.pth'
REFERENCE_SPEAKER = BASE_DIR / '..' / '..' / 'services' / 'voice' / 'resources' / 'voice-training.mp3'
# services\voice\resources\training-audio-v2.mp3

CKPT_CONVERTER = CKPT_CONVERTER.resolve()
OUTPUT_DIR = OUTPUT_DIR.resolve()
REFERENCE_SPEAKER = REFERENCE_SPEAKER.resolve()
EN_BASE_SPEAKER = EN_BASE_SPEAKER.resolve()


# ckpt_converter = 'app/services/voice/checkpoints_1226/checkpoints/converter'
device = "cuda:0" if torch.cuda.is_available() else "cpu"
# output_dir = 'outputs_v2'

tone_color_converter = ToneColorConverter(f'{CKPT_CONVERTER}/config.json', device=device)
tone_color_converter.load_ckpt(f'{CKPT_CONVERTER}/checkpoint.pth')

os.makedirs(OUTPUT_DIR, exist_ok=True)

# reference_speaker = 'resources/voice-training.mp3' # This is the voice you want to clone
target_se, audio_name = se_extractor.get_se(str(REFERENCE_SPEAKER), tone_color_converter, vad=True)

texts = {
    'EN': "Did you ever hear a folk tale about a giant turtle?",  # The newest English base speaker model
}

src_path = f'{OUTPUT_DIR}\\tmp.wav'

model = TTS(language='EN', device=device)
speaker_ids = model.hps.data.spk2id

source_se = torch.load(EN_BASE_SPEAKER, map_location=device)

if torch.backends.mps.is_available() and device == 'cpu':
    torch.backends.mps.is_available = lambda: False

def voice_conversion(text):
    # Convert text to speech
    model.tts_to_file(text, 0, src_path, speed=1.0)
    save_path = f'{OUTPUT_DIR}/response.wav'
    print(f"🟢 Generated TTS: {save_path}")

    # Run the tone color converter
    encode_message = "@MyShell"
    tone_color_converter.convert(
        audio_src_path=src_path, 
        src_se=source_se, 
        tgt_se=target_se, 
        output_path=save_path,
        message=encode_message)
# model.tts_to_file("hi vineeta, this is adharsh rajendran, i love Bhadra buddy", 0, src_path, speed=speed)
# save_path = f'adharsh-test.wav'

# # Run the tone color converter
# encode_message = "@MyShell"
# tone_color_converter.convert(
#     audio_src_path=src_path, 
#     src_se=source_se, 
#     tgt_se=target_se, 
#     output_path=save_path,
#     message=encode_message)

# voice_conversion(texts['EN'], speed)