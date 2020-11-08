<script>
  import { createEventDispatcher, tick } from "svelte";

  export let name;
  export let amount;
  export let currency;
  export let id = "";

  let inputRef = null;

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

  function handleDelete(e) {
    e.preventDefault();
    dispatch("delete", id);
  }

  async function handleClickOnName() {
    isInputNameVisible = !isInputNameVisible;
    await tick();
    inputRef.focus();
  }
</script>

<style>
  .container {
    display: flex;
    align-items: center;
    /* flex-direction: column; */
  }
  .field {
    display: flex;
    margin: 0.5rem 0.5rem 0.5rem 0;
  }

  .accountName {
    min-width: 140px;
    margin-right: 4px;
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
    border-radius: 6px;
    border: 1px solid #eee;
    color: black;
  }

  .button {
    display: inline-block;
    width: 100%;
    max-width: 124px;
    padding: 12px 12px;

    outline: none;
    box-shadow: none;
    cursor: pointer;
    text-decoration: none;
    text-align: center;

    font-size: 16px;
    border-radius: 8px;
    line-height: 1.125;

    color: #fff;
    background-color: rgb(37, 138, 255);
    border: 1px solid rgb(37, 138, 255);

    transition: border-color 0.1s ease 0s, background-color 0.1s ease 0s,
      color 0.1s ease 0s;
  }

  .button:hover {
    background-color: lighten(rgb(37, 138, 255), 8%);
    border-color: lighten(rgb(37, 138, 255), 8%);
  }

  .select {
    margin-left: 8px;
    padding: 0 12px;
    border-radius: 8px;
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
        placeholder="название"
        bind:value={accountName}
        on:blur={() => (isInputNameVisible = !isInputNameVisible)}
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
      placeholder="cумма"
      name={`${id}Amount`}
      bind:value={amountValue} />
    <select class='select' name={`${id}Currency`} bind:value={currencyValue}>
      <option value="USD">Доллар</option>
      <option value="EUR">Евро</option>
      <option value="RUB">Рубли</option>
    </select>
  </div>
  <button class="button" on:click={handleDelete}>Удалить</button>
</div>
