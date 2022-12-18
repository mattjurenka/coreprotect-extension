<script>
  import CallTraceRecurse from "./CallTraceRecurse.svelte"
  import { call_trace } from "../stores"
</script>

<div class="pt-4">
  <CallTraceRecurse call_trace={$call_trace} />
</div>
