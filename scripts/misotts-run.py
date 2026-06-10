#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path
import sys


os.environ.setdefault("HF_HUB_ETAG_TIMEOUT", "60")
os.environ.setdefault("HF_HUB_DOWNLOAD_TIMEOUT", "60")
os.environ.setdefault("NO_TORCH_COMPILE", "1")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run MisoTTS local speech synthesis.")
    parser.add_argument("--app-dir", default=".")
    parser.add_argument("--model-source", default="MisoLabs/MisoTTS")
    parser.add_argument("--text", required=True)
    parser.add_argument("--output-wav", required=True)
    parser.add_argument("--mode", choices=["Text", "Prompted"], default="Text")
    parser.add_argument("--speaker", type=int, default=0)
    parser.add_argument("--prompt-speaker", type=int, default=0)
    parser.add_argument("--prompt-wav", default="")
    parser.add_argument("--prompt-text", default="")
    parser.add_argument("--max-audio-length-ms", type=int, default=10000)
    parser.add_argument("--temperature", type=float, default=0.9)
    parser.add_argument("--topk", type=int, default=50)
    parser.add_argument("--device", default="auto")
    parser.add_argument("--dtype", choices=["bfloat16", "float16", "float32"], default="bfloat16")
    return parser.parse_args()


def device_name(value: str):
    import torch

    clean = (value or "auto").strip().lower()
    if clean == "auto":
        return "cuda" if torch.cuda.is_available() else "cpu"
    if clean == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA is not available on this machine.")
    if clean not in {"cpu", "cuda"}:
        raise RuntimeError("MisoTTS supports cpu or cuda in this app. MPS is skipped because the upstream example does not support it reliably.")
    return clean


def dtype_value(value: str):
    import torch

    return {
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
    }[(value or "bfloat16").strip()]


def load_prompt_audio(path: str, sample_rate: int):
    import torchaudio

    prompt_audio, original_rate = torchaudio.load(path)
    if prompt_audio.ndim == 2:
        prompt_audio = prompt_audio.mean(dim=0)
    else:
        prompt_audio = prompt_audio.squeeze()
    if int(original_rate) != int(sample_rate):
        prompt_audio = torchaudio.functional.resample(
            prompt_audio,
            orig_freq=int(original_rate),
            new_freq=int(sample_rate),
        )
    return prompt_audio


def main() -> int:
    args = parse_args()
    app_dir = Path(args.app_dir).resolve()
    if not (app_dir / "generator.py").is_file():
        raise FileNotFoundError(f"generator.py was not found in {app_dir}")
    sys.path.insert(0, str(app_dir))

    import torch
    import torchaudio
    from generator import Segment, load_miso_8b

    output_path = Path(args.output_wav)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    device = device_name(args.device)
    generator = load_miso_8b(
        device=device,
        model_path_or_repo_id=args.model_source,
        dtype=dtype_value(args.dtype),
    )

    context = []
    prompt_wav = (args.prompt_wav or "").strip()
    prompt_text = (args.prompt_text or "").strip()
    if args.mode == "Prompted":
        if not prompt_wav or not prompt_text:
            raise ValueError("Prompted mode requires --prompt-wav and --prompt-text.")
        context.append(Segment(
            speaker=int(args.prompt_speaker),
            text=prompt_text,
            audio=load_prompt_audio(prompt_wav, generator.sample_rate),
        ))

    audio = generator.generate(
        text=args.text.strip(),
        speaker=int(args.speaker),
        context=context,
        max_audio_length_ms=int(args.max_audio_length_ms),
        temperature=float(args.temperature),
        topk=int(args.topk),
    )
    torchaudio.save(str(output_path), audio.unsqueeze(0).detach().cpu(), int(generator.sample_rate))
    print(json.dumps({
        "ok": True,
        "output": str(output_path),
        "sampleRate": int(generator.sample_rate),
        "mode": args.mode,
        "speaker": int(args.speaker),
        "promptSpeaker": int(args.prompt_speaker),
        "modelSource": args.model_source,
        "device": device,
        "dtype": args.dtype,
        "maxAudioLengthMs": int(args.max_audio_length_ms),
        "temperature": float(args.temperature),
        "topk": int(args.topk),
        "prompted": bool(context),
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
