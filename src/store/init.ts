import { forward } from "effector";

import {
  status,
  error,
  rates,
  historyRates,
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
import type { IRates, ISavings, ITotalStorage } from "./types";
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

historyRates.on(getAllCurrency.doneData, (_, { ratesUSD, ratesEUR }) => {
  const oldRatesItemsLS = localStorage.getItem("rates");
  const oldRatesItems = oldRatesItemsLS ? JSON.parse(oldRatesItemsLS) : [];

  const ratesItem = {
    USD: ratesUSD["RUB"],
    EUR: ratesEUR["RUB"],
    RUB: 1,
  };


  if(oldRatesItems.length > 0 && ratesUSD.RUB === oldRatesItems[oldRatesItems.length-1].USD) {
    return oldRatesItems;
  }

  const allHistory: IRates[] = [...oldRatesItems, ratesItem];

  localStorage.setItem("rates", JSON.stringify(allHistory));

  return allHistory;
});

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

// saveTotal

saveTotal.use((savingHistory) => {
  return saveTotalToLS(savingHistory);
});

savingsHistory.on(saveTotal.doneData, (_, newHistory) => newHistory);

//

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
  localStorage.setItem("data", JSON.stringify(currentState));

  return currentState;
});

forward({
  from: totalSaving,
  to: saveTotal,
});

function saveTotalToLS(total: ISavings): ITotalStorage[] {
  const dataFromLS = localStorage.getItem("total");
  const prevHistory: ITotalStorage[] = dataFromLS ? JSON.parse(dataFromLS) : [];
  const currentDate = parseDate();

  if (total.EUR === 0 && total.RUB === 0 && total.USD === 0) {
    return prevHistory;
  }

  const newHistoryItem: ITotalStorage = { ...total, date: currentDate };

  let newHistory = [...prevHistory, newHistoryItem];

  if (prevHistory.map((item) => item.date).includes(currentDate)) {
    newHistory = [...prevHistory.slice(0, -1), newHistoryItem];
  }

  localStorage.setItem("total", JSON.stringify(newHistory));

  return newHistory;
}
