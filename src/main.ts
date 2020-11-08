import App from "./App.svelte";
import "./store/init";

const app = new App({
  target: document.body,
});

export default app;
