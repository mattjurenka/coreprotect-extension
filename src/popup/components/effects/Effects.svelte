<script>
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
  import ERC20BaseEffect from "./erc20/BaseEffect.svelte";
  import SafeTransferFromPartiallyFungible from "./erc1155/SafeTransferFromPartiallyFungible.svelte";
import Erc1155BaseEffect from "./erc1155/ERC1155BaseEffect.svelte";

  const effect_help_by_fn_sig = {
    "ERC20": {
      "transfer(address,uint256)": Transfer,
      "approve(address,uint256)": Approve,
      "transferFrom(address,address,uint256)": TransferFrom,
      "safeTransferFrom(address,address,uint256)": TransferFrom,
      "increaseAllowance(address,uint256)": IncreaseAllowance,
      "increaseApproval(address,uint256)": IncreaseAllowance,
      "decreaseAllowance(address,uint256)": DecreaseAllowance,
      "decreaseApproval(address,uint256)": DecreaseAllowance,
      "mint(address,uint256)": Mint,
      "burn(uint256)": Burn,
      "burnFrom(address,uint256)": BurnFrom,
    }, 
    "ERC721": {
      "transferFrom(address,address,uint256)": SafeTransferFromPartiallyFungible,
      "safeTransferFrom(address,address,uint256)": SafeTransferFromPartiallyFungible,
    },
    "ERC1155": {
      "safeTransferFrom(address,address,uint256,uint256,bytes)": SafeTransferFromPartiallyFungible,
      "safeTransferFrom(address,address,uint256,bytes)": SafeTransferFromPartiallyFungible,
      "safeTransferFrom(address,address,uint256)": SafeTransferFromPartiallyFungible,
      "transferFrom(address,address,uint256,uint256,bytes)": SafeTransferFromPartiallyFungible,
      "transferFrom(address,address,uint256,bytes)": SafeTransferFromPartiallyFungible,
      "transferFrom(address,address,uint256)": SafeTransferFromPartiallyFungible,
    },
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
      <p class="mb-4 text-base font-jetbrains font-bold underline decoration-2 underline-offset-2">{title}</p>
      {#each $effects[key] as effect}
        {#if effect.type === "erc20"}
          {@const { schema_name, fn_sig, caller, contract, from, to, value, name } = effect}
          {@const comp = effect_help_by_fn_sig?.[schema_name]?.[fn_sig]}
          {#if comp}
            <div class="mb-4 pl-4">
              {#if effect.schema_name === "ERC20"}
                <ERC20BaseEffect
                  contract={contract} from={from} to={to} caller={caller} value={value}
                  HelpComponent={comp}
                />
              {:else if effect.schema_name === "ERC721"}
                {@const { nft_link, nft_name, nft_picture, name } = effect}
                <Erc1155BaseEffect 
                  contract={contract} from={from} to={to} caller={caller}
                  value={value} HelpComponent={comp} nft_link={nft_link}
                  nft_name={nft_name} nft_picture={nft_picture}
                  name={name}
                />
              {:else if effect.schema_name === "ERC1155"}
                {@const { nft_link, nft_name, nft_picture, name } = effect}
                <Erc1155BaseEffect 
                  contract={contract} from={from} to={to} caller={caller}
                  value={value} HelpComponent={comp} nft_link={nft_link}
                  nft_name={nft_name} nft_picture={nft_picture}
                  name={name}
                />
              {/if}
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
