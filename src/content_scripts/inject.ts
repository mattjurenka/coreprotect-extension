chrome.runtime.onMessage.addListener(m => {
  console.log("Content Script receiving message of type", m.msg_type, "from Background Script", m)
  if (m.msg_type === "respond_to_approve_request") {
    window.postMessage({
      msg_type: "respond_to_request",
      approval: m.status
    })
  }
})

window.addEventListener("message", event => {
  if (event?.data?.msg_type === "simulate_transaction") {
    chrome.runtime.sendMessage(event.data).catch(console.log)
  }
})

var s = document.createElement('script');
s.src = chrome.runtime.getURL('content_scripts/to_inject.js');
s.onload = function() {
    (this as any).remove();
};
(document.head || document.documentElement).appendChild(s);
