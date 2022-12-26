<script>
  import Seperator from "./Seperator.svelte";
  import VerticalSeperator from "./VerticalSeperator.svelte";

  import Effects from "./effects/Effects.svelte";
  import Reputation from "./Reputation.svelte"
  import CallTrace from "./CallTrace.svelte";
  import Statediff from "./Statediff.svelte";

  import { window_type } from "../stores";

  const tabs = ["Effects", "Contracts", "Execution", "State"]

  let current_tab = tabs[0]
  const set_tab = new_tab => () => {
    current_tab = new_tab
  }

</script>

<div class="grow min-h-0 flex flex-col">
  <Seperator />
  <div class="flex {window_type === 'floating' ? 'justify-evenly' : 'justify-between'} py-2">
    {#each tabs as tab, i}
      <button on:click={set_tab(tab)}>
        <p 
          class="text-base text-blue font-jetbrains font-bold decoration-2"
          class:underline={current_tab == tab}
        >
          {tab}
        </p>
      </button>
      {#if i !== tabs.length - 1}
        <VerticalSeperator />
      {/if}
    {/each}
  </div>
  <Seperator />
  <div
    class="min-h-[20rem] overflow-y-scroll grow min-h-0"
    class:overflow-x-scroll={current_tab === "Execution"}
  >
    {#if current_tab == "Effects"}
      <Effects />
    {:else if current_tab == "Contracts"}
      <Reputation />
    {:else if current_tab == "Execution"}
      <CallTrace />
    {:else if current_tab == "State"}
      <Statediff />
    {/if}
  </div>
</div>
