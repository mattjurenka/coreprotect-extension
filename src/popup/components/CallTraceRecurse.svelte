<script>
  import { contract_data_map } from "../stores"
import Etherscanlink from "./etherscanlink.svelte";

  export let call_trace;

  $: contract_data = $contract_data_map[call_trace[0]?.to]
  $: display = ((data) => {
    if (call_trace[0] === undefined) {
      return [2]
    }
    if (data === undefined) {
      return [1, call_trace[0].from, call_trace[0].to]
    }
    const selector = call_trace[0]?.input?.slice(2, 10)
    if (selector !== undefined && data.selectors[selector] !== undefined) {
      const name = data.selectors[selector].split("(")[0]
      return [0, name, call_trace[0].to]
    }
    return [3, call_trace[0].to]
  })(contract_data)
</script>

<div>
  <p class="font-jetbrains text-base whitespace-nowrap mb-1">
    {#if display[0] === 0}
      {display[1]} @ <Etherscanlink contract_hex={display[2]}/>
    {:else if display[0] === 1}
      <Etherscanlink contract_hex={display[1]}/> -> <Etherscanlink contract_hex={display[2]}/>
    {:else if display[0] === 2}
      Unknown Contract Call
    {:else}
      Unknown <Etherscanlink contract_hex={display[1]} /> Internal Call
    {/if}
  </p>
  {#if call_trace.length > 1}
    <div class="ml-[0.6rem]">
      {#each call_trace.slice(1) as subcall}
        <svelte:self call_trace={subcall}/>
      {/each}
    </div>
  {/if}
</div>
