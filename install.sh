#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CYAN="\033[1;36m"
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
BOLD="\033[1m"
RESET="\033[0m"

show_usage() {
    echo "Usage: ./install.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  --link-only    Symlink bin/acer & bin/cutcharge to /usr/local/bin (default)"
    echo "  --configs      Also install system configs (nbfc, modprobe, modules-load, systemd)"
    echo "  --check        Check required dependencies & kernel modules"
    echo "  -h, --help     Show this help message"
}

check_deps() {
    echo -e "${CYAN}Checking dependencies & kernel modules...${RESET}"
    local deps=(bash python3 git gh nbfc envycontrol switcherooctl)
    for cmd in "${deps[@]}"; do
        if command -v "$cmd" &>/dev/null; then
            echo -e "  ${GREEN}✓${RESET} $cmd ($(command -v "$cmd"))"
        else
            echo -e "  ${YELLOW}✗${RESET} $cmd (not found)"
        fi
    done

    echo -e "\n${CYAN}Checking optional tools:${RESET}"
    if command -v fzf &>/dev/null; then
        echo -e "  ${GREEN}✓${RESET} fzf"
    else
        echo -e "  ${YELLOW}○${RESET} fzf (optional, for interactive branch picker)"
    fi

    echo -e "\n${CYAN}Checking kernel modules / sysfs nodes:${RESET}"
    if [ -e /dev/acer-gkbbl-0 ]; then
        echo -e "  ${GREEN}✓${RESET} facer (/dev/acer-gkbbl-0 present)"
    else
        echo -e "  ${YELLOW}✗${RESET} facer (/dev/acer-gkbbl-0 not found - RGB module not loaded)"
    fi

    if [ -d /sys/bus/wmi/drivers/acer-wmi-battery ]; then
        echo -e "  ${GREEN}✓${RESET} acer_wmi_battery (driver loaded)"
    else
        echo -e "  ${YELLOW}✗${RESET} acer_wmi_battery (driver not loaded)"
    fi
}

install_links() {
    echo -e "${YELLOW}Linking CLI executables to /usr/local/bin...${RESET}"
    chmod +x "$REPO_DIR/bin/acer" "$REPO_DIR/bin/cutcharge" "$REPO_DIR/rgb/facer_rgb.py" "$REPO_DIR/rgb/keyboard.py" 2>/dev/null || true

    sudo ln -sf "$REPO_DIR/bin/acer" /usr/local/bin/acer
    sudo ln -sf "$REPO_DIR/bin/cutcharge" /usr/local/bin/cutcharge

    local real_home="${HOME}"
    if [ -n "$SUDO_USER" ] && [ "$SUDO_USER" != "root" ]; then
        real_home=$(getent passwd "$SUDO_USER" | cut -d: -f6)
    fi
    local user_cfg_dir="${XDG_CONFIG_HOME:-$real_home/.config}/acer"
    mkdir -p "$user_cfg_dir"
    if [ ! -f "$user_cfg_dir/accounts.conf" ]; then
        cp "$REPO_DIR/configs/accounts.example.conf" "$user_cfg_dir/accounts.conf"
        echo -e "${CYAN}Created starter preset config at: $user_cfg_dir/accounts.conf${RESET}"
    fi

    echo -e "${GREEN}✓ Linked /usr/local/bin/acer -> $REPO_DIR/bin/acer${RESET}"
    echo -e "${GREEN}✓ Linked /usr/local/bin/cutcharge -> $REPO_DIR/bin/cutcharge${RESET}"
}

install_configs() {
    echo -e "\n${YELLOW}Installing system configuration files...${RESET}"
    sudo mkdir -p /etc/nbfc/configs /etc/modprobe.d /etc/modules-load.d /etc/systemd/system

    sudo cp "$REPO_DIR/configs/nbfc/nbfc.json" /etc/nbfc/nbfc.json
    sudo cp "$REPO_DIR/configs/nbfc/Acer Nitro AN517-41.json" "/etc/nbfc/configs/Acer Nitro AN517-41.json"
    sudo cp "$REPO_DIR/configs/modprobe.d/acer-wmi-battery.conf" /etc/modprobe.d/acer-wmi-battery.conf
    sudo cp "$REPO_DIR/configs/modprobe.d/alsa-acer-nitro.conf" /etc/modprobe.d/alsa-acer-nitro.conf
    sudo cp "$REPO_DIR/configs/modules-load.d/facer.conf" /etc/modules-load.d/facer.conf
    sudo cp "$REPO_DIR/configs/systemd/acer-rgb.service" /etc/systemd/system/acer-rgb.service
    sudo cp "$REPO_DIR/configs/systemd/turbo-fan.service" /etc/systemd/system/turbo-fan.service

    sudo systemctl daemon-reload
    echo -e "${GREEN}✓ Configs copied! Enable services as needed:${RESET}"
    echo "  sudo systemctl enable --now nbfc_service switcheroo-control acer-rgb turbo-fan"
}

case "${1:-}" in
    --link-only|"")
        install_links
        check_deps
        ;;
    --configs)
        install_links
        install_configs
        check_deps
        ;;
    --check)
        check_deps
        ;;
    -h|--help)
        show_usage
        ;;
    *)
        echo -e "${RED}Unknown option: $1${RESET}"
        show_usage
        exit 1
        ;;
esac

