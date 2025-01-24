# IoT API Server

This is an API server built with Node.js and Express for collecting, managing, and monitoring IoT device data such as current and voltage. It integrates PostgreSQL for database management, Socket.IO for real-time data updates, and OpenAI API for AI-driven insights based on energy consumption data.

## Features
- **Data Retrieval**: Provides endpoints to fetch all sensor data stored in the PostgreSQL database.
- **Data Insertion**: Allows posting new IoT data (current, voltage, and power readings) to the database.
- **Real-Time Updates**: Uses Socket.IO to broadcast new data to all connected clients in real time.
- **Database Reset**: Includes an endpoint to reset all sensor data in the database.
- **AI Integration**: Uses OpenAI API to answer user questions based on collected IoT data.
- **Environment Variables**: API keys and database credentials are securely managed with dotenv.
