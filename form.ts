interface IFormProps {
  id?: number;
  title: string;
  description: string;
}
//post form
export const formHtml = () => {
  return `
    <form
    hx-indicator="#loading"
    hx-post="/add-todos"
    hx-trigger="submit"
    hx-vals="title desc"
    class="bg-white shadow-2xl rounded px-8 pt-6 pb-8 w-[600px]"
    hx-swap="outerHTML"
    hx-target="#todos-container"
  >
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2" for="title">
        Title
      </label>
      <input
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        id="title"
        name="title"
        type="text"
        placeholder="Title"
      />
    </div>

    <div class="mb-6">
      <label
        class="block text-gray-700 text-sm font-bold mb-2"
        for="description"
      >
        Description
      </label>
      <textarea
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        id="desc"
        rows="3"
        name="description"
        placeholder="Description"
      ></textarea>
    </div>

    <div class="flex items-center justify-between">
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="submit"
      >
        Submit
      </button>
    </div>
  </form>

  `;
};

//edit form
export const editHtml = ({ id, title, description }: IFormProps) => {
  return `
  <form
  hx-post="/edit-todos"
  hx-trigger="submit"
  hx-vals="id title desc"
  class="bg-white shadow-2xl rounded px-8 pt-6 pb-8 w-[600px]"
  hx-swap="outerHTML"
  hx-target="#todos-container"
>
  <div class="mb-4">
    <label class="block text-gray-700 text-sm font-bold mb-2" for="title">
      Title
    </label>
    <input type="hidden" id="id" name="id" value="${id}" />
    <input
      class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      id="title"
      name="title"
      type="text"
      placeholder="Title"
      value=${title}
    
    />
  </div>

  <div class="mb-6">
    <label
      class="block text-gray-700 text-sm font-bold mb-2"
      for="description"
    >
      Description
    </label>
    <textarea
      class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      id="desc"
      rows="3"
      name="description"
      placeholder="Description"
    >${description}</textarea>
  </div>

  <div class="flex items-center justify-between">
    <button
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      type="submit"
    >
      Submit
    </button>
  </div>
</form>

`;
};
