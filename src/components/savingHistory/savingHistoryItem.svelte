<script lang="ts">
  import { round } from "../../helpers";
  import type { ITotalStorage } from "../../store/types";
  import Money from "../money.svelte";

  export let item: ITotalStorage;
  export let prevItem: ITotalStorage;

  const prevAmount: number = prevItem ? prevItem.RUB : 0;
  $: diffAmount = prevItem ? round(item.RUB - prevAmount) : 0;
</script>

<style>
  .sum {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #615a5a;
  }
  .sum:first-child {
    border-top: 1px solid #615a5a;
  }
  .diff {
    margin-left: 1rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }
  .green {
    background-color: rgb(10, 119, 52);
  }
  .red {
    background-color: rgb(209, 13, 23);
  }
</style>

<div class="sum">
  <span>
    {item.date}:

    <Money amount={item.RUB} currency="RUB" />
  </span>
  <span class="diff" class:green={diffAmount >= 0} class:red={diffAmount < 0}>
    <Money amount={Number(diffAmount)} currency="RUB" withK={true} />
  </span>
</div>
