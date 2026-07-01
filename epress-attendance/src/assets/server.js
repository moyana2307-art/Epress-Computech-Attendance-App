const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Mock Database
let attendanceRecords = [
  { id: 1, employeeName: "Sarah Jenkins", date: "2026-07-01", checkIn: "08:45 AM", checkOut: "05:15 PM", status: "Present" },
  { id: 2, employeeName: "Michael Chang", date: "2026-07-01", checkIn: "09:02 AM", checkOut: "---", status: "Late" }
];

// Get all attendance logs
app.get('/api/attendance', (req, res) => {
  res.json(attendanceRecords);
});

// Check-in / Check-out Toggle Endpoint
app.post('/api/attendance/toggle', (req, res) => {
  const { employeeName } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Find if employee already checked in today
  const existingRecord = attendanceRecords.find(r => r.employeeName === employeeName && r.date === today);

  if (!existingRecord) {
    // Determine status based on an 8:30 AM shift start
    const isLate = new Date().getHours() >= 8 && new Date().getMinutes() > 30;
    const newRecord = {
      id: attendanceRecords.length + 1,
      employeeName,
      date: today,
      checkIn: currentTime,
      checkOut: "---",
      status: isLate ? "Late" : "Present"
    };
    attendanceRecords.unshift(newRecord); // Add to top
    return res.status(201).json({ message: "Checked in successfully", data: newRecord });
  } else if (existingRecord.checkOut === "---") {
    // Update check out time
    existingRecord.checkOut = currentTime;
    return res.status(200).json({ message: "Checked out successfully", data: existingRecord });
  } else {
    return res.status(400).json({ message: "Already checked out for today." });
  }
});

app.listen(PORT, () => {
  console.log(`Epress Computech Backend running on port ${PORT}`);
});