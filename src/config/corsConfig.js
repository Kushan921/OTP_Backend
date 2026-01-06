import cors from "cors";

const allowedOrigins = [
  "https://brave-beach-0d27f4b0f.4.azurestaticapps.net"
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
