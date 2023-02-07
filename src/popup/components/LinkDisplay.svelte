<script>
  import { open_link } from "../actions";
  import { clamp_str_to } from "../utils";

  export let to_display;
  
  $: readable = clamp_str_to(25)((to_display || "").replace(/https?:\/\/(www.)?/, ""))
</script>

<a
  class="text-base font-jetbrains underline decoration-2 underline-offset-2 font-blue"
  href="#"
  on:click={() => open_link(to_display)}
  title={to_display}
>
  {readable}
</a>
