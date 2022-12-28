<script>
  import { SvelteComponent } from "svelte/internal";

  import { effects } from "../../stores";
  import Transfer from "./erc20/Transfer.svelte";
  import Approve from "./erc20/Approve.svelte";
  import TransferFrom from "./erc20/TransferFrom.svelte";
  import IncreaseAllowance from "./erc20/IncreaseAllowance.svelte";
  import DecreaseAllowance from "./erc20/DecreaseAllowance.svelte";
  import BurnFrom from "./erc20/BurnFrom.svelte";
  import Mint from "./erc20/Mint.svelte";
  import Burn from "./erc20/Burn.svelte";

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

<div class="pt-4 pr-4">
  {#each $effects as [caller, contract, schema_name, fn_sig, args]}
    <div class="mb-4">
      <svelte:component this={effects_by_fn_sig[schema_name][fn_sig] || SvelteComponent} caller={caller} contract={contract} args={args} />
    </div>
  {/each}
</div>
<p class="text-darkgrey text-small font-jetbrains">
  Note that this list is not exhaustive. Check the Execution tab for a full analysis.
</p>
