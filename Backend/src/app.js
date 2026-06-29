const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

const app = express()

app.set("trust proxy", 1);

// Trust proxy header setup and basic secure HTTP headers
app.use(helmet())

// Custom NoSQL query injection prevention (compatible with Express 5 req.query getter)
const mongoSanitizer = (req, res, next) => {
    const sanitize = (obj) => {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (key.startsWith('$')) {
                    delete obj[key]
                } else {
                    sanitize(obj[key])
                }
            }
        }
    }
    sanitize(req.body)
    sanitize(req.query)
    sanitize(req.params)
    next()
}
app.use(mongoSanitizer)


// Limiters to prevent service spam and brute forcing
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150,
    message: { message: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: { message: "Too many login/registration attempts, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
})

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.includes(origin) ||
            origin.startsWith("http://localhost:") ||
            origin.includes("vercel.app") ||
            origin.includes("onrender.com");
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true
}));

app.use(express.json())
app.use(cookieParser())

const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

app.use("/api/auth", authLimiter, authRouter)
app.use("/api/interview", apiLimiter, interviewRouter)

module.exports = app

