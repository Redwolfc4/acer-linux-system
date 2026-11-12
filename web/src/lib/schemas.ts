import { z } from "zod";

export const FanTargetSchema = z.enum(["both", "cpu", "gpu"]);
export type FanTarget = z.infer<typeof FanTargetSchema>;

export const FanModeSchema = z.enum(["auto", "manual", "max"]);
export type FanMode = z.infer<typeof FanModeSchema>;

export const FanControlRequestSchema = z
  .object({
    target: FanTargetSchema.default("both"),
    mode: FanModeSchema,
    speed: z.number().int().min(0).max(100).optional(),
  })
  .refine((data) => data.mode !== "manual" || data.speed !== undefined, {
    message: "Speed (0-100) is required when mode is manual",
    path: ["speed"],
  });

export type FanControlRequest = z.infer<typeof FanControlRequestSchema>;

export const SensorAlgorithmSchema = z.enum(["Average", "Min", "Max"]);
export type SensorAlgorithm = z.infer<typeof SensorAlgorithmSchema>;

export const FanSensorUpdateSchema = z.object({
  fanIndex: z.union([z.literal(0), z.literal(1)]),
  sensors: z.array(z.string().trim().min(1)).min(1),
  algorithm: SensorAlgorithmSchema.default("Average"),
  force: z.boolean().default(true),
});

export type FanSensorUpdateRequest = z.infer<typeof FanSensorUpdateSchema>;

export const FanSensorMappingSchema = z.object({
  fanIndex: z.union([z.literal(0), z.literal(1)]),
  fanName: z.string(),
  sensors: z.array(z.string()),
  algorithm: z.string(),
  isDefaultSensors: z.boolean(),
});

export const AvailableSensorSchema = z.object({
  name: z.string(),
  paths: z.array(z.string()),
  active: z.boolean(),
});

export const FanSensorsResponseSchema = z.object({
  mappings: z.array(FanSensorMappingSchema),
  available: z.array(AvailableSensorSchema),
});

export type FanSensorsResponse = z.infer<typeof FanSensorsResponseSchema>;

export const RgbModeSchema = z.enum([
  "static",
  "breath",
  "neon",
  "wave",
  "shifting",
  "zoom",
  "off",
]);
export type RgbMode = z.infer<typeof RgbModeSchema>;

export const RgbColorSchema = z.object({
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
});

export type RgbColor = z.infer<typeof RgbColorSchema>;

export const ZoneColorSchema = z.object({
  zone: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
});

export const RgbControlRequestSchema = z.object({
  mode: RgbModeSchema,
  zone: z
    .union([z.literal("all"), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .default("all"),
  speed: z.number().int().min(0).max(9).default(4),
  brightness: z.number().int().min(0).max(100).default(100),
  direction: z.union([z.literal(1), z.literal(2)]).default(2),
  color: RgbColorSchema.default({ r: 0, g: 255, b: 255 }),
  zoneColors: z.array(ZoneColorSchema).optional(),
});

export type RgbControlRequest = z.infer<typeof RgbControlRequestSchema>;

export const RgbProfileActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    name: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[a-zA-Z0-9_-]+$/, "Profile name may only contain letters, numbers, _ and -"),
    config: RgbControlRequestSchema.optional(),
  }),
  z.object({
    action: z.literal("load"),
    name: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[a-zA-Z0-9_-]+$/, "Profile name may only contain letters, numbers, _ and -"),
  }),
]);

export type RgbProfileAction = z.infer<typeof RgbProfileActionSchema>;

export const RgbProfilesResponseSchema = z.object({
  available: z.boolean(),
  devicePresent: z.boolean(),
  profiles: z.array(z.string()),
});

export type RgbProfilesResponse = z.infer<typeof RgbProfilesResponseSchema>;

export const BatteryControlRequestSchema = z
  .object({
    healthMode: z.boolean().optional(),
    persistBoot: z.boolean().optional(),
  })
  .refine(
    (data) => data.healthMode !== undefined || data.persistBoot !== undefined,
    { message: "At least one of healthMode or persistBoot must be provided" }
  );

export type BatteryControlRequest = z.infer<typeof BatteryControlRequestSchema>;

export const GpuModeSchema = z.enum(["hybrid", "integrated", "nvidia"]);
export type GpuMode = z.infer<typeof GpuModeSchema>;

export const GpuControlRequestSchema = z.object({
  mode: GpuModeSchema,
});

export type GpuControlRequest = z.infer<typeof GpuControlRequestSchema>;

export const FanTelemetrySchema = z.object({
  index: z.union([z.literal(0), z.literal(1)]),
  name: z.string(),
  side: z.enum(["left", "right"]),
  temperature: z.number(),
  autoControl: z.boolean(),
  criticalMode: z.boolean(),
  currentSpeed: z.number(),
  targetSpeed: z.number(),
  rpm: z.number(),
  maxRpm: z.number(),
});

export type FanTelemetry = z.infer<typeof FanTelemetrySchema>;

export const GpuDeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
  isDiscrete: z.boolean(),
});

export const TelemetryResponseSchema = z.object({
  timestamp: z.number(),
  system: z.object({
    model: z.string(),
    kernel: z.string(),
    distro: z.string(),
    hostname: z.string(),
    uptimeSeconds: z.number(),
    cpuModel: z.string(),
    cpuLoadPercent: z.number(),
    memoryUsedGb: z.number(),
    memoryTotalGb: z.number(),
    memoryPercent: z.number(),
  }),
  nbfc: z.object({
    available: z.boolean(),
    configName: z.string(),
    readOnly: z.boolean(),
    fans: z.array(FanTelemetrySchema),
  }),
  battery: z.object({
    driverLoaded: z.boolean(),
    capacity: z.number().nullable(),
    status: z.string(),
    temperature: z.number().nullable(),
    healthMode: z.boolean().nullable(),
    persistBoot: z.boolean(),
  }),
  rgb: z.object({
    devicePresent: z.boolean(),
  }),
  gpu: z.object({
    currentMode: z.string(),
    devices: z.array(GpuDeviceSchema),
    nvidiaStats: z
      .object({
        name: z.string(),
        temperature: z.number(),
        utilization: z.number(),
        memoryUsedMb: z.number(),
        memoryTotalMb: z.number(),
      })
      .nullable(),
  }),
});

export type TelemetryResponse = z.infer<typeof TelemetryResponseSchema>;

export const GitOverviewResponseSchema = z.object({
  ghAccounts: z.array(
    z.object({
      username: z.string(),
      active: z.boolean(),
    })
  ),
  presets: z.array(
    z.object({
      alias: z.string(),
      githubUsername: z.string(),
      gitName: z.string(),
      gitEmail: z.string(),
    })
  ),
  globalAuthor: z.object({
    name: z.string(),
    email: z.string(),
  }),
});

export type GitOverviewResponse = z.infer<typeof GitOverviewResponseSchema>;

