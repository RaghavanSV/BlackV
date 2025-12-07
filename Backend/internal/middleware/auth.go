package middleware

import (
	"net/http"
	"strings"

	"github.com/RaghavanSV/BlackV/Backend/internal/auth"
)

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "missing auth", http.StatusUnauthorized)
			return
		}

		// Expect: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "invalid header", http.StatusUnauthorized)
			return
		}

		username, err := auth.ValidateJWT(parts[1])
		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// Store username in context if you need it later
		_ = username

		next.ServeHTTP(w, r)
	})
}
