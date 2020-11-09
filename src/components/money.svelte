<script>
  import { round } from "../helpers";

  export let amount = "Mistake";
  export let currency;

  const SYMBOL = {
    EUR: "€",
    USD: "$",
    RUB: "₽",
  }[currency || "RUB"];
</script>

<style>
  .sum {
    font-size: 1.2rem;
    margin: 0.5rem 0;
  }
</style>

<span class="sum">{round(amount)} {SYMBOL}</span>
