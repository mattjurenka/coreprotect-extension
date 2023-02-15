import { Command, RequestStatusType, SimulateTransactionCMD } from "../types"

let approval: RequestStatusType = "requested"
window.addEventListener("message", (event) => {
  const cmd: Command | undefined = event?.data
  if (cmd?.msg_type === "respond_to_approve_request") {
    approval = cmd.data.status
  }
})

let times_checked = 0
const intervalId = setInterval(() => {
  if ((window as any).ethereum?.request) {
    const old_request = (window as any).ethereum.request;
    const new_request =(requestArgs: any) => {
      //console.log(requestArgs)
      const network_id: string = (window as any).ethereum.networkVersion
      if (requestArgs.method === "eth_sendTransaction" && ["1", "56"].includes(network_id)) {
        const { from, to, value, data } = requestArgs.params[0]

        window.postMessage({
          msg_type: "simulate_transaction",
          data: {
            from, to, value, input: data, network_id
          }
        } as SimulateTransactionCMD)

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

    //if setting window.ethereum.request fails its probably a proxy
    try {
      ((window as any).ethereum.request as any) = new_request
    } catch (e) {
      console.log((window as any).ethereum);
      (window as any).ethereum = new Proxy((window as any).ethereum, {
        get: (target, prop, receiver) => {
          console.log(target, prop, receiver)
          return prop === "request" ?
            new_request : Reflect.get(target, prop, receiver)
        }
      })
    }

    clearInterval(intervalId)
  } else {
    times_checked += 1
    if (times_checked > 1000) {
      console.warn("Core Protect could not detect MetaMask.")
      clearInterval(intervalId)
    }
  }
}, 1)
