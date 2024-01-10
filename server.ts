import { PrismaClient } from "@prisma/client";
import express from "express";
import { NewComponent } from "./layout";

const app = express();
const prisma = new PrismaClient();
// Set static folder
app.use(express.static("public"));
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.get("/get/todo", function (req, res) {
  setInterval(() => {
    res.set("user-data", "text/html");
    res.send(
      NewComponent({
        children: "<h1>hamro tempasdadslating</h1>",
      })
    );
  }, 1000);
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
        return ` <div
        class="flex text-white px-[1.7rem] gap-5 items-center"
      >
        <label class="flex flex-col gap-[2px] w-[3%]">
        <input type="checkbox" name="checkbox" />
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
    const todos = await prisma.todo.create({
      data: {
        title,
        description,
      },
    });
    return res.status(200).send(todos);
  } catch (e) {
    console.log(e);
    return res.status(304).send("Forbidden to create todos");
  }
});

//DELETE REQ FOR TODOS
app.delete("/remove-todos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const deletedTodo = await prisma.todo.delete({
      where: {
        id: Number(id),
      },
    });
    return res.json(deletedTodo);
  } catch (e) {
    return res.status(404).send("Nothing here tto delete");
  }
});

app.listen(3000, () => {
  console.log("Server running at port 3000");
});
