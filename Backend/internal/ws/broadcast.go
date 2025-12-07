package ws

import (
	"encoding/json"
	"log"
)

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"data"`
}

func BroadcastEvent(evtType string, payload interface{}) {
	if hubInstance == nil {
		log.Println("ws: hub not set, cannot broadcast event")
		return
	}

	ev := Event{
		Type:    evtType,
		Payload: payload,
	}

	data, err := json.Marshal(ev)
	if err != nil {
		log.Println("ws: failed to marshal event %s: %v", evtType, err)
		return
	}

	hubInstance.BroadcastRaw(data)
}

func BroadcastAgentOnline(id, hostname, ip, os, user string) {
	BroadcastEvent("agent_created", map[string]string{
		"id":       id,
		"hostname": hostname,
		"ip":       ip,
		"os":       os,
		"user":     user,
		"status":   "active",
	})
}

func BroadcastTaskresult(agentID, taskID, command, result string) {
	BroadcastEvent("task_result", map[string]string{
		"agent_id": agentID,
		"task_id":  taskID,
		"command":  command,
		"result":   result,
	})
}

func BroadcastTaskCreated(agentID, taskID, uiid, command string) {
	BroadcastEvent("task_created", map[string]string{
		"agent_id": agentID,
		"task_id":  taskID,
		"ui_id":    uiid,
		"command":  command,
	})
}
