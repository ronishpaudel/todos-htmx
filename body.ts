export const mainHtml = () => {
  return ` 
  
    <div
      class="flex-col flex bg-gray-900 w-[650px] rounded-lg text-white"
      hx-get="/todos-data"
      hx-target="#todo-data"
      hx-trigger="load"
    >
      <div class="flex text-white pt-5 pb-3 gap-5 items-center pl-[1.5rem]">
        <input
          class="border border-gray-600 bg-gray-800 p-2 rounded-lg w-[484px] py-2"
          placeholder="Start Searching Your Todos...."
          name="search"
          type="search"
          hx-post="/search/todos-data"
          hx-trigger="input changed delay:500ms, search"
          hx-target="#search-results"
          hx-indicator="#loading"
        />
        <div
          hx-get="/get/todo"
          hx-swap="outerHTML"
          hx-target="#todos-container"
          hx-indicator="#loading"
          class="bg-green-600 py-2 px-1 rounded-lg cursor-pointer text-[14px] uppercase font-medium"
        >
          Add new todo
        </div>
      </div>
      <div class="text-white flex px-[1.7rem] w-full underline">
        <div class="w-[42%] py-1 text-xs font-medium uppercase tracking-wider">
          S.N
        </div>
        <div
          class="py-1 text-center text-xs font-medium uppercase tracking-wider"
        >
          Todo-List
        </div>
      </div>

      <div id="todo-data" class="mb-2 overflow-y-auto max-h-[150px]" style="color-scheme:dark;" >
      
      </div>
      <div id="search-results" class="mb-2 bg-gray-800"></div>

    </div>
  `;
};
