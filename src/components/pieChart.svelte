<script lang="ts">
  import type { ISlice } from "../store/types";

  export let slices: ISlice[];

  interface IPath {
    d: string;
    lastX: number;
    lastY: number;
    fill: string;
    key: number;
  }
  const size: number = 100;
  const radCircumference: number = Math.PI * 2;
  const center: number = size / 2;
  const radius: number = center - 1; // padding to prevent clipping

  function renderPaths(slices: ISlice[]): IPath[] {
    const total = slices.reduce(
      (totalValue, { value }) => totalValue + value,
      0
    );

    let radSegment: number = 0;
    let lastX: number = radius;
    let lastY: number = 0;

    return slices.map(({ color, value }, index) => {
      if (value === 0) {
        return {} as IPath;
      }

      const valuePercentage = value / total;
      const longArc = valuePercentage <= 0.5 ? 0 : 1;

      radSegment += valuePercentage * radCircumference;
      const nextX = Math.cos(radSegment) * radius;
      const nextY = Math.sin(radSegment) * radius;

      const d = [
        `M ${center},${center}`,
        `l ${lastX},${-lastY}`,
        `a${radius},${radius}`,
        "0",
        `${longArc},0`,
        `${nextX - lastX},${-(nextY - lastY)}`,
        "z",
      ].join(" ");

      lastX = nextX;
      lastY = nextY;

      return {
        d,
        lastX,
        lastY,
        fill: color,
        key: index,
      };
    });
  }

  const pathes = renderPaths(slices);
</script>

<style>
  svg {
    transform: rotate(-90deg);
    border-radius: 50%;
    width: 230px;
    height: 230px;
  }

  svg path:hover {
    transform: scale(0.9);
    top: -5px;
  }
</style>

<svg viewBox={`0 0 ${size} ${size}`}>
  <g transform={`rotate(-90 ${center} ${center})`}>
    {#each pathes as path}
      <text x={path.lastX} y={path.lastY} fill="#fff">
        {slices[path.key].value}
      </text>
      <path d={path.d} fill={path.fill} />;
    {/each}
  </g>
</svg>
