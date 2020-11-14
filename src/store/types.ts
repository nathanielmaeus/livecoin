export interface IRates {
  USD: number;
  EUR: number;
  RUB: number;
}

export type currencyType = "USD" | "EUR" | "RUB";

export interface ISavings {
  USD: number;
  EUR: number;
  RUB: number;
}

export interface ITotalStorage extends ISavings {
  date: string;
}

export interface IData {
  rates: Rates;
  base: string;
  date: string;
}

export interface IAccount {
  id: number;
  name: string;
  amount: number;
  currency: currencyType;
}

export interface IAllCurrency {
  ratesUSD: Rates;
  ratesEUR: Rates;
  date: string;
}

export interface IFinance {
  [key: string]: IAccount;
}

export interface Rates {
  CAD: number;
  HKD: number;
  ISK: number;
  PHP: number;
  DKK: number;
  HUF: number;
  CZK: number;
  GBP: number;
  RON: number;
  SEK: number;
  IDR: number;
  INR: number;
  BRL: number;
  RUB: number;
  HRK: number;
  JPY: number;
  THB: number;
  CHF: number;
  EUR: number;
  MYR: number;
  BGN: number;
  TRY: number;
  CNY: number;
  NOK: number;
  NZD: number;
  ZAR: number;
  USD: number;
  MXN: number;
  SGD: number;
  AUD: number;
  ILS: number;
  KRW: number;
  PLN: number;
}

export interface ISlice {
  color: string;
  value: number;
  text: string;
}
