package main

import (
    "log"
    "net/http"

    "github.com/gorilla/mux"
)

func main() {
    r := mux.NewRouter()

    // Temporary test route
    r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("BlackV Backend Running"))
    }).Methods("GET")

    log.Println("[+] BlackV C2 Backend Starting on :8080")
    http.ListenAndServe(":8080", r)
}
