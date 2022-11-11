let approval = "requested"
window.addEventListener("message", event => {
  if (event?.data?.msg_type === "respond_to_request") {
    approval = event.data.approval
  }
})

let times_checked = 0
const intervalId = setInterval(() => {
  if (window.ethereum) {
    window.ethereum = new Proxy(window.ethereum, {
      get: (target, prop, receiver) => {
        if (prop === "request") {
          return (requestArgs) => {
            if (requestArgs.method === "eth_sendTransaction") {
              const { from, to, value, data } = requestArgs.params[0]
              window.postMessage({msg_type: "simulate_transaction", from, to, value, input: data})
              return new Promise((resolve, reject) => {
                const check_approval_id = setInterval(() => {
                  if (approval !== "requested") {
                    clearInterval(check_approval_id);
                    if (approval === "approved") {
                      approval = "requested"
                      resolve()
                    } else {
                      approval = "requested"
                      reject({
                        code: 4001,
                        message: "Rejected by Core Protect"
                      })
                    }
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
}, 100)
