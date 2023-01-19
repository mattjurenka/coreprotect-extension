import { derived, writable } from "svelte/store"
import browser from "webextension-polyfill"
import { supported_effects } from "./effects"
import { get_localstorage_accessors } from "./utils"

export const VERSION: string = "__VERSION__"
export const BROWSER: string = "__BROWSER__"

export interface CallInfo {
  caller: string
  contract: string
  schema_name: string
  fn_sig: string
  args: string[]
  from: string | undefined
  to: string | undefined
  value: string | undefined
  name: string | undefined
  nft_id: string | undefined
  nft_picture: string | undefined
  nft_name: string | undefined
  nft_link: string | undefined
  type: "erc20"
}
export type EffectType = "inbound" | "outbound" | "approval" | "external"
export interface EthTransfer {
  from: string
  to: string
  value: string
  type: "eth"
}

export const window_type = new URLSearchParams(window?.location?.search).has("floating") ? "floating" : "popup"

export const contract_data_map = writable({})
export const contracts_touched = writable<string[]>([])
export const state_diff = writable({})
export const call_trace = writable([])
export const effects = writable<Record<EffectType, (CallInfo | EthTransfer)[]>>({} as any)
export const your_address = writable("0x0")
export const eth_price = writable({})
export const eth_transfers = writable([])

export const loading = writable(false)
export const resolved = writable(false)

export const [accepted_tos, set_accepted_tos] = get_localstorage_accessors("accepted_tos", false)
export const [advanced_tabs, set_advanced_tabs] = get_localstorage_accessors("advanced_tabs", false)
export const [external_transfers, set_external_transfers] = get_localstorage_accessors("external_transfers", false)
export const [outdated_cache, set_outdated_cache] = get_localstorage_accessors<[boolean, number]>("outdated_cache", [false, Date.now()])

const base_tabs = ["Contracts", "Execution"]
export const tabs = derived(
  [advanced_tabs, effects, external_transfers],
  ([$advanced_tabs, $effects, $external_transfers]) =>
    (Object.entries($effects).filter(([effect_type, effects]) => !(
      (effects?.length && effects?.filter(effect =>
        effect.type !== "erc20" ||
        supported_effects[effect.fn_sig]?.includes(effect.fn_sig)
      ).length === 0) ||
      (effect_type === "external" && !$external_transfers)
    )).length > 0 ? ["Transfers"] : []).concat(base_tabs).concat($advanced_tabs ? ["State"] : [])
)
export const current_tab = writable(base_tabs[0])
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
