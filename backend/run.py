#!/usr/bin/env python3
"""
KAHIKO // Secure Record Management System — Cinematic Launcher
Warm amber CRT + Hollywood boot + ASCII banner + smoke FX.
"""

from __future__ import annotations

import math
import os
import random
import shutil
import signal
import sys
import threading
import time
from dataclasses import dataclass


# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
@dataclass(frozen=True)
class Config:
    host: str = os.getenv("KAHIKO_HOST", "0.0.0.0")
    port: int = int(os.getenv("KAHIKO_PORT", "8000"))
    reload: bool = os.getenv("KAHIKO_RELOAD", "1") == "1"
    log_level: str = os.getenv("KAHIKO_LOG_LEVEL", "info")
    app: str = os.getenv("KAHIKO_APP", "app.main:app")


DEMO = os.getenv("KAHIKO_DEMO", "0") == "1"
_TTY = sys.stdout.isatty()
_ANIM = _TTY and os.getenv("KAHIKO_NO_ANIM", "0") != "1"


# ─────────────────────────────────────────────────────────────
# ANSI — WARM KAHIKO PALETTE
# ─────────────────────────────────────────────────────────────
def _c(code: str) -> str:
    return code if _ANIM else ""

RESET = _c("\033[0m")
BOLD  = _c("\033[1m")
DIM   = _c("\033[2m")
ITAL  = _c("\033[3m")

AMBER     = _c("\033[38;5;215m")
CORAL     = _c("\033[38;5;209m")
GOLD      = _c("\033[38;5;221m")
PEACH     = _c("\033[38;5;216m")
CREAM     = _c("\033[38;5;230m")
MINT      = _c("\033[38;5;157m")
TANGERINE = _c("\033[38;5;214m")
WARM_RED  = _c("\033[38;5;203m")
TOAST     = _c("\033[38;5;137m")
EMBER     = _c("\033[38;5;166m")

# smoke palette: very dim warm grays/browns
SMOKE = [
    _c("\033[38;5;236m"),   # darkest smoke
    _c("\033[38;5;238m"),
    _c("\033[38;5;240m"),
    _c("\033[38;5;243m"),
    _c("\033[38;5;246m"),   # lightest smoke
]

HIDE_CUR = _c("\033[?25l")
SHOW_CUR = _c("\033[?25h")

# warm matrix rain palette
_RAIN_HEAD = "\033[1;97m"
_RAIN_TRAIL = [
    "\033[38;5;215m",
    "\033[38;5;209m",
    "\033[38;5;203m",
    "\033[38;5;131m",
    "\033[38;5;94m",
]

GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789ABCDEF<>*+=-¦"
SMOKE_GLYPHS = "·∙•◦○◌░▒▓█ "

_WRITE_LOCK = threading.Lock()


# ─────────────────────────────────────────────────────────────
# WARM MATRIX RAIN
# ─────────────────────────────────────────────────────────────
class MatrixRain(threading.Thread):
    def __init__(self, rows: int, cols: int, y_off: int = 0, fps: int = 30) -> None:
        super().__init__(daemon=True)
        self.rows, self.cols, self.y_off, self.fps = rows, cols, y_off, fps
        self._halt = threading.Event()
        self.drops = [random.uniform(-rows, 0) for _ in range(cols)]
        self.speeds = [random.choice((0.5, 0.7, 1.0, 1.0, 1.0, 1.5)) for _ in range(cols)]
        self.cells = [[random.choice(GLYPHS) for _ in range(cols)] for _ in range(rows)]

    def stop(self) -> None:
        self._halt.set()

    def run(self) -> None:
        frame_t = 1.0 / self.fps
        while not self._halt.is_set():
            t0 = time.perf_counter()
            self._mutate()
            with _WRITE_LOCK:
                sys.stdout.write(self._render())
                sys.stdout.flush()
            self._advance()
            time.sleep(max(0.0, frame_t - (time.perf_counter() - t0)))

    def _mutate(self) -> None:
        for _ in range(max(1, self.cols // 4)):
            self.cells[random.randrange(self.rows)][random.randrange(self.cols)] = \
                random.choice(GLYPHS)

    def _render(self) -> str:
        out = ["\033[s", f"\033[{self.y_off + 1};1H"]
        for r in range(self.rows):
            parts = []
            for c in range(self.cols):
                dist = int(r - self.drops[c])
                if dist < 0 or dist > len(_RAIN_TRAIL):
                    parts.append(" ")
                elif dist == 0:
                    parts.append(_RAIN_HEAD + self.cells[r][c])
                else:
                    parts.append(_RAIN_TRAIL[min(dist - 1, len(_RAIN_TRAIL) - 1)]
                                 + self.cells[r][c])
            out.append("".join(parts) + RESET)
            if r < self.rows - 1:
                out.append("\r\n")
        out.append("\033[u")
        return "".join(out)

    def _advance(self) -> None:
        for c in range(self.cols):
            self.drops[c] += self.speeds[c]
            if self.drops[c] > self.rows + len(_RAIN_TRAIL) + 2:
                self.drops[c] = random.uniform(-10, 0)
                self.speeds[c] = random.choice((0.5, 0.7, 1.0, 1.0, 1.0, 1.5))

    def clear_region(self) -> None:
        with _WRITE_LOCK:
            out = ["\033[s", f"\033[{self.y_off + 1};1H"]
            blank = " " * self.cols
            out.append(("\r\n".join([blank] * self.rows)))
            out.append("\033[u")
            sys.stdout.write("".join(out))
            sys.stdout.flush()


# ─────────────────────────────────────────────────────────────
# SMOKE EFFECT (billowing plumes behind the KAHIKO logo)
# ─────────────────────────────────────────────────────────────
class SmokeFX:
    """
    A soft, drifting smoke layer drawn *behind* the ASCII banner.
    Uses half-width spaces + dim warm colours to simulate haze.
    """

    def __init__(self, rows: int, cols: int):
        self.rows, self.cols = rows, cols
        # each plume: [x, y, radius, life, color_idx]
        self.plumes = []
        for _ in range(28):
            self._spawn(initial=True)

    def _spawn(self, initial: bool = False) -> None:
        self.plumes.append({
            "x": random.uniform(-5, self.cols + 5),
            "y": random.uniform(self.rows * 0.2, self.rows * 0.9) if initial
                 else random.uniform(self.rows * 0.5, self.rows * 0.9),
            "r": random.uniform(3.0, 8.0),
            "life": random.uniform(0.6, 1.0),
            "decay": random.uniform(0.004, 0.010),
            "vy": random.uniform(-0.05, -0.015),
            "vx": random.uniform(-0.04, 0.04),
            "color_idx": random.randint(0, len(SMOKE) - 1),
        })

    def step(self) -> None:
        for p in self.plumes:
            p["x"] += p["vx"]
            p["y"] += p["vy"]
            p["r"] += 0.02
            p["life"] -= p["decay"]
        self.plumes = [p for p in self.plumes if p["life"] > 0.15]
        while len(self.plumes) < 28:
            self._spawn()

    def render_layer(self) -> list[list[str]]:
        """Return a rows×cols char grid of smoke."""
        grid = [[" " for _ in range(self.cols)] for _ in range(self.rows)]
        for p in self.plumes:
            cx, cy, r = p["x"], p["y"], p["r"]
            intensity = max(0.0, min(1.0, p["life"]))
            # glyph tier based on intensity
            if intensity > 0.75:
                glyph = "▓"
            elif intensity > 0.55:
                glyph = "▒"
            elif intensity > 0.35:
                glyph = "░"
            else:
                glyph = "·"

            for y in range(max(0, int(cy - r)), min(self.rows, int(cy + r) + 1)):
                for x in range(max(0, int(cx - r)), min(self.cols, int(cx + r) + 1)):
                    dx, dy = x - cx, y - cy
                    d = math.hypot(dx, dy)
                    if d > r:
                        continue
                    # higher weight toward the center
                    w = 1.0 - (d / r)
                    if random.random() < w * intensity * 0.55:
                        grid[y][x] = glyph
        return grid


# ─────────────────────────────────────────────────────────────
# HOLLYWOOD BOOT — progressive ASCII banner
# ─────────────────────────────────────────────────────────────
# KAHIKO in big ASCII block letters
BANNER_LINES = [
    r" ██╗  ██╗ █████╗ ██╗  ██╗██╗██╗  ██╗ ██████╗ ",
    r" ██║ ██╔╝██╔══██╗██║  ██║██║██║ ██╔╝██╔═══██╗",
    r" █████╔╝ ███████║███████║██║█████╔╝ ██║   ██║",
    r" ██╔═██╗ ██╔══██║██╔══██║██║██╔═██╗ ██║   ██║",
    r" ██║  ██╗██║  ██║██║  ██║██║██║  ██╗╚██████╔╝",
    r" ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ",
]

BANNER_WIDTH = max(len(l) for l in BANNER_LINES)
BANNER_HEIGHT = len(BANNER_LINES)


def _center(text: str, width: int) -> str:
    pad = max(0, (width - len(text)) // 2)
    return " " * pad + text


def hollywood_banner(term_cols: int, term_rows: int, rain_rows: int) -> None:
    """
    Progressively 'wipe in' the KAHIKO ASCII banner, with smoke
    billowing behind it and a scan-line reveal.
    """
    smoke = SmokeFX(rows=BANNER_HEIGHT + 4, cols=min(BANNER_WIDTH + 10, term_cols))

    # Calculate where to draw the banner
    banner_top = rain_rows + 4
    banner_left = max(0, (term_cols - BANNER_WIDTH) // 2)

    # Hide real cursor during animation
    sys.stdout.write(HIDE_CUR)
    sys.stdout.flush()

    # ── Phase 1: smoke build-up behind banner (no logo yet) ──
    for frame in range(14):
        smoke.step()
        layer = smoke.render_layer()
        with _WRITE_LOCK:
            sys.stdout.write(f"\033[{banner_top};{banner_left + 1}H")
            for r in range(len(layer)):
                line = "".join(
                    (SMOKE[min(4, max(0, len(SMOKE) - 1 - r // 2))] + ch + RESET)
                    if ch != " " else " "
                    for ch in layer[r]
                )
                sys.stdout.write(line)
                if r < len(layer) - 1:
                    sys.stdout.write("\n")
                    sys.stdout.write(f"\033[{banner_left + 1}G")
            sys.stdout.flush()
        time.sleep(0.05)

    # ── Phase 2: progressive reveal of the banner, left → right ──
    total_cols = BANNER_WIDTH
    for reveal in range(0, total_cols + 1, 3):
        smoke.step()
        layer = smoke.render_layer()

        with _WRITE_LOCK:
            sys.stdout.write(f"\033[{banner_top};{banner_left + 1}H")
            for r in range(BANNER_HEIGHT):
                row_chars = []
                for c in range(BANNER_WIDTH):
                    # smoke behind
                    smoke_ch = layer[r][c] if r < len(layer) and c < len(layer[r]) else " "
                    # logo on top if revealed
                    logo_ch = BANNER_LINES[r][c] if c < len(BANNER_LINES[r]) else " "

                    if c < reveal and logo_ch != " ":
                        # glowing amber logo (bright at the reveal edge)
                        if c >= reveal - 6:
                            row_chars.append(f"{CREAM}{BOLD}{logo_ch}{RESET}")
                        else:
                            row_chars.append(f"{AMBER}{BOLD}{logo_ch}{RESET}")
                    elif smoke_ch != " ":
                        idx = random.randint(0, len(SMOKE) - 1)
                        row_chars.append(f"{SMOKE[idx]}{smoke_ch}{RESET}")
                    else:
                        row_chars.append(" ")
                sys.stdout.write("".join(row_chars))
                if r < BANNER_HEIGHT - 1:
                    sys.stdout.write("\n")
                    sys.stdout.write(f"\033[{banner_left + 1}G")
            sys.stdout.flush()
        time.sleep(0.018)

    # ── Phase 3: settle — full banner, calm smoke fade ──
    for frame in range(10):
        smoke.step()
        layer = smoke.render_layer()
        with _WRITE_LOCK:
            sys.stdout.write(f"\033[{banner_top};{banner_left + 1}H")
            for r in range(BANNER_HEIGHT):
                row_chars = []
                for c in range(BANNER_WIDTH):
                    smoke_ch = layer[r][c] if r < len(layer) and c < len(layer[r]) else " "
                    logo_ch = BANNER_LINES[r][c] if c < len(BANNER_LINES[r]) else " "
                    if logo_ch != " ":
                        row_chars.append(f"{AMBER}{BOLD}{logo_ch}{RESET}")
                    elif smoke_ch != " ":
                        idx = random.randint(0, len(SMOKE) - 1)
                        row_chars.append(f"{SMOKE[idx]}{smoke_ch}{RESET}")
                    else:
                        row_chars.append(" ")
                sys.stdout.write("".join(row_chars))
                if r < BANNER_HEIGHT - 1:
                    sys.stdout.write("\n")
                    sys.stdout.write(f"\033[{banner_left + 1}G")
            sys.stdout.flush()
        time.sleep(0.04)

    # Park cursor below the banner for the rest of the boot
    sys.stdout.write(f"\033[{banner_top + BANNER_HEIGHT + 2};1H")
    sys.stdout.flush()


# ─────────────────────────────────────────────────────────────
# FX HELPERS
# ─────────────────────────────────────────────────────────────
def type_line(text: str, delay: float = 0.010) -> None:
    with _WRITE_LOCK:
        for ch in text:
            sys.stdout.write(ch)
            sys.stdout.flush()
            time.sleep(delay)
        sys.stdout.write("\n")
        sys.stdout.flush()


def scramble(text: str, delay: float = 0.028) -> None:
    noise = "@#%&$!?/\\|<>*+=~^"
    with _WRITE_LOCK:
        for i in range(len(text) + 1):
            out = []
            for j, ch in enumerate(text):
                if ch == " ":
                    out.append(" ")
                elif j < i:
                    out.append(ch)
                else:
                    out.append(random.choice(noise))
            sys.stdout.write("\r" + "".join(out))
            sys.stdout.flush()
            time.sleep(delay)
        sys.stdout.write("\n")
        sys.stdout.flush()


BAR_WIDTH = 34


def boot_bar(label: str, color: str, duration: float = 0.55) -> None:
    frame_t = duration / BAR_WIDTH
    with _WRITE_LOCK:
        for i in range(BAR_WIDTH + 1):
            filled = "█" * i
            empty  = "░" * (BAR_WIDTH - i)
            pct    = int(i / BAR_WIDTH * 100)
            sys.stdout.write(
                f"\r{color}  {label:<44}{RESET}"
                f"{color}[{filled}{empty}]{RESET} "
                f"{CREAM}{pct:3d}%{RESET}"
            )
            sys.stdout.flush()
            time.sleep(frame_t)
        sys.stdout.write(
            f"\r{color}  {label:<44}{RESET}"
            f"{MINT}[{'█' * BAR_WIDTH}]{RESET} "
            f"{MINT}{100:3d}%{RESET} {MINT}✓{RESET}\n"
        )
        sys.stdout.flush()


def trace_line(tag: str, msg: str) -> None:
    jitter = "".join(random.choice("0123456789abcdef") for _ in range(4))
    type_line(
        f"{CORAL}[{tag}]{RESET} {TOAST}0x{jitter}{RESET} "
        f"{CREAM}{msg}{RESET}", delay=0.006
    )


def _line(width: int = 78, char: str = "─") -> str:
    return f"{AMBER}{char * width}{RESET}"


# ─────────────────────────────────────────────────────────────
# HEADER / FOOTER
# ─────────────────────────────────────────────────────────────
def print_header_info(term_cols: int, rain_rows: int) -> None:
    """Subtitle + institution badge above the banner."""
    top = rain_rows + 1
    with _WRITE_LOCK:
        sys.stdout.write(f"\033[{top};1H\033[0m")
        sys.stdout.flush()

    print(f"{CORAL}{BOLD}              K A H I K O   //   Z E R O   T R U S T   C O R E{RESET}")
    print()


def print_institution_badge(term_cols: int) -> None:
    box_w = 46
    left = max(0, (term_cols - box_w) // 2)
    pad = " " * left
    print(f"{TOAST}{pad}╔{'═' * (box_w - 2)}╗{RESET}")
    print(f"{TOAST}{pad}║{GOLD}{_center('KABETE NATIONAL POLYTECHNIC', box_w - 2)}{TOAST}║{RESET}")
    print(f"{TOAST}{pad}║{MINT}{_center('SECURE RECORDS DIVISION', box_w - 2)}{TOAST}║{RESET}")
    print(f"{TOAST}{pad}╚{'═' * (box_w - 2)}╝{RESET}\n")


def print_services(cfg: Config) -> None:
    base = f"http://127.0.0.1:{cfg.port}"
    print(f"\n{AMBER}{BOLD}  ╭─[ KAHIKO NETWORK SERVICES ]{RESET}")
    print(f"{EMBER}  │{RESET} {MINT}🚀 API SERVER{RESET}   {CREAM}{base}{RESET}")
    print(f"{EMBER}  │{RESET} {CORAL}📖 API DOCS{RESET}     {CREAM}{base}/docs{RESET}")
    print(f"{EMBER}  │{RESET} {TANGERINE}🔐 SECURITY{RESET}     {CREAM}ZERO TRUST / RBAC{RESET}")
    print(f"{EMBER}  ╰─{RESET}{MINT} CONNECTION READY{RESET}\n")
    print(f"{TOAST}{'─' * 78}{RESET}")
    print(f"{DIM}{AMBER}  KAHIKO // SECURE RECORD MANAGEMENT SYSTEM{RESET}")
    print(f"{TOAST}{'─' * 78}{RESET}\n")


# ─────────────────────────────────────────────────────────────
# ENTRY
# ─────────────────────────────────────────────────────────────
def _handle_sigint(*_):
    sys.stdout.write(SHOW_CUR)
    print(f"\n{TOAST}[KAHIKO] {TANGERINE}Shutdown requested. Goodbye.{RESET}")
    sys.exit(0)


def _run_server(cfg: Config) -> None:
    import uvicorn
    uvicorn.run(cfg.app, host=cfg.host, port=cfg.port,
                reload=cfg.reload, log_level=cfg.log_level)


def main() -> None:
    signal.signal(signal.SIGINT, _handle_sigint)
    cfg = Config()

    if not _ANIM:
        print(f"[KAHIKO] starting {cfg.app} on {cfg.host}:{cfg.port} "
              f"(reload={cfg.reload})")
        if not DEMO:
            _run_server(cfg)
        return

    size = shutil.get_terminal_size(fallback=(110, 34))
    term_cols, term_rows = size.columns, size.lines
    rain_rows = max(6, min(10, term_rows // 5))

    rain = MatrixRain(rows=rain_rows, cols=term_cols)
    try:
        sys.stdout.write(HIDE_CUR + "\033[2J\033[H")
        sys.stdout.flush()
        rain.start()

        # ── Subtitle above the banner ──
        print_header_info(term_cols, rain_rows)

        # ── Hollywood KAHIKO banner with smoke ──
        hollywood_banner(term_cols, term_rows, rain_rows)

        # ── Institution badge ──
        print_institution_badge(term_cols)

        # ── Boot sequence header ──
        print(_line())
        print(f"{MINT}{BOLD}              [ KAHIKO SYSTEM BOOT SEQUENCE ]{RESET}")
        print(_line())
        print()

        # ── 9 warm boot bars ──
        boot_steps = [
            ("INITIALIZING KAHIKO CORE",           AMBER),
            ("LOADING NEURAL INTERFACE",           CORAL),
            ("ESTABLISHING ZERO-TRUST GATEWAY",    GOLD),
            ("CONNECTING SECURE DATABASE",         PEACH),
            ("SYNCHRONIZING RBAC MATRIX",          TANGERINE),
            ("LOADING RECORD MANAGEMENT MODULES",  EMBER),
            ("ACTIVATING SECURITY MONITOR",        WARM_RED),
            ("VERIFYING ENCRYPTION KEYS",          GOLD),
            ("MOUNTING AUDIT LEDGER",              AMBER),
        ]
        for label, color in boot_steps:
            boot_bar(label, color)

        print()
        trace_line("KAHIKO", "Encrypted session established.")
        trace_line("KAHIKO", "Identity verification layer online.")
        trace_line("KAHIKO", "All core systems operational.")
        print()
        print(_line(char="═"))
        print(f"{MINT}{BOLD}                         SYSTEM ONLINE{RESET}")
        print(_line(char="═"))
        time.sleep(0.35)

        print_services(cfg)
    finally:
        rain.stop()
        rain.join(timeout=1.0)
        rain.clear_region()
        sys.stdout.write(SHOW_CUR)
        sys.stdout.flush()

    if DEMO:
        print(f"{TOAST}[KAHIKO] demo mode — exiting before server start.{RESET}")
        return
    _run_server(cfg)


if __name__ == "__main__":
    main()
