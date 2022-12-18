<script>
  import { state_diff } from "../stores"
  import { clamp_hex, format_wei } from "../utils";
  import Etherscanlink from "./etherscanlink.svelte";
</script>

<div class="pt-2 pr-4">
  {#each Object.keys($state_diff) as contract}
    <div class="mb-1 mt-2">
      <Etherscanlink contract_hex={contract} />
    </div>
    {#each $state_diff[contract] as item}
      <div class="grid grid-cols-2 mb-2 gap-y-1">
        {#if item[0] === "memory"}
          <p class="text-base font-jetbrains">Memory @</p>
          <p class="text-base font-jetbrains text-right" title={item[1]}>{clamp_hex(item[1])}</p>
          <p class="text-base font-jetbrains">Was</p>
          <p class="text-base font-jetbrains text-right" title={item[2]}>{clamp_hex(item[2])}</p>
          <p class="text-base font-jetbrains">Will Be</p>
          <p class="text-base font-jetbrains text-right" title={item[3]}>{clamp_hex(item[3])}</p>
        {:else if item[0] === "balance"}
          <p class="text-base font-jetbrains">Eth Balance Was</p>
          <p class="text-base font-jetbrains text-right" title={`${item[1]} Wei`}>{format_wei(item[1])}</p>
          <p class="text-base font-jetbrains">Balance Changed By</p>
          <p
            class="text-base font-jetbrains text-right"
            title={`${(BigInt(item[2]) - BigInt(item[1])).toString()} Wei`}
          >
            {format_wei((BigInt(item[2]) - BigInt(item[1])).toString())}
          </p>
          <p class="text-base font-jetbrains">Will Be</p>
          <p class="text-base font-jetbrains text-right" title={`${item[2]} Wei`}>{format_wei(item[2])}</p>
        {/if}
      </div>
    {/each}
  {/each}
</div>
