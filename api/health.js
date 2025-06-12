export default function handler(req, res) {
  return res.json({
    service: "Vehicle Rental System",
    status: "healthy",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  })
}
