<script lang="ts">
  import { createEventDispatcher, tick } from "svelte";
  import Button from "./components/button.svelte";
  import type { IRates } from "./store/types";

  export let name: string;
  export let amount: number;
  export let currency: keyof IRates;
  export let id = "";

  let inputRef: HTMLInputElement | null = null;

  const dispatch = createEventDispatcher();

  $: isInputNameVisible = !name;
  $: accountName = name || "";
  $: amountValue = amount || "";
  $: currencyValue = currency || "USD";

  $: {
    if (accountName && amountValue && currencyValue) {
      dispatch("message", {
        id: id,
        name: accountName,
        amount: amountValue,
        currency: currencyValue,
      });
    }
  }

  function handleDelete(e: Event) {
    e.preventDefault();
    dispatch("delete", id);
  }

  async function handleClickOnName() {
    isInputNameVisible = !isInputNameVisible;
    await tick();
    inputRef!.focus();
  }

  function handleBlur() {
    if(!accountName) {
      return;
    }
    isInputNameVisible = !isInputNameVisible;
  }
</script>

<style>
  .container {
    display: flex;
    align-items: center;
    padding: 0.25rem 1.4rem;
    margin-bottom: 1rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 0.25rem;
  }
  .field {
    display: flex;
    margin: 0.5rem 0.5rem 0.5rem 0;
  }

  .accountName {
    min-width: 210px;
    margin: 0 0.5rem 0 0.5rem;
  }

  .input {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    min-height: 38px;
    width: 100%;
    padding: 10px 12px;
    box-sizing: border-box;

    font-size: 14px;
    line-height: 1.38;

    background-color: white;

    outline: none;
    border-radius: 4px;
    border: 1px solid #eee;
    color: black;
  }

  .select {
    margin-left: 8px;
    padding: 0 12px;
    border-radius: 4px;
    border: 1px solid #eee;
  }
</style>

<div class="container">
  {#if isInputNameVisible}
    <div class="field">
      <input
        class="input accountName"
        bind:this={inputRef}
        type="text"
        placeholder="Название"
        bind:value={accountName}
        on:blur={handleBlur}
        name="accountName" />
    </div>
  {:else}
    <div class="accountName" on:click={handleClickOnName}>
      {accountName || ''}
    </div>
  {/if}
  <div class="field">
    <input
      class="input"
      type="number"
      placeholder="Сумма"
      name={`${id}Amount`}
      bind:value={amountValue} />
    <select class="select" name={`${id}Currency`} bind:value={currencyValue}>
      <option value="USD">Доллар</option>
      <option value="EUR">Евро</option>
      <option value="RUB">Рубли</option>
    </select>
  </div>
  <Button on:click={handleDelete}>Удалить</Button>
</div>
