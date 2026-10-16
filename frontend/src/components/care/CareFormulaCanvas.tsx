import { Box, Paper, Typography } from "@mui/material";
import type { CareDimensionKey } from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { orbitNodes } from "../../utils/careEquationModel";

export interface CareFormulaCanvasProps {
  /** Active weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Node to emphasize (from the criteria draft handoff). */
  focus?: CareDimensionKey | null;
}

const CX = 160;
const CY = 160;

/**
 * Hand-built SVG (no chart libs): center node Ψ with 7 orbital dimension nodes
 * whose radius is proportional to the weight, and radial edges labeled with the
 * coefficient (weight %).
 */
export default function CareFormulaCanvas({
  blocks,
  focus = null,
}: CareFormulaCanvasProps) {
  const nodes = orbitNodes(blocks);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Diagrama Ψ / M
      </Typography>
      <Box
        component="svg"
        viewBox="0 0 320 320"
        sx={{ width: "100%", maxWidth: 320, height: "auto" }}
      >
        {nodes.map((node) => (
          <g key={node.key} data-testid={`edge-${node.key}`}>
            <line
              x1={CX}
              y1={CY}
              x2={node.x}
              y2={node.y}
              stroke={node.color}
              strokeWidth={1 + node.percent / 40}
              opacity={0.5}
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
        ))}
        <g data-testid="canvas-psi">
          <circle
            cx={CX}
            cy={CY}
            r={26}
            fill="#1f1f1f"
            stroke="#ff4d4f"
            strokeWidth={2}
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
        {nodes.map((node) => (
          <g
            key={node.key}
            data-testid={`node-${node.key}`}
            data-radius={node.radius}
            data-focus={focus === node.key ? "true" : "false"}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.color}
              opacity={0.85}
              stroke={focus === node.key ? "#fff" : "none"}
              strokeWidth={2}
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
        ))}
      </Box>
    </Paper>
  );
}
