package api

import (
	"encoding/json"
	"net/http"
)

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	var users struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
		Role     string `json:"role"`
	}

	err := json.NewDecoder(r.Body).Decode(&users)
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
}
