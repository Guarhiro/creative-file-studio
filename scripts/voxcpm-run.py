#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import sys

import soundfile as sf
from voxcpm import VoxCPM


def clean_control(value: str) -> str:
    text = (value or "").strip()
    if text.startswith("(") and text.endswith(")") and len(text) >= 2:
        return text[1:-1].strip()
    return text


def compose_text(text: str, control: str, mode: str) -> str:
    base = (text or "").strip()
    voice_control = clean_control(control)
    if not voice_control or mode == "HiFi":
        return base
    if base.startswith("("):
        return base
    return f"({voice_control}){base}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Run VoxCPM local speech synthesis.")
    parser.add_argument("--model-id", default="openbmb/VoxCPM2")
    parser.add_argument("--text", required=True)
    parser.add_argument("--output-wav", required=True)
    parser.add_argument("--mode", choices=["VoiceDesign", "Reference", "HiFi"], default="VoiceDesign")
    parser.add_argument("--voice-prompt", default="")
    parser.add_argument("--reference-wav", default="")
    parser.add_argument("--prompt-wav", default="")
    parser.add_argument("--prompt-text", default="")
    parser.add_argument("--cfg-value", type=float, default=2.0)
    parser.add_argument("--inference-timesteps", type=int, default=10)
    parser.add_argument("--device", default="auto")
    parser.add_argument("--cache-dir", default="")
    parser.add_argument("--normalize", action="store_true")
    parser.add_argument("--denoise", action="store_true")
    parser.add_argument("--no-optimize", action="store_true")
    parser.add_argument("--local-files-only", action="store_true")
    args = parser.parse_args()

    output_path = Path(args.output_wav)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    text = compose_text(args.text, args.voice_prompt, args.mode)
    reference_wav_path = args.reference_wav or None
    prompt_wav_path = args.prompt_wav or None
    prompt_text = args.prompt_text.strip() or None
    if args.mode == "HiFi" and (not prompt_wav_path or not prompt_text):
        raise ValueError("HiFi mode requires --prompt-wav and --prompt-text.")
    if args.mode != "HiFi":
        prompt_wav_path = None
        prompt_text = None

    model = VoxCPM.from_pretrained(
        args.model_id,
        load_denoiser=bool(args.denoise),
        cache_dir=args.cache_dir or None,
        local_files_only=bool(args.local_files_only),
        optimize=not bool(args.no_optimize),
        device=args.device or "auto",
    )
    wav = model.generate(
        text=text,
        reference_wav_path=reference_wav_path,
        prompt_wav_path=prompt_wav_path,
        prompt_text=prompt_text,
        cfg_value=args.cfg_value,
        inference_timesteps=args.inference_timesteps,
        normalize=bool(args.normalize),
        denoise=bool(args.denoise),
    )
    sample_rate = int(model.tts_model.sample_rate)
    sf.write(str(output_path), wav, sample_rate)
    print(json.dumps({
        "ok": True,
        "output": str(output_path),
        "sampleRate": sample_rate,
        "mode": args.mode,
        "modelId": args.model_id,
        "device": args.device,
        "optimize": not bool(args.no_optimize),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(json.dumps({
            "ok": False,
            "error": str(exc),
            "type": exc.__class__.__name__,
        }, ensure_ascii=False), file=sys.stderr)
        raise
