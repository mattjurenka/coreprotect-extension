<script>
  import { SvelteComponent } from "svelte/internal";

  import { effects } from "../../stores";
  import Transfer from "./erc20/Transfer.svelte";
  import Approve from "./erc20/Approve.svelte";
  import TransferFrom from "./erc20/TransferFrom.svelte";

  const effects_by_fn_sig = {
    "ERC20": {
      "transfer(address,uint256)": Transfer,
      "approve(address,uint256)": Approve,
      "transferFrom(address,uint256)": TransferFrom,
      "increaseAllowance(address,uint256)": Transfer,
      "decreaseAllowance(address,uint256)": Transfer,
      "mint(address,uint256)": Transfer,
      "burn(uint256)": Transfer,
      "burnFrom(address,uint256)": Transfer,
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
