<script>
  import { savingsHistory } from "../../store";
  import Item from "./savingHistoryItem.svelte";
</script>


{#each $savingsHistory as item, index}
  <Item {item} prevItem={$savingsHistory[index - 1]} />
{/each}
