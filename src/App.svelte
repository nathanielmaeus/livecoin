<script lang="ts">
  import { onMount } from "svelte";
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
    totalRatio,
    separateCurrencyTotal,
  } from "./store";

  import PieChart from "./components/pieChart.svelte";
  import Input from "./Input.svelte";
  import Button from "./components/button.svelte";
  import SavingHistory from "./components/savingHistory/savingHistory.svelte";
  import Money from "./components/money.svelte";
  import type { IAccount, ISlice } from "./store/types";


  let slices: ISlice[] = [];

  onMount(() => {
    initializeSavings();
    getAllCurrency();
  });

  function handleChange({ detail }: { detail: IAccount }) {
    updateAccount(detail);
  }

  function handleDelete({ detail }: { detail: number }) {
    deleteAccount(detail);
  }

  function add(e: Event) {
    e.preventDefault();
    createAccount();
  }

  $: financeKeys = $finance ? Object.keys($finance) : [];

  $: {
    slices = [
      {
        color: "#eee",
        value: $totalRatio.RUB || 1,
        text: "RUB",
      },
      {
        color: "#0a7734",
        value: $totalRatio.EUR || 1,
        text: "EUR",
      },
      {
        color: "#d10d17",
        value: $totalRatio.USD || 1,
        text: "USD",
      },
    ];
  }
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
  .results {
    display: flex;
    align-items: center;
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

  <div>
    <div class="results">
      <div class="sum">
        <Money amount={$totalSaving.RUB} currency="RUB" />,
      </div>
      <div class="sum">
        <Money amount={$totalSaving.USD} currency="USD" />,
      </div>
      <div class="sum">
        <Money amount={$totalSaving.EUR} currency="EUR" />,
      </div>
    </div>
    <div class="ratioCurrency">
      <div class="results">
        <div class="sum">
          <Money
            amount={$separateCurrencyTotal.RUB}
            currency="RUB" />({$totalRatio.RUB}%),
        </div>
        <div class="sum">
          <Money
            amount={$separateCurrencyTotal.USD}
            currency="USD" />({$totalRatio.USD}%),
        </div>
        <div class="sum">
          <Money
            amount={$separateCurrencyTotal.EUR}
            currency="EUR" />({$totalRatio.EUR}%)
        </div>
      </div>
      <PieChart {slices} />
    </div>
  </div>
</div>
