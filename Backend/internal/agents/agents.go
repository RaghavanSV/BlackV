package agents

import (
	"sync"
	"time"
)

type Agent struct {
	ID       string `json:"id"`
	Hostname string `json:"hostname"`
	LastSeen int64  `json:"last_seen"`
}

var (
	mu     sync.RWMutex
	active = make(map[string]*Agent)
)

func RegisterOrUpdate(id, hostname string) {
	mu.Lock()
	defer mu.Unlock()

	ag, exist := active[id]
	//if not exist
	if !exist {
		ag := &Agent{
			ID:       id,
			Hostname: hostname,
			LastSeen: time.Now().Unix(),
		}

		active[id] = ag
		return
	}
	//if already exist update hostname and lastseen
	ag.Hostname = hostname
	ag.LastSeen = time.Now().Unix()

}

func List() []*Agent {
	mu.RLock()
	defer mu.RUnlock()

	list := make([]*Agent, 0, len(active))

	for _, a := range active {
		list = append(list, a)
	}
	return list

}

func Get(id string) (*Agent, bool) {
	mu.RLock()
	defer mu.RUnlock()

	a, ok := active[id]
	return a, ok
}
