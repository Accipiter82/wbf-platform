import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/auth";
import organisationRoutes from "./routes/organisation";
import adminRoutes from "./routes/admin";
import messagingRoutes from "./routes/messaging";
import superAdminRoutes from "./routes/super-admin";
import wallRoutes from "./routes/wall";

// MongoDB init (early)
import "./db-client";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// trust reverse proxy (Apache) so secure cookies & IPs work
app.set("trust proxy", 1);

// Security
app.use(helmet());

// Rate limit - more lenient in development
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.NODE_ENV === "development" ? 1000 : 100, // Much higher limit in dev
        message: {
            success: false,
            error: "Too many requests from this IP, please try again later.",
        },
        standardHeaders: true,
        legacyHeaders: false,
    }) as unknown as express.RequestHandler
);

// CORS
const allowedOrigins = [
    "https://wbf-platform-admin-panel.vercel.app",
    "https://dev.settim.mk",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3101",
    "http://192.168.200.241:5173",
];

const corsOptions: cors.CorsOptions = {
    origin(origin, cb) {
        // console.log(`[CORS] Incoming origin: ${origin}`);

        // In development, allow all localhost origins and any origin
        if (process.env.NODE_ENV === "development") {
            if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
                return cb(null, true);
            }
            // Allow any origin in development
            return cb(null, true);
        }

        // Allow non-browser (no Origin)
        if (!origin) return cb(null, true);

        // Allow whitelisted sites
        if (allowedOrigins.includes(origin)) return cb(null, true);

        // Allow Vercel preview deployments
        if (origin.endsWith(".vercel.app")) return cb(null, true);

        console.log(`[CORS] BLOCKED origin: ${origin}`);
        return cb(null, false); // Don't throw error, just block
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body & cookies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser() as unknown as express.RequestHandler);

// Health
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        message: "WBF Platform Backend is running",
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/organisation", organisationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messaging", messagingRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/wall", wallRoutes);

// 404
app.use("*", (_req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler
app.use(
    (error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        if (error instanceof Error) {
            console.error("[ERROR]", error.stack || error.message);
        } else {
            console.error("[ERROR]", error);
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, error: "Validation error", details: error.message });
        }
        if (error.name === "UnauthorizedError") {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        return res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
        });
    }
);

app.listen(PORT, () => {
    console.log(`🚀 Backend on :${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔗 API:    http://localhost:${PORT}/api`);
});

export default app;