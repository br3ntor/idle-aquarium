export interface Tuning {
  speedScale: number;
  turnScale: number;
  zoom: number;
  npcCount: number;
  paused: boolean;
}

export interface DebugStats {
  fps: number;
  fish: number;
  zoom: number;
}

export interface DebugPanel {
  setStats(stats: DebugStats): void;
  setZoom(zoom: number): void;
  destroy(): void;
}

interface SliderOptions {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (value: number) => string;
  onInput: (value: number) => void;
}

/**
 * Tiny, dependency-free tuning panel. Being able to feel a parameter change
 * immediately is the fastest way to learn how the movement system behaves.
 */
export function createDebugPanel(tuning: Tuning): DebugPanel {
  const root = document.createElement("section");
  root.className = "debug";

  const toggle = document.createElement("button");
  toggle.className = "debug-toggle";
  toggle.type = "button";
  const toggleLabel = document.createElement("span");
  toggleLabel.textContent = "Tuning";
  const toggleKey = document.createElement("kbd");
  toggleKey.textContent = "H";
  toggle.append(toggleLabel, toggleKey);

  const body = document.createElement("div");
  body.className = "debug-body";
  body.hidden = window.innerWidth < 700;

  const stats = document.createElement("div");
  stats.className = "debug-stats";
  stats.textContent = "starting up";

  const zoomControl = createSlider({
    label: "Zoom",
    min: 0.6,
    max: 1.5,
    step: 0.01,
    value: tuning.zoom,
    format: (value) => value.toFixed(2),
    onInput: (value) => {
      tuning.zoom = value;
    },
  });

  const pause = document.createElement("button");
  pause.className = "debug-pause";
  pause.type = "button";

  const syncPause = (): void => {
    pause.textContent = tuning.paused ? "Resume" : "Pause";
    pause.classList.toggle("is-paused", tuning.paused);
  };
  pause.addEventListener("click", () => {
    tuning.paused = !tuning.paused;
    syncPause();
  });
  syncPause();

  body.append(
    stats,
    zoomControl.element,
    createSlider({
      label: "Swim speed",
      min: 0.4,
      max: 1.8,
      step: 0.01,
      value: tuning.speedScale,
      format: (value) => `${Math.round(value * 100)}%`,
      onInput: (value) => {
        tuning.speedScale = value;
      },
    }).element,
    createSlider({
      label: "Turn rate",
      min: 0.4,
      max: 1.8,
      step: 0.01,
      value: tuning.turnScale,
      format: (value) => `${Math.round(value * 100)}%`,
      onInput: (value) => {
        tuning.turnScale = value;
      },
    }).element,
    createSlider({
      label: "Ambient fish",
      min: 0,
      max: 40,
      step: 1,
      value: tuning.npcCount,
      format: (value) => String(Math.round(value)),
      onInput: (value) => {
        tuning.npcCount = Math.round(value);
      },
    }).element,
    pause,
  );

  root.append(toggle, body);

  const host = document.getElementById("app") ?? document.body;
  host.appendChild(root);

  toggle.addEventListener("click", () => {
    body.hidden = !body.hidden;
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    const inForm =
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "BUTTON");

    if (event.key.toLowerCase() === "h") {
      body.hidden = !body.hidden;
    } else if (event.key === " " && !inForm) {
      event.preventDefault();
      tuning.paused = !tuning.paused;
      syncPause();
    }
  };
  document.addEventListener("keydown", onKeyDown);

  let lastStats = "";

  return {
    setStats(next: DebugStats): void {
      const line = `${Math.round(next.fps)} fps · ${next.fish} fish`;
      if (line !== lastStats) {
        lastStats = line;
        stats.textContent = line;
      }
    },
    setZoom(zoom: number): void {
      tuning.zoom = zoom;
      zoomControl.setValue(zoom);
    },
    destroy(): void {
      document.removeEventListener("keydown", onKeyDown);
      root.remove();
    },
  };
}

function createSlider(options: SliderOptions): {
  element: HTMLElement;
  setValue: (value: number) => void;
} {
  const wrapper = document.createElement("div");
  wrapper.className = "debug-control";

  const head = document.createElement("div");
  head.className = "debug-control-head";

  const label = document.createElement("span");
  label.textContent = options.label;

  const value = document.createElement("output");
  value.className = "debug-value";
  value.textContent = options.format(options.value);

  head.append(label, value);

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(options.min);
  input.max = String(options.max);
  input.step = String(options.step);
  input.value = String(options.value);

  input.addEventListener("input", () => {
    const next = Number(input.value);
    value.textContent = options.format(next);
    options.onInput(next);
  });

  wrapper.append(head, input);

  return {
    element: wrapper,
    setValue(next: number): void {
      input.value = String(next);
      value.textContent = options.format(next);
    },
  };
}
