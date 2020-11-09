<script>
  import { round } from "../../helpers";
  import Money from "../money.svelte";
  export let item;
  export let prevItem;

  console.log(prevItem);
  const prevAmount = prevItem ? prevItem.RUB : 0;
  const diffAmount = prevItem ? round(item.RUB - prevAmount) : null;
  console.log(diffAmount);
</script>

<style>
  .sum {
    font-size: 1.2rem;
    margin: 0.5rem 0;
  }
  .diff {
    color: #000;
  }
  .green {
    color: rgb(10, 119, 52);
  }
  .red {
    color: rgb(209, 13, 23);
  }
</style>

<div class="sum">
  {item.date}:
  <Money amount={item.RUB} currency="RUB" />
  
  {#if diffAmount !== null}
    <span class="diff" class:green={diffAmount >= 0} class:red={diffAmount < 0}>
      {'->'} <Money amount={diffAmount} currency="RUB" />
    </span>
  {/if}
</div>
