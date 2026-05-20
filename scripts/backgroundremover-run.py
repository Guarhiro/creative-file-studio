#!/usr/bin/env python3
import os
import runpy
import sys


def force_cpu_if_requested():
    if os.environ.get("CFS_BACKGROUNDREMOVER_FORCE_CPU") != "1":
        return
    import torch

    torch.cuda.is_available = lambda: False
    try:
        torch.backends.mps.is_available = lambda: False
    except Exception:
        pass


def main():
    force_cpu_if_requested()
    sys.argv = ["backgroundremover", *sys.argv[1:]]
    runpy.run_module("backgroundremover.cmd.cli", run_name="__main__")


if __name__ == "__main__":
    main()
