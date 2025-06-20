import express from "express";
import { engine } from "express-handlebars";
import config from "./config";
import session from "./utils/session";

const app = express();
app.use(express.static("public"));
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
  }),
);
app.set("view engine", "hbs");
app.set("views", "./views");
app.use(session);

app.get("/", (_, res) => {
  res.render("index", {
    isDev: config.env.DEV,
  });
});

export default app;
