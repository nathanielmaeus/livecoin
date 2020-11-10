<script>
</script>

<style>
  svg {
    transform: rotate(-90deg);
    border-radius: 50%;
    width: 230px;
    height: 230px;
  }

  .circle-underlay {
    transform-origin: center;
    transform: rotate(65deg);
  }
</style>

<svg width="100" height="100" viewBox="0 0 32 32">
  <title>
    Circle representing a pie chart with a purple 25% piece, a pink 45% piece,
    and a green 30% piece
  </title>
  <desc>Pink piece of chart representing 45%</desc>
  <circle
    class="circle-underlay"
    r="16"
    cx="16"
    cy="16"
    fill="#5DC3B3"
    stroke="pink"
    stroke-width="32"
    stroke-dasharray="10 100" />
  <desc>Purple piece of chart representing 25%</desc>
  <circle
    class="circle-overlay"
    r="16"
    cx="16"
    cy="16"
    fill="transparent"
    stroke="#221A46"
    stroke-width="32"
    stroke-dasharray="30 100" />
</svg>
