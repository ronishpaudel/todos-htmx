import { PrismaClient } from "@prisma/client";
import express from "express";
import { Layout, NewComponent } from "./layout";
import { editHtml, formHtml } from "./form";
import { mainHtml } from "./body";
import path from "path";

const app = express();
const prisma = new PrismaClient();
const fs = require("fs");

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
  const pageSize = 8;
  const page = Number(req.query?.page) || 1;
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const todoHtml = (res: { title: string; id: number }, isLast: boolean) => ` 
    <div
    class="flex text-white px-[1.7rem] gap-5 items-center" 
    ${
      isLast
        ? `hx-get="/todos-data?page=${
            page + 1
          }" hx-trigger="intersect once" hx-swap="beforeend"`
        : ""
    }
    >
    <label class="flex flex-col gap-[2px] w-[3%]">
    <input type="checkbox" name="checkbox" />
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
      <img hx-delete="/remove-todos/${
        res.id
      }" hx-target="closest div" src="/delete.png" alt="delete-img" class="h-[1rem] cursor-pointer" style="filter: brightness(0) invert(1)"/>

      </div>

    `;

    const getTodos = desiredTodos
      .map((res, i) => {
        return todoHtml(res, desiredTodos?.length - 1 === i);
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
    setTimeout(async () => {
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
    }, 500);
  } catch (e) {
    console.log(e);
    return res.status(404).send("todos Not found");
  }
});
//GET REQ FOR FILE DOWNLOAD

app.get("/download/csv", async (req, res) => {
  try {
    const csvData = await prisma.todo.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });
    const filePath = path.join(__dirname, "csv", "todos.csv");

    const csvContent = csvData
      .map((row) => `${row.id},${row.title},${row.description}${row.createdAt}`)
      .join("\n");

    const fileCreate = fs.writeFileSync(
      filePath,
      `Id,Title,Description,CreatedAt\n${csvContent}`
    );

    res.download(filePath, "todos.csv", (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }

      fs.unlinkSync(filePath);
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

// POST REQ FOR CREATING TODOS (VIA CSV FILE OR REQ BODY)
app.post("/add-todos", async (req, res) => {
  try {
    const { title, description, file } = req.body;

    // console.log({ n: { ...req.body.file } });

    console.log({ title, description, file });

    fs.readFile("example.csv", "utf-8", (err: Error, data: any) => {
      if (err) {
        console.log(err);
      } else {
        const splitData = data.split("\r\n");
        console.log({ data: splitData });
        const results = againSplitData(splitData);
        console.log({ results });
        csvUpload(results);
      }
    });

    function againSplitData(data: any) {
      let arr = [];
      const result = data.map((element: string) => element.split(","));
      console.log("Split Data Again:", result);

      const shiftResult = result.shift();
      console.log(shiftResult);
      console.log("shiftpacxi", result);

      for (let i = 0; i < result.length; i++) {
        const dataVal = result[i];
        console.log({ dataval: result[i] });

        let obj = {};
        for (let j = 0; j < dataVal.length; j++) {
          obj = { [shiftResult[j]]: dataVal[j], ...obj };
          console.log({ obj: { [shiftResult[j]]: dataVal[j] } });
        }

        arr.push(obj);
        console.log({ arr: arr });
      }
      console.log(arr);
      return arr;
    }

    async function csvUpload(data: any[]) {
      if (!data) {
        return res
          .status(400)
          .send({ error: "Data not allotted in this file" });
      }

      const createdTodos = [];

      for (let i = 0; i < data.length; i++) {
        const result = data[i];
        const { title, description } = result;

        if (!title || !description) {
          return res.status(400).send({ error: "title and desc not found" });
        }

        const csvTodo = await prisma.todo.create({
          data: {
            title,
            description,
          },
        });

        console.log({ csvTodo });
        createdTodos.push(csvTodo);
      }

      return createdTodos;
    }

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

// EDIT POST REQ TODOS
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
