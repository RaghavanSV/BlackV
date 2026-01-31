package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/RaghavanSV/BlackV/Backend/internal/auth"
	"github.com/RaghavanSV/BlackV/Backend/internal/transport"
	"github.com/RaghavanSV/BlackV/Backend/internal/ws"
)

func main() {

	if err := auth.LoadUsers(); err != nil {
		log.Printf("[!] auth: failed to load users.json: %v\n", err)
	} else {
		log.Printf("[+] auth: Users Loaded Successfully\n")
	}

	// start websocket hub
	hub := ws.NewHub()
	go hub.Run()

	ws.SetHub(hub)

	// create router
	handler := transport.NewRouter()

	addr := ":8080"
	if v := os.Getenv("BLACKV_ADDR"); v != "" {
		addr = v
	}

	srv := &http.Server{
		Handler:      handler,
		Addr:         addr,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Printf("[+] BlackV backend listening on %s\n", addr)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
