<script>
  import { round, getCurrencySymbol } from "../helpers";

  export let amount = "Mistake";
  export let currency;
  export let withK = false;
</script>

<style>
  .sum {
    margin: 0.5rem 0;
  }
</style>

<span class="sum">{round(amount, withK)} {getCurrencySymbol(currency)}</span>
