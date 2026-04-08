import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";

// Route imports
import userRouter from "./routes/auth.route.js";
import candidateRouter from "./routes/candidate.route.js";
import companyRouter from "./routes/company.route.js";
import jobApplicationRouter from "./routes/job_application.route.js";
import jobRouter from "./routes/job.route.js";
import savedJobRouter from "./routes/saved_job.route.js";
import uploadRouter from "./routes/upload.route.js";



const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const PORT = process.env.PORT;



app.use("/api/user", userRouter);
app.use("/api/candidate", candidateRouter);
app.use("/api/company", companyRouter);
app.use("/api/job_applications", jobApplicationRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/saved-jobs", savedJobRouter);
app.use("/api/upload", uploadRouter);



app.use((err, req, res, next) => {
  if (err.message === "Invalid file type") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message,
  });
});


connectDB().then(()=>{
    app.listen(PORT, ()=>{
        console.log(`Server is running at PORT : ${PORT}`);
    })
})

