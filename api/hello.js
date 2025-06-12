export default function handler(req, res) {
  return res.json({
    message: "Hello from Vehicle Rental System API!",
    status: "online",
    timestamp: new Date().toISOString(),
  })
}
