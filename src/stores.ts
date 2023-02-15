import { get_storage_accessors } from "./util"
import { Subject, scan, from, mergeMap, tap } from "rxjs"
import { Command, GlobalState, SyncGlobalStateCMD } from "./types"
import browser from "webextension-polyfill"
import produce from "immer"
import { WritableDraft } from "immer/dist/internal"
import { fetch_contract_data_map, simulate_transaction, fetch_erc20_token_price, fetch_native_coin_price } from "./token_info"
import { calculate_effects } from "./calculate_effects"

const $commands = new Subject<Command>()

const [get_global_state, set_global_state] = get_storage_accessors<GlobalState>("global_state", {
  data_map: {
    eth: {},
    bsc: {}
  },
  state_diff: {},
  contracts_touched: [],
  call_trace: [],
  call_trace_with_delegate_info: [],
  effects: {
    inbound: [],
    outbound: [],
    approval: [],
    external: [],
  },
  caller: "",
  eth_price: {},
  eth_transfers: [],
  loading: {
    effects: false,
    eth_price: false,
    contract_data: false,
    token_data: false,
    simulation: false
  },
  resolved: true,
  last_requested_id: null,
  chain: "eth",
  error: ""
})

const $global_state_transition = from(get_global_state()).pipe(
  tap(_ => console.log("Loaded initial state")),
  mergeMap(initial_state => $commands.pipe(
    scan(
      ([state, _], cmd) => (cmd.msg_type === "update_global_state" ?
        [produce(state, cmd.data.recipe), cmd] : [state, cmd]) as [GlobalState, Command],
      [initial_state, { msg_type: "noop", data: {} }] as [GlobalState, Command]
    ),
  ))
)

$global_state_transition.subscribe(async ([state, last_command]) => {
  console.log("Global State Transition just fired", last_command.msg_type, state, last_command)
  const send_state_update = (update: (state: WritableDraft<GlobalState>) => void) =>
    $commands.next({
      msg_type: "update_global_state",
      data: { recipe: update }
    })
  try {
    const { msg_type, data } = last_command
    if (msg_type === "update_global_state") {
      set_global_state(state)
      browser.runtime.sendMessage({
        msg_type: "sync_global_state",
        data: { state, timestamp: Date.now() }
      } as SyncGlobalStateCMD)
    } if (msg_type === "update_token_price") {
      const token_data = await fetch_erc20_token_price(state.contracts_touched, state.chain)
      if (token_data) {
        send_state_update(state => {
          Object.entries(token_data).forEach(([contract, price_data]) => {
            const contract_data_root = state.data_map[state.chain]
            if (contract_data_root[contract]) {
              contract_data_root[contract].moralis_price_data = price_data
            } else {
              contract_data_root[contract] = { moralis_price_data: price_data }
            }
          })

          state.loading.token_data = false
        })
      }
    } else if (msg_type === "update_contract_data") {
      const { contracts } = data
      const contract_data: Record<string, any> = await fetch_contract_data_map(contracts, state.chain)
      send_state_update(state => {
        Object.entries(contract_data).forEach(([contract, new_data]) => {
          const chain_map = state.data_map[state.chain]
          if (chain_map[contract]) {
            chain_map[contract] = Object.assign(chain_map[contract], new_data)
          } else {
            chain_map[contract] = new_data
          }
        })
        state.loading.contract_data = false
      })
      $commands.next({ msg_type: "update_effects", data: {} })
    } else if (msg_type === "simulate_transaction") {
      const { last_requested_id, network_id } = data
      send_state_update(state => {
        state.loading.token_data = true
        state.loading.simulation = true
        state.loading.contract_data = true
        state.loading.eth_price = true
        state.loading.effects = true
        state.error = ""

        state.chain = network_id === "1" ? "eth" : "bsc"
        state.resolved = false
        state.last_requested_id = last_requested_id
        state.caller = data.from
      })

      const url = browser.runtime.getURL("popup/app.html") + "?floating=true"
      browser.windows.create({
        url, type: "popup", height: 620, width: 468
      })

      const result = await simulate_transaction(last_command)
      if (result.ok) {
        const {
          state_diff, eth_transfers, contracts_touched, call_trace,
          call_trace_with_delegate_info
        } = result.ok
        send_state_update(state => {
          state.state_diff = state_diff
          state.eth_transfers = eth_transfers
          state.contracts_touched = contracts_touched
          state.call_trace = call_trace
          state.call_trace_with_delegate_info = call_trace_with_delegate_info
          state.loading.simulation = false
        })
        $commands.next({ msg_type: "update_native_price", data: {} })
        $commands.next({ 
          msg_type: "update_contract_data", data: {
            chain: state.chain, contracts: contracts_touched
          }
        })
        $commands.next({ msg_type: "update_token_price", data: {} })
      } else {
        send_state_update(state => {
          state.error = result.err
        })
      }
    } else if (msg_type === "update_native_price") {
      const eth_price_map = await fetch_native_coin_price(state.chain)
      send_state_update(state => {
        state.eth_price = eth_price_map
        state.loading.eth_price = false
      })
    } else if (msg_type === "update_effects") {
      const effects = await calculate_effects(
        state.call_trace_with_delegate_info, state.data_map, state.caller, state.chain
      )
      state.eth_transfers.forEach(value => {
        if (state.caller === value.to) {
          effects["inbound"].push(value)
        } else if (state.caller === value.from) {
          effects["outbound"].push(value)
        } else {
          effects["external"].push(value)
        }
      })
      send_state_update(state => {
        state.effects = effects
        state.loading.effects = false
      })
    } else if (msg_type === "respond_to_approve_request") {
      const last_requested_id = state.last_requested_id
      if (last_requested_id) {
        browser.tabs.sendMessage(last_requested_id, last_command).catch(console.log)
      }
      $commands.next({ msg_type: "close_window", data: { keep_open: "none", } })
      send_state_update(state => {
        state.resolved = true
      })
    } else if (msg_type === "close_window") {
      browser.runtime.sendMessage(last_command)
    } else if (msg_type === "open_tab") {
      browser.tabs.create({ url: data.url })
    }
  } catch (e) {
    console.log(e)
    send_state_update(state => {
      state.error = "Internal Error Occurred"
    })
  }
})

export { $commands }
