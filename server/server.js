import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3001;

// Serve static files for production (optional for React app build)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
}

// Handle WebSocket events for signaling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle incoming stream request from the sender
  socket.on('stream-request', (data) => {
    console.log('Stream request:', data);
    socket.broadcast.emit('stream-request', data);  // Send it to the receiver
  });

  // Handle stream acceptance by the receiver
  socket.on('stream-accepted', (data) => {
    console.log('Stream accepted:', data);
    io.to(data.senderId).emit('stream-accepted', data); // Notify sender
  });

  // Handle stream rejection by the receiver
  socket.on('stream-rejected', (data) => {
    console.log('Stream rejected:', data);
    io.to(data.senderId).emit('stream-rejected', data); // Notify sender
  });

  // Handle WebRTC offer
  socket.on('offer', (offer) => {
    console.log('Offer:', offer);
    socket.broadcast.emit('offer', offer);  // Forward offer to the receiver
  });

  // Handle WebRTC answer
  socket.on('answer', (answer) => {
    console.log('Answer:', answer);
    socket.broadcast.emit('answer', answer);  // Forward answer to the sender
  });

  // Handle ICE candidates
  socket.on('candidate', (candidate) => {
    console.log('Candidate:', candidate);
    socket.broadcast.emit('candidate', candidate);  // Forward candidate
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});