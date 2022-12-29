<script>
  import { SvelteComponent } from "svelte/internal";

  import { effects, eth_transfers, your_address } from "../../stores";
  import Transfer from "./erc20/Transfer.svelte";
  import Approve from "./erc20/Approve.svelte";
  import TransferFrom from "./erc20/TransferFrom.svelte";
  import IncreaseAllowance from "./erc20/IncreaseAllowance.svelte";
  import DecreaseAllowance from "./erc20/DecreaseAllowance.svelte";
  import BurnFrom from "./erc20/BurnFrom.svelte";
  import Mint from "./erc20/Mint.svelte";
  import Burn from "./erc20/Burn.svelte";
import Eth from "./Eth.svelte";

  const effects_by_fn_sig = {
    "ERC20": {
      "transfer(address,uint256)": Transfer,
      "approve(address,uint256)": Approve,
      "transferFrom(address,uint256)": TransferFrom,
      "increaseAllowance(address,uint256)": IncreaseAllowance,
      "decreaseAllowance(address,uint256)": DecreaseAllowance,
      "mint(address,uint256)": Mint,
      "burn(uint256)": Burn,
      "burnFrom(address,uint256)": BurnFrom,
    }, 
    "ERC721": {},
    "ERC1155": {},
  }
</script>

<div class="pt-2 pr-4">
  {#each $effects as [caller, contract, schema_name, fn_sig, args]}
    {@const comp = effects_by_fn_sig?.[schema_name]?.[fn_sig] || SvelteComponent}
    {#if comp}
      <div class="mb-4">
        <svelte:component this={comp} caller={caller} contract={contract} args={args} />
      </div>
    {/if}
  {/each}
  {#each $eth_transfers as {from, to, value}}
    <div class="mb-4">
      <Eth from={from} to={to} amount={value} />
    </div>
  {/each}
</div>
<p class="text-darkgrey text-small font-jetbrains mb-4">
  Note that this list is not exhaustive. Check the Execution tab for a full analysis.
</p>
