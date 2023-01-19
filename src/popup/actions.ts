import browser from "webextension-polyfill";
import { BROWSER } from "./stores";

export const accept_and_continue = () => browser.runtime.sendMessage({
  msg_type: "respond_to_approve_request",
  status: "approved"
})

export const reject_and_continue = () => browser.runtime.sendMessage({
  msg_type: "respond_to_approve_request",
  status: "rejected"
})

export const report_and_continue = () => {
  browser.runtime.sendMessage({
    msg_type: "open_tab",
    url: "https://forms.gle/Csc2hc7xJdg6au5KA"
  })
  browser.runtime.sendMessage({
    msg_type: "respond_to_approve_request",
    status: "reported"
  })
}

export const open_update_page = () => {
  browser.runtime.sendMessage({
    msg_type: "open_tab",
    url: BROWSER === "chrome" ?
      "https://chrome.google.com/webstore/detail/core-protect/gomldkkfnllkkgpbidoejphhmhmfnjge" :
      "https://addons.mozilla.org/en-US/firefox/addon/core-protect/"
  })
}

export const open_link = (url: string) => {
  browser.runtime.sendMessage({
    msg_type: "open_tab", url
  })
}
