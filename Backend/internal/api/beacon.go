package api

import (
	"encoding/json"
	"net/http"

	//local
	"github.com/RaghavanSV/BlackV/Backend/internal/agents"
	"github.com/RaghavanSV/BlackV/Backend/internal/jobs"
	"github.com/RaghavanSV/BlackV/Backend/internal/ws"
)

type CheckinRequest struct {
	ID       string `json:"id"`
	Hostname string `json:"hostname"`
	IP       string `json:"ip"`
	OS       string `json:"os"`
	User     string `json:"user"`
	Status   string `json:"status"`
}

type TaskRequest struct {
	ID string `json:"id"`
}

type ResultRequest struct {
	ID      string `json:"agent_id"`
	TaskID  string `json:"task_id"`
	Command string `json:"command"`
	Result  string `json:"data"`
}

func CheckinHandler(w http.ResponseWriter, r *http.Request) {
	var req CheckinRequest

	decoder := json.NewDecoder(r.Body)
	//decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	agents.RegisterOrUpdate(req.ID, req.Hostname) //agent'id and name of the host in whcih the agents is in

	//bradcast the agent's status
	ws.BroadcastAgentOnline(req.ID, req.Hostname, req.IP, req.OS, req.User)

	task := jobs.GetNextTask(req.ID)

	w.Write([]byte(task))
}

func ResultHandler(w http.ResponseWriter, r *http.Request) {
	var req ResultRequest

	decoder := json.NewDecoder(r.Body)
	//decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ws.BroadcastTaskresult(req.ID, req.TaskID, req.Command, req.Result)

	jobs.StoreResult(req.ID, req.TaskID, req.Command, req.Result)

	w.Write([]byte("ok"))
}
