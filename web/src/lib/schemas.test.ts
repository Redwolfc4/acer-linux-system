import { describe, expect, test } from "bun:test";
import { parseNbfcStatus, readBatteryTelemetry } from "./hardware";
import {
  BatteryControlRequestSchema,
  BatteryTelemetrySchema,
  FanControlRequestSchema,
  FanSensorUpdateSchema,
  GpuControlRequestSchema,
  RgbControlRequestSchema,
  RgbProfileActionSchema,
  RgbSavedStateSchema,
} from "./schemas";

describe("Zod Hardware Control Schemas", () => {
  test("FanControlRequestSchema validates manual, auto, max and rejects missing manual speed", () => {
    expect(
      FanControlRequestSchema.parse({ target: "cpu", mode: "auto" })
    ).toEqual({ target: "cpu", mode: "auto" });

    expect(
      FanControlRequestSchema.parse({ target: "gpu", mode: "manual", speed: 75 })
    ).toEqual({ target: "gpu", mode: "manual", speed: 75 });

    const invalidManual = FanControlRequestSchema.safeParse({
      target: "both",
      mode: "manual",
    });
    expect(invalidManual.success).toBe(false);

    const invalidSpeed = FanControlRequestSchema.safeParse({
      target: "cpu",
      mode: "manual",
      speed: 120,
    });
    expect(invalidSpeed.success).toBe(false);
  });

  test("FanSensorUpdateSchema validates fan index 0|1 and sensor list", () => {
    const valid = FanSensorUpdateSchema.parse({
      fanIndex: 1,
      sensors: ["amdgpu"],
      algorithm: "Average",
    });
    expect(valid.fanIndex).toBe(1);
    expect(valid.force).toBe(true);

    const invalidFan = FanSensorUpdateSchema.safeParse({
      fanIndex: 2,
      sensors: ["k10temp"],
    });
    expect(invalidFan.success).toBe(false);
  });

  test("RgbControlRequestSchema validates zones, modes, and color bounds", () => {
    const valid = RgbControlRequestSchema.parse({
      mode: "static",
      zone: 1,
      brightness: 100,
      color: { r: 0, g: 255, b: 255 },
    });
    expect(valid.mode).toBe("static");

    const invalidColor = RgbControlRequestSchema.safeParse({
      mode: "breath",
      color: { r: 300, g: 0, b: 0 },
    });
    expect(invalidColor.success).toBe(false);
  });

  test("RgbSavedStateSchema validates state with isOff and lastActiveConfig", () => {
    const activeState = {
      mode: "wave",
      zone: "all",
      speed: 4,
      brightness: 100,
      direction: 2,
      color: { r: 0, g: 240, b: 255 },
      isOff: false,
      lastActiveConfig: {
        mode: "wave",
        zone: "all",
        speed: 4,
        brightness: 100,
        direction: 2,
        color: { r: 0, g: 240, b: 255 },
      },
    };
    const parsedActive = RgbSavedStateSchema.parse(activeState);
    expect(parsedActive.isOff).toBe(false);
    expect(parsedActive.mode).toBe("wave");
    expect(parsedActive.lastActiveConfig?.brightness).toBe(100);

    const offState = {
      mode: "off",
      zone: "all",
      speed: 4,
      brightness: 0,
      direction: 2,
      color: { r: 0, g: 255, b: 255 },
      isOff: true,
      lastActiveConfig: {
        mode: "wave",
        zone: "all",
        speed: 4,
        brightness: 100,
        direction: 2,
        color: { r: 0, g: 240, b: 255 },
      },
    };
    const parsedOff = RgbSavedStateSchema.parse(offState);
    expect(parsedOff.isOff).toBe(true);
    expect(parsedOff.mode).toBe("off");
    expect(parsedOff.lastActiveConfig?.mode).toBe("wave");
  });

  test("RgbProfileActionSchema rejects unsafe profile names", () => {
    const ok = RgbProfileActionSchema.safeParse({
      action: "save",
      name: "gaming_cyan-1",
    });
    expect(ok.success).toBe(true);

    const unsafe = RgbProfileActionSchema.safeParse({
      action: "load",
      name: "../etc/passwd",
    });
    expect(unsafe.success).toBe(false);
  });

  test("BatteryControlRequestSchema requires at least one field", () => {
    expect(BatteryControlRequestSchema.safeParse({}).success).toBe(false);
    expect(
      BatteryControlRequestSchema.safeParse({ healthMode: true }).success
    ).toBe(true);
  });

  test("GpuControlRequestSchema validates hybrid/integrated/nvidia", () => {
    expect(GpuControlRequestSchema.parse({ mode: "hybrid" }).mode).toBe("hybrid");
    expect(GpuControlRequestSchema.safeParse({ mode: "nouveau" }).success).toBe(false);
  });
});

describe("parseNbfcStatus", () => {
  test("parses dual fan output into left (CPU) and right (GPU) telemetry", () => {
    const sample = `
Read-only                : false
Selected Config Name     : Acer Nitro AN517-41

Fan Display Name         : CPU fan
Temperature              : 59.88
Auto Control Enabled     : true
Critical Mode Enabled    : false
Current Fan Speed        : 51.05
Target Fan Speed         : 35.00
Fan Speed Steps          : 6122

Fan Display Name         : GPU fan
Temperature              : 40.50
Auto Control Enabled     : false
Critical Mode Enabled    : false
Current Fan Speed        : 75.00
Target Fan Speed         : 75.00
Fan Speed Steps          : 6122
`;
    const parsed = parseNbfcStatus(sample);
    expect(parsed.configName).toBe("Acer Nitro AN517-41");
    expect(parsed.fans).toHaveLength(2);
    expect(parsed.fans[0].side).toBe("left");
    expect(parsed.fans[0].autoControl).toBe(true);
    expect(parsed.fans[0].rpm).toBe(Math.round(0.5105 * 6122));
    expect(parsed.fans[1].side).toBe("right");
    expect(parsed.fans[1].autoControl).toBe(false);
    expect(parsed.fans[1].currentSpeed).toBe(75);
  });

  test("BatteryTelemetrySchema parses battery telemetry with estimation and electrical metrics", () => {
    const rawSample = {
      driverLoaded: true,
      capacity: 85,
      status: "Charging",
      temperature: 24.5,
      healthMode: true,
      persistBoot: true,
      voltageVolts: 16.72,
      currentAmps: 0.815,
      powerWatts: 13.63,
      chargeNowMah: 2450,
      chargeFullMah: 2876,
      chargeFullDesignMah: 3620,
      healthPercent: 79.4,
      timeTo80Minutes: 0,
      timeToFullMinutes: 31,
      timeToEmptyMinutes: null,
      timeToTargetMinutes: 0,
      targetPercent: 80,
      targetReached: true,
      estimateFormatted: "Batas 80% Cut-Off tercapai",
    };

    const parsed = BatteryTelemetrySchema.parse(rawSample);
    expect(parsed.targetPercent).toBe(80);
    expect(parsed.targetReached).toBe(true);
    expect(parsed.estimateFormatted).toBe("Batas 80% Cut-Off tercapai");
    expect(parsed.powerWatts).toBe(13.63);
  });

  test("readBatteryTelemetry reads real system battery or graceful defaults", () => {
    const bat = readBatteryTelemetry();
    expect(typeof bat.driverLoaded).toBe("boolean");
    expect(typeof bat.status).toBe("string");
    if (bat.capacity !== null) {
      expect(bat.capacity).toBeGreaterThanOrEqual(0);
      expect(bat.capacity).toBeLessThanOrEqual(100);
    }
    if (bat.status.toLowerCase() === "charging") {
      expect(bat.timeToTargetMinutes !== null || bat.estimateFormatted !== null).toBe(true);
    }
  });
});

