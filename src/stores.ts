import { get_default_dict, get_storage_accessors } from "./util"

export type DataMap = { [address: string]: any }
export type ExternalCall = {
  from: string, to: string, input: string, value: string,
  delegate_caller: string | undefined 
}
export type DiffType = ["memory", string, string, string] | ["balance", string, string]
export type StateDiff = { [address: string]: DiffType[] }
export type EthPriceMap = {[currency: string]: string}
export interface CallInfo {
  caller: string
  contract: string
  schema_name: string
  fn_sig: string
  args: string[]
  from: string | undefined
  to: string | undefined
  value: string
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

export const [get_data_map, set_data_map] = get_storage_accessors<DataMap>("data_map", {})
export const [get_state_diff, set_state_diff] = get_storage_accessors<StateDiff>("state_diff", {})
export const [get_contracts_touched, set_contracts_touched] = get_storage_accessors<string[]>("contracts_touched", [])
export const [get_call_trace, set_call_trace] = get_storage_accessors<ExternalCall[]>("call_trace", [])
export const [get_effects, set_effects] = get_storage_accessors<Record<EffectType, (CallInfo | EthTransfer)[]>>("effects", get_default_dict(() => []))
export const [get_eth_price, set_eth_price] = get_storage_accessors<EthPriceMap>("eth_price", {})
export const [get_eth_transfers, set_eth_transfers] = get_storage_accessors<EthTransfer[]>("eth_transfers", [])

export const [get_last_requested_id, set_last_requested_id] = get_storage_accessors<number | undefined>("last_requested_id", undefined)

export const [get_loading, set_loading] = get_storage_accessors("loading", false)
export const [get_resolved, set_resolved] = get_storage_accessors("resolved", false)
