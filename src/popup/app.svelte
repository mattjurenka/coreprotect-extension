<script>
  import Actions from "./components/Actions.svelte";
  import Dataview from "./components/Dataview.svelte";
  import Close from "./components/icons/Close.svelte";
  import SettingsIcon from "./components/icons/Settings.svelte";
  import Settings from "./components/Settings.svelte";
  import Seperator from "./components/Seperator.svelte";
  import { resolved, loading, window_type, accepted_tos, outdated_cache, set_outdated_cache } from "./stores"
  import TermsOfService from "./TermsOfService.svelte";
  import { is_outdated } from "./utils";

  let settings_open = false
  const toggle_settings = () => {
    settings_open = !settings_open
  }

  $: {
    const [_, last_checked] = $outdated_cache
    if ((Date.now() - last_checked) > 1000 * 60 * 60 * 0) {
      is_outdated().then(outdated => {
        set_outdated_cache([outdated, Date.now()])
      })
    }
  }
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
      {#if settings_open}
        <div class="flex">
          <h1 class="font-vollkorn text-xl text-blue mb-4 [word-spacing:0.25rem]">Settings</h1>
          <div class="ml-auto">
            <button class="cursor-pointer" on:click={toggle_settings}>
              <Close />
            </button>
          </div>
        </div>
        <Settings />
      {:else}
        <div class="flex">
          <h1 class="font-vollkorn text-xl text-blue mb-4 [word-spacing:0.25rem]">Review Transaction</h1>
          <div class="ml-auto text-right">
            <button class="cursor-pointer" on:click={toggle_settings}>
              <SettingsIcon has_notification={$outdated_cache[0]} />
            </button>
          </div>
        </div>
        <Seperator />
        <Dataview />
        {#if !$resolved && !$loading}
          <Seperator />
          <p class="font-jetbrains text-base mt-4">Continue with this transaction?</p>
          <Actions />
        {/if}
      {/if}
    </div>
  {:else}
    <TermsOfService />
  {/if}
</div>

