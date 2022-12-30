import { EthPriceMap } from "./stores"

export const fetch_eth_price = async (): Promise<EthPriceMap> => {
  try {
    const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=ETH")
    return (await response.json()).data.rates
  } catch (e) {
    console.error(e)
    return {}
  }
}

