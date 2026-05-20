import os


if os.environ.get("CFS_BACKGROUNDREMOVER_FORCE_CPU") == "1":
    try:
        import torch

        torch.cuda.is_available = lambda: False
        try:
            torch.backends.mps.is_available = lambda: False
        except Exception:
            pass
    except Exception:
        pass
