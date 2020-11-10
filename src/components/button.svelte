<style>
  .button {
    display: inline-block;
    max-width: 124px;
    padding: 12px 12px;

    outline: none;
    box-shadow: none;
    cursor: pointer;
    text-decoration: none;
    text-align: center;

    font-size: 16px;
    border-radius: 4px;
    line-height: 1.125;

    color: #fff;
    background-color: #424c57;
    border: 1px solid#424c57;

    transition: border-color 0.1s ease 0s, background-color 0.1s ease 0s,
      color 0.1s ease 0s;
  }

  .button:hover {
    background-color: #53606e;
    border-color: #53606e;
  }
</style>

<button class="button" on:click><slot /></button>
