import { describe, expect, test, beforeEach } from "bun:test";
import { useAcerStore } from "./useAcerStore";

describe("useAcerStore - RGB State & Multi-Zone Restoration", () => {
  beforeEach(() => {
    // Reset store to known state
    useAcerStore.setState({
      rgbMode: "wave",
      rgbBrightness: 100,
      rgbSpeed: 4,
      rgbDirection: 2,
      selectedZone: "all",
      zoneColors: {
        1: "#00f0ff",
        2: "#00b8ff",
        3: "#a855f7",
        4: "#ff2e63",
      },
      lastActiveRgb: {
        mode: "wave",
        brightness: 100,
        speed: 4,
        direction: 2,
        selectedZone: "all",
        zoneColors: {
          1: "#00f0ff",
          2: "#00b8ff",
          3: "#a855f7",
          4: "#ff2e63",
        },
      },
    });
  });

  test("setZoneColor updates single zone without wiping other zones", () => {
    const { setZoneColor } = useAcerStore.getState();
    setZoneColor(4, "#ff0000");

    const state = useAcerStore.getState();
    expect(state.zoneColors[1]).toBe("#00f0ff");
    expect(state.zoneColors[2]).toBe("#00b8ff");
    expect(state.zoneColors[3]).toBe("#a855f7");
    expect(state.zoneColors[4]).toBe("#ff0000");
    expect(state.lastActiveRgb.zoneColors[4]).toBe("#ff0000");
  });

  test("setAllZoneColors updates all 4 zones atomically and syncs to lastActiveRgb", () => {
    const { setAllZoneColors } = useAcerStore.getState();
    setAllZoneColors({
      1: "#111111",
      2: "#222222",
      3: "#333333",
      4: "#444444",
    });

    const state = useAcerStore.getState();
    expect(state.zoneColors[1]).toBe("#111111");
    expect(state.zoneColors[2]).toBe("#222222");
    expect(state.zoneColors[3]).toBe("#333333");
    expect(state.zoneColors[4]).toBe("#444444");
    expect(state.lastActiveRgb.zoneColors[1]).toBe("#111111");
    expect(state.lastActiveRgb.zoneColors[4]).toBe("#444444");
  });

  test("applyLoadedRgbConfig preserves distinct zoneColors when dynamic mode without zoneColors is loaded", () => {
    // Custom distinct zone colors
    useAcerStore.getState().setAllZoneColors({
      1: "#00f0ff",
      2: "#00b8ff",
      3: "#a855f7",
      4: "#ff2e63",
    });

    // When loading dynamic mode like wave or neon that has a single fallback color
    useAcerStore.getState().applyLoadedRgbConfig({
      mode: "wave",
      zone: "all",
      brightness: 100,
      color: { r: 0, g: 240, b: 255 }, // Cyan
    });

    const state = useAcerStore.getState();
    // Must NOT be overwritten to all cyan!
    expect(state.zoneColors[1]).toBe("#00f0ff");
    expect(state.zoneColors[2]).toBe("#00b8ff");
    expect(state.zoneColors[3]).toBe("#a855f7");
    expect(state.zoneColors[4]).toBe("#ff2e63");
  });

  test("applyLoadedRgbConfig accurately applies explicit zoneColors from payload", () => {
    useAcerStore.getState().applyLoadedRgbConfig({
      mode: "static",
      zone: "all",
      brightness: 80,
      zoneColors: [
        { zone: 1, r: 255, g: 0, b: 0 },
        { zone: 2, r: 0, g: 255, b: 0 },
        { zone: 3, r: 0, g: 0, b: 255 },
        { zone: 4, r: 255, g: 255, b: 0 },
      ],
    });

    const state = useAcerStore.getState();
    expect(state.zoneColors[1]).toBe("#ff0000");
    expect(state.zoneColors[2]).toBe("#00ff00");
    expect(state.zoneColors[3]).toBe("#0000ff");
    expect(state.zoneColors[4]).toBe("#ffff00");
    expect(state.lastActiveRgb.zoneColors[1]).toBe("#ff0000");
    expect(state.lastActiveRgb.zoneColors[4]).toBe("#ffff00");
  });

  test("power off and restore cycle preserves all 4 zone colors", () => {
    const customColors = {
      1: "#00f0ff",
      2: "#10b981",
      3: "#8b5cf6",
      4: "#f43f5e",
    };
    useAcerStore.getState().setAllZoneColors(customColors);

    // Turn off
    const activeSnapshot = {
      mode: useAcerStore.getState().rgbMode,
      brightness: useAcerStore.getState().rgbBrightness,
      speed: useAcerStore.getState().rgbSpeed,
      direction: useAcerStore.getState().rgbDirection,
      selectedZone: useAcerStore.getState().selectedZone,
      zoneColors: { ...useAcerStore.getState().zoneColors },
    };
    useAcerStore.getState().setLastActiveRgb(activeSnapshot);
    useAcerStore.getState().setRgbMode("off");
    useAcerStore.getState().setRgbBrightness(0);

    let state = useAcerStore.getState();
    expect(state.rgbMode).toBe("off");
    expect(state.rgbBrightness).toBe(0);

    // Turn on & restore
    const restoredColors = state.lastActiveRgb.zoneColors;
    useAcerStore.getState().setRgbMode(state.lastActiveRgb.mode);
    useAcerStore.getState().setRgbBrightness(state.lastActiveRgb.brightness);
    useAcerStore.getState().setAllZoneColors(restoredColors);

    state = useAcerStore.getState();
    expect(state.rgbMode).toBe("wave");
    expect(state.rgbBrightness).toBe(100);
    expect(state.zoneColors).toEqual(customColors);
  });
});

