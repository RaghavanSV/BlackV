package ws

import (
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages to them.
type Hub struct {
	// Registered clients here *Client whcih is a pointer to client instance is key .
	clients map[*Client]bool

	// Inbound messages to broadcast to all clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Protect clients map for safe access where necessary.
	mu sync.RWMutex
}

// NewHub creates a new Hub instance.
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub main loop. Run this in a goroutine.
func (h *Hub) Run() {
	for {
		select { //runs concurrently or listens on all chans simul
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send) // closes the message queue where all the messages are queued to send to the websocket
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			// Broadcast to all clients (non-blocking write)
			h.mu.RLock()
			for c := range h.clients { // for c in h.clients
				select {
				case c.send <- message:
				default:
					// client send channel is full — remove it to avoid blocking
					delete(h.clients, c)
					close(c.send)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastRaw sends a raw JSON message to all connected clients.
func (h *Hub) BroadcastRaw(msg []byte) {
	h.broadcast <- msg
}
