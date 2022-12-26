import { writable } from "svelte/store"
import browser from "webextension-polyfill"

export const window_type = new URLSearchParams(window?.location?.search).has("floating") ? "floating" : "popup"

export const contract_data_map = writable({})
export const contracts_touched = writable<string[]>([])
export const state_diff = writable({})
export const call_trace = writable([])
export const effects = writable([])
export const your_address = writable("0x")
export const eth_price = writable({})

export const loading = writable(false)
export const resolved = writable(false)

const stores = {
  contract_data_map, contracts_touched, state_diff,
  call_trace, loading, resolved, effects, eth_price
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
