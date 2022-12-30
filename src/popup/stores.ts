import { writable } from "svelte/store"
import browser from "webextension-polyfill"
import { supported_effects } from "./effects"

export const window_type = new URLSearchParams(window?.location?.search).has("floating") ? "floating" : "popup"

export const contract_data_map = writable({})
export const contracts_touched = writable<string[]>([])
export const state_diff = writable({})
export const call_trace = writable([])
export const effects = writable([])
export const your_address = writable("0x")
export const eth_price = writable({})
export const eth_transfers = writable([])

export const loading = writable(false)
export const resolved = writable(false)

export const accepted_tos = writable(false)
browser.storage.local.get("accepted_tos")
  .then(found => accepted_tos.set(found.accepted_tos || false))
export const accept_tos = () => browser.storage.local.set({accepted_tos: true})
  .then(() => accepted_tos.set(true))

const with_transfers = ["Transfers", "Execution", "Contracts", "State"]
const without_transfers = ["Execution", "Contracts", "State"]

export let tabs = writable(with_transfers)
export const current_tab = writable(with_transfers[0])
tabs.subscribe($tabs => current_tab.set($tabs[0]))

const stores = {
  contract_data_map, contracts_touched, state_diff,
  call_trace, loading, resolved, effects, eth_price, eth_transfers
}

browser.runtime.onMessage.addListener(async m => {
  console.log("Popup receiving message of type", m.msg_type, m)
  if (!m?.msg_type) {
    return false
  }

  if (m.msg_type === "update_transfers") {
    Object.entries(stores).forEach(([store_name, store]) => {
      if (store_name in m) {
        store.set(m[store_name])
      }
      if ("effects" in m) {
        tabs.set(
          m.effects.some(
            ([_, __, schema, fn_sig]: any[]) => supported_effects?.[schema]?.includes(fn_sig)
          ) || m.eth_transfers.length > 0
            ? with_transfers : without_transfers
        )
      }
    })
    const first_caller: string | undefined = m.call_trace?.[0]?.from
    if (first_caller) {
      your_address.set(first_caller)
    }
  } else if (m.msg_type === "close_window") {
    if (m.keep_open !== window_type) {
      window.close()
    }
  }
})
browser.runtime.sendMessage({ msg_type: "register_popup_port", keep_open: window_type })
