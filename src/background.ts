import browser from "webextension-polyfill"

import { get_storage_accessors } from "./util"

const SIMULATE_URL = "https://coreprotect-workers.matthewjurenka.workers.dev/simulate/"
const CONTRACT_DATA_URL = "https://coreprotect-workers.matthewjurenka.workers.dev/get_contract_data/"

type DataMap = { [address: string]: any }
type ExternalCall = { from: string, to: string, input: string, value: string }
type DiffType = ["memory", string, string, string] | ["balance", string, string]
type StateDiff = { [address: string]: DiffType[] }

const [get_data_map, set_data_map] = get_storage_accessors<DataMap>("data_map", {})
const [get_state_diff, set_state_diff] = get_storage_accessors<StateDiff>("state_diff", {})
const [get_contracts_touched, set_contracts_touched] = get_storage_accessors<string[]>("contracts_touched", [])
const [get_call_trace, set_call_trace] = get_storage_accessors<ExternalCall[]>("call_trace", [])

const [get_last_requested_id, set_last_requested_id] = get_storage_accessors<number | undefined>("last_requested_id", undefined)


const [get_loading, set_loading] = get_storage_accessors("loading", false)
const [get_resolved, set_resolved] = get_storage_accessors("resolved", false)

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

      await simulate_transaction(m.from, m.to, m.input, m.value)
      await update_contract_data_map(await get_contracts_touched())
      await set_loading(false)
      await browser.runtime.sendMessage({
        msg_type: "update_transfers",
        state_diff: await get_state_diff(),
        call_trace: await get_call_trace(),
        contracts_touched: await get_contracts_touched(),
        contract_data_map: await get_data_map(),
        loading: await get_loading(),
        resolved: await get_resolved(),
      }).catch(console.log)
    }
  } catch (err) {
    console.log(err)
  }
})

const simulate_transaction = async (from: any, to: any, input: any, value: any) => {
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
    const recurse_trace = (call: any): ExternalCall[] => {
      touched.add(call.to)
      return [{
          from: call.from, to: call.to, value: call.value, input: call.input
        },
        ...(call.calls ? call.calls.map(recurse_trace) : [])
      ]
    }

    await set_call_trace(recurse_trace(returned_trace))
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
  } catch (err) {
    console.error(err)
  }
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
