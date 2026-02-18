"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const organisation_1 = __importDefault(require("./routes/organisation"));
const admin_1 = __importDefault(require("./routes/admin"));
const messaging_1 = __importDefault(require("./routes/messaging"));
const super_admin_1 = __importDefault(require("./routes/super-admin"));
const wall_1 = __importDefault(require("./routes/wall"));
require("./db-client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.set("trust proxy", 1);
app.use((0, helmet_1.default)());
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 1000 : 100,
    message: {
        success: false,
        error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
}));
const allowedOrigins = [
    "https://wbf-platform-admin-panel.vercel.app",
    "https://dev.settim.mk",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3101",
    "http://192.168.200.241:5173",
];
const corsOptions = {
    origin(origin, cb) {
        if (process.env.NODE_ENV === "development") {
            if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1")) {
                return cb(null, true);
            }
            return cb(null, true);
        }
        if (!origin)
            return cb(null, true);
        if (allowedOrigins.includes(origin))
            return cb(null, true);
        if (origin.endsWith(".vercel.app"))
            return cb(null, true);
        console.log(`[CORS] BLOCKED origin: ${origin}`);
        return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
};
app.use((0, cors_1.default)(corsOptions));
app.options("*", (0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        message: "WBF Platform Backend is running",
        timestamp: new Date().toISOString(),
    });
});
app.use("/api/auth", auth_1.default);
app.use("/api/organisation", organisation_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/messaging", messaging_1.default);
app.use("/api/super-admin", super_admin_1.default);
app.use("/api/wall", wall_1.default);
app.use("*", (_req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
});
app.use((error, _req, res, _next) => {
    if (error instanceof Error) {
        console.error("[ERROR]", error.stack || error.message);
    }
    else {
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
});
app.listen(PORT, () => {
    console.log(`🚀 Backend on :${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔗 API:    http://localhost:${PORT}/api`);
});
exports.default = app;
//# sourceMappingURL=index.js.map