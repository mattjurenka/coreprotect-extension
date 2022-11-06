let central_port = browser.runtime.connect({name:"extension@matthewjurenka.com"});
central_port.onMessage.addListener(m => {
  console.log("Popup receiving message of type", m.msg_type, m)
  if (m.msg_type === "update_transfers") {
    set_transfers(m.state_diff)
    populate_trace(m.call_trace, m.selectors_map)
    populate_reputation(m.contracts_touched, m.scam_prob_map)
  } else if (m.msg_type === "close_window") {
    window.close()
  }
})
central_port.postMessage({ msg_type: "register_popup_port" })

const scam_emoji_map = {"Low": "\u2705", "Medium": "\u26a0\ufe0f", "High": "🚩"}

let contract_name_map = {
  "0xdec8005ca1a3f90168c211406fefafa412467d81": ["Hop Protocol Message Router", "PolygonMessengerWrapper"],
  "0xfe5e5d361b2ad62c541bab87c45a0b9b018389a2": ["Polymarket fx-root Bridge", "FxRoot"],
  "0xb8901acb165ed027e32754e0ffe830802919727f": ["Hop Protocol L1 Bridge", "L1_ETH_Bridge"],
  "0x28e4f3a7f651294b9564800b2d01f35189a5bfbe": ["Polygon StateSender", "StateSender"],
  "0xace8a2d0f41702161d8363eddae981e844c35c6e": ["Cool Monkes Trainers", "CoolMonkeTrainers"],
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": ["Uniswap Router", "SwapRouter02"],
  "0x6b175474e89094c44da98b954eedeac495271d0f": ["DAI Stablecoin", "Dai"],
  "0x60594a405d53811d3bc4766596efd80fd545a270": ["Uniswap Liquidity Pool", "UniswapV3Pool"],
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": ["Wrapped ETH Token", "WETH9"]
}

const NO_EFFECTS_EL = document.getElementById("noeffects")
const EFFECTS_EL = document.getElementById("transfers")
EFFECTS_EL.hidden = true

const STATE_DIFF_EL = document.getElementById("state_diff")
const CALL_TRACE_EL = document.getElementById("call_trace")
const REPUTATION_EL = document.getElementById("reputation")
CALL_TRACE_EL.hidden = true
STATE_DIFF_EL.hidden = true

const STATE_DIFF_TAB_EL = document.getElementById("state_diff_tab")
const CALL_TRACE_TAB_EL = document.getElementById("call_trace_tab")
const REPUTATION_TAB_EL = document.getElementById("reputation_tab")

{
  [
    [STATE_DIFF_EL, STATE_DIFF_TAB_EL],
    [CALL_TRACE_EL, CALL_TRACE_TAB_EL],
    [REPUTATION_EL, REPUTATION_TAB_EL]
  ].forEach(([view_el, tab_el]) => {
    tab_el.onclick = () => {
      STATE_DIFF_TAB_EL.classList.remove("selected")
      CALL_TRACE_TAB_EL.classList.remove("selected")
      REPUTATION_TAB_EL.classList.remove("selected")
      tab_el.classList.add("selected")

      STATE_DIFF_EL.hidden = true
      CALL_TRACE_EL.hidden = true
      REPUTATION_EL.hidden = true
      view_el.hidden = false
    }
  })
}

const strip_zeros = (str) => str.replace(/0x0*/, "0x")
const shorten_hex = str => str.substring(0, 6) + "..." + str.substring(str.length - 4, str.length) 
const get_shorten_hex_el = (str) => {
  const p = document.createElement("p")
  p.textContent = shorten_hex(str)
  p.title = str
  return p
}

const get_etherscan_link = address => {
  const url = `https://etherscan.io/address/${address}`
  const a = document.createElement("a")

  a.replaceChildren(
    address in contract_name_map ?
      document.createTextNode(contract_name_map[address][0]) :
      shorten_hex(address)
  )
  a.onclick = () => central_port.postMessage({msg_type: "open_tab", url})
  a.style.cursor = "pointer"

  return a
}

//Returns a display of the state diff for each contract that had its state changed
const get_state_diff_el = (contract, state_diff) => {
  const container = document.createElement("div")

  const state_diff_display = document.createElement("div")
  const diffs = state_diff.map(([state_address, old_val, new_val]) => {
    const state_address_display = document.createElement("p")
    state_address_display.classList.add("contract-title")
    state_address_display.textContent = `Memory @  ${strip_zeros(state_address)}`

    const now_display = document.createElement("p")
    now_display.textContent = `Was ${strip_zeros(old_val)}`

    const will_be_display = document.createElement("p")
    will_be_display.textContent = `Changed to ${strip_zeros(new_val)}`

    const modify_address_container = document.createElement("div")
    modify_address_container.style.display = "grid"
    modify_address_container.style.gridTemplateColumns = "1fr 1fr"
    modify_address_container.style.marginBottom = "0.5rem"
    modify_address_container.replaceChildren(...([
      ["Memory @", state_address],
      ["Was", old_val],
      ["Will Be", new_val]
    ].map(([text, val], i) => {
      const p = document.createElement("p")
      p.textContent = text

      const val_el = get_shorten_hex_el(val)
      val_el.style.textAlign = "right"
      val_el.style.marginRight = "1rem"

      return [p, val_el]
    }).flat()))

    return modify_address_container
  })
  state_diff_display.replaceChildren(...diffs);
  container.replaceChildren(get_etherscan_link(contract), ...diffs)
  return container
}

//Returns an element containing displays of all state diffs
const set_transfers = (state_diff_by_contract) => {
  if (Object.keys(state_diff_by_contract).length > 0) {
    NO_EFFECTS_EL.hidden = true
    EFFECTS_EL.hidden = false
    STATE_DIFF_EL.replaceChildren(...(
      Object.entries(state_diff_by_contract)
        .map(([contract_address, contract_diff]) =>
          get_state_diff_el(contract_address, contract_diff))
    ))
  }
}

const recurse_trace_el = ([{from, to, input}, ...subcalls], selectors_map) => {

  const trace_display = document.createElement("div")
  trace_display.style.marginLeft = "1rem"

  const trace_header = document.createElement("p")
  const fn_name = selectors_map[to]?.[input.slice(2, 10)]?.split("(")?.[0]
  trace_header.replaceChildren(...(fn_name ?
    [document.createTextNode(`${fn_name} @ `), get_etherscan_link(to)] :
    from == to ?
      [get_etherscan_link(from), document.createTextNode(" -> "), get_etherscan_link(to)] :
      [document.createTextNode("Unknown "), get_etherscan_link(from), document.createTextNode(" internal call")]
  ))

  trace_display.replaceChildren(trace_header, ...(subcalls.map(x => recurse_trace_el(x, selectors_map))))

  return trace_display
}

const populate_trace = (trace, selectors_map) => {
  try {
    const trace_el = recurse_trace_el(trace, selectors_map)
    trace_el.style.marginLeft = "0rem"
    CALL_TRACE_EL.replaceChildren(trace_el)
  } catch (err) {
    CALL_TRACE_EL.textContent = "err"
  }
}

const populate_reputation = (contracts_touched, scam_prob_map) => {
  try {
    REPUTATION_EL.replaceChildren(...Array.from(contracts_touched)
      .map(contract => [contract, scam_prob_map[contract] || "Low"])
      .sort(([_, prob1], [__, prob2]) => {
        const map = { "High": 0, "Medium": 1, "Low": 2 }
        if (prob1 === prob2) {
          return 0
        }
        return map[prob1] < map[prob2] ? -1 : 1
      })
      .map(([contract, scam_prob]) => {
        const contract_rep_el = document.createElement("p")
        contract_rep_el.replaceChildren(
          document.createTextNode(`${scam_emoji_map[scam_prob]} Risk for `),
          get_etherscan_link(contract),
          document.createTextNode(` is ${scam_prob}`)
        )
        return contract_rep_el
      }))
  } catch (err) {
    console.log(err)
  }
}


const APPROVE_EL = document.getElementById("approve")
const REJECT_EL = document.getElementById("reject")
const REPORT_EL = document.getElementById("report")

APPROVE_EL.onclick = () => {
  central_port.postMessage({
    msg_type: "respond_to_approve_request",
    status: "approved"
  })
  window.close()
}
REJECT_EL.onclick = () => {
  central_port.postMessage({
    msg_type: "respond_to_approve_request",
    status: "rejected"
  })
  window.close()
}
REPORT_EL.onclick = () => {
  central_port.postMessage({
    msg_type: "respond_to_approve_request",
    status: "reported"
  })
  window.close()
}
