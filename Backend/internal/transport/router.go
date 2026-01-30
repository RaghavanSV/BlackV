package transport

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"

	"github.com/RaghavanSV/BlackV/Backend/internal/api"
	"github.com/RaghavanSV/BlackV/Backend/internal/middleware"
	"github.com/RaghavanSV/BlackV/Backend/internal/profiles"
	"github.com/RaghavanSV/BlackV/Backend/internal/ws"
)

func NewRouter() http.Handler {
	r := mux.NewRouter()
	//middleware
	r.Use(requestLogger)
	//cors
	cors := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:8081", "http://127.0.0.1:8081"}),
		handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)
	// subrouter creation for /api

	apiBase := r.PathPrefix("/api").Subrouter()
	apiBase.HandleFunc("/checkin", api.CheckinHandler).Methods("POST")
	apiBase.HandleFunc("/task", api.TaskHandler).Methods("POST")
	apiBase.HandleFunc("/result", api.ResultHandler).Methods("POST")
	apiBase.HandleFunc("/login", api.LoginHandler).Methods("POST")

	//------------------------------------------------------------------
	// PROTECTED OPERATOR ROUTES (Require JWT)
	//------------------------------------------------------------------

	protected := r.PathPrefix("/api").Subrouter()
	protected.Use(middleware.RequireAuth)

	// Agents
	protected.HandleFunc("/agents", api.ListAgentsHandler).Methods("GET")
	protected.HandleFunc("/agents/{id}", api.GetAgentHandler).Methods("GET")

	// Agent → profile assignment
	//protected.HandleFunc("/agents/{id}/profile", api.GetAgentProfileHandler).Methods("GET")
	//protected.HandleFunc("/agents/{id}/profile", api.SetAgentProfileHandler).Methods("PUT")

	// Profiles CRUD
	protected.HandleFunc("/profiles", profiles.ListProfileHandler).Methods("GET")
	protected.HandleFunc("/profiles/{id}", profiles.GetProfileHandler).Methods("GET")
	protected.HandleFunc("/profiles", profiles.CreateProfileHandler).Methods("POST")
	protected.HandleFunc("/profiles/{id}", profiles.UpdateProfileHandler).Methods("PUT")
	protected.HandleFunc("/profiles/{id}", profiles.DeleteProfileHandler).Methods("DELETE")

	//ws
	r.HandleFunc("/ws", ws.WebSocketHandler)

	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}).Methods("GET")

	return cors(r)
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s %v\n", r.RemoteAddr, r.Method, r.RequestURI, time.Since(start))
	})

}
