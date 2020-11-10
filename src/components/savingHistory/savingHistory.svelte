<script>
  import { savingsHistory } from "../../store";
  import Item from "./savingHistoryItem.svelte";
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
