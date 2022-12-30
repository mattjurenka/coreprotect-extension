import browser from "webextension-polyfill";

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
