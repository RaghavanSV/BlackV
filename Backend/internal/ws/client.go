package ws

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	//time allowed to write message to
	writeWait = 10 * time.Second

	//time allowed to read the next pong message
	pongWait = 60 * time.Second

	//send ping to peers with this period
	pingPeriod = (pongWait * 9) / 10

	maxMessageSize = 512
)

type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		_ = c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws: unexpected close: %v", err)
			}
			break
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod) //returns ticker struct whcih has an internal timer and channel named c
	//ticker.c will get the time.Now() value when the tick happens .
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		case message, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage) //starts writing new websocket textframe
			if err != nil {
				return
			}
			if _, err := w.Write(message); err != nil {
				_ = w.Close()
				return
			}
			n := len(c.send)
			for i := 0; i < n; i++ {
				if m := <-c.send; m != nil {
					if _, err := w.Write(m); err != nil {
						_ = w.Close()
						return
					}
				}
			}
			if err := w.Close(); err != nil {
				return
			}
		}
	}

}
