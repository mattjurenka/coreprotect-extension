import { derived, writable } from "svelte/store"
import browser from "webextension-polyfill"
import { CallInfo, Chain, Command, DataMap, EffectType, EthTransfer, ExternalCall, PopupType, RegisterPopupPortCMD } from "../types"
import { supported_effects } from "./effects"
import { get_localstorage_accessors } from "./utils"

export const VERSION: string = "__VERSION__"
export const BROWSER: string = "__BROWSER__"

export const window_type: PopupType = new URLSearchParams(window?.location?.search).has("floating") ? "floating" : "browser_action"

let state_last_updated = 0
export const contract_data_map = writable<DataMap>({eth: {}, bsc: {}})
export const contracts_touched = writable<string[]>([])
export const state_diff = writable({})
export const call_trace = writable<ExternalCall[]>([])
export const effects = writable<Record<EffectType, (EthTransfer | CallInfo)[]>>({} as any)
export const your_address = writable("0x0")
export const eth_price = writable({})
export const eth_transfers = writable<EthTransfer[]>([])
export const chain = writable<Chain>("eth")
export const error = writable<string>("")

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

browser.runtime.onMessage.addListener(async (cmd: Command) => {
  const { msg_type, data } = cmd
  console.log("Popup receiving message of type", msg_type, cmd)
  if (msg_type === "sync_global_state") {
    if (data.timestamp > state_last_updated) {
      state_last_updated = data.timestamp

      const state = data.state
      contract_data_map.set(state.data_map)
      contracts_touched.set(state.contracts_touched)
      state_diff.set(state.state_diff)
      call_trace.set(state.call_trace)
      effects.set(state.effects)
      your_address.set(state.caller)
      eth_price.set(state.eth_price)
      eth_transfers.set(state.eth_transfers)
      chain.set(state.chain)
      error.set(state.error)

      resolved.set(state.resolved)
      loading.set(Object.entries(state.loading).filter(([k]) => k !== "simulation").some(([_, l]) => l))
    }

  } else if (msg_type === "close_window") {
    if (data.keep_open !== window_type) {
      window.close()
    }
  }
})

browser.runtime.sendMessage({
  msg_type: "handle_open_popup",
  data: {
    opened_type: window_type
  }
} as RegisterPopupPortCMD)
