<script>
  import { onMount } from "svelte";
  import { round } from "./helpers";
  import {
    initializeSavings,
    getAllCurrency,
    updateAccount,
    createAccount,
    deleteAccount,
    rates,
    status,
    error,
    finance,
    STATUS,
    totalSaving,
    savingsHistory,
  } from "./store";
  import Input from "./Input.svelte";
  import Diagram from "./components/diagram.svelte";
  import { data } from "./data";

  onMount(() => {
    initializeSavings();
    getAllCurrency();
  });

  function handleChange({ detail }) {
    console.log(detail);
    updateAccount(detail);
  }

  function handleDelete({ detail }) {
    deleteAccount(detail);
  }

  function add(e) {
    e.preventDefault();
    createAccount();
  }

  $: financeKeys = $finance ? Object.keys($finance) : [];

  const product = {
    banans: data.columns[1],
  };
</script>

<style lang="css">
  .app {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  .results {
    margin: 1rem 0;
  }
  .stats {
    display: flex;
    justify-content: space-between;
  }
  .sum {
    font-size: 1.2rem;
    margin: 0.5rem 0;
  }
</style>

<div class="app">
  {#if $status === STATUS.loading}Загрузка{/if}
  {#if $status === STATUS.failed}{$error}{/if}
  {#if $status === STATUS.loaded}
    <div class="sum">
      Доллар:
      {round($rates['USD'])}
      Евро:
      {round($rates['EUR'])}
    </div>
  {/if}
  <div class="stats">
    <form>
      {#each financeKeys as key}
        <Input
          id={key}
          name={$finance[key].name}
          amount={$finance[key].amount}
          currency={$finance[key].currency}
          on:message={handleChange}
          on:delete={handleDelete} />
      {/each}
      <button on:click={add}>Добавить</button>
    </form>
    <div>
      {#each $savingsHistory as item}
        <div class="sum">{item.date}: {round(item.RUB)} RUB</div>
      {/each}
    </div>
  </div>

  <div class="results">
    <div class="sum">
      Общая сумма в рублях:
      {round($totalSaving['RUB'])}
      RUB
    </div>
    <div class="sum">
      Общая сумма в долларах:
      {round($totalSaving['USD'])}
      USD
    </div>
    <div class="sum">Общая сумма в евро: {round($totalSaving['EUR'])} EUR</div>
  </div>

  <!-- <Diagram xData={data.columns[0]} yData={data.columns[1]} colors={data.colors} title="Chart 3" /> -->
</div>
