<script>
  import { SvelteComponent } from "svelte/internal";

  import { effects, eth_transfers, your_address, external_transfers } from "../../stores";
  import Transfer from "./erc20/Transfer.svelte";
  import Approve from "./erc20/Approve.svelte";
  import TransferFrom from "./erc20/TransferFrom.svelte";
  import IncreaseAllowance from "./erc20/IncreaseAllowance.svelte";
  import DecreaseAllowance from "./erc20/DecreaseAllowance.svelte";
  import BurnFrom from "./erc20/BurnFrom.svelte";
  import Mint from "./erc20/Mint.svelte";
  import Burn from "./erc20/Burn.svelte";
  import Eth from "./Eth.svelte";
  import BaseEffect from "./BaseEffect.svelte";

  const effect_help_by_fn_sig = {
    "ERC20": {
      "transfer(address,uint256)": Transfer,
      "approve(address,uint256)": Approve,
      "transferFrom(address,address,uint256)": TransferFrom,
      "increaseAllowance(address,uint256)": IncreaseAllowance,
      "increaseApproval(address,uint256)": IncreaseAllowance,
      "decreaseAllowance(address,uint256)": DecreaseAllowance,
      "decreaseApproval(address,uint256)": DecreaseAllowance,
      "mint(address,uint256)": Mint,
      "burn(uint256)": Burn,
      "burnFrom(address,uint256)": BurnFrom,
    }, 
    "ERC721": {},
    "ERC1155": {},
  }
  const sections = [
    ["inbound", "Transfers to you"],
    ["outbound", "Transfers from you"],
    ["external", "Transfers not involving you"],
    ["approval", "Approvals"],
  ]
</script>

<div class="pt-4 pr-4">
  {#each sections as [key, title]}
    {#if key in $effects && $effects[key].length > 0 && (key !== "external" || $external_transfers)}
      <p class="mb-2 text-base font-jetbrains font-bold underline decoration-2 underline-offset-2">{title}</p>
      {#each $effects[key] as effect}
        {#if effect.type === "erc20"}
          {@const { schema_name, fn_sig, caller, contract, from, to, value } = effect}
          {@const comp = effect_help_by_fn_sig?.[schema_name]?.[fn_sig]}
          {#if comp}
            <div class="mb-4 pl-4">
              <BaseEffect
                contract={contract} from={from} to={to} caller={caller} value={value}
                HelpComponent={comp}
              />
            </div>
          {/if}
        {:else}
          {@const {from, to, value} = effect}
          <div class="mb-4 pl-4">
            <Eth from={from} to={to} amount={value} />
          </div>
        {/if}
      {/each}
    {/if}
  {/each}
</div>
<p class="text-darkgrey text-small font-jetbrains mb-4">
  Note that this list is not exhaustive. Check the Execution tab for a full analysis.
</p>
