import browser from "webextension-polyfill"
import { Command, SimulateTransactionCMD } from "../types"

browser.runtime.onMessage.addListener((cmd: Command) => {
  const { msg_type } = cmd

  console.log("Content Script receiving message of type", msg_type, "from Background Script", cmd)
  if (msg_type === "respond_to_approve_request") {
    window.postMessage(cmd)
  }
})

window.addEventListener("message", event => {
  if (event?.data?.msg_type === "simulate_transaction") {
    const cmd: SimulateTransactionCMD = event?.data
    browser.runtime.sendMessage(cmd).catch(console.log)
  }
})

var s = document.createElement('script');
s.src = browser.runtime.getURL('content_scripts/to_inject.js');
s.onload = function() {
    (this as any).remove();
};
(document.head || document.documentElement).appendChild(s);
