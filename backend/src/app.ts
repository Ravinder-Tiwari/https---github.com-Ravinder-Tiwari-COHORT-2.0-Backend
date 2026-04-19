import express from "express"
import useGraph from "./services/graph.ai.service.js"
import cors from "cors"
import path from "path"


const app = express()
app.use(cors({
    origin: [
        "https://aibattlearena1.onrender.com", 
        "https://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
}))
app.use(express.json())
app.use(express.static("./public"))
app.get("/health", (req, res) => {
    
    res.status(200).json({ status: "ok" })
})  

app.post("/response", async (req, res) => {
    const { problem } = req.body
    console.log(problem)
    const result = await useGraph(problem)
    res.status(200).json({
        message: "Response from graph",
        result
    })
})





export default app  