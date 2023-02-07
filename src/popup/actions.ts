import browser from "webextension-polyfill";
import { OpenTabCMD, RespondToApproveRequestCMD } from "../types";
import { BROWSER } from "./stores";

export const accept_and_continue = () => browser.runtime.sendMessage({
  msg_type: "respond_to_approve_request",
  data: { status: "approved" }
} as RespondToApproveRequestCMD)

export const reject_and_continue = () => browser.runtime.sendMessage({
  msg_type: "respond_to_approve_request",
  data: { status: "rejected" }
} as RespondToApproveRequestCMD)

export const report_and_continue = () => {
  browser.runtime.sendMessage({
    msg_type: "open_tab",
    data: { url: "https://forms.gle/Csc2hc7xJdg6au5KA" }
  } as OpenTabCMD)
  browser.runtime.sendMessage({
    msg_type: "respond_to_approve_request",
    data: { status: "rejected" }
  } as RespondToApproveRequestCMD)
}

export const open_update_page = () => {
  browser.runtime.sendMessage({
    msg_type: "open_tab",
    data: { url: BROWSER === "chrome" ?
      "https://chrome.google.com/webstore/detail/core-protect/gomldkkfnllkkgpbidoejphhmhmfnjge" :
      "https://addons.mozilla.org/en-US/firefox/addon/core-protect/" }
  } as OpenTabCMD)
}

export const open_discord = () => browser.runtime.sendMessage({
    msg_type: "open_tab",
    data: { url: "https://discord.com/invite/jrqE3NtkdP" }
  } as OpenTabCMD)

export const open_link = (url: string) => {
  browser.runtime.sendMessage({
    msg_type: "open_tab", data: { url }
  } as OpenTabCMD)
  console.log("sending", {
    msg_type: "open_tab", data: { url }
  } as OpenTabCMD)
}
