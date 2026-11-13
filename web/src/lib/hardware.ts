import { execFile, execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  type BatteryControlRequest,
  type BatteryTelemetry,
  type FanControlRequest,
  type FanSensorUpdateRequest,
  type FanSensorsResponse,
  type FanTelemetry,
  type GitOverviewResponse,
  type GpuControlRequest,
  type RgbControlRequest,
  type RgbMode,
  type RgbProfileAction,
  type RgbProfilesResponse,
  type RgbSavedState,
  RgbSavedStateSchema,
  type TelemetryResponse,
} from "./schemas";

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const WMI_BATTERY_DIR = "/sys/bus/wmi/drivers/acer-wmi-battery";
const BAT1_DIR = "/sys/class/power_supply/BAT1";
const MODPROBE_BAT_CONF = "/etc/modprobe.d/acer-wmi-battery.conf";
const FACER_DEV = "/dev/acer-gkbbl-0";

let prevCpuIdle = 0;
let prevCpuTotal = 0;

async function runCmd(
  cmd: string,
  args: string[],
  timeout = 4000
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      timeout,
      encoding: "utf8",
    });
    return { ok: true, stdout: stdout ?? "", stderr: stderr ?? "" };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return {
      ok: false,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? e.message ?? "Command failed",
    };
  }
}

async function runSudo(
  args: string[],
  timeout = 8000
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return runCmd("sudo", ["-n", ...args], timeout);
}

function readText(filePath: string): string | null {
  try {
    return readFileSync(filePath, "utf8").trim();
  } catch {
    return null;
  }
}

function resolveFacerRgbScript(): string | null {
  const candidates = [
    path.join(PROJECT_ROOT, "rgb", "facer_rgb.py"),
    "/opt/turbo-fan/facer_rgb.py",
    "/usr/local/bin/facer_rgb.py",
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function getCpuLoadPercent(): number {
  const raw = readText("/proc/stat");
  if (!raw) return 0;
  const firstLine = raw.split("\n")[0];
  if (!firstLine?.startsWith("cpu ")) return 0;
  const parts = firstLine
    .trim()
    .split(/\s+/)
    .slice(1)
    .map((n) => Number.parseInt(n, 10) || 0);
  const idle = (parts[3] ?? 0) + (parts[4] ?? 0);
  const total = parts.reduce((acc, v) => acc + v, 0);

  if (prevCpuTotal === 0) {
    prevCpuIdle = idle;
    prevCpuTotal = total;
    return 0;
  }

  const diffIdle = idle - prevCpuIdle;
  const diffTotal = total - prevCpuTotal;
  prevCpuIdle = idle;
  prevCpuTotal = total;

  if (diffTotal <= 0) return 0;
  const usage = ((diffTotal - diffIdle) / diffTotal) * 100;
  return Math.max(0, Math.min(100, Number(usage.toFixed(1))));
}

function getMemoryStats(): { usedGb: number; totalGb: number; percent: number } {
  const raw = readText("/proc/meminfo");
  if (!raw) {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return {
      usedGb: Number((used / 1024 ** 3).toFixed(2)),
      totalGb: Number((total / 1024 ** 3).toFixed(2)),
      percent: Number(((used / total) * 100).toFixed(1)),
    };
  }

  let memTotalKb = 0;
  let memAvailKb = 0;
  for (const line of raw.split("\n")) {
    if (line.startsWith("MemTotal:")) {
      memTotalKb = Number.parseInt(line.replace(/\D+/g, ""), 10) || 0;
    } else if (line.startsWith("MemAvailable:")) {
      memAvailKb = Number.parseInt(line.replace(/\D+/g, ""), 10) || 0;
    }
  }
  if (memTotalKb <= 0) return { usedGb: 0, totalGb: 0, percent: 0 };
  const usedKb = Math.max(0, memTotalKb - memAvailKb);
  return {
    usedGb: Number((usedKb / (1024 * 1024)).toFixed(2)),
    totalGb: Number((memTotalKb / (1024 * 1024)).toFixed(2)),
    percent: Number(((usedKb / memTotalKb) * 100).toFixed(1)),
  };
}

function getSystemInfo() {
  const vendor = readText("/sys/devices/virtual/dmi/id/sys_vendor") ?? "Acer";
  const product =
    readText("/sys/devices/virtual/dmi/id/product_name") ?? "Nitro AN517-41";
  const osRelease = readText("/etc/os-release") ?? "";
  let distro = "Linux";
  for (const line of osRelease.split("\n")) {
    if (line.startsWith("PRETTY_NAME=")) {
      distro = line.replace("PRETTY_NAME=", "").replace(/^"|"$/g, "");
      break;
    }
  }
  const cpus = os.cpus();
  const cpuModel = cpus[0]?.model?.trim() ?? "AMD Ryzen 7 5800H";
  const mem = getMemoryStats();

  return {
    model: `${vendor} ${product}`.trim(),
    kernel: os.release(),
    distro,
    hostname: os.hostname(),
    uptimeSeconds: Math.floor(os.uptime()),
    cpuModel,
    cpuLoadPercent: getCpuLoadPercent(),
    memoryUsedGb: mem.usedGb,
    memoryTotalGb: mem.totalGb,
    memoryPercent: mem.percent,
  };
}

export function parseNbfcStatus(output: string): {
  readOnly: boolean;
  configName: string;
  fans: FanTelemetry[];
} {
  let readOnly = false;
  let configName = "Acer Nitro AN517-41";
  const fans: FanTelemetry[] = [];

  let current: Partial<FanTelemetry> | null = null;
  let maxRpm = 6122;

  for (const rawLine of output.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const sepIdx = line.indexOf(":");
    if (sepIdx === -1) continue;

    const key = line.slice(0, sepIdx).trim();
    const val = line.slice(sepIdx + 1).trim();

    if (key === "Read-only") {
      readOnly = val === "true";
    } else if (key === "Selected Config Name") {
      configName = val;
    } else if (key === "Fan Display Name") {
      if (current) {
        const idx: 0 | 1 = fans.length === 0 ? 0 : 1;
        fans.push({
          index: idx,
          name: current.name ?? (idx === 0 ? "CPU fan" : "GPU fan"),
          side: idx === 0 ? "left" : "right",
          temperature: current.temperature ?? 0,
          autoControl: current.autoControl ?? true,
          criticalMode: current.criticalMode ?? false,
          currentSpeed: current.currentSpeed ?? 0,
          targetSpeed: current.targetSpeed ?? 0,
          rpm: Math.round(((current.currentSpeed ?? 0) / 100) * maxRpm),
          maxRpm,
        });
      }
      current = { name: val };
    } else if (current) {
      if (key === "Temperature") current.temperature = Number.parseFloat(val) || 0;
      else if (key === "Auto Control Enabled") current.autoControl = val === "true";
      else if (key === "Critical Mode Enabled") current.criticalMode = val === "true";
      else if (key === "Current Fan Speed") current.currentSpeed = Number.parseFloat(val) || 0;
      else if (key === "Target Fan Speed") current.targetSpeed = Number.parseFloat(val) || 0;
      else if (key === "Fan Speed Steps") maxRpm = Number.parseInt(val, 10) || 6122;
    }
  }

  if (current) {
    const idx: 0 | 1 = fans.length === 0 ? 0 : 1;
    fans.push({
      index: idx,
      name: current.name ?? (idx === 0 ? "CPU fan" : "GPU fan"),
      side: idx === 0 ? "left" : "right",
      temperature: current.temperature ?? 0,
      autoControl: current.autoControl ?? true,
      criticalMode: current.criticalMode ?? false,
      currentSpeed: current.currentSpeed ?? 0,
      targetSpeed: current.targetSpeed ?? 0,
      rpm: Math.round(((current.currentSpeed ?? 0) / 100) * maxRpm),
      maxRpm,
    });
  }

  return { readOnly, configName, fans };
}

function resolveBatteryDir(): string {
  if (existsSync("/sys/class/power_supply/BAT1")) return "/sys/class/power_supply/BAT1";
  if (existsSync("/sys/class/power_supply/BAT0")) return "/sys/class/power_supply/BAT0";
  return BAT1_DIR;
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 mnt";
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours === 0) return `${remMinutes} mnt`;
  if (remMinutes === 0) return `${hours} jam`;
  return `${hours}j ${remMinutes}m`;
}

export function readBatteryTelemetry(): BatteryTelemetry {
  const batDir = resolveBatteryDir();
  const rawCap = readText(path.join(batDir, "capacity"));
  const rawStatus = readText(path.join(batDir, "status")) ?? "Unknown";
  const rawVolt = readText(path.join(batDir, "voltage_now"));
  const rawCurrent = readText(path.join(batDir, "current_now"));
  const rawPower = readText(path.join(batDir, "power_now"));
  const rawChargeNow = readText(path.join(batDir, "charge_now"));
  const rawChargeFull = readText(path.join(batDir, "charge_full"));
  const rawChargeFullDesign = readText(path.join(batDir, "charge_full_design"));
  const rawBatTemp = readText(path.join(WMI_BATTERY_DIR, "temperature"));
  const rawHealth = readText(path.join(WMI_BATTERY_DIR, "health_mode"));
  const modprobeConf = readText(MODPROBE_BAT_CONF) ?? "";

  const capacity = rawCap !== null ? Number.parseInt(rawCap, 10) : null;
  const status = rawStatus;
  const healthMode = rawHealth !== null ? rawHealth === "1" : null;
  const persistBoot = modprobeConf.includes("enable_health_mode=1");

  const temperature =
    rawBatTemp !== null
      ? Number((Number.parseInt(rawBatTemp, 10) / 1000).toFixed(1))
      : null;

  const rawVoltNum = rawVolt ? Number.parseInt(rawVolt, 10) : null;
  const voltageVolts =
    rawVoltNum !== null && !Number.isNaN(rawVoltNum)
      ? Number((rawVoltNum / 1_000_000).toFixed(2))
      : null;

  const rawCurrentNum = rawCurrent ? Math.abs(Number.parseInt(rawCurrent, 10)) : null;
  const currentAmps =
    rawCurrentNum !== null && !Number.isNaN(rawCurrentNum)
      ? Number((rawCurrentNum / 1_000_000).toFixed(3))
      : null;

  let powerWatts: number | null = null;
  if (rawPower) {
    const p = Math.abs(Number.parseInt(rawPower, 10));
    if (!Number.isNaN(p)) {
      powerWatts = Number((p / 1_000_000).toFixed(2));
    }
  } else if (voltageVolts !== null && currentAmps !== null) {
    powerWatts = Number((voltageVolts * currentAmps).toFixed(2));
  }

  const rawChargeNowNum = rawChargeNow ? Number.parseInt(rawChargeNow, 10) : null;
  const chargeNowMah =
    rawChargeNowNum !== null && !Number.isNaN(rawChargeNowNum)
      ? Math.round(rawChargeNowNum / 1000)
      : null;

  const rawChargeFullNum = rawChargeFull ? Number.parseInt(rawChargeFull, 10) : null;
  const chargeFullMah =
    rawChargeFullNum !== null && !Number.isNaN(rawChargeFullNum)
      ? Math.round(rawChargeFullNum / 1000)
      : null;

  const rawChargeFullDesignNum = rawChargeFullDesign
    ? Number.parseInt(rawChargeFullDesign, 10)
    : null;
  const chargeFullDesignMah =
    rawChargeFullDesignNum !== null && !Number.isNaN(rawChargeFullDesignNum)
      ? Math.round(rawChargeFullDesignNum / 1000)
      : null;

  const healthPercent =
    chargeFullMah && chargeFullDesignMah && chargeFullDesignMah > 0
      ? Number(((chargeFullMah / chargeFullDesignMah) * 100).toFixed(1))
      : null;

  // Target sesuai kebutuhan pengguna:
  // Jika Limit 80% (healthMode=true) aktif -> target 80% (cut-off).
  // Jika Cas Penuh (healthMode=false) aktif -> target 100% full.
  const targetPercent = healthMode === true ? 80 : 100;

  let timeTo80Minutes: number | null = null;
  let timeToFullMinutes: number | null = null;
  let timeToEmptyMinutes: number | null = null;
  let timeToTargetMinutes: number | null = null;
  let targetReached = false;
  let estimateFormatted: string | null = null;

  const statusNorm = status.toLowerCase();

  if (statusNorm === "charging") {
    // Estimasi pengisian daya
    if (rawChargeFullNum && rawChargeNowNum !== null && rawCurrentNum && rawCurrentNum > 20_000) {
      const charge80 = Math.round(rawChargeFullNum * 0.8);
      if (rawChargeNowNum >= charge80 || (capacity !== null && capacity >= 80)) {
        timeTo80Minutes = 0;
      } else {
        timeTo80Minutes = Math.max(
          1,
          Math.round(((charge80 - rawChargeNowNum) / rawCurrentNum) * 60)
        );
      }

      if (rawChargeNowNum >= rawChargeFullNum || (capacity !== null && capacity >= 100)) {
        timeToFullMinutes = 0;
      } else {
        timeToFullMinutes = Math.max(
          1,
          Math.round(((rawChargeFullNum - rawChargeNowNum) / rawCurrentNum) * 60)
        );
      }
    }

    if (targetPercent === 80) {
      targetReached = (capacity !== null && capacity >= 80) || timeTo80Minutes === 0;
      timeToTargetMinutes = targetReached ? 0 : timeTo80Minutes;
      if (targetReached) {
        estimateFormatted = "Batas 80% Cut-Off tercapai";
      } else if (timeTo80Minutes !== null) {
        estimateFormatted = `~${formatDuration(timeTo80Minutes)} menuju batas 80%`;
      } else {
        estimateFormatted = "Menghitung estimasi...";
      }
    } else {
      targetReached = (capacity !== null && capacity >= 100) || timeToFullMinutes === 0;
      timeToTargetMinutes = targetReached ? 0 : timeToFullMinutes;
      if (targetReached) {
        estimateFormatted = "Baterai Penuh 100%";
      } else if (timeToFullMinutes !== null) {
        estimateFormatted = `~${formatDuration(timeToFullMinutes)} menuju 100% penuh`;
      } else {
        estimateFormatted = "Menghitung estimasi...";
      }
    }
  } else if (statusNorm === "discharging") {
    // Estimasi saat menggunakan daya baterai
    targetReached = false;
    timeTo80Minutes = null;
    timeToFullMinutes = null;
    timeToTargetMinutes = null;

    if (rawChargeNowNum !== null && rawCurrentNum && rawCurrentNum > 20_000) {
      timeToEmptyMinutes = Math.max(
        1,
        Math.round((rawChargeNowNum / rawCurrentNum) * 60)
      );
      estimateFormatted = `Sisa waktu: ~${formatDuration(timeToEmptyMinutes)}`;
    } else {
      estimateFormatted = "Menghitung sisa waktu...";
    }
  } else if (statusNorm === "full") {
    targetReached = true;
    timeTo80Minutes = 0;
    timeToFullMinutes = 0;
    timeToTargetMinutes = 0;
    estimateFormatted = "Baterai Penuh (100%)";
  } else if (statusNorm === "not charging") {
    targetReached = capacity !== null && capacity >= 80;
    estimateFormatted = targetReached
      ? "Cut-Off aktif (Tersambung, tidak mengisi)"
      : "Tersambung Adaptor AC (Tidak mengisi)";
  } else {
    estimateFormatted = status;
  }

  return {
    driverLoaded: existsSync(WMI_BATTERY_DIR),
    capacity,
    status,
    temperature,
    healthMode,
    persistBoot,
    voltageVolts,
    currentAmps,
    powerWatts,
    chargeNowMah,
    chargeFullMah,
    chargeFullDesignMah,
    healthPercent,
    timeTo80Minutes,
    timeToFullMinutes,
    timeToEmptyMinutes,
    timeToTargetMinutes,
    targetPercent,
    targetReached,
    estimateFormatted,
  };
}

export async function getTelemetry(): Promise<TelemetryResponse> {
  const [nbfcRes, envyRes, switcherooRes, nvidiaRes] = await Promise.all([
    runCmd("nbfc", ["status"], 3000),
    runCmd("envycontrol", ["-q"], 2500),
    runCmd("switcherooctl", ["list"], 2500),
    runCmd(
      "nvidia-smi",
      [
        "--query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total",
        "--format=csv,noheader,nounits",
      ],
      1500
    ),
  ]);

  const parsedNbfc = nbfcRes.ok
    ? parseNbfcStatus(nbfcRes.stdout)
    : { readOnly: false, configName: "Unavailable", fans: [] };

  const battery = readBatteryTelemetry();

  const devices: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    isDiscrete: boolean;
  }> = [];

  if (switcherooRes.ok) {
    let cur: { id: string; name: string; isDefault: boolean; isDiscrete: boolean } | null = null;
    for (const rawLine of switcherooRes.stdout.split("\n")) {
      const line = rawLine.trim();
      if (line.startsWith("Device:")) {
        if (cur) devices.push(cur);
        cur = {
          id: line.replace("Device:", "").trim(),
          name: "Unknown GPU",
          isDefault: false,
          isDiscrete: false,
        };
      } else if (cur) {
        if (line.startsWith("Name:")) {
          cur.name = line.replace("Name:", "").trim();
        } else if (line.startsWith("Default:")) {
          cur.isDefault = line.replace("Default:", "").trim() === "yes";
        } else if (line.startsWith("Discrete:")) {
          cur.isDiscrete = line.replace("Discrete:", "").trim() === "yes";
        }
      }
    }
    if (cur) devices.push(cur);
  }

  let nvidiaStats: TelemetryResponse["gpu"]["nvidiaStats"] = null;
  if (nvidiaRes.ok && nvidiaRes.stdout.trim()) {
    const firstLine = nvidiaRes.stdout.trim().split("\n")[0];
    const cols = firstLine.split(",").map((c) => c.trim());
    if (cols.length >= 5) {
      const temp = Number.parseFloat(cols[1]);
      const util = Number.parseFloat(cols[2]);
      const memUsed = Number.parseFloat(cols[3]);
      const memTotal = Number.parseFloat(cols[4]);
      if (!Number.isNaN(temp)) {
        nvidiaStats = {
          name: cols[0],
          temperature: temp,
          utilization: Number.isNaN(util) ? 0 : util,
          memoryUsedMb: Number.isNaN(memUsed) ? 0 : memUsed,
          memoryTotalMb: Number.isNaN(memTotal) ? 0 : memTotal,
        };
      }
    }
  }

  return {
    timestamp: Date.now(),
    system: getSystemInfo(),
    nbfc: {
      available: nbfcRes.ok && parsedNbfc.fans.length > 0,
      configName: parsedNbfc.configName,
      readOnly: parsedNbfc.readOnly,
      fans: parsedNbfc.fans,
    },
    battery,
    rgb: {
      devicePresent: existsSync(FACER_DEV),
    },
    gpu: {
      currentMode: envyRes.ok ? envyRes.stdout.trim() : "unknown",
      devices,
      nvidiaStats,
    },
  };
}

export async function controlFan(input: FanControlRequest): Promise<void> {
  const baseArgs = ["nbfc", "set"];
  if (input.mode === "auto") {
    baseArgs.push("-a");
  } else if (input.mode === "max") {
    baseArgs.push("-s", "100");
  } else {
    baseArgs.push("-s", String(input.speed ?? 50));
  }

  if (input.target === "cpu") {
    baseArgs.push("-f", "0");
  } else if (input.target === "gpu") {
    baseArgs.push("-f", "1");
  }

  const res = await runSudo(baseArgs);
  if (!res.ok) {
    throw new Error(res.stderr || "Failed to update fan speed via nbfc");
  }
}

export async function getFanSensors(): Promise<FanSensorsResponse> {
  const [showRes, listRes] = await Promise.all([
    runCmd("nbfc", ["sensors", "show"], 3000),
    runCmd("nbfc", ["sensors", "list"], 3000),
  ]);

  const mappings: FanSensorsResponse["mappings"] = [];
  if (showRes.ok) {
    let cur: {
      fanIndex: 0 | 1;
      fanName: string;
      sensors: string[];
      algorithm: string;
      isDefaultSensors: boolean;
    } | null = null;

    for (const rawLine of showRes.stdout.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;

      const headerMatch = /^#(\d+)\s+\((.+)\):$/.exec(line);
      if (headerMatch) {
        if (cur) mappings.push(cur);
        const idx = Number.parseInt(headerMatch[1], 10) === 1 ? 1 : 0;
        cur = {
          fanIndex: idx,
          fanName: headerMatch[2],
          sensors: [],
          algorithm: "Average",
          isDefaultSensors: true,
        };
      } else if (cur && line.startsWith("Sensors:")) {
        const val = line.replace("Sensors:", "").trim();
        cur.isDefaultSensors = val.includes("(default)");
        const cleaned = val.replace(/\s*\((default|service config)\)\s*/g, "").trim();
        cur.sensors = cleaned
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (cur && line.startsWith("Algorithm:")) {
        const val = line.replace("Algorithm:", "").trim();
        cur.algorithm = val.replace(/\s*\((default|service config)\)\s*/g, "").trim();
      }
    }
    if (cur) mappings.push(cur);
  }

  const available: FanSensorsResponse["available"] = [];
  if (listRes.ok) {
    let curSensor: { name: string; paths: string[]; active: boolean } | null = null;
    for (const rawLine of listRes.stdout.split("\n")) {
      if (!rawLine.trim()) continue;
      if (!rawLine.startsWith("\t") && !rawLine.startsWith("  ") && rawLine.trim().endsWith(":")) {
        if (curSensor) available.push(curSensor);
        curSensor = {
          name: rawLine.trim().slice(0, -1),
          paths: [],
          active: false,
        };
      } else if (curSensor) {
        const p = rawLine.trim();
        if (p !== "none") {
          curSensor.paths.push(p);
          curSensor.active = true;
        }
      }
    }
    if (curSensor) available.push(curSensor);
  }

  return { mappings, available };
}

export async function updateFanSensors(input: FanSensorUpdateRequest): Promise<void> {
  const args = ["nbfc", "sensors", "set", "-f", String(input.fanIndex)];

  const wantsDefault =
    input.sensors.length === 1 &&
    (input.sensors[0] === "@default" ||
      input.sensors[0] === "@CPU" ||
      input.sensors[0] === "@GPU");

  if (!wantsDefault) {
    for (const sensor of input.sensors) {
      args.push("-s", sensor);
    }
    args.push("-a", input.algorithm);
    if (input.force) {
      args.push("--force");
    }
  }

  const setRes = await runSudo(args, 6000);
  if (!setRes.ok) {
    throw new Error(setRes.stderr || "Failed to update nbfc sensor configuration");
  }

  const restartRes = await runSudo(["nbfc", "restart"], 8000);
  if (!restartRes.ok) {
    throw new Error(restartRes.stderr || "Sensor saved but failed to restart nbfc service");
  }
}

const MODE_INDEX_MAP: Record<Exclude<RgbControlRequest["mode"], "off">, number> = {
  static: 0,
  breath: 1,
  neon: 2,
  wave: 3,
  shifting: 4,
  zoom: 5,
};

const INDEX_TO_MODE_MAP: Record<number, Exclude<RgbMode, "off">> = {
  0: "static",
  1: "breath",
  2: "neon",
  3: "wave",
  4: "shifting",
  5: "zoom",
};

export function getPredatorConfigDir(): string {
  const sudoUser = process.env.SUDO_USER;
  let baseHome = os.homedir();
  if (sudoUser && sudoUser !== "root") {
    try {
      const userHome = execSync(`getent passwd ${sudoUser} | cut -d: -f6`, {
        encoding: "utf-8",
      }).trim();
      if (userHome && existsSync(userHome)) {
        baseHome = userHome;
      }
    } catch {
      // fallback to os.homedir()
    }
  }
  return path.join(baseHome, ".config", "predator");
}

export function getPredatorSavedProfilesDir(): string {
  return path.join(getPredatorConfigDir(), "saved profiles");
}

export function getLastRgbStateFile(): string {
  return path.join(getPredatorConfigDir(), "last_state.json");
}

export function readLastRgbState(): RgbSavedState | null {
  const filePath = getLastRgbStateFile();
  try {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    const parsed = RgbSavedStateSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveLastRgbState(state: RgbSavedState): void {
  const dir = getPredatorConfigDir();
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const filePath = getLastRgbStateFile();
    writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save last RGB state:", err);
  }
}

export async function applyRgb(input: RgbControlRequest): Promise<void> {
  const script = resolveFacerRgbScript();
  if (!script) {
    throw new Error("facer_rgb.py not found in rgb/ or /opt/turbo-fan/");
  }

  const existingState = readLastRgbState();

  if (input.mode === "off" || input.brightness === 0) {
    const res = await runCmd("python3", [script, "-b", "0"]);
    if (!res.ok) throw new Error(res.stderr || "Failed to turn off RGB backlight");

    const fallbackActive: RgbControlRequest = {
      mode: "wave",
      zone: "all",
      speed: 4,
      brightness: 100,
      direction: 2,
      color: { r: 0, g: 240, b: 255 },
    };

    const lastActiveConfig =
      existingState?.lastActiveConfig && existingState.lastActiveConfig.mode !== "off"
        ? existingState.lastActiveConfig
        : existingState && existingState.mode !== "off" && existingState.brightness > 0
          ? {
              mode: existingState.mode,
              zone: existingState.zone,
              speed: existingState.speed,
              brightness: existingState.brightness,
              direction: existingState.direction,
              color: existingState.color,
              zoneColors: existingState.zoneColors,
            }
          : fallbackActive;

    saveLastRgbState({
      mode: "off",
      zone: input.zone ?? "all",
      speed: input.speed ?? 4,
      brightness: 0,
      direction: input.direction ?? 2,
      color: input.color ?? { r: 0, g: 240, b: 255 },
      zoneColors: input.zoneColors,
      isOff: true,
      lastActiveConfig,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  // Active lighting mode
  const activeConfig: RgbControlRequest = {
    mode: input.mode,
    zone: input.zone ?? "all",
    speed: input.speed ?? 4,
    brightness: input.brightness,
    direction: input.direction ?? 2,
    color: input.color,
    zoneColors: input.zoneColors,
  };

  saveLastRgbState({
    ...activeConfig,
    isOff: false,
    lastActiveConfig: activeConfig,
    updatedAt: new Date().toISOString(),
  });

  if (input.mode === "static") {
    if (input.zoneColors && input.zoneColors.length > 0 && input.zone === "all") {
      for (const zc of input.zoneColors) {
        const res = await runCmd("python3", [
          script,
          "-m",
          "0",
          "-z",
          String(zc.zone),
          "-b",
          String(input.brightness),
          "-cR",
          String(zc.r),
          "-cG",
          String(zc.g),
          "-cB",
          String(zc.b),
        ]);
        if (!res.ok) {
          throw new Error(res.stderr || `Failed to set RGB zone ${zc.zone}`);
        }
      }
      return;
    }

    const zones = input.zone === "all" ? [1, 2, 3, 4] : [input.zone];
    for (const z of zones) {
      const res = await runCmd("python3", [
        script,
        "-m",
        "0",
        "-z",
        String(z),
        "-b",
        String(input.brightness),
        "-cR",
        String(input.color.r),
        "-cG",
        String(input.color.g),
        "-cB",
        String(input.color.b),
      ]);
      if (!res.ok) {
        throw new Error(res.stderr || `Failed to set RGB zone ${z}`);
      }
    }
    return;
  }

  const modeIndex = MODE_INDEX_MAP[input.mode];
  const args = [
    script,
    "-m",
    String(modeIndex),
    "-s",
    String(input.speed),
    "-b",
    String(input.brightness),
    "-d",
    String(input.direction),
  ];

  if (input.mode !== "neon" && input.mode !== "wave") {
    args.push(
      "-cR",
      String(input.color.r),
      "-cG",
      String(input.color.g),
      "-cB",
      String(input.color.b)
    );
  }

  const res = await runCmd("python3", args);
  if (!res.ok) {
    throw new Error(res.stderr || "Failed to apply RGB effect");
  }
}

export async function getRgbProfiles(): Promise<RgbProfilesResponse> {
  const script = resolveFacerRgbScript();
  const savedDir = getPredatorSavedProfilesDir();
  let profiles: string[] = [];
  try {
    if (existsSync(savedDir)) {
      profiles = readdirSync(savedDir)
        .filter((f) => !f.startsWith(".") && f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/i, ""));
    }
  } catch {
    profiles = [];
  }

  const currentState = readLastRgbState();

  return {
    available: Boolean(script),
    devicePresent: existsSync(FACER_DEV),
    profiles,
    currentState,
    lastActiveConfig: currentState?.lastActiveConfig ?? null,
  };
}

export async function handleRgbProfile(
  input: RgbProfileAction
): Promise<RgbControlRequest | null> {
  const script = resolveFacerRgbScript();
  if (!script) {
    throw new Error("facer_rgb.py not found");
  }

  const savedDir = getPredatorSavedProfilesDir();

  if (input.action === "load") {
    const res = await runCmd("python3", [script, "-load", input.name]);
    if (!res.ok) throw new Error(res.stderr || `Failed to load profile ${input.name}`);

    // Read profile JSON if present
    const profileFile = path.join(savedDir, `${input.name}.json`);
    let loadedConfig: RgbControlRequest | null = null;
    if (existsSync(profileFile)) {
      try {
        const raw = readFileSync(profileFile, "utf-8");
        const data = JSON.parse(raw);
        let mode: RgbMode = "wave";
        if (typeof data.mode === "number") {
          mode = INDEX_TO_MODE_MAP[data.mode] ?? "wave";
        } else if (typeof data.mode === "string") {
          mode = (data.mode as RgbMode) || "wave";
        }

        const color = {
          r: typeof data.red === "number" ? data.red : data.color?.r ?? 0,
          g: typeof data.green === "number" ? data.green : data.color?.g ?? 255,
          b: typeof data.blue === "number" ? data.blue : data.color?.b ?? 255,
        };

        const speed = typeof data.speed === "number" ? data.speed : 4;
        const brightness = typeof data.brightness === "number" ? data.brightness : 100;
        const direction = data.direction === 1 ? 1 : 2;
        const zone =
          data.zone && [1, 2, 3, 4].includes(data.zone)
            ? (data.zone as 1 | 2 | 3 | 4)
            : "all";

        let zoneColors = data.zoneColors;
        if (!zoneColors && mode === "static") {
          zoneColors = ([1, 2, 3, 4] as const).map((z) => ({
            zone: z,
            ...color,
          }));
        }

        loadedConfig = {
          mode,
          zone,
          speed,
          brightness,
          direction,
          color,
          zoneColors,
        };

        // Also persist as last active state
        saveLastRgbState({
          ...loadedConfig,
          isOff: mode === "off" || brightness === 0,
          lastActiveConfig: loadedConfig,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        loadedConfig = null;
      }
    }
    return loadedConfig;
  }

  const cfg = input.config;
  if (!cfg || cfg.mode === "off") {
    const res = await runCmd("python3", [script, "-b", "0", "-save", input.name]);
    if (!res.ok) throw new Error(res.stderr || "Failed to save profile");
    return null;
  }

  const modeIdx = MODE_INDEX_MAP[cfg.mode];
  const args = [
    script,
    "-m",
    String(modeIdx),
    "-s",
    String(cfg.speed),
    "-b",
    String(cfg.brightness),
    "-d",
    String(cfg.direction),
    "-cR",
    String(cfg.color.r),
    "-cG",
    String(cfg.color.g),
    "-cB",
    String(cfg.color.b),
    "-save",
    input.name,
  ];
  const res = await runCmd("python3", args);
  if (!res.ok) throw new Error(res.stderr || `Failed to save profile ${input.name}`);

  // Enrich saved JSON with zoneColors if provided
  const profileFile = path.join(savedDir, `${input.name}.json`);
  if (existsSync(profileFile) && cfg.zoneColors) {
    try {
      const raw = JSON.parse(readFileSync(profileFile, "utf-8"));
      raw.zoneColors = cfg.zoneColors;
      writeFileSync(profileFile, JSON.stringify(raw, null, 2), "utf-8");
    } catch {
      // ignore
    }
  }

  return cfg;
}

export async function controlBattery(input: BatteryControlRequest): Promise<void> {
  if (input.healthMode !== undefined) {
    if (!existsSync(WMI_BATTERY_DIR)) {
      await runSudo(["modprobe", "acer_wmi_battery"]);
    }
    const healthPath = path.join(WMI_BATTERY_DIR, "health_mode");
    const val = input.healthMode ? "1" : "0";
    const res = await runSudo([
      "bash",
      "-c",
      `printf '%s\n' '${val}' > '${healthPath}'`,
    ]);
    if (!res.ok) {
      throw new Error(res.stderr || "Failed to update acer_wmi_battery health_mode");
    }
  }

  if (input.persistBoot !== undefined) {
    if (input.persistBoot) {
      const res = await runSudo([
        "bash",
        "-c",
        `printf '%s\n' 'options acer_wmi_battery enable_health_mode=1' > '${MODPROBE_BAT_CONF}'`,
      ]);
      if (!res.ok) throw new Error(res.stderr || "Failed to write modprobe config");
    } else if (existsSync(MODPROBE_BAT_CONF)) {
      const res = await runSudo(["rm", "-f", MODPROBE_BAT_CONF]);
      if (!res.ok) throw new Error(res.stderr || "Failed to remove modprobe config");
    }
  }
}

export async function controlGpu(input: GpuControlRequest): Promise<void> {
  const res = await runSudo(["envycontrol", "-s", input.mode], 15000);
  if (!res.ok) {
    throw new Error(res.stderr || `Failed to switch GPU mode to ${input.mode}`);
  }
}

export async function getGitOverview(): Promise<GitOverviewResponse> {
  const [ghRes, gitNameRes, gitEmailRes] = await Promise.all([
    runCmd("gh", ["auth", "status"], 3000),
    runCmd("git", ["config", "--global", "user.name"], 2000),
    runCmd("git", ["config", "--global", "user.email"], 2000),
  ]);

  const ghCombined = `${ghRes.stdout}\n${ghRes.stderr}`;
  const ghAccounts: GitOverviewResponse["ghAccounts"] = [];
  const lines = ghCombined.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const accMatch = /account\s+([^\s(]+)/.exec(lines[i]);
    if (accMatch) {
      const username = accMatch[1];
      let active = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes("Active account: true")) {
          active = true;
          break;
        }
        if (lines[j].includes("account ")) break;
      }
      if (!ghAccounts.some((a) => a.username === username)) {
        ghAccounts.push({ username, active });
      }
    }
  }

  const presets: GitOverviewResponse["presets"] = [];
  const cfgCandidates = [
    path.join(
      process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
      "acer",
      "accounts.conf"
    ),
    path.join(PROJECT_ROOT, "configs", "accounts.conf"),
  ];

  for (const cfgPath of cfgCandidates) {
    if (existsSync(cfgPath)) {
      const content = readText(cfgPath) ?? "";
      for (const rawLine of content.split("\n")) {
        const clean = rawLine.split("#")[0]?.trim() ?? "";
        if (!clean) continue;
        const [alias, githubUsername, gitName, gitEmail] = clean.split("|");
        if (alias && githubUsername) {
          presets.push({
            alias: alias.trim(),
            githubUsername: githubUsername.trim(),
            gitName: (gitName ?? githubUsername).trim(),
            gitEmail: (gitEmail ?? "").trim(),
          });
        }
      }
      break;
    }
  }

  return {
    ghAccounts,
    presets,
    globalAuthor: {
      name: gitNameRes.ok ? gitNameRes.stdout.trim() : "",
      email: gitEmailRes.ok ? gitEmailRes.stdout.trim() : "",
    },
  };
}

