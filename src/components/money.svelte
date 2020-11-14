<script lang="ts">
  import { round, getCurrencySymbol } from "../helpers";
  import type { IRates } from "../store/types";

  export let amount: number = 0;
  export let currency: keyof IRates;
  export let withK: boolean = false;
</script>

<style>
  .sum {
    margin: 0.5rem 0;
  }
</style>

<span class="sum">{round(amount, withK)} {getCurrencySymbol(currency)}</span>
