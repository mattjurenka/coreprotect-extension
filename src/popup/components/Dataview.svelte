<script>
  import Seperator from "./Seperator.svelte";

  import Effects from "./effects/Effects.svelte";
  import Reputation from "./Reputation.svelte"
  import CallTrace from "./CallTrace.svelte";
  import Statediff from "./Statediff.svelte";

  import { call_trace, current_tab, loading, error, tabs } from "../stores";
  import { open_discord } from "../actions";

  const set_tab = new_tab => () => {
    current_tab.set(new_tab)
  }
</script>

<div class="grow min-h-0 flex flex-col">
  {#if $error !== ""}
    <div class="h-full w-full">
      <div class="text-center mt-[33%]">
        <p class="text-base font-bold font-jetbrains">{$error}</p>
        <p class="text-base font-jetbrains mt-4">For technical support, join the
          <a
            class="font-jetbrains text-base text-blue underline decoration-2 underline-offset-2 mb-2" href="#"
            on:click={open_discord}
          >
            Discord
          </a>
        </p>
      </div>
    </div>
  {:else if $loading}
    <div class="h-full w-full flex flex-col items-center justify-center">
      <p class="text-base font-jetbrains">Running Analytics...</p>
    </div>
  {:else if $call_trace.length > 0}
    <div class="flex gap-4">
      {#each $tabs as tab}
        <div class="py-2">
          <button on:click={set_tab(tab)}>
            <p 
              class="text-base text-blue font-jetbrains font-bold decoration-2 underline-offset-2"
              class:underline={$current_tab == tab}
            >
              {tab}
            </p>
          </button>
        </div>
      {/each}
    </div>
    <Seperator />
    <div
      class="min-h-[20rem] overflow-y-scroll grow min-h-0 {['Execution'].includes($current_tab) ? 'overflow-x-scroll' : 'overflow-x-hidden'}"
    >
      {#if $current_tab == "Transfers"}
        <Effects />
      {:else if $current_tab == "Contracts"}
        <Reputation />
      {:else if $current_tab == "Execution"}
        <CallTrace />
      {:else if $current_tab == "State"}
        <Statediff />
      {/if}
    </div>
  {:else}
    <p class="mt-16 text-center text-base font-jetbrains">No Transaction Received.</p>
    <div class="mt-4 text-justify text-paragraph font-jetbrains">
      Ensure you are logged into your wallet and transactions will appear here
      for review before they are forwarded to your wallet and then to the network.
    </div>
    <div class="mt-4 text-justify text-paragraph font-jetbrains">
      At the moment we only support Metamask and Rabby, although other evm wallets are likely to work.
    </div>
  {/if}
</div>
