<script>
  import { savingsHistory } from "../../store";
  import Item from "./savingHistoryItem.svelte";
  import { data } from "../../data";
  import Diagram from "../diagram.svelte";

  let yData = []
  let xData = [];

  $: yData = $savingsHistory.map((item) => item.RUB);
  $: xData = $savingsHistory.map((item) => item.date);
</script>

<style>
  .container {
    max-height: 468px;
    overflow-y: auto;
  }
</style>

<div class="container">
  {#each $savingsHistory as item, index}
    <Item {item} prevItem={$savingsHistory[index - 1]} />
  {/each}
</div>
<!-- <Diagram {xData} {yData} colors={data.colors} title="Chart 3" /> -->
<!-- <Diagram xData={data.columns[0]} yData={yData}  colors={data.colors} title="Chart 3" /> -->

