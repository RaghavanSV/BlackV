package api

import (
	"encoding/json"
	"log"
	"net/http"

	//local
	"github.com/RaghavanSV/BlackV/Backend/internal/agents"
	"github.com/RaghavanSV/BlackV/Backend/internal/jobs"
	"github.com/RaghavanSV/BlackV/Backend/internal/ws"
)

type CheckinRequest struct {
	ID                string `json:"id"`
	Hostname          string `json:"hostname"`
	IP                string `json:"ip"`
	OS_version        string `json:"os_version"`
	OS_build          string `json:"os_build"`
	Architecture      string `json:"architecture"`
	User              string `json:"user"`
	Process_ID        string `json:"process_id"`
	Process_Name      string `json:"process_name"`
	Internal_IP       string `json:"internal_ip"`
	External_IP       string `json:"external_ip"`
	Domain            string `json:"domain"`
	IS_Admin          string `json:"is_admin"`
	AV_Products       string `json:"av_products"`
	Beacon_start_time string `json:"beacon_start_time"`
	First_checkin     string `json:"first_checkin"`
	Implant_version   string `json:"implant_version"`
	Beacon_key        string `json:"beacon_key"`
	Timestamp         string `json:"timestamp"`
	Status            string `json:"status"`
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
	ws.BroadcastAgentOnline(req.ID, req.Hostname, req.IP, req.OS_version, req.User)

	task := jobs.GetNextTask(req.ID)
	log.Println("entered the checkin Handler function and passed the GetNextTask: ", task)
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
