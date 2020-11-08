import type { currencyType, IAllCurrency, IData } from "./types";

export async function getCurrencyApi(currency: currencyType): Promise<IData> {
  try {
    const result = await fetch(
      `https://api.exchangeratesapi.io/latest?base=${currency}`
    );

    const data = await result.json();

    if (!result.ok) {
      throw new Error(data.error);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export async function getAllCurrencyApi(): Promise<IAllCurrency> {
  try {
    const data = await Promise.all([
      getCurrencyApi("USD"),
      getCurrencyApi("EUR"),
    ]);

    const [{ rates: ratesUSD, date }, { rates: ratesEUR }] = data;

    return {
      ratesUSD,
      ratesEUR,
      date,
    };
  } catch (err) {
    throw new Error(err);
  }
}
