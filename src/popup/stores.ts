import { writable } from "svelte/store"
import browser from "webextension-polyfill"

export const window_type = new URLSearchParams(window?.location?.search).has("floating") ? "floating" : "popup"

export const contract_data_map = writable({})
export const contracts_touched = writable<string[]>([])
export const state_diff = writable({})
export const call_trace = writable([])

export const loading = writable(false)
export const resolved = writable(false)

browser.runtime.onMessage.addListener(async m => {
  console.log("Popup receiving message of type", m.msg_type, m)
  if (!m?.msg_type) {
    return false
  }

  if (m.msg_type === "update_transfers") {
    loading.set(m.loading)
    contract_data_map.set(m.contract_data_map)
    contracts_touched.set(m.contracts_touched)
    state_diff.set(m.state_diff)
    call_trace.set(m.call_trace)
    resolved.set(m.resolved)
  } else if (m.msg_type === "close_window") {
    if (m.keep_open !== window_type) {
      window.close()
    }
  }
})
browser.runtime.sendMessage({ msg_type: "register_popup_port", keep_open: window_type })
