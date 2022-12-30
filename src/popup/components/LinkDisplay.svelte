<script>
  import { clamp_str_to } from "../utils";
  import browser from "webextension-polyfill";

  export let to_display;

  const open_link = () => browser.runtime.sendMessage({msg_type: "open_tab", url: to_display})
  
  $: readable = clamp_str_to(25)((to_display || "").replace(/https?:\/\/(www.)?/, ""))
</script>

<a
  class="text-base font-jetbrains underline decoration-2 underline-offset-2 font-blue"
  href="#"
  on:click={open_link}
>
  {readable}
</a>
