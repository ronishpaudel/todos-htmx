import { PrismaClient } from "@prisma/client";
import express from "express";
import { Layout, NewComponent } from "./layout";

const app = express();
const prisma = new PrismaClient();

// Set static folder
app.use(express.static("public"));
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.get("/", function (req, res) {
  const html = Layout({
    children: NewComponent({
      children: ` 
  
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
            hx-push-url="true"
            hx-indicator="#loading"
            class="bg-green-600 py-2 px-1 rounded-lg cursor-pointer text-[14px] uppercase font-medium"
          >
            Add new todo
          </div>
        </div>
        <div class="text-white flex px-[1.7rem] w-full underline">
          <div class="w-[45%] py-1 text-xs font-medium uppercase tracking-wider">
            S.N
          </div>
          <div
            class="py-1 text-center text-xs font-medium uppercase tracking-wider"
          >
            Todo-List
          </div>
        </div>
        <div id="todo-data" class="mb-2"></div>
        <div id="search-results" class="mb-2 bg-gray-800"></div>
      </div>
    `,
    }),
  });
  res.send(html);
});

app.get("/get/todo", function (req, res) {
  res.set("user-data", "text/html");
  res.send(
    NewComponent({
      children: `
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

      `,
    })
  );
});

//GET REQ FOR TODOS
app.get("/todos-data", async (req, res) => {
  try {
    const desiredTodos = await prisma.todo.findMany({
      select: {
        id: true,
        title: true,
        description: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const getTodos = desiredTodos
      .map((res) => {
        return ` 
        <div
        class="flex text-white px-[1.7rem] gap-5 items-center">
        <label class="flex flex-col gap-[2px] w-[3%]">
        <input type="checkbox" name="checkbox"/>
        </label>
        <div
          class="flex flex-col text-center w-full cursor-pointer text-[16px] font-semibold">
          <div>${res.title}</div>
          </div>
       
          <img hx-delete="/remove-todos/${res.id}" hx-target="closest div" src="/delete.png" alt="delete-img" class="h-[1.1rem] cursor-pointer" style="filter: brightness(0) invert(1)"/>
  
          </div>
        `;
      })
      .join("");
    return res.status(200).send(getTodos);
  } catch (e) {
    console.log(e);
    return res.status(404).send("todos Not found");
  }
});

//POST REQ THROUGH ID (VIA SEARCHING)
app.post("/search/todos-data", async (req, res) => {
  try {
    const searchTerm = req.body.search.toLowerCase();

    if (!searchTerm) {
      return res.status(404).send(`<div>No Such Todos exist.</div>`);
    }
    const searchResults = await prisma.todo.findMany({
      where: {
        title: {
          contains: searchTerm,
        },
      },
      select: {
        title: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const searchResultsFilter = searchResults.filter((res) => {
      const title = res.title.toLowerCase();
      return title.includes(searchTerm);
    });
    setInterval(() => {
      const searchResultHtml = searchResultsFilter
        .map((res) => {
          return ` <div
        class="flex text-white px-[1.7rem] gap-5 items-center"
      >
        <label class="flex flex-col gap-[2px] w-[3%]">
        <input type="checkbox" />
        </label>
        <div
          class="flex flex-col text-center w-full cursor-pointer text-[16px] font-semibold"
        >
          <div>${res.title}</div>
          </div>
          </div>
        `;
        })
        .join("");
      return res.status(200).send(searchResultHtml);
    }, 1000);
  } catch (e) {
    console.log(e);
    return res.status(404).send("todos Not found");
  }
});

//POST REQ FOR TODOS
app.post("/add-todos", async (req, res) => {
  try {
    const { title, description } = req.body;
    console.log({ title, description });
    if (!title || !description) {
      return res
        .status(400)
        .send({ error: "Both title and description are required." });
    }
    await prisma.todo.create({
      data: {
        title,
        description,
      },
    });

    return res.status(201).redirect("/");
  } catch (e) {
    console.log(e);
    return res.status(304).send("Forbidden to create todos");
  }
});

//DELETE REQ FOR TODOS
app.delete("/remove-todos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const deletedTodo = await prisma.todo.delete({
      where: {
        id: Number(id),
      },
    });
    return res.status(200).send(``);
  } catch (e) {
    return res.status(404).send("Nothing here tto delete");
  }
});

app.listen(3000, () => {
  console.log("Server running at port 3000");
});
