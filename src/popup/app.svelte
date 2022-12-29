<script>
  import Actions from "./components/Actions.svelte";
  import Dataview from "./components/Dataview.svelte";
  import Seperator from "./components/Seperator.svelte";
  import { resolved, window_type, accepted_tos } from "./stores"
  import TermsOfService from "./TermsOfService.svelte";
</script>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&family=Vollkorn&display=swap');
</style>


<div class="min-w-[28rem] p-4 {window_type === 'popup' ? 'h-[36rem] max-w-[28rem]' : 'h-full'}">
  {#if $accepted_tos}
    <div class="p-4 h-full border-2 border-blue flex flex-col">
      <h1 class="font-vollkorn text-xl text-blue mb-4 [word-spacing:0.25rem]">Review Transaction</h1>
      <Seperator />
      <Dataview />
      {#if !$resolved}
        <Seperator />
        <p class="font-jetbrains text-base mt-4">Continue with this transaction?</p>
        <Actions />
      {/if}
    </div>
  {:else}
    <TermsOfService />
  {/if}
</div>

