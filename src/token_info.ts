import { EthTransfer, ExternalCall, ExternalCallDelegate, SimulateTransactionCMD, StateDiff, MoralisTokenPrice, Chain, EthPriceMap, Result } from "./types"
import { SIMULATE_URL, CONTRACT_DATA_URL, TOKEN_PRICES_URL } from "./urls"

export const fetch_erc20_token_price = async (contracts: string[], chain: Chain): Promise<Record<string, MoralisTokenPrice> | null> => {
  console.log("called2")
  try {
    const response = await fetch(
      TOKEN_PRICES_URL,
      {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ contracts, chain })
      }
    )
    return (await response.json()) as Record<string, MoralisTokenPrice> || null
  } catch (e) {
    console.log(e)
    return null
  }
}

export const fetch_contract_data_map = async (contracts: string[], chain: Chain): Promise<any> => {
  const resp = await fetch(CONTRACT_DATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({contracts, chain})
  })
  const json = await resp.json()

  return Object.fromEntries(Object.entries(json).map(([address, val]: [any, any]) => [
    address,
    { 
      selectors: Object.fromEntries(val.etherscan_contract_source?.selectors
        ?.map(({ function_signature, selector }: {[x: string]: any}) => [selector, function_signature]) || []),
      contract_name: val.etherscan_contract_source?.name,
      bigcs_score: val.bigcs_data?.score,
      flags: (val.bigcs_data?.flags
        ?.map((flag: any) => flag.split("_").map((word: any) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "))),
      etherscan_nft_data: val.etherscan_nft_data,
      moralis_nft_data: val.moralis_nft_data
    }
  ]))
}

export const simulate_transaction = async (cmd: SimulateTransactionCMD): Promise<Result<{
  state_diff: StateDiff,
  eth_transfers: EthTransfer[],
  call_trace: ExternalCall[],
  contracts_touched: string[],
  call_trace_with_delegate_info: ExternalCallDelegate[],
}>> => {
  try {
    const { value, from, to, input, network_id } = cmd.data
    const res = await fetch(SIMULATE_URL, {
      method: "POST",
      body: JSON.stringify({
        "gas": 8000000,
        "gas_price": "0",
        "value": value || "0",
        from, to, input, network_id
      })
    })
    const json = await res.json()

    const state_diff = (json.transaction.transaction_info.state_diff as any[])
      .reduce((acc: StateDiff, cur) => {
        const { address, original, dirty, key } = cur.raw[0]
        if (address in acc) {
          acc[address].push(["memory", key, original, dirty])
        } else {
          acc[address] = [["memory", key, original, dirty]]
        }
        return acc
      }, {})

    json.transaction.transaction_info.balance_diff
      .filter((diff: any) => !diff.is_miner)
      .forEach(({address, dirty, original}: {[x: string]: any}) => {
        address = address.toLowerCase()
        if (address in state_diff) {
          state_diff[address].unshift(["balance", original, dirty])
        } else {
          state_diff[address] = [["balance", original, dirty]]
        }
      })

    const raw_call_trace = json.transaction.transaction_info.call_trace;

    const touched: Set<string> = new Set()
    const eth_transfers: EthTransfer[] = []
    const recurse_trace = (call: any, caller: any): ExternalCall[] => {
      touched.add(call.to)
      if (call.value && call.value !== "0") {
        eth_transfers.push({
          from: call.from, to: call.to, value: call.value, type: "eth"
        })
      }
      return [{
          from: call.from, to: call.to, value: call.value, input: call.input,
          delegate_caller: call.call_type === "DELEGATECALL" ? {
            from: caller.from,
            to: caller.to
          } : undefined
        },
        ...(call.calls ? call.calls.map((subcall: any) => recurse_trace(subcall, call)) : [])
      ]
    }
    
    const call_trace = recurse_trace(raw_call_trace, {})
    const contracts_touched = Array.from(touched)
    const call_trace_with_delegate_info = (json.transaction.call_trace as any[]).map((call: any, idx, arr) => [
      call.from, call.to, call.input, call.call_type === "DELEGATECALL" ? {
        from: arr[idx-1].from,
        to: arr[idx-1].to
      } : undefined
    ] as ExternalCallDelegate)
    return {
      ok: {
        state_diff, eth_transfers, call_trace, call_trace_with_delegate_info, contracts_touched
      },
      err: undefined
    }
  } catch (e) {
    console.log(e)
    return {
      ok: undefined,
      err: "Error Simulating Transaction: Unable to Connect to Server"
    }
  }
}

export const fetch_native_coin_price = async (chain: Chain): Promise<EthPriceMap> => {
  try {
    const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${chain === "eth" ? "ETH" : "BNB"}`)
    return (await response.json()).data.rates
  } catch (e) {
    console.error(e)
    return {}
  }
}
