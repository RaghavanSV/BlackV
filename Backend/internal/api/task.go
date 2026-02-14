package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/RaghavanSV/BlackV/Backend/internal/jobs"
	"github.com/RaghavanSV/BlackV/Backend/internal/ws"
)

type TaskCreateRequest struct {
	AgentID string `json:"agentID"`
	Command string `json:"command"`
	Profile string `json:"profile"`
}

type TaskCreateResponse struct {
	Success   bool   `json:"success"`
	UIID      string `json:"id"` //since UUID will be for frontend but at backend will be using task_id
	TaskID    string `json:"task_id"`
	AgentID   string `json:"agent"`
	Command   string `json:"command"`
	Profile   string `json:"profile"`
	Status    string `json:"status"`
	CreatedAT string `json:"createdAT"`
}

func TaskHandler(w http.ResponseWriter, r *http.Request) {
	var req TaskCreateRequest

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid Request Body", http.StatusBadRequest)
		return
	}

	if req.AgentID == "" || req.Command == "" {
		http.Error(w, "Missing agent_id or command", http.StatusBadRequest)
		return
	}

	//add task
	task := jobs.AddTask(req.AgentID, req.Command)

	//broadcast task
	ws.BroadcastTaskCreated(req.AgentID, task.TaskID, task.UIID, req.Command)

	ui_resp := TaskCreateResponse{
		Success:   true,
		UIID:      task.UIID,
		TaskID:    task.TaskID,
		Command:   task.Command,
		AgentID:   req.AgentID,
		Profile:   req.Profile,
		Status:    "Pending",
		CreatedAT: time.Now().UTC().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ui_resp) // same as data, _ := json.marshal(ui_resp); w.Write(data)
}

func ResultsHandler(w http.ResponseWriter, r *http.Request) {

}
