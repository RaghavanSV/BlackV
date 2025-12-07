package profiles

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

func WriteJson(w http.ResponseWriter, j interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(j)
}

func ListProfileHandler(w http.ResponseWriter, r *http.Request) {
	WriteJson(w, GetAll())
}

func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	p, ok := Get(id)
	if !ok {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}
	WriteJson(w, p)
}

func CreateProfileHandler(w http.ResponseWriter, r *http.Request) {
	var p C2Profile

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Bad json", http.StatusBadRequest)
		return
	}

	p = Create(p)
	WriteJson(w, p)
}

func UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	var p C2Profile

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Bad Json", http.StatusBadRequest)
		return
	}

	id := p.ID

	out, ok := Update(id, p)

	if !ok {
		http.Error(w, "Profile Not Found", http.StatusNotFound)
		return
	}

	WriteJson(w, out)
}

func DeleteProfileHandler(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	ok := Delete(id)
	if !ok {
		http.Error(w, "Profile Not Found", http.StatusNotFound)
		return
	}
	w.Write([]byte("Deleted"))
}
