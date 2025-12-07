package profiles

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"github.com/google/uuid"
)

type C2Profile struct {
	ID          string `json:"id"`
	Name        string `json:name`
	Description string `json:description`
	Content     string `json:content`
}

var (
	profiles     = make(map[string]C2Profile)
	profilesLock sync.RWMutex
	storePath    = filepath.Join("data", "profiles.json")
)

func init() {
	_ = os.MkdirAll("data", 0755)
	loadProfiles()
}

func loadProfiles() { //read from file as json convert it to slice
	data, err := os.ReadFile(storePath)
	if err != nil {
		return
	}

	var list []C2Profile

	if err := json.Unmarshal(data, &list); err != nil {
		return
	}

	profilesLock.Lock()
	defer profilesLock.Unlock()

	for _, p := range list {
		profiles[p.ID] = p
	}

}

func saveProfiles() { //reads from map converting this go strcut to json fr storing to file
	profilesLock.RLock()
	defer profilesLock.RUnlock()
	list := make([]C2Profile, 0, len(profiles))

	for _, p := range profiles {
		list = append(list, p)
	}

	data, _ := json.MarshalIndent(list, "", " ")
	_ = os.WriteFile(storePath, data, 0644)
}

func GetAll() []C2Profile {
	profilesLock.RLock()
	defer profilesLock.RUnlock()

	list := make([]C2Profile, 0, len(profiles))

	for _, p := range profiles {
		list = append(list, p)
	}

	return list
}

func Get(id string) (C2Profile, bool) {
	profilesLock.RLock()
	defer profilesLock.RUnlock()

	p, ok := profiles[id]

	return p, ok
}

func Create(p C2Profile) C2Profile {
	p.ID = uuid.NewString()

	profilesLock.Lock()
	profiles[p.ID] = p
	profilesLock.Unlock()

	saveProfiles()

	return p
}

func Update(id string, p C2Profile) (C2Profile, bool) {
	profilesLock.Lock()
	defer profilesLock.Unlock()

	if _, ok := profiles[id]; !ok {
		return p, false
	}
	p.ID = id
	profiles[id] = p

	saveProfiles()
	return p, true
}

func Delete(id string) bool {
	profilesLock.Lock()
	defer profilesLock.Unlock()

	if _, exists := profiles[id]; !exists {
		return false
	}

	delete(profiles, id)
	saveProfiles()
	return true
}
