package api

import (
	"encoding/json"
	"net/http"

	"github.com/RaghavanSV/BlackV/Backend/internal/auth"
)

// POST /api/login
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	if !auth.Authenticate(creds.Username, creds.Password) {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := auth.GenerateJWT(creds.Username)
	if err != nil {
		http.Error(w, "token error", http.StatusInternalServerError)
		return
	}

	data := auth.GetUser(creds.Username)

	WriteJson(w, map[string]string{
		"id":       data.UUID,
		"username": data.Username,
		"role":     data.Role,
		"email":    data.Email,
		"token":    token,
	})
}
