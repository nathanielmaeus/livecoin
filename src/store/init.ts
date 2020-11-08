import { forward } from "effector";

import {
  status,
  error,
  rates,
  date,
  finance,
  totalSaving,
  createAccount,
  updateAccount,
  deleteAccount,
  getAllCurrency,
  initializeSavings,
  savingsHistory,
  STATUS,
  saveTotal,
} from ".";
import { getAllCurrencyApi } from "./api";
import type { ITotalStorage } from "./types";
import { parseDate } from "../helpers";

// getAllCurrency

getAllCurrency.use(getAllCurrencyApi);

status
  .on(getAllCurrency, () => STATUS.loading)
  .on(getAllCurrency.done, () => STATUS.loaded)
  .on(getAllCurrency.fail, () => STATUS.failed);

rates.on(getAllCurrency.doneData, (_, { ratesUSD, ratesEUR }) => ({
  USD: ratesUSD["RUB"],
  EUR: ratesEUR["RUB"],
  RUB: 1,
}));

error.on(getAllCurrency.failData, (_, error) => error);

date.on(getAllCurrency.doneData, (_, { date }) => date);

// updateAccount

finance.on(updateAccount, (state, { id, name, amount, currency }) => {
  const newState = {
    ...state,
    [id]: {
      name,
      amount,
      currency,
    },
  };
  localStorage.setItem("data", JSON.stringify(newState));
  return newState;
});

totalSaving.on(updateAccount, (state, { id, name, amount, currency }) => {
  const newState = {
    ...state,
    [id]: {
      name,
      amount,
      currency,
    },
  };
  return newState;
});

// initializeSavings

finance.on(initializeSavings, (state) => {
  try {
    const data = localStorage.getItem("data");
    return data ? JSON.parse(data) : state;
  } catch (err) {
    return state;
  }
});

savingsHistory.on(initializeSavings, (state) => {
  try {
    const data = localStorage.getItem("total");
    const history: ITotalStorage[] = data ? JSON.parse(data) : state;
    return history;
  } catch (err) {
    return state;
  }
});

finance.on(createAccount, (state) => {
  const currentId = Date.now().valueOf();
  return {
    ...state,
    [currentId]: {
      name: "",
      amount: "",
      currency: "USD",
    },
  };
});

finance.on(deleteAccount, (state, id) => {
  const currentState = { ...state };
  delete currentState[id];
  return currentState;
});

saveTotal.use((total) => {
  const dataFromLS = localStorage.getItem("total");
  const prev: ITotalStorage[] = dataFromLS ? JSON.parse(dataFromLS) : [];
  const currentDate = parseDate();

  if (total.EUR === 0 && total.RUB === 0 && total.USD === 0) {
    return;
  }

  if (prev.map((item) => item.date).includes(currentDate)) {
    return;
  }

  localStorage.setItem(
    "total",
    JSON.stringify([...prev, { ...total, date: currentDate }])
  );
});

forward({
  from: totalSaving,
  to: saveTotal,
});
