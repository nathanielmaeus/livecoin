import { createStore, createEvent, createEffect, combine } from "effector";
import type {
  IRates,
  IFinance,
  IAccount,
  IAllCurrency,
  ISavings,
  ITotalStorage,
} from "./types";

export enum STATUS {
  initial = "initial",
  loading = "loading",
  loaded = "loaded",
  failed = "failed",
}

const INITIAL: IFinance = {
  1: {
    id: 1,
    name: "",
    amount: 0,
    currency: "USD",
  },
};

export const status = createStore<STATUS>(STATUS.initial);
export const error = createStore<string | null>(null);
export const rates = createStore<IRates>({ USD: 0, EUR: 0 });
export const historyRates = createStore<IRates[]>([]);
export const date = createStore<string | null>(null);
export const savingsHistory = createStore<ITotalStorage[]>([]);
export const finance = createStore<IFinance>(INITIAL);

export const totalSaving = combine(finance, rates, (finance, rates) => {
  const initial = {
    USD: 0,
    EUR: 0,
    RUB: 0,
  };

  if (!finance || !rates["EUR"]) {
    return initial;
  }

  return Object.keys(finance).reduce((acc, key) => {
    const { currency, amount } = finance[key];
    if (!amount) {
      return acc;
    }
    acc["RUB"] += amount * rates[currency];
    acc["EUR"] += acc["RUB"] / rates["EUR"];
    acc["USD"] += acc["RUB"] / rates["USD"];

    return acc;
  }, initial);
});

export const createAccount = createEvent<void>();
export const updateAccount = createEvent<IAccount>();
export const deleteAccount = createEvent<number>();
export const initializeSavings = createEvent<void>();

export const getAllCurrency = createEffect<void, IAllCurrency, string>();
export const saveTotal = createEffect<ISavings, ITotalStorage[], void>();
