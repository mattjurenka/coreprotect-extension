document.getElementById("disagree").onclick = () => window.close()
document.getElementById("agree").onclick = () => {
  const agree1 = document.getElementById("check1").checked
  const agree2 = document.getElementById("check2").checked
  const agree3 = document.getElementById("check3").checked

  if (agree1 && agree2 && agree3) {
    localStorage.setItem("agreed_tos", "true")
    document.getElementById("tos-overlay").classList.add("overlay-hidden")
  }
}

if (localStorage.getItem("agreed_tos") === "true") {
  document.getElementById("tos-overlay").classList.add("overlay-hidden")
}

if (new URLSearchParams(window?.location?.search).has("floating")) {
  document.getElementById("background").classList.remove("fixed")
  document.getElementById("tos-overlay").classList.remove("fixed")
  document.getElementById("dataview").classList.remove("fixed")
}

let contract_data = {}

let central_port = chrome.runtime.connect();
central_port.onMessage.addListener(m => {
  console.log("Popup receiving message of type", m.msg_type, m)
  if (m.msg_type === "update_transfers") {
    contract_data = m.contract_data_map
    set_transfers(m.state_diff, m.loading)
    populate_trace(m.call_trace, m.contract_data_map)
    populate_reputation(m.contracts_touched)

    if (m.resolved) {
      document.getElementById("action-bar").classList.add("hidden")
      document.getElementById("action-bar-hr").classList.add("hidden")
      document.getElementById("action-bar-confirm").classList.add("hidden")
    }

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
EFFECTS_EL.classList.add("hidden")

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
    [STATE_DIFF_EL, STATE_DIFF_TAB_EL, "y"],
    [CALL_TRACE_EL, CALL_TRACE_TAB_EL, "both"],
    [REPUTATION_EL, REPUTATION_TAB_EL, "y"]
  ].forEach(([view_el, tab_el, scroll]) => {
    tab_el.onclick = () => {
      STATE_DIFF_TAB_EL.classList.remove("selected")
      CALL_TRACE_TAB_EL.classList.remove("selected")
      REPUTATION_TAB_EL.classList.remove("selected")
      tab_el.classList.add("selected")
      
      STATE_DIFF_EL.hidden = true
      CALL_TRACE_EL.hidden = true
      REPUTATION_EL.hidden = true
      view_el.hidden = false

      const dataview = document.getElementById("dataview")
      dataview.classList.remove("scroll-x")
      dataview.classList.remove("scroll-y")
      if (scroll === "x") {
        dataview.classList.add("scroll-x")
      } else if (scroll === "y") {
        dataview.classList.add("scroll-y")
      } else {
        dataview.classList.add("scroll-x")
        dataview.classList.add("scroll-y")
      }
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
const format_wei = wei => {
  const padded = wei.padStart(18, "0")
	const split_point = padded.length - 18
  const before_zero = padded.substr(0, split_point)
  const after = padded.substr(split_point, padded.length)
	const prefix = before_zero || "0"
  return (Number(prefix).toLocaleString() + "." + after).substring(0, 15)
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
  const diffs = state_diff.map((diff) => {
    if (diff[0] === "memory") {
      const [_, state_address, old_val, new_val] = diff

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
    } else {
      const [_, old_val, new_val] = diff

      const modify_address_container = document.createElement("div")
      modify_address_container.style.display = "grid"
      modify_address_container.style.gridTemplateColumns = "1fr 1fr"
      modify_address_container.style.marginBottom = "0.5rem"
      modify_address_container.replaceChildren(...([
        ["ETH Balance Was", format_wei(old_val)],
        ["Will Be", format_wei(new_val)]
      ].map(([text, val], i) => {
        const p = document.createElement("p")
        p.textContent = text

        const val_el = document.createElement("p")
        val_el.textContent = val
        val_el.style.textAlign = "right"
        val_el.style.marginRight = "1rem"

        return [p, val_el]
      }).flat()))

      return modify_address_container
    }
  })
  state_diff_display.replaceChildren(...diffs);
  container.replaceChildren(get_etherscan_link(contract), ...diffs)
  return container
}

//Returns an element containing displays of all state diffs
const set_transfers = (state_diff_by_contract, loading) => {
  if (loading) {
    NO_EFFECTS_EL.hidden = true
    document.getElementById("loading").classList.remove("hidden")
  } else if (Object.keys(state_diff_by_contract).length > 0) {
    NO_EFFECTS_EL.hidden = true
    document.getElementById("loading").classList.add("hidden")
    document.getElementById("action-bar").classList.remove("hidden")
    document.getElementById("action-bar-hr").classList.remove("hidden")
    document.getElementById("action-bar-confirm").classList.remove("hidden")
    EFFECTS_EL.classList.remove("hidden")
    STATE_DIFF_EL.replaceChildren(...(
      Object.entries(state_diff_by_contract)
        .map(([contract_address, contract_diff]) =>
          get_state_diff_el(contract_address, contract_diff))
    ))
  }
}

const recurse_trace_el = ([{from, to, input}, ...subcalls], contract_data) => {

  const trace_display = document.createElement("div")
  trace_display.style.marginLeft = "0.6rem"

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
    contract_title.onclick = () => console.log(contracts_touched, Array.from(contracts_touched))

    const score_title = document.createElement("p")
    score_title.textContent = "Reputation"
    score_title.classList.add("rep_score")

    title_bar.replaceChildren(contract_title, score_title)

    REPUTATION_EL.replaceChildren(title_bar, ...contracts_touched
      .map(contract => [contract, contract_data[contract]?.bigcs_score || null])
      .map(([contract, score]) => {
        const contract_rep_el = document.createElement("div")
        contract_rep_el.classList.add("contract_rep")

        const contract_title_bar = document.createElement("div")
        contract_title_bar.classList.add("rep_title_bar")

        const contract_title_el = document.createElement("p")
        const score_category = get_score_category(score)

        const rep_toggle_el = document.createElement("div")
        rep_toggle_el.classList.add("toggle")
        rep_toggle_el.classList.add("toggle-rotate")
        rep_toggle_el.innerHTML = '<svg \
          xmlns="http://www.w3.org/2000/svg" fill="none"\
          viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"\
          class="chevron"\
        >\
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />\
        </svg>'
        contract_title_el.replaceChildren(
          document.createTextNode(`${scam_emoji_map[score_category]} `),
          get_etherscan_link(contract),
          rep_toggle_el
        )


        const reputation_score_el = document.createElement("p")
        reputation_score_el.classList.add("rep_score")
        reputation_score_el.replaceChildren(
          document.createTextNode(score || "unknown")
        )

        contract_title_bar.replaceChildren(contract_title_el, reputation_score_el)

        const after_info = []

        const flags = contract_data[contract]?.flags || []
        if (flags.length > 0) {
          const bigcs_title = document.createElement("p")
          bigcs_title.textContent = "Blockchain Intelligence Group Flags"
          bigcs_title.style.marginTop = "0.5rem"

          const flags_el = document.createElement("div")
          flags_el.replaceChildren(...(flags).map(flag => {
            const flag_el = document.createElement("p")
            flag_el.textContent = flag
            return flag_el
          }))
          flags_el.classList.add("chips")

          after_info.push(bigcs_title, flags_el)
        }

        const link_data = data => {
          const a = document.createElement("a")
          a.onclick = () => central_port.postMessage({msg_type: "open_tab", url: data})
          a.title = data
          const href = data.replace(/https?:\/\/(www.)?/, "")
          a.textContent = href.length > 25 ? href.substring(0, 22) + "..." : href
          a.classList.add("rep_score")
          a.style.fontWeight = "normal"
          return a
        }

        const nft_data = contract_data[contract]?.etherscan_nft_data
        if (nft_data?.symbol?.length > 0) {
          const nft_data_order = [
            ["blueCheckmark", "Blue Checkmark"],
            ["website", "Website", link_data],
            ["discord", "Discord", link_data],
            ["twitter", "Twitter", link_data],
            ["telegram", "Telegram", link_data],
            ["github", "GitHub", link_data],
            ["reddit", "Reddit", link_data],
            ["linkedin", "LinkedIn", link_data],
            ["facebook", "Facebook", link_data],
            ["whitepaper", "Whitepaper", link_data],
            ["blog", "Blog", link_data],
            ["bitcointalk", "Bitcoin Talk", link_data]
          ]
          
          const nft_data_title = document.createElement("p")
          nft_data_title.textContent = "Etherscan NFT Data"
          nft_data_title.style.marginTop = "0.5rem"

          const nft_data_div = document.createElement("div")
          nft_data_div.replaceChildren(...(
            nft_data_order.map(([data_key, display_name, el_fn]) => {
              const data = nft_data?.[data_key]
              if (!data) {
                return undefined
              } else {
                const data_div = document.createElement("div")
                data_div.classList.add("rep_title_bar")

                const data_div_title = document.createElement("p")
                data_div_title.textContent = display_name
                data_div_title.style.fontWeight = "normal"

                const data_div_data = (() => {
                  if (el_fn === undefined) {
                    const data_div_data = document.createElement("p")
                    data_div_data.classList.add("rep_score")
                    data_div_data.textContent = data
                    data_div_data.style.fontWeight = "normal"
                    return data_div_data
                  } else {
                    return el_fn(data)
                  }
                })();

                data_div.replaceChildren(data_div_title, data_div_data)
                return data_div
              }
            }).filter(x => x !== undefined)
          ))

          after_info.push(nft_data_title, nft_data_div)
        }

        const get_rep_toggle = () => {
          let shown = true
          return () => {
            shown = !shown
            rep_toggle_el.classList[shown ? "add" : "remove"]("toggle-rotate")
            after_info.forEach(el => {
              el.classList[shown ? "remove" : "add"]("hidden")
            })
          }
        }
        rep_toggle_el.onclick = get_rep_toggle()

        if (after_info.length === 0) {
          rep_toggle_el.style.display = "none"
        }

        contract_rep_el.replaceChildren(contract_title_bar, ...after_info)

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
  central_port.postMessage({
    msg_type: "open_tab",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSfVcT1HOjkgtXIWidYD7ILaOaVTJ5kjSaFvOYu1t_88tTSnnA/viewform?usp=sf_link"
  })
  window.close()
}
