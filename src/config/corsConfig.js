import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://13.212.69.50:5173",
  "http://13.212.69.50:5173/"
]; 

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
