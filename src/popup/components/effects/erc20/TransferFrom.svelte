<script>
  import Etherscanlink from "../../etherscanlink.svelte";
  import { format_decimal } from "../../../utils";

  export let contract;
  export let from;
  export let to;
  export let tokens_transferred;
  export let dollars_transferred;
</script>

This transaction includes a transfer of {format_decimal(tokens_transferred)} coins of <Etherscanlink contract_hex={contract}/>
from <Etherscanlink contract_hex={from} /> to <Etherscanlink contract_hex={to} />.
At current Uniswap price, this transfer represents a value of ${format_decimal(dollars_transferred)} in USD.
