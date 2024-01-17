import { PrismaClient } from "@prisma/client";
import express from "express";
import { Layout, NewComponent } from "./layout";
import { editHtml, formHtml } from "./form";
import { mainHtml } from "./body";

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
      children: mainHtml(),
    }),
  });
  res.send(html);
});

app.get("/get/todo", function (req, res) {
  res.set("user-data", "text/html");
  res.send(
    NewComponent({
      children: formHtml(),
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
        <input type="checkbox" name="checkbox"  />
        </label>
        <div
          class="flex flex-col text-center w-full cursor-pointer text-[16px] font-semibold">
          <div>${res.title}</div>
          </div>
          <img hx-get="/get-todo/${res.id}"        
          hx-swap="outerHTML"
          hx-target="#todos-container" 
          src="/edit.png" alt="delete-img" 
          class="h-[1rem] cursor-pointer" style="filter: brightness(0) invert(1)"/>
          <img hx-delete="/remove-todos/${res.id}" hx-target="closest div" src="/delete.png" alt="delete-img" class="h-[1rem] cursor-pointer" style="filter: brightness(0) invert(1)"/>
  
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

//GET TODO THROUGH ID
app.get("/get-todo/:id", async (req, res) => {
  try {
    const searchId = req.params.id;

    if (searchId === undefined || searchId === null) {
      return res.status(400).send("Invalid todo ID");
    }

    const preserveId = await prisma.todo.findUnique({
      where: {
        id: Number(searchId),
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    if (!preserveId) {
      return res.status(404).send("Todo not found");
    }

    return res.status(200).send(
      NewComponent({
        children: editHtml({
          id: preserveId.id,
          title: preserveId.title,
          description: preserveId.description,
        }),
      })
    );
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal Server Error");
  }
});

//POST REQ THROUGH ID (VIA SEARCHING)
app.post("/search/todos-data", async (req, res) => {
  try {
    const searchTerm = req.body.search.toLowerCase();

    if (!searchTerm) {
      return res.status(200).send(`<div></div>`);
    }
    const searchResults = await prisma.todo.findMany({
      where: {
        title: {
          contains: searchTerm,
        },
      },
      select: {
        id: true,
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

    const searchResultHtml = searchResultsFilter
      .map((res) => {
        return ` 
          <div
          class="flex text-white px-[1.7rem] gap-5 items-center">
          <label class="flex flex-col gap-[2px] w-[3%]">
          <input type="checkbox" name="checkbox"  />
          </label>
          <div
            class="flex flex-col text-center w-full cursor-pointer text-[16px] font-semibold">
            <div>${res.title}</div>
            </div>
            <img hx-get="/get-todo/${res.id}"        
            hx-swap="outerHTML"
            hx-target="#todos-container" 
            src="/edit.png" alt="delete-img" 
            class="h-[1rem] cursor-pointer" style="filter: brightness(0) invert(1)"/>
            <img hx-delete="/remove-todos/${res.id}" hx-target="closest div" src="/delete.png" alt="delete-img" class="h-[1rem] cursor-pointer" style="filter: brightness(0) invert(1)"/>
    
            </div>
        `;
      })
      .join("");
    return res.status(200).send(searchResultHtml);
  } catch (e) {
    console.log(e);
    return res.status(404).send("todos Not found");
  }
});

//EDIT POST REQ FOR TODOS
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

//POST REQ TODOS
app.post("/edit-todos", async (req, res) => {
  try {
    const { id, title, description } = req.body;
    if (!id || !title || !description) {
      return res
        .status(400)
        .send({ error: "Both title and description are required." });
    }
    await prisma.todo.update({
      where: {
        id: Number(id),
      },
      data: {
        title: title,
        description: description,
      },
    });

    return res.status(200).redirect("/");
  } catch (e) {
    return res.status(401).send("Failed to update todo");
  }
});

//DELETE REQ FOR TODOS
app.delete("/remove-todos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await prisma.todo.delete({
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
