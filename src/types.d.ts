type Chain = "eth" | "bsc"

type DataMap = Record<Chain, {[address: string]: any }>
type ExternalCall = {
  from: string, to: string, input: string, value: string,
  delegate_caller: string | undefined 
}
type ExternalCallDelegate = [string, string, string, {from: string, to: string} | undefined]
type DiffType = ["memory", string, string, string] | ["balance", string, string]
type StateDiff = { [address: string]: DiffType[] }
type EthPriceMap = {[currency: string]: string}
interface CallInfo {
  caller: string
  contract: string
  schema: string
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
type EffectType = "inbound" | "outbound" | "approval" | "external"

interface MoralisTokenPrice {
  nativePrice: {
    value: string
    decimals: string
    name: string
    symbol: string
  },
  usdPrice: string
  exchangeAddress: string
  exchangeName: string
}
interface MoralisNFTData {
  token_address: string
  name: string
  symbol: string
  contract_type: string
  synced_at: string
}

interface EthTransfer {
  from: string
  to: string
  value: string
  type: "eth"
}

type LoadingType = "effects" | "eth_price" | "contract_data" | "token_data" | "simulation"

export interface GlobalState {
  data_map: DataMap
  state_diff: StateDiff
  contracts_touched: string[]
  call_trace: ExternalCall[]
  call_trace_with_delegate_info: ExternalCallDelegate[]
  effects: Record<EffectType, (CallInfo | EthTransfer)[]>
  eth_price: EthPriceMap
  eth_transfers: EthTransfer[]
  loading: Record<LoadingType, boolean>
  resolved: boolean
  last_requested_id: number | null
  caller: string
  chain: Chain
  error: string
}

type Result<T> = {
  ok: T,
  err: undefined
} | {
  ok: undefined,
  err: string
}

type PopupType = "browser_action" | "floating"
type ApprovalStatusType = "approved" | "rejected"
type RequestStatusType = "requested" | ApprovalStatusType

type Message<A extends string, B> = {
  msg_type: A
  data: B
}

type OpenTabCMD = Message<"open_tab", {
  url: string
}>
type SyncGlobalStateCMD = Message<"sync_global_state", {
  state: GlobalState
  timestamp: number
}>
// Can't be sent with sendMessage
type UpdateGlobalStateCMD = Message<"update_global_state", {
  recipe: (state: GlobalState) => void
}>
type SimulateTransactionCMD = Message<"simulate_transaction", {
  from: string, to: string, input: string, network_id: string, value: string,
  last_requested_id: number
}>
type RegisterPopupPortCMD = Message<"handle_open_popup", {
  opened_type: PopupType
}>
type CloseWindowCMD = Message<"close_window", {
  keep_open: PopupType | "none"
}>
type UpdateTokenPriceCMD = Message<"update_token_price", {}>
type UpdateContractDataCMD = Message<"update_contract_data", {
  contracts: string[]
  chain: Chain
}>
type UpdateNativePriceCMD = Message<"update_native_price", {}>
type UpdateEffectsCMD = Message<"update_effects", {}>
type RespondToApproveRequestCMD = Message<"respond_to_approve_request", {
  status: ApprovalStatusType
}>
type NoopCMD = Message<"noop", {}>

type Command = RegisterPopupPortCMD | OpenTabCMD | SyncGlobalStateCMD | SimulateTransactionCMD |
  UpdateTokenPriceCMD | CloseWindowCMD | UpdateGlobalStateCMD | NoopCMD | UpdateContractDataCMD |
  UpdateNativePriceCMD | UpdateEffectsCMD | RespondToApproveRequestCMD
