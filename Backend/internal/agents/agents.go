package agents

import (
	"log"
	"sync"
	"time"

	"github.com/RaghavanSV/BlackV/Backend/internal/ws"
)

type Agent struct {
	ID       string `json:"id"`
	Hostname string `json:"hostname"`
	IP       string `json:"ip"`
	OS       string `json:"os"`
	User     string `json:"user"`
	Status   string `json:"status"`
	LastSeen string `json:"last_seen"`
}

var (
	mu     sync.RWMutex
	active = make(map[string]*Agent)
)

func RegisterOrUpdate(id, hostname, ip, os, user, status string) {
	mu.Lock()
	defer mu.Unlock()

	ag, exist := active[id]
	//if not exist
	if !exist {
		ag := &Agent{
			ID:       id,
			Hostname: hostname,
			IP:       ip,
			OS:       os,
			User:     user,
			Status:   status,
			LastSeen: time.Now().UTC().Format(time.RFC3339),
		}

		active[id] = ag
		ws.BroadcastAgentOnline(id, hostname, ip, os, user)
		return
	}
	//if already exist update hostname and lastseen

	if ag.Hostname != hostname || ag.IP != ip || ag.User != user {
		ws.BroadcastAgentOnline(id, hostname, ip, os, user)
	}
	ag.Hostname = hostname
	ag.IP = ip
	ag.OS = os
	ag.User = user
	ag.LastSeen = time.Now().UTC().Format(time.RFC3339)
}

func List() []*Agent {
	mu.RLock()
	defer mu.RUnlock()

	list := make([]*Agent, 0, len(active))

	for _, a := range active {
		list = append(list, a)
	}
	log.Println("[+] inside the List fucntion for agents :", list)
	return list

}

func Get(id string) (*Agent, bool) {
	mu.RLock()
	defer mu.RUnlock()

	a, ok := active[id]
	return a, ok
}
