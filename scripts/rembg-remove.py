#!/usr/bin/env python3
import argparse
from pathlib import Path

from PIL import Image
from rembg import new_session, remove


def main():
    parser = argparse.ArgumentParser(description="Remove image background with rembg.")
    parser.add_argument("input_path")
    parser.add_argument("output_path")
    parser.add_argument("--model", default="isnet-general-use")
    parser.add_argument("--alpha-matting", action="store_true")
    parser.add_argument("--post-process-mask", action="store_true")
    parser.add_argument("--foreground-threshold", type=int, default=240)
    parser.add_argument("--background-threshold", type=int, default=10)
    parser.add_argument("--erode-size", type=int, default=10)
    args = parser.parse_args()

    input_path = Path(args.input_path)
    output_path = Path(args.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    session = new_session(args.model)
    with Image.open(input_path) as image:
        result = remove(
            image,
            session=session,
            alpha_matting=args.alpha_matting,
            alpha_matting_foreground_threshold=args.foreground_threshold,
            alpha_matting_background_threshold=args.background_threshold,
            alpha_matting_erode_size=args.erode_size,
            post_process_mask=args.post_process_mask,
        )
        result.save(output_path, "PNG")


if __name__ == "__main__":
    main()
