const SIMULATE_URL = "https://coreprotect-workers.matthewjurenka.workers.dev/simulate/"
const get_selectors_endpoint = "https://coreprotect-workers.matthewjurenka.workers.dev/get_contract_data/"

const selectors_map = {}

const { low, medium, high } = { low: "Low", medium: "Medium", high: "High"}

const scam_prob_map = {
  "0xace8a2d0f41702161d8363eddae981e844c35c6e": low,
  "0xb8901acb165ed027e32754e0ffe830802919727f": low,
  "0xdec8005ca1a3f90168c211406fefafa412467d81": high,
  "0xfe5e5d361b2ad62c541bab87c45a0b9b018389a2": medium,
  "0x28e4f3a7f651294b9564800b2d01f35189a5bfbe": low,
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": low,
  "0x6b175474e89094c44da98b954eedeac495271d0f": low,
  "0x60594a405d53811d3bc4766596efd80fd545a270": low,
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": low,
  "0x701e475c3e579c037d50552557f30b4be744d279": low,
}

let state_diff = {}
let call_trace = []
let contracts_touched = new Set()

let popup_port = null
let last_requested_content_port = null

browser.runtime.onConnect.addListener(port => {
  try {
    console.log("Registering port", port)
    if (port.sender.envType === "addon_child") {
      port.onMessage.addListener(m => {
        console.log("Background Script receiving message of type", m.msg_type, "from popup", m)
        if (m.msg_type === "register_popup_port") {
          console.log("Opening", port?.sender?.contextId)
          console.log("Sending close message to", popup_port?.sender?.contextId)
          try {
            if (popup_port) {
              popup_port.postMessage({
                msg_type: "close_window"
              })
            }
          } catch (err) {}
          //console.log(popup_port, port)
          popup_port = port
          //console.log(popup_port, port)
          popup_port.postMessage({
            msg_type: "update_transfers",
            state_diff, call_trace, contracts_touched, selectors_map, scam_prob_map
          })
        } else if (m.msg_type === "respond_to_approve_request") {
          last_requested_content_port.postMessage({
            msg_type: "respond_to_approve_request", status: m.status
          })
        } else if (m.msg_type === "open_tab") {
          browser.tabs.create({url: m.url})
        }
      })
    } else {
      port.onMessage.addListener(async m => {
        console.log("Background Script receiving message of type", m.msg_type, "from page", m)
        if (m.msg_type === "simulate_transaction") {
          last_requested_content_port = port

          await simulate_transaction(m.from, m.to, m.input, m.value)
          await update_selectors_map(Array.from(contracts_touched))
          port.postMessage({
            msg_type: "update_transfers",
            state_diff,
            call_trace,
            contracts_touched,
            selectors_map, scam_prob_map
          })
          const url = browser.extension.getURL("popup/app.html")
          browser.windows.create({
            url, type: "popup", height: 580, width: 452
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
    console.log("tenderly response:", json)

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

const update_selectors_map = async (contracts) => {
  return fetch(get_selectors_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({contracts})
  }).then(async resp => {
    const json = await resp.json()
    console.log(selectors_map, json)
    Object.assign(
      selectors_map,
      Object.fromEntries(Object.entries(json).map(([address, val]) => [
        address,
        Object.fromEntries(val.data.metadata.etherscan_contract_source.selectors.map(({ function_signature, selector }) => [selector, function_signature]))
      ]))
    )
    console.log(selectors_map)
  }).catch(console.error)
}
