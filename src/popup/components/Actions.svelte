<script>
  import { accept_and_continue, reject_and_continue, report_and_continue } from "../actions"
</script>

<div class="flex gap-2 mt-4">
  <button 
    class="bg-blue border-2 border-blue px-4 pt-2 pb-[0.4rem] rounded-md text-white hover:bg-white hover:text-blue"
    on:click={accept_and_continue}
  >
    <p class="font-jetbrains text-base font-bold ">Yes</p>
  </button>
  <button
    class="border-2 border-blue px-4 pt-2 pb-[0.4rem] rounded-md text-blue hover:bg-blue hover:text-white"
    on:click={reject_and_continue}
  >
    <p class="font-jetbrains text-base font-bold ">No</p>
  </button>
  <button
    class="bg-orange border-2 border-orange px-4 pt-2 pb-[0.4rem] rounded-md hover:bg-white"
    on:click={report_and_continue}
  >
    <p class="font-jetbrains text-base font-bold ">Report</p>
  </button>
</div>
