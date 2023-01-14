<script>
  import Etherscanlink from "../../etherscanlink.svelte";
  import { format_decimal } from "../../../utils";

  export let contract;
  export let from;
  export let tokens_transferred;
  export let dollars_transferred;
</script>

This transaction includes a burn (token destruction) of {format_decimal(tokens_transferred)} coins of <Etherscanlink contract_hex={contract}/>
from <Etherscanlink contract_hex={from} />. At current Uniswap price, this burn represents a value of ${format_decimal(dollars_transferred)} in USD.
