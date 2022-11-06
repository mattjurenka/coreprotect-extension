let port = browser.runtime.connect({name:"extension@matthewjurenka.com"});

let is_waiting_for_approval = "requested"

port.onMessage.addListener(m => {
  console.log("Content Script receiving message of type", m.msg_type, "from Background Script", m)
  if (m.msg_type === "respond_to_approve_request") {
    is_waiting_for_approval = m.status
  }
})

const simulate = (from, to, input, value) => new Promise((resolve, reject) => {
  is_waiting_for_approval = "requested"
  exportFunction(() => is_waiting_for_approval, window, {defineAs: "coreprotect_approval"})

  port.postMessage({
    msg_type: "simulate_transaction", from, to, input, value
  })
  const approvalId = setInterval(() => {
    if (is_waiting_for_approval === "approved") {
      clearInterval(approvalId)
      resolve()
    } else if (is_waiting_for_approval === "rejected" || is_waiting_for_approval === "reported") {
      clearInterval(approvalId)
      reject()
    }
  }, 25)
}).then(_ => exportFunction(() => is_waiting_for_approval, window, {defineAs: "coreprotect_approval"}))

exportFunction(() => is_waiting_for_approval, window, {defineAs: "coreprotect_approval"})
exportFunction(simulate, window, {defineAs: "coreprotect_eth_simulate"})

const actualCode = `
let times_checked = 0
const intervalId = setInterval(() => {
  if (window.ethereum) {
    window.ethereum = new Proxy(window.ethereum, {
      get: (target, prop, receiver) => {
        if (prop === "request") {
          return (requestArgs) => {
            if (requestArgs.method === "eth_sendTransaction") {
              const { from, to, value, data } = requestArgs.params[0]
              window.coreprotect_eth_simulate(from, to, data, value)
              return new Promise((resolve, reject) => {
                const check_approval_id = setInterval(() => {
                  const approval = coreprotect_approval()
                  if (approval !== "requested") {
                    clearInterval(check_approval_id);
                    (approval === "approved" ? resolve : reject)(approval)
                  }
                }, 25)
              }).then(() => target.request(requestArgs))
            } else {
              return target.request(requestArgs)
            }
          }
        } else {
          return Reflect.get(target, prop, receiver)
        }
      }
    })
    clearInterval(intervalId)
  } else {
    times_checked += 1
    if (times_checked > 10) {
      console.warn("Core Protect could not detect MetaMask.")
      clearInterval(intervalId)
    }
  }
}, 50)
`

var s = document.createElement('script');
s.textContent = actualCode;
(document.head || document.documentElement).appendChild(s);
//s.remove();
