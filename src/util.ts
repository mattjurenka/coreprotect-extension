import browser from "webextension-polyfill"
import { Chain, DataMap } from "./types";

export const get_storage_accessors = <T>(key_name: string, def: T): [() => Promise<T>, (val: T) => Promise<void>] => {
  let last_queued_op: Promise<any> = Promise.resolve();
  let state_status: ["init" | "uninit", T] = ["uninit", def];
  return [
    async () => {
      last_queued_op = last_queued_op.then(async () => {
        if (state_status[0] === "uninit") {
          const found = (await browser.storage.local.get(key_name))[key_name]
          state_status = [
            "init",
            found !== undefined ?
              (found === "undefined" ? undefined : JSON.parse(found)) :
              state_status[1]
          ]
        }
        return state_status[1]
      })
      return last_queued_op
    },
    async (val: T) => {
      last_queued_op = last_queued_op.then(async () => {
        state_status[1] = val
        await browser.storage.local.set({ [key_name]: JSON.stringify(val) })
      })
    }
  ]
}

export const check_token_type = (contract: string, data_map: DataMap, chain: Chain): {
  name: string | null,
  schema: string | null
} => {
  const contract_data = data_map[chain]?.[contract]
  if (contract_data === undefined) {
    return {
      name: null,
      schema: null
    }
  }

  const { moralis_nft_data, moralis_price_data, etherscan_nft_data } = contract_data
  let name = moralis_nft_data?.name || null
  name = etherscan_nft_data?.tokenName || name

  let schema = moralis_nft_data?.contract_type || null
  schema = (moralis_price_data?.usdPrice ? "ERC20" : null) || schema

  return {
    name, schema
  }
}
