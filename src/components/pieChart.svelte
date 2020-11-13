<script>
  import Path from "./path.svelte";
  const data = [6, 2, 1, 8, 10, 4, 5, 2, 7, 8, 12];
  const radius = 100;
  const total = data.reduce((a, b) => a + b, 0);
  const diameter = 2 * radius;

  $: rotate = 0.5 * Math.PI;
</script>

<style>
  svg {
    transform: rotate(-90deg);
    border-radius: 50%;
    width: 230px;
    height: 230px;
  }
</style>

<svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
  {#each data as value, i}
    {(rotate += (2 * Math.PI * value) / total)}
    <Path {value} {i} {total} {radius} {rotate} />
  {/each}
</svg>
