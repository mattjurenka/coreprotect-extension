<script>
  import { contract_data_map, chain } from "../stores"
  import Chevron from "./Chevron.svelte";
  import Etherscanlink from "./etherscanlink.svelte";

  export let call_trace;

  let expanded = false
  const toggle_expanded = () => {
    expanded = !expanded
  }

  $: contract_data = $contract_data_map[$chain][call_trace[0]?.to]
  $: display = ((data) => {
    if (call_trace[0] === undefined) {
      return [2]
    }
    if (data === undefined) {
      return [1, call_trace[0].from, call_trace[0].to, call_trace[0]?.input]
    }
    const selector = call_trace[0]?.input?.slice(2, 10)
    if (selector !== undefined && data.selectors[selector] !== undefined) {
      const name = data.selectors[selector].split("(")[0]
      return [0, name, call_trace[0].to, call_trace[0]?.input]
    }
    return [3, call_trace[0].to]
  })(contract_data)
</script>

<div>
  <div class="flex">
    {#if display[0] === 0}
      <p class="font-jetbrains text-base whitespace-nowrap mb-1">
        {display[1]} @ <Etherscanlink contract_hex={display[2]}/>
      </p>
      <div on:click={toggle_expanded}>
        <Chevron expanded={expanded}/>
      </div>
    {:else if display[0] === 1}
      <p class="font-jetbrains text-base whitespace-nowrap mb-1">
        <Etherscanlink contract_hex={display[1]}/> -> <Etherscanlink contract_hex={display[2]}/>
      </p>
      <div on:click={toggle_expanded}>
        <Chevron expanded={expanded}/>
      </div>
    {:else if display[0] === 2}
      <p class="font-jetbrains text-base whitespace-nowrap mb-1">
        Unknown Contract Call
      </p>
    {:else}
      <p class="font-jetbrains text-base whitespace-nowrap mb-1">
        Unknown <Etherscanlink contract_hex={display[1]} /> Internal Call
      </p>
    {/if}
  </div>
  {#if display[3]}
    <div class="my-1 {expanded ? '' : 'hidden'}">
      <div class="p-2 bg-lightgrey min-w-[32rem] max-w-[32rem]">
        <p class="font-jetbrains text-base mb-1">Input Hex</p>
        <p class="font-jetbrains text-base break-all">{display[3]}</p>
      </div>
    </div>
  {/if}
  {#if call_trace.length > 1}
    <div class="ml-[0.6rem]">
      {#each call_trace.slice(1) as subcall}
        <svelte:self call_trace={subcall}/>
      {/each}
    </div>
  {/if}
</div>
