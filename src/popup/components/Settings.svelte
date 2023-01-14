<script>
  import HelpIcon from "./icons/HelpIcon.svelte";
  import { advanced_tabs, set_advanced_tabs, external_transfers, set_external_transfers, outdated_cache } from "../stores";
  import { open_update_page } from "../actions";

  let advanced_help_open = false
  const toggle_advanced_help = () => {
    advanced_help_open = !advanced_help_open
  }

  let external_help_open = false
  const toggle_external_help = () => {
    external_help_open = !external_help_open
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex items-center gap-2">
    <input type="checkbox" checked={$advanced_tabs} on:change={e => set_advanced_tabs(e.target?.checked)} />
    <p class="font-jetbrains text-base">Show Advanced Tabs</p>
    <button class="cursor-pointer bg-lightgrey hover:bg-grey rounded-full flex gap-2 p-1 pl-2 border border-grey ml-auto text-darkgrey" on:click={toggle_advanced_help}>
      <p class="text-base font-jetbrains">Help</p>
      <HelpIcon />
    </button>
  </div>
  {#if advanced_help_open}
    <div class="p-2 bg-lightgrey">
      <p class="font-jetbrains text-paragraph">
        Enable view of memory and contract execution.
      </p>
    </div>
  {/if}
  <div class="flex items-center gap-2">
    <input type="checkbox" checked={$external_transfers} on:change={e => set_external_transfers(e.target?.checked)} />
    <p class="font-jetbrains text-base">Show External Transfers</p>
    <button class="cursor-pointer bg-lightgrey hover:bg-grey rounded-full flex gap-2 p-1 pl-2 border border-grey ml-auto text-darkgrey" on:click={toggle_external_help}>
      <p class="text-base font-jetbrains">Help</p>
      <HelpIcon />
    </button>
  </div>
  {#if external_help_open}
    <div class="p-2 bg-lightgrey">
      <p class="font-jetbrains text-paragraph">
        Show transfers that do not involve your wallet.
      </p>
    </div>
  {/if}
  {#if $outdated_cache[0]}
    <a
      class="font-jetbrains text-base text-blue underline decoration-2 underline-offset-2 mb-2" href="#"
      on:click={open_update_page}
    >
      New Version Released, Update Now
    </a>
  {/if}
</div>
