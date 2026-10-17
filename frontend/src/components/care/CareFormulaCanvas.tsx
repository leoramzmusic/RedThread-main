import { Box, Paper, Typography } from "@mui/material";
import type { CareDimensionKey } from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { orbitNodes } from "../../utils/careEquationModel";
import { useAppTheme } from "../../context/ThemeContext";

export interface CareFormulaCanvasProps {
  /** Active weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Node to emphasize (hover sync / criteria draft handoff). */
  focus?: CareDimensionKey | null;
  /** Emits the hovered node key (null on leave), enabling table ↔ diagram sync. */
  onNodeHover?: (key: CareDimensionKey | null) => void;
  /** Dimension to flash briefly after a slider change. */
  glow?: CareDimensionKey | null;
  /** Increments on "Probar fórmula"; each change pulses Ψ. */
  pulseToken?: number;
}

const CX = 160;
const CY = 160;
const PULSE_MS = 700;

/** SVG shapes scale around their own center only with an explicit box/origin. */
const SVG_CENTER = {
  transformBox: "fill-box",
  transformOrigin: "center",
} as const;

/** All animations live under `prefers-reduced-motion: no-preference`. */
const MOTION = "@media (prefers-reduced-motion: no-preference)";

/**
 * Hand-built SVG (no chart libs): center node Ψ with 7 orbital dimension nodes
 * whose radius is proportional to the weight, and radial edges labeled with the
 * coefficient (weight %).
 *
 * Motion (all gated by prefers-reduced-motion, 450–700ms, transform-only):
 * - load: nodes fade/scale in while edges draw with animated stroke-dashoffset;
 * - idle: weight-proportional node pulse + slow Ψ breathing;
 * - hover/focus: edge switches to a flowing dash + grows, node glows;
 * - slider change: one-shot node glow (page-driven `glow`);
 * - Probar: Ψ pulse + slight edge vibration (page-driven `pulseToken`).
 */
export default function CareFormulaCanvas({
  blocks,
  focus = null,
  onNodeHover,
  glow = null,
  pulseToken = 0,
}: CareFormulaCanvasProps) {
  const { mode } = useAppTheme();
  const isDark = mode === "dark";
  const nodes = orbitNodes(blocks);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        minHeight: 320,
        bgcolor: isDark ? "rgba(30,30,30,0.65)" : "background.paper",
        boxShadow: isDark
          ? "0 4px 16px rgba(0,0,0,0.4)"
          : "0 4px 16px rgba(26,27,30,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        transition: "box-shadow 0.2s ease",
        "@keyframes rtDiaEdgeDraw": {
          from: { strokeDashoffset: 300 },
          to: { strokeDashoffset: 0 },
        },
        "@keyframes rtDiaDashFlow": {
          to: { strokeDashoffset: -22 },
        },
        "@keyframes rtDiaEdgeJitter": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(1.5px, -1px)" },
          "75%": { transform: "translate(-1.5px, 1px)" },
        },
        "@keyframes rtDiaNodeIn": {
          from: { opacity: 0, transform: "scale(0.4)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        "@keyframes rtDiaNodePulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(var(--rt-dia-pulse, 1.05))" },
        },
        "@keyframes rtDiaNodeGlow": {
          "0%": { transform: "scale(1)", filter: "brightness(1)" },
          "35%": { transform: "scale(1.22)", filter: "brightness(1.7)" },
          "100%": { transform: "scale(1)", filter: "brightness(1)" },
        },
        "@keyframes rtDiaPsiBreath": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.045)" },
        },
        "@keyframes rtDiaPsiPulse": {
          "0%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        Diagrama Ψ / M
      </Typography>
      <Typography
        variant="caption"
        data-testid="canvas-formula"
        sx={{ color: "text.secondary", textAlign: "center", mb: 1 }}
      >
        CARE_score = Σ wᵢ·fᵢ + χ(t) — ajusta los pesos, prueba la fórmula y
        guarda una versión nueva
      </Typography>
      <Box
        component="svg"
        viewBox="0 0 320 320"
        sx={{ width: "100%", maxWidth: 320, height: "auto" }}
      >
        {nodes.map((node, index) => {
          const isFocused = focus === node.key;
          const lineAnimations = [
            isFocused
              ? "rtDiaDashFlow 900ms linear infinite"
              : `rtDiaEdgeDraw 600ms ease-out ${index * 45}ms both`,
            pulseToken > 0 && !isFocused
              ? `rtDiaEdgeJitter 500ms ease-out ${index * 30}ms`
              : null,
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <g key={node.key} data-testid={`edge-${node.key}`}>
              <Box
                component="line"
                x1={CX}
                y1={CY}
                x2={node.x}
                y2={node.y}
                stroke={node.color}
                strokeWidth={
                  isFocused ? 2 + node.percent / 30 : 1 + node.percent / 40
                }
                opacity={isFocused ? 0.8 : 0.5}
                style={{ transition: "all 0.3s ease" }}
                sx={{
                  strokeDasharray: isFocused ? "6 5" : 300,
                  [MOTION]: { animation: lineAnimations },
                }}
              />
              <text
                data-testid={`edge-label-${node.key}`}
                x={(CX + node.x) / 2}
                y={(CY + node.y) / 2}
                fontSize={10}
                fill={node.color}
                textAnchor="middle"
              >
                {node.percent}%
              </text>
            </g>
          );
        })}
        <g data-testid="canvas-psi" data-pulse-token={pulseToken}>
          <Box
            key={pulseToken}
            component="circle"
            cx={CX}
            cy={CY}
            r={26}
            fill="#1f1f1f"
            stroke="#ff4d4f"
            strokeWidth={2}
            style={SVG_CENTER}
            sx={{
              willChange: "transform",
              [MOTION]: {
                animation:
                  pulseToken > 0
                    ? "rtDiaPsiBreath 4s ease-in-out infinite, rtDiaPsiPulse 700ms ease-out"
                    : "rtDiaPsiBreath 4s ease-in-out infinite",
              },
            }}
          />
          <text
            x={CX}
            y={CY + 8}
            fontSize={22}
            fill="#fff"
            textAnchor="middle"
            fontWeight={800}
          >
            Ψ
          </text>
        </g>
        {nodes.map((node, index) => {
          const isFocused = focus === node.key;
          const isGlowing = glow === node.key;
          const hasPulse = node.percent > 0;
          const pulseSeconds = Math.max(2.1, 3.4 - (node.percent / 100) * 3);
          const pulseScale = 1.02 + (node.percent / 100) * 0.05;
          const nodeAnimations = [
            `rtDiaNodeIn 450ms ease-out ${index * 45}ms both`,
            hasPulse
              ? `rtDiaNodePulse ${pulseSeconds.toFixed(2)}s ease-in-out ${(index * 0.21).toFixed(2)}s infinite`
              : null,
            isGlowing ? `rtDiaNodeGlow ${PULSE_MS}ms ease-out` : null,
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <g
              key={node.key}
              data-testid={`node-${node.key}`}
              data-radius={node.radius}
              data-focus={isFocused ? "true" : "false"}
              data-pulse={hasPulse ? "true" : "false"}
              data-glow={isGlowing ? "true" : "false"}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => onNodeHover?.(node.key)}
              onMouseLeave={() => onNodeHover?.(null)}
            >
              <Box
                component="circle"
                cx={node.x}
                cy={node.y}
                r={isFocused ? node.radius * 1.15 : node.radius}
                fill={node.color}
                opacity={isFocused ? 1.0 : 0.85}
                stroke={isFocused ? "#fff" : "none"}
                strokeWidth={isFocused ? 3 : 2}
                style={
                  {
                    ...SVG_CENTER,
                    "--rt-dia-pulse": pulseScale,
                    transition: "all 0.3s ease",
                    filter: isFocused
                      ? `drop-shadow(0 0 8px ${node.color})`
                      : "none",
                  } as React.CSSProperties
                }
                sx={{
                  willChange: "transform",
                  [MOTION]: { animation: nodeAnimations },
                }}
              />
              <text
                x={node.x}
                y={node.y + 4}
                fontSize={12}
                fill="#fff"
                textAnchor="middle"
                fontWeight={700}
              >
                {node.chip}
              </text>
            </g>
          );
        })}
      </Box>
    </Paper>
  );
}
