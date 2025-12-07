package api

import (
	"encoding/json"
	"net/http"

	"github.com/RaghavanSV/BlackV/Backend/internal/agents"
	"github.com/gorilla/mux"
)

// GET /agents
func ListAgentsHandler(w http.ResponseWriter, r *http.Request) {
	list := agents.List()
	WriteJson(w, list)
}

//GET /agents/{id}

func GetAgentHandler(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	a, ok := agents.Get(id)

	if !ok {
		http.Error(w, "Agent Not Found", http.StatusNotFound)
		return
	}

	WriteJson(w, a)
}

func WriteJson(w http.ResponseWriter, j interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(j)
}
