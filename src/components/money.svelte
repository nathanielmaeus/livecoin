<script>
  import { round } from "../helpers";

  export let amount = "Mistake";
  export let currency;
  export let withK = false;

  const SYMBOL = {
    EUR: "€",
    USD: "$",
    RUB: "₽",
  }[currency || "RUB"];
</script>

<style>
  .sum {
    margin: 0.5rem 0;
  }
</style>

<span class="sum">{round(amount, withK)} {SYMBOL}</span>
