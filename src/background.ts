import browser from "webextension-polyfill"
import { calculate_effects } from "./calculate_effects"
import { fetch_eth_price } from "./eth_price"

import { get_loading, get_state_diff, get_call_trace, get_contracts_touched, get_data_map, get_resolved, get_effects, get_last_requested_id, get_eth_price, EthTransfer, set_eth_transfers, get_eth_transfers } from "./stores"
import { set_loading, set_state_diff, set_call_trace, set_contracts_touched, set_data_map, set_resolved, set_effects, set_last_requested_id, set_eth_price} from "./stores"
import { ExternalCall } from "./stores"

const BASE_URL = "https://coreprotect-workers.matthewjurenka.workers.dev"
const SIMULATE_URL = BASE_URL + "/simulate/"
const CONTRACT_DATA_URL = BASE_URL + "/get_contract_data/"

browser.runtime.onMessage.addListener(async (m, sender) => {
  console.log("Background Script receiving message", m, "from popup", sender);
  try{
    if (m.msg_type === "register_popup_port") {
      browser.runtime.sendMessage({
        msg_type: "close_window",
        keep_open: m.keep_open
      }).catch(console.log)
      browser.runtime.sendMessage({
        msg_type: "update_transfers",
        state_diff: await get_state_diff(),
        call_trace: await get_call_trace(),
        contracts_touched: await get_contracts_touched(),
        contract_data_map: await get_data_map(),
        loading: await get_loading(),
        resolved: await get_resolved(),
        effects: await get_effects(),
        eth_transfers: await get_eth_transfers(),
        eth_price: await get_eth_price(),
      })
    } else if (m.msg_type === "respond_to_approve_request") {
      await set_resolved(true)
      const last_requested_tab = await get_last_requested_id()
      if (last_requested_tab) {
        browser.tabs.sendMessage(last_requested_tab, {
          msg_type: "respond_to_approve_request", status: m.status
        }).catch(console.log)
      }
      browser.runtime.sendMessage({
        msg_type: "close_window"
      }).catch(console.log)
    } else if (m.msg_type === "open_tab") {
      browser.tabs.create({url: m.url})
    } else if (m.msg_type === "simulate_transaction") {
      await set_loading(true)
      await set_resolved(false)
      await set_last_requested_id(sender.tab?.id)

      const url = browser.runtime.getURL("popup/app.html")
      browser.windows.create({
        url: url + "?floating=true", type: "popup", height: 620, width: 468
      })

      const [trace] = await Promise.all([
        simulate_transaction(m.from, m.to, m.input, m.value),
        fetch_eth_price().then(set_eth_price)
      ])
      await update_contract_data_map(await get_contracts_touched())
      
      await Promise.all((await get_contracts_touched()).map(update_erc20_token_data))
      const effects = await calculate_effects(trace, await get_data_map(), (await get_call_trace())?.[0]?.from)

      const call_trace = await get_call_trace()
      const first_caller: string | undefined = call_trace?.[0]?.from;
      (await get_eth_transfers()).forEach(value => {
        if (first_caller && first_caller === value.to) {
          effects["inbound"].push(value)
        } else if (first_caller && first_caller === value.from) {
          effects["outbound"].push(value)
        } else {
          effects["external"].push(value)
        }
      })
      await set_call_trace(call_trace)

      await set_effects(effects)
      await set_loading(false)
      await browser.runtime.sendMessage({
        msg_type: "update_transfers",
        state_diff: await get_state_diff(),
        call_trace,
        contracts_touched: await get_contracts_touched(),
        contract_data_map: await get_data_map(),
        loading: await get_loading(),
        resolved: await get_resolved(),
        eth_transfers: await get_eth_transfers(),
        effects, eth_price: await get_eth_price()
      }).catch(console.log)
    }
  } catch (err) {
    console.log(err)
  }
})

const simulate_transaction = async (from: any, to: any, input: any, value: any): Promise<[string, string, string, {from: string, to: string} | undefined][]> => {
  try {
    const res = await fetch(SIMULATE_URL, {
      method: "POST",
      body: JSON.stringify({
        "gas": 8000000,
        "gas_price": "0",
        "value": value || "0",
        from, to, input,
      })
    })
    const json = await res.json()

    await set_state_diff(json.transaction.transaction_info.state_diff
      .reduce((acc: any, cur: any) => {
        const address = cur.raw[0].address
        const original = cur.raw[0].original
        const dirty = cur.raw[0].dirty
        const key = cur.raw[0].key
        if (address in acc) {
          acc[address].push(["memory", key, original, dirty])
        } else {
          acc[address] = [["memory", key, original, dirty]]
        }
        return acc
      }, {}))
    
    const returned_trace = json.transaction.transaction_info.call_trace;
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

    await set_eth_transfers(eth_transfers)
    await set_call_trace(recurse_trace(returned_trace, {}))
    await set_contracts_touched(Array.from(touched))

    const state_diff = await get_state_diff()
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
    await set_state_diff(state_diff)
    return (json.transaction.call_trace as Array<any>).map((call: any, idx, arr) => [
      call.from, call.to, call.input, call.call_type === "DELEGATECALL" ? {
        from: arr[idx-1].from,
        to: arr[idx-1].to
      } : undefined
    ])
  } catch (err) {
    console.error(err)
  }
  return []
}

const update_contract_data_map = async (contracts: any) => {
  const resp = await fetch(CONTRACT_DATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({contracts})
  })
  const json = await resp.json()
  const data_map = await get_data_map()
  Object.assign(
    data_map,
    Object.fromEntries(Object.entries(json).map(([address, val]: [any, any]) => [
      address,
      { 
        "selectors": Object.fromEntries(val.data.metadata.etherscan_contract_source?.selectors
          ?.map(({ function_signature, selector }: {[x: string]: any}) => [selector, function_signature]) || []),
        "contract_name": val.data.metadata.etherscan_contract_source?.name,
        "bigcs_score": val.data.metadata.bigcs_data?.score,
        "flags": (val.data.metadata.bigcs_data?.flags
          ?.map((flag: any) => flag.split("_").map((word: any) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "))),
        "etherscan_nft_data": val.data.metadata.etherscan_nft_data
      }
    ]))
  )
  await set_data_map(data_map)
}

const update_erc20_token_data = async (contract: string): Promise<any> => {
  try {
    const response = await fetch(
      "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
      {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          query: `{ tokens(where: {id: "${contract.toLowerCase()}"}) { id name decimals symbol derivedETH }}`
        })
      }
    )
    const data_map = await get_data_map()
    const token = (await response.json())?.data?.tokens?.[0]
    data_map[contract].uniswap_token_info = token
    await set_data_map(data_map)
  } catch (e) {}
}

