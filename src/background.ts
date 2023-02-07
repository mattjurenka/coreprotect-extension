import { enablePatches } from "immer";
import browser from "webextension-polyfill"
import { $commands } from "./stores";
import { Command } from "./types"

enablePatches()

browser.runtime.onMessage.addListener(async (m: Command, sender) => {
  console.log("Background Script receiving message", m, "from popup", sender);
  const { msg_type, data } = m
  try {
    if (msg_type === "handle_open_popup") {
      $commands.next({ msg_type: "update_global_state", data: { recipe: () => {} }})
      $commands.next({
        msg_type: "close_window",
        data: { keep_open: data.opened_type }
      })
    } else if (msg_type === "respond_to_approve_request") {
      $commands.next(m)
      $commands.next({ msg_type: "close_window", data: { keep_open: "none" } })
    } else if (m.msg_type === "open_tab") {
      $commands.next(m)
    } else if (m.msg_type === "simulate_transaction") {
      $commands.next(m)
    }
  } catch (err) {
    console.log(err)
  }
})

