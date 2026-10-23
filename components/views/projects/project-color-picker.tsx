"use client";

import {
  useState,
  useRef,
  useCallback,
  type ChangeEvent,
  type PointerEvent,
  type KeyboardEvent,
} from "react";

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;
  const max = Math.max(normR, normG, normB);
  const min = Math.min(normR, normG, normB);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  if (max !== min) {
    switch (max) {
      case normR:
        h = (normG - normB) / d + (normG < normB ? 6 : 0);
        break;
      case normG:
        h = (normB - normR) / d + 2;
        break;
      case normB:
        h = (normR - normG) / d + 4;
        break;
    }
    h = h * 60;
  }
  return [h, s, v];
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const normS = s / 100;
  const normV = v / 100;
  const c = normV * normS;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = normV - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "").trim();
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

export interface ProjectColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
}

export function ProjectColorPicker({ color, onChange }: ProjectColorPickerProps) {
  const initialRgb = hexToRgb(color) ?? [215, 166, 161];
  const initialHsv = rgbToHsv(...initialRgb);

  const [hsv, setHsv] = useState<[number, number, number]>(initialHsv);
  const [rgb, setRgb] = useState<[number, number, number]>(initialRgb);
  const [hexInput, setHexInput] = useState<string>(color.replace(/^#/, "").toUpperCase());
  const [rInput, setRInput] = useState<string>(initialRgb[0].toString());
  const [gInput, setGInput] = useState<string>(initialRgb[1].toString());
  const [bInput, setBInput] = useState<string>(initialRgb[2].toString());

  const boardRef = useRef<HTMLDivElement>(null);
  const rInputRef = useRef<HTMLInputElement>(null);
  const gInputRef = useRef<HTMLInputElement>(null);
  const bInputRef = useRef<HTMLInputElement>(null);

  const [prevColor, setPrevColor] = useState(color);
  if (color !== prevColor) {
    setPrevColor(color);
    const parsed = hexToRgb(color);
    if (parsed) {
      const [r, g, b] = parsed;
      const [newH, newS, newV] = rgbToHsv(r, g, b);
      const finalH = newS === 0 ? hsv[0] : newH;
      const formattedHex = rgbToHex(r, g, b).replace(/^#/, "").toUpperCase();
      setRgb(parsed);
      setHsv([finalH, newS, newV]);
      setHexInput(formattedHex);
      setRInput(r.toString());
      setGInput(g.toString());
      setBInput(b.toString());
    }
  }

  const updateBoardFromCoords = useCallback(
    (clientX: number, clientY: number) => {
      const board = boardRef.current;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const newS = (x / rect.width) * 100;
      const newV = (1 - y / rect.height) * 100;
      const [r, g, b] = hsvToRgb(hsv[0], newS, newV);
      const hex = rgbToHex(r, g, b);

      setHsv([hsv[0], newS, newV]);
      setRgb([r, g, b]);
      setHexInput(hex.replace(/^#/, "").toUpperCase());
      setRInput(r.toString());
      setGInput(g.toString());
      setBInput(b.toString());
      onChange(hex);
    },
    [hsv, onChange]
  );

  const handleBoardPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateBoardFromCoords(e.clientX, e.clientY);
  };

  const handleBoardPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 && e.type !== "pointerdown") return;
    updateBoardFromCoords(e.clientX, e.clientY);
  };

  const handleHueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newHue = parseFloat(e.target.value);
    const [r, g, b] = hsvToRgb(newHue, hsv[1], hsv[2]);
    const hex = rgbToHex(r, g, b);

    setHsv([newHue, hsv[1], hsv[2]]);
    setRgb([r, g, b]);
    setHexInput(hex.replace(/^#/, "").toUpperCase());
    setRInput(r.toString());
    setGInput(g.toString());
    setBInput(b.toString());
    onChange(hex);
  };

  const handleHexChange = (val: string) => {
    const clean = val.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
    setHexInput(clean);
    if (clean.length === 6 || clean.length === 3) {
      const parsed = hexToRgb(clean);
      if (parsed) {
        const [r, g, b] = parsed;
        const [newH, newS, newV] = rgbToHsv(r, g, b);
        const finalH = newS === 0 ? hsv[0] : newH;
        const hex = rgbToHex(r, g, b);
        setRgb(parsed);
        setHsv([finalH, newS, newV]);
        setRInput(r.toString());
        setGInput(g.toString());
        setBInput(b.toString());
        onChange(hex);
      }
    }
  };

  const handleHexBlur = () => {
    setHexInput(rgbToHex(...rgb).replace(/^#/, "").toUpperCase());
  };

  const handleRgbChange = (index: 0 | 1 | 2, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (index === 0) setRInput(cleaned);
    else if (index === 1) setGInput(cleaned);
    else setBInput(cleaned);

    if (cleaned !== "") {
      const num = parseInt(cleaned, 10);
      const clamped = Math.max(0, Math.min(255, num));
      const nextRgb: [number, number, number] = [...rgb];
      nextRgb[index] = clamped;
      const [newH, newS, newV] = rgbToHsv(...nextRgb);
      const finalH = newS === 0 ? hsv[0] : newH;
      const hex = rgbToHex(...nextRgb);

      setRgb(nextRgb);
      setHsv([finalH, newS, newV]);
      setHexInput(hex.replace(/^#/, "").toUpperCase());
      onChange(hex);

      if (cleaned.length >= 3 && index < 2) {
        const nextInput = index === 0 ? gInputRef.current : bInputRef.current;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    }
  };

  const handleRgbKeyDown = (index: 0 | 1 | 2, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }

    if (e.key === "ArrowRight") {
      const target = e.currentTarget;
      if (
        target.selectionEnd === target.value.length ||
        (target.selectionStart === 0 && target.selectionEnd === target.value.length)
      ) {
        if (index < 2) {
          e.preventDefault();
          const nextInput = index === 0 ? gInputRef.current : bInputRef.current;
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        }
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      const target = e.currentTarget;
      if (
        target.selectionStart === 0 ||
        (target.selectionStart === 0 && target.selectionEnd === target.value.length)
      ) {
        if (index > 0) {
          e.preventDefault();
          const prevInput = index === 2 ? gInputRef.current : rInputRef.current;
          if (prevInput) {
            prevInput.focus();
            prevInput.select();
          }
        }
      }
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const delta = e.key === "ArrowUp" ? step : -step;
      const currentVal = rgb[index];
      const nextVal = Math.max(0, Math.min(255, currentVal + delta));
      const nextRgb: [number, number, number] = [...rgb];
      nextRgb[index] = nextVal;
      const [newH, newS, newV] = rgbToHsv(...nextRgb);
      const finalH = newS === 0 ? hsv[0] : newH;
      const hex = rgbToHex(...nextRgb);

      setRgb(nextRgb);
      setHsv([finalH, newS, newV]);
      setHexInput(hex.replace(/^#/, "").toUpperCase());
      if (index === 0) setRInput(nextVal.toString());
      else if (index === 1) setGInput(nextVal.toString());
      else setBInput(nextVal.toString());
      onChange(hex);
      return;
    }
  };

  const handleRgbBlur = (index: 0 | 1 | 2) => {
    if (index === 0) setRInput(rgb[0].toString());
    else if (index === 1) setGInput(rgb[1].toString());
    else setBInput(rgb[2].toString());
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="projects-color-picker" aria-label="颜色选择器">
      <div
        ref={boardRef}
        className="projects-color-picker-board"
        style={{ backgroundColor: `hsl(${hsv[0]}, 100%, 50%)` }}
        onPointerDown={handleBoardPointerDown}
        onPointerMove={handleBoardPointerMove}
        role="slider"
        aria-label="饱和度与明度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv[2])}
        tabIndex={0}
      >
        <div
          className="projects-color-picker-board-indicator"
          style={{
            left: `${Math.max(0, Math.min(100, hsv[1]))}%`,
            top: `${Math.max(0, Math.min(100, 100 - hsv[2]))}%`,
          }}
        />
      </div>

      <div className="projects-color-picker-hue-wrap">
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          className="projects-color-picker-hue-slider"
          value={Math.round(hsv[0])}
          onChange={handleHueChange}
          aria-label="色相滑条"
        />
      </div>

      <div className="projects-color-picker-values-row">
        <label className="projects-color-picker-hex-cell" title="十六进制颜色代码">
          <span className="projects-color-picker-cell-label">HEX</span>
          <span className="projects-color-picker-hex-hash" aria-hidden="true">#</span>
          <input
            type="text"
            maxLength={6}
            className="projects-color-picker-hex-input"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            onBlur={handleHexBlur}
            onKeyDown={handleInputKeyDown}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="HEX 颜色代码"
            spellCheck={false}
          />
        </label>

        <div className="projects-color-picker-rgb-group" role="group" aria-label="RGB 颜色值">
          <label className="projects-color-picker-rgb-cell" title="红色分量 (0-255)">
            <span className="projects-color-picker-cell-label">R</span>
            <input
              ref={rInputRef}
              type="text"
              inputMode="numeric"
              maxLength={3}
              className="projects-color-picker-val-input"
              value={rInput}
              onChange={(e) => handleRgbChange(0, e.target.value)}
              onBlur={() => handleRgbBlur(0)}
              onKeyDown={(e) => handleRgbKeyDown(0, e)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="R (红)"
            />
          </label>
          <label className="projects-color-picker-rgb-cell" title="绿色分量 (0-255)">
            <span className="projects-color-picker-cell-label">G</span>
            <input
              ref={gInputRef}
              type="text"
              inputMode="numeric"
              maxLength={3}
              className="projects-color-picker-val-input"
              value={gInput}
              onChange={(e) => handleRgbChange(1, e.target.value)}
              onBlur={() => handleRgbBlur(1)}
              onKeyDown={(e) => handleRgbKeyDown(1, e)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="G (绿)"
            />
          </label>
          <label className="projects-color-picker-rgb-cell" title="蓝色分量 (0-255)">
            <span className="projects-color-picker-cell-label">B</span>
            <input
              ref={bInputRef}
              type="text"
              inputMode="numeric"
              maxLength={3}
              className="projects-color-picker-val-input"
              value={bInput}
              onChange={(e) => handleRgbChange(2, e.target.value)}
              onBlur={() => handleRgbBlur(2)}
              onKeyDown={(e) => handleRgbKeyDown(2, e)}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="B (蓝)"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
