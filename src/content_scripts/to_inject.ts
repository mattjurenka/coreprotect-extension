let approval = "requested"
window.addEventListener("message", event => {
  if (event?.data?.msg_type === "respond_to_request") {
    approval = event.data.approval
  }
})

let times_checked = 0
const intervalId = setInterval(() => {
  if ((window as any).ethereum?.request) {
    const old_request = (window as any).ethereum.request;
    ((window as any).ethereum.request as any) = (requestArgs: any) => {
      if (requestArgs.method === "eth_sendTransaction") {
        const { from, to, value, data } = requestArgs.params[0]
        window.postMessage({msg_type: "simulate_transaction", from, to, value, input: data})
        return new Promise((resolve, reject) => {
          const check_approval_id = setInterval(() => {
            if (approval !== "requested") {
              clearInterval(check_approval_id);
              if (approval === "approved") {
                approval = "requested"
                resolve(undefined)
              } else {
                approval = "requested"
                reject({
                  code: 4001,
                  message: "Rejected by Core Protect"
                })
              }
            }
          }, 25)
        }).then(() => old_request(requestArgs))
      } else {
        return old_request(requestArgs)
      }
    }
    clearInterval(intervalId)
  } else {
    times_checked += 1
    if (times_checked > 100) {
      console.warn("Core Protect could not detect MetaMask.")
      clearInterval(intervalId)
    }
  }
}, 10)
