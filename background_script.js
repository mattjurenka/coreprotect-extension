const SIMULATE_URL = "https://coreprotect-workers.matthewjurenka.workers.dev/simulate/"
const get_contract_data_endpoint = "https://coreprotect-workers.matthewjurenka.workers.dev/get_contract_data/"

const contract_data_map = {}

const { low, medium, high } = { low: "Low", medium: "Medium", high: "High"}

let state_diff = {}
let call_trace = []
let contracts_touched = new Set()

let popup_port = null
let last_requested_content_port = null
let loading = false

chrome.runtime.onConnect.addListener(port => {
  try {
    console.log("Registering port", port)
    if (port.sender.url === chrome.runtime.getURL("popup/app.html")) {
      port.onMessage.addListener(m => {
        console.log("Background Script receiving message of type", m.msg_type, "from popup", m)
        if (m.msg_type === "register_popup_port") {
          try {
            if (popup_port) {
              popup_port.postMessage({
                msg_type: "close_window"
              })
            }
          } catch (err) {}
          popup_port = port
          popup_port.postMessage({
            msg_type: "update_transfers",
            state_diff, call_trace,
            contracts_touched: Array.from(contracts_touched),
            contract_data_map, loading
          })
        } else if (m.msg_type === "respond_to_approve_request") {
          last_requested_content_port.postMessage({
            msg_type: "respond_to_approve_request", status: m.status
          })
        } else if (m.msg_type === "open_tab") {
          chrome.tabs.create({url: m.url})
        }
      })
    } else {
      port.onMessage.addListener(async m => {
        console.log("Background Script receiving message of type", m.msg_type, "from page", m)
        if (m.msg_type === "simulate_transaction") {
          loading = true
          last_requested_content_port = port

          const url = chrome.runtime.getURL("popup/app.html")
          chrome.windows.create({
            url, type: "popup", height: 620, width: 468
          })

          await simulate_transaction(m.from, m.to, m.input, m.value)
          await update_contract_data_map(Array.from(contracts_touched))
          loading = false
          popup_port.postMessage({
            msg_type: "update_transfers",
            state_diff,
            call_trace,
            contracts_touched: Array.from(contracts_touched),
            contract_data_map,
            loading
          })
        }
      })
    }
  } catch (err) {
    console.error(err)
  }
});

const simulate_transaction = async (from, to, input, value) => {
  try {
    const res = await fetch(SIMULATE_URL, {
      method: "POST",
      body: JSON.stringify({
        "gas": 8000000,
        "gas_price": "0",
        "value": value || "0",
        from, to, input,
      })
    })
    const json = await res.json()

    state_diff = json.transaction.transaction_info.state_diff
      .reduce((acc, cur) => {
        const address = cur.raw[0].address
        const original = cur.raw[0].original
        const dirty = cur.raw[0].dirty
        const key = cur.raw[0].key
        if (address in acc) {
          acc[address].push([key, original, dirty])
        } else {
          acc[address] = [[key, original, dirty]]
        }
        return acc
      }, {})
    
    const returned_trace = json.transaction.transaction_info.call_trace;
    contracts_touched = new Set()
    const recurse_trace = (call) => {
      contracts_touched.add(call.to)
      return [{
          from: call.from, to: call.to, value: call.value, input: call.input
        },
        ...(call.calls ? call.calls.map(recurse_trace) : [])
      ]
    }
    call_trace = recurse_trace(returned_trace)
  } catch (err) {
    console.error(err)
  }
}

const update_contract_data_map = async (contracts) => {
  return fetch(get_contract_data_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({contracts})
  }).then(async resp => {
    const json = await resp.json()
    Object.assign(
      contract_data_map,
      Object.fromEntries(Object.entries(json).map(([address, val]) => [
        address,
        { 
          "selectors": Object.fromEntries(val.data.metadata.etherscan_contract_source?.selectors
            ?.map(({ function_signature, selector }) => [selector, function_signature]) || []),
          "contract_name": val.data.metadata.etherscan_contract_source?.name,
          "bigcs_score": val.data.metadata.bigcs_data?.score,
          "flags": (val.data.metadata.bigcs_data?.flags
            ?.map(flag => flag.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "))),
          "etherscan_nft_data": val.data.metadata.etherscan_nft_data
        }
      ]))
    )
  }).catch(console.error)
}
