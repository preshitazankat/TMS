import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mime from "mime";

const app = express();

app.use(cookieParser());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
dotenv.config();


// Express example
// app.use('/uploads', express.static('uploads', {
//   setHeaders: (res, path) => {
//     if (path.endsWith('.xlsx')) res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     if (path.endsWith('.docx')) res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
//   }
// }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

const PORT = 5000;

app.use(cors({
  origin: [
    'http://localhost:5000',      // React dev server 
    'http://172.28.148.82:3000',
    
  ],
  credentials: true
}));
app.use(express.json());



app.use("/api", taskRoutes);
app.use("/api/users", userRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
