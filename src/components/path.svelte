<script>
  import { round } from '../helpers';
  export let radius, rotate, value, total, i;

  const angle = (2 * Math.PI * value) / total;

  const fill = `hsl(${70 * i}, 100%, 50%)`;
  const transform = `rotate(${round(rotate)}rad)`;
  const transformOrigin = `${radius}px ${radius}px`;

  //rotate += angle;

  

  const r = radius; // for brevity
  const dx = r * Math.sin(angle);
  const dy = r * (1 - Math.cos(angle));
</script>

<path
  style={`fill: ${fill}; transform: ${transform}; transform-origin: ${transformOrigin};`}
  d={`M${r} ${r}V0a${r} ${r} 0 0 1 ${dx} ${dy}z`} />
