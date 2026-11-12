# Acer Linux System (`acer` CLI + Web GUI)

All-in-one Linux hardware control center and developer suite built for **Acer Nitro / Predator** laptops on Arch/CachyOS Linux — available as both a fast **terminal CLI (`acer`)** and a **Next.js Web GUI Dashboard (`acer gui`)**.

Combines dual fan speed & sensor management (independent Left CPU / Right GPU control), 4-zone RGB keyboard backlight studio, 80% battery charge cut-off, hybrid/iGPU/dGPU switching, system hardware configs, and a multi-account Git/GitHub workflow manager.

---

## Verified Target System Specs

| Component | Specification |
|---|---|
| **Laptop Model** | Acer Nitro 5 (`Acer Nitro AN517-41`) |
| **CPU** | AMD Ryzen 7 5800H with Radeon Graphics (8C / 16T) |
| **Integrated GPU (iGPU)** | AMD Radeon Vega / Cezanne (`amdgpu`) |
| **Dedicated GPU (dGPU)** | NVIDIA GeForce RTX 3080 Mobile / Max-Q (`GA104M`) |
| **Memory** | 16 GB DDR4 |
| **Distro & Kernel** | CachyOS Linux (Arch-based), Kernel `7.2.9-1-cachyos` |
| **Audio Quirk** | Realtek ALC295 (`snd-hda-intel model=acer-aspire`) |
| **Web GUI Stack** | Bun, Next.js (App Router, TypeScript), Zustand, Zod, TanStack Query, Tailwind CSS |

---

## Features

### 1. Web GUI Dashboard (`acer gui`)
Launchable directly from the `acer` CLI on `http://localhost:3456`:
- **Live Mini Sparkline Charts**: Real-time CPU temp, GPU/RTX temp, dual fan duty %, memory, and battery telemetry
- **Animated Dual Turbine Fans**: Left (CPU #0) and Right (GPU #1) fan blades rotate dynamically according to actual RPM/duty % with thermal color rings
- **Independent Left / Right Fan & Sensor Control**: Control Left only, Right only, or Both fans, plus assign NBFC temperature sensors (`@CPU`, `k10temp`, `amdgpu`, `nvidia-ml`, `acpitz`, `nvme`) per fan
- **Visual 4-Zone RGB Keyboard**: Interactive Acer Nitro 4-zone keycap layout with live effect preview, per-zone color picker, brightness/speed/direction sliders, and saved profiles
- **Battery Care & GPU Mode Switcher**: One-click 80% cut-off, boot persistence, and EnvyControl GPU switching (`hybrid`, `integrated`, `nvidia`)

### 2. Fan Control & Sensor Source (`acer fan`)
Powered by `nbfc-linux` with a custom EC profile for `Acer Nitro AN517-41` (CPU + GPU dual-fan tachometer readouts up to `6122 RPM`):
- Real-time temperature, duty cycle target, actual RPM, and mode display
- **Independent Fan Targeting**: Both fans, Left/CPU fan only (`-f 0`), or Right/GPU fan only (`-f 1`)
- **Sensor Source Configuration**: Choose between `@CPU (default)`, `k10temp`, `amdgpu`, `nvidia-ml`, `acpitz`, or `nvme` per fan (`nbfc sensors set`)
- Auto curve mode, Max/Turbo 100%, or custom manual percentage (`0–100%`)

### 2. 4-Zone Keyboard RGB (`acer rgb` / `acer keyboard`)
Powered by the `facer` WMI kernel module + bundled `rgb/facer_rgb.py` & `rgb/keyboard.py`:
- Presets: **Neon**, **Wave**, **Breathing (Cyan)**, **Static** (6 colors across 4 zones), and **Backlight OFF**
- Interactive keyboard RGB wizard (`keyboard.py`)
- Persistent boot service (`configs/systemd/acer-rgb.service`)

### 3. Battery Care & 80% Charge Limit (`acer bat` / `acer battery` / `cutcharge`)
Powered by the `acer_wmi_battery` kernel module (`/sys/bus/wmi/drivers/acer-wmi-battery/health_mode`):
- Real-time battery capacity, charging status, temperature, and health mode status
- Toggle **80% Charge Cut-Off** ON / OFF (100% full charge)
- Persist across reboots via `/etc/modprobe.d/acer-wmi-battery.conf`
- Includes standalone helper `bin/cutcharge` (`sudo cutcharge [on|off|status]`)

### 4. GPU Mode Switcher (`acer gpu`)
Powered by `envycontrol` + `switcheroo-control`:
- **Hybrid** (AMD iGPU + NVIDIA On-Demand)
- **Integrated** (AMD iGPU only for maximum battery life)
- **NVIDIA** (Dedicated RTX 3080 dGPU only)
- Device status check via `switcherooctl list` and `envycontrol -q`

### 5. Git & GitHub Developer Suite (`acer git` / `acer switch`)
- Repo summary header (branch, dirty file count, local vs global Git author, active GitHub CLI account, origin URL)
- **Per-Repository Local Account Override** (`git config --local` author + `github.user` + scoped `gh auth token` credential helper + origin URL prefix) without touching global config
- **Configurable 1-Click Presets** via `~/.config/acer/accounts.conf`
- Pull & Rebase, Working Tree / Diff / Stash, Quick Commit & Push, Remote Manager, Branch Manager (with optional `fzf`), and Git Graph Log

---

## Project Structure

```text
acer-linux-system/
├── bin/
│   ├── acer                             # Main CLI entry point + Web GUI launcher
│   └── cutcharge                        # Standalone battery 80% cut-off helper
├── web/                                 # Next.js Web GUI (Bun + Zustand + Zod + TanStack Query)
│   ├── src/app/                         # App Router pages & /api/* hardware endpoints
│   ├── src/components/                  # Animated fans, mini charts, 4-zone RGB keyboard, panels
│   ├── src/hooks/                       # TanStack Query polling & mutation hooks
│   ├── src/lib/                         # Zod schemas & safe server hardware bridge
│   └── src/store/                       # Zustand store & telemetry sparkline ring buffer
├── rgb/
│   ├── facer_rgb.py                     # 4-zone RGB controller script
│   └── keyboard.py                      # Interactive RGB keyboard wizard
├── configs/
│   ├── accounts.example.conf            # Template for Git/GitHub quick-switch presets
│   ├── nbfc/
│   │   ├── nbfc.json                    # Active NBFC config (Acer Nitro AN517-41)
│   │   └── Acer Nitro AN517-41.json     # EC fan curve & register profile
│   ├── modprobe.d/
│   │   ├── acer-wmi-battery.conf        # Enable 80% health_mode on module load
│   │   └── alsa-acer-nitro.conf         # Fix internal mic quirk on ALC295
│   ├── modules-load.d/
│   │   └── facer.conf                   # Auto-load facer kernel module
│   └── systemd/
│       ├── acer-rgb.service             # Apply RGB effect on boot
│       └── turbo-fan.service            # Build/reload facer module on boot
├── install.sh                           # Symlink CLI, build Web GUI, check deps, install configs
├── LICENSE                              # GPL-3.0
└── README.md
```

---

## Prerequisites & Kernel Drivers

### System Packages (Arch / CachyOS)
```bash
sudo pacman -S git github-cli python fzf switcheroo-control
yay -S nbfc-linux envycontrol
```

### Out-of-Tree Kernel Modules
1. **Keyboard RGB & Turbo (`facer`)**:
   - Upstream: [JafarAkhondali/acer-predator-turbo-and-rgb-keyboard-linux-module](https://github.com/JafarAkhondali/acer-predator-turbo-and-rgb-keyboard-linux-module)
   - Typically cloned/installed to `/opt/turbo-fan` (used by `configs/systemd/turbo-fan.service`).
2. **Battery Health Mode (`acer_wmi_battery`)**:
   - Upstream: [frederik-h/acer-wmi-battery](https://github.com/frederik-h/acer-wmi-battery)
   - Available via AUR (`acer-wmi-battery-dkms`) or built from source (`make && sudo make modules_install && sudo depmod -a`).

---

## Installation

```bash
git clone https://github.com/Redwolfc4/acer-linux-system.git
cd acer-linux-system
chmod +x install.sh bin/acer bin/cutcharge rgb/facer_rgb.py rgb/keyboard.py
```

### Link CLI + Build Web GUI (Recommended)
```bash
./install.sh --with-web
```

### Link CLI Only (creates `/usr/local/bin/acer` & `/usr/local/bin/cutcharge` symlinks)
```bash
./install.sh --link-only
```

### Full Setup (symlinks + system configs for NBFC, modprobe, systemd)
```bash
./install.sh --configs
sudo systemctl enable --now nbfc_service switcheroo-control acer-rgb turbo-fan
```

### Configure Git Account Presets (Optional)
Edit `~/.config/acer/accounts.conf` (created automatically from `configs/accounts.example.conf` on install):
```text
# alias|github_username|git_author_name|git_author_email
personal|your-github-username|Your Name|you@example.com
work|your-work-username|Work Name|work@company.com
```

---

## CLI Usage

```bash
acer                                  # Launch interactive main menu (includes Web GUI option)
acer gui                              # Start Next.js Web GUI & print http://localhost:3456
acer gui --open                       # Start Web GUI & open in default browser
acer gui status | stop | dev          # Check status, stop, or start dev mode
acer fan                              # Open Fan Control menu (Both / Left CPU / Right GPU + Sensors)
acer fan auto [all|cpu|gpu]           # Set Auto mode for both, left (CPU), or right (GPU) fan
acer fan set 75 [all|cpu|gpu]         # Set manual speed (%) for both, left, or right fan
acer fan sensor                       # Configure NBFC temperature sensor source per fan
acer fan sensor 1 nvidia-ml Average   # Assign nvidia-ml sensor to Right/GPU fan (#1)
acer rgb                              # Open Keyboard RGB menu
acer bat                              # Open Battery Care & 80% Charge Limit menu
acer gpu                              # Open GPU Mode Switcher (Hybrid / iGPU / NVIDIA)
acer git                              # Open Git & GitHub Developer Suite
acer switch                           # Open Git/GitHub Account Switcher
acer switch <alias>                   # 1-click local repo switch using ~/.config/acer/accounts.conf
acer switch reset                     # Remove local repo account override
acer pull                             # Quick git pull in current repo
acer status                           # Quick git status in current repo
acer help                             # Show CLI help
```

Standalone battery helper:
```bash
sudo cutcharge on     # Enable 80% charge limit
sudo cutcharge off    # Disable limit (charge to 100%)
sudo cutcharge status # Show current charge limit state
```

---

## Credits & License

- CLI suite & system configuration bundle by **Redwolfc4**
- `rgb/facer_rgb.py` & `rgb/keyboard.py` from [acer-predator-turbo-and-rgb-keyboard-linux-module](https://github.com/JafarAkhondali/acer-predator-turbo-and-rgb-keyboard-linux-module) (GPL-3.0)
- Battery WMI support via [acer-wmi-battery](https://github.com/frederik-h/acer-wmi-battery) (GPL-2.0)
- Fan control powered by [nbfc-linux](https://github.com/nbfc-linux/nbfc-linux) and GPU switching via [envycontrol](https://github.com/bayasdev/envycontrol)

Licensed under **GNU General Public License v3.0** — see [LICENSE](LICENSE).

