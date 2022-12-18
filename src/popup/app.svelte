<script>
  import Dataview from "./components/Dataview.svelte";
  import { window_type } from "./stores"
</script>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono&family=Vollkorn&display=swap');
</style>


<div class="min-w-[28rem] p-4 {window_type === 'popup' ? 'h-[36rem] max-w-[28rem]' : 'h-full'}">
  <div class="p-4 h-full border-2 border-blue flex flex-col">
    <h1 class="font-vollkorn text-xl text-blue mb-4">Review Transaction</h1>
    <Dataview />
    <p class="font-jetbrains text-base mt-4">Continue with this transaction?</p>
    <div class="flex gap-2 mt-4">
      <button class="bg-blue border-2 border-blue px-4 pt-2 pb-[0.4rem] rounded-md text-white hover:bg-white hover:text-blue">
        <p class="font-jetbrains text-base font-bold ">Yes</p>
      </button>
      <button class="border-2 border-blue px-4 pt-2 pb-[0.4rem] rounded-md text-blue hover:bg-blue hover:text-white">
        <p class="font-jetbrains text-base font-bold ">No</p>
      </button>
      <button class="bg-orange border-2 border-orange px-4 pt-2 pb-[0.4rem] rounded-md hover:bg-white">
        <p class="font-jetbrains text-base font-bold ">Report</p>
      </button>
    </div>
  </div>
</div>

