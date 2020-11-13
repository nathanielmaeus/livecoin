<script>
  import { onMount } from "svelte";
  import { round, getCurrencySymbol } from "./helpers";
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
    totalRation,
  } from "./store";

  import PieChart from "./components/pieChart.svelte";
  import Input from "./Input.svelte";
  import Button from "./components/button.svelte";
  import SavingHistory from "./components/savingHistory/savingHistory.svelte";
  import Money from "./components/money.svelte";
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
    max-width: 1100px;
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
  .currentRates {
    margin: 1rem 0 2rem 0;
  }
</style>

<div class="app">
  {#if $status === STATUS.loading}Загрузка{/if}
  {#if $status === STATUS.failed}{$error}{/if}
  {#if $status === STATUS.loaded}
    <div class="currentRates">
      Доллар:
      <Money amount={$rates.USD} currency="USD" />
      Евро:
      <Money amount={$rates.EUR} currency="EUR" />
    </div>
  {/if}
  <div class="stats">
    <form class="form">
      {#each financeKeys as key}
        <Input
          id={key}
          name={$finance[key].name}
          amount={$finance[key].amount}
          currency={$finance[key].currency}
          on:message={handleChange}
          on:delete={handleDelete} />
      {/each}
      <Button on:click={add}>Добавить</Button>
    </form>
    <SavingHistory />
  </div>

  <div class="results">
    Общая сумма:
    <div class="sum">
      <Money amount={$totalSaving.RUB} currency="RUB" />
    </div>
    <div class="sum">
      <Money amount={$totalSaving.USD} currency="USD" />
    </div>
    <div class="sum">
      <Money amount={$totalSaving.EUR} currency="EUR" />
    </div>
    <div class="results sum">
      {getCurrencySymbol('RUB')}:
      {$totalRation.RUB}%
      {getCurrencySymbol('EUR')}:
      {$totalRation.EUR}%
      {getCurrencySymbol('USD')}:
      {$totalRation.USD}%
    </div>
  </div>
  <PieChart />
  <!-- <Diagram xData={data.columns[0]} yData={data.columns[1]} colors={data.colors} title="Chart 3" /> -->
</div>
