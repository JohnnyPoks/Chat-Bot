require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const cors = require("cors");
const sequelize = require("./db/dbConnector");
const chatRoutes = require("./routes/chat_routes");

const port = 8000;
const app = express();

app.use(cors());
app.use(express.json());

// Sync Sequelize models
sequelize.sync({ force: true }).then(() => {
  console.log("Database synchronized");
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 1.0,
  },
});

app.post("/api/chat", async (req, res) => {
  console.log("REQUEST IS ENTERED");
  console.log(req.body.input);

  try {
    const messages = req.body.input;
    const result = await model.generateContentStream(messages);

    // Streaming the content to the client
    for await (const chunk of result.stream) {
      const chunkText = await chunk.text();
      res.write(chunkText);
    }

    // Ending the response once all chunks are sent
    res.end();
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).send({ error: "Please connect to the internet and retry" });
  }
});

// Uncomment this if you want to use the OpenAI API instead of the gemini API

// app.post("/api/chat", async (req, res) => {
//   const { messages } = req.body;
//   const data = {
//     model: "gpt-4o-mini",
//     messages: [
//       {
//         role: "system",
//         content: "You are a helpful assistant.",
//       },
//     ],
//   };

//   try {
//     const { default: fetch } = await import("node-fetch");

//     const response = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//       },
//       body: JSON.stringify({
//         ...data,
//         messages: [...data.messages, ...messages],
//       }),
//     });
//     const resdata = await response.json();
//     console.log(resdata);
//     res.send(resdata);
//   } catch (error) {
//     console.log(error, "Error");
//   }
// });

// Chat routes

app.use("/api/chats", chatRoutes);

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.listen(port, () => {
  console.log(`Chat bot server listening at http://localhost:${port}`);
});
