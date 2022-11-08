document.getElementById("disagree").onclick = () => window.close()
document.getElementById("agree").onclick = () => {
  const agree1 = document.getElementById("check1").checked
  const agree2 = document.getElementById("check2").checked
  const agree3 = document.getElementById("check3").checked

  if (agree1 && agree2 && agree3) {
    localStorage.setItem("agreed_tos", "true")
    document.getElementById("overlay").classList.add("overlay-hidden")
  }
}

if (localStorage.getItem("agreed_tos") === "true") {
  document.getElementById("overlay").classList.add("overlay-hidden")
}

let contract_data = {}

let central_port = browser.runtime.connect({name:"extension@matthewjurenka.com"});
central_port.onMessage.addListener(m => {
  console.log("Popup receiving message of type", m.msg_type, m)
  if (m.msg_type === "update_transfers") {
    contract_data = m.contract_data_map
    set_transfers(m.state_diff)
    populate_trace(m.call_trace, m.contract_data_map)
    populate_reputation(m.contracts_touched)
  } else if (m.msg_type === "close_window") {
    window.close()
  }
})
central_port.postMessage({ msg_type: "register_popup_port" })

const scam_emoji_map = {
  "Low": "😨", "Neutral": "🙂", "High": "😀", "Unknown": "🤔"
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
const shorten_name = str => str.length > 30 ? str.substring(0, 27) + "..." : str
const get_shorten_hex_el = (str) => {
  const p = document.createElement("p")
  p.textContent = shorten_hex(str)
  p.title = str
  return p
}


const get_etherscan_link = address => {
  const url = `https://etherscan.io/address/${address}`
  const a = document.createElement("a")

  const contract_name = contract_data[address]?.contract_name

  a.replaceChildren(
    contract_name ?
      document.createTextNode(shorten_name(contract_name)) :
      shorten_hex(address)
  )
  a.onclick = () => central_port.postMessage({msg_type: "open_tab", url})
  a.style.cursor = "pointer"
  a.title = address

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

const recurse_trace_el = ([{from, to, input}, ...subcalls], contract_data) => {

  const trace_display = document.createElement("div")
  trace_display.style.marginLeft = "1rem"

  const trace_header = document.createElement("p")
  const fn_name = contract_data[to]?.selectors?.[input.slice(2, 10)]?.split("(")?.[0]
  trace_header.replaceChildren(...(fn_name ?
    [document.createTextNode(`${fn_name} @ `), get_etherscan_link(to)] :
    from == to ?
      [get_etherscan_link(from), document.createTextNode(" -> "), get_etherscan_link(to)] :
      [document.createTextNode("Unknown "), get_etherscan_link(from), document.createTextNode(" internal call")]
  ))

  trace_display.replaceChildren(trace_header, ...(subcalls.map(x => recurse_trace_el(x, contract_data))))

  return trace_display
}

const populate_trace = (trace, contract_data) => {
  try {
    const trace_el = recurse_trace_el(trace, contract_data)
    trace_el.style.marginLeft = "0rem"
    CALL_TRACE_EL.replaceChildren(trace_el)
  } catch (err) {
    CALL_TRACE_EL.textContent = "err"
  }
}

const get_score_category = (score) => {
  if (score === null) {
    return "Unknown"
  } else if (score < 40) {
    return "Low"
  } else if (score < 60) {
    return "Neutral"
  } else {
    return "High"
  }
}

const populate_reputation = (contracts_touched) => {
  try {
    const title_bar = document.createElement("div")
    title_bar.classList.add("rep_title_bar")
    title_bar.style.marginBottom = "0.25rem"

    const contract_title = document.createElement("p")
    contract_title.textContent = "Contract"

    const score_title = document.createElement("p")
    score_title.textContent = "Reputation"
    score_title.classList.add("rep_score")

    title_bar.replaceChildren(contract_title, score_title)

    REPUTATION_EL.replaceChildren(title_bar, ...Array.from(contracts_touched)
      .map(contract => [contract, contract_data[contract]?.bigcs_score || null])
      //.sort(([_, score1], [__, score2]) => score2 - score1)
      .map(([contract, score]) => {
        const contract_rep_el = document.createElement("div")
        contract_rep_el.classList.add("contract_rep")

        const contract_title_bar = document.createElement("div")
        contract_title_bar.classList.add("rep_title_bar")

        const contract_title_el = document.createElement("p")
        const score_category = get_score_category(score)
        contract_title_el.replaceChildren(
          document.createTextNode(`${scam_emoji_map[score_category]} `),
          get_etherscan_link(contract),
        )
        const reputation_score_el = document.createElement("p")
        reputation_score_el.classList.add("rep_score")
        reputation_score_el.replaceChildren(
          document.createTextNode(score || "unknown")
        )

        contract_title_bar.replaceChildren(contract_title_el, reputation_score_el)

        const chips = document.createElement("div")
        chips.replaceChildren(...(contract_data[contract]?.chips || []).map(chip => {
          const chip_el = document.createElement("p")
          chip_el.textContent = chip
          return chip_el
        }))
        chips.classList.add("chips")

        contract_rep_el.replaceChildren(contract_title_bar, chips)

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
