package jobs

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Task struct {
	TaskID  string `json:"task_id"`
	UIID    string `json:"ui_id"`
	Command string `json:"command"`
}

type Result struct {
	TaskID  string `json:"task_id"`
	UIID    string `json:"ui_id"`
	Command string `json:"command"`
	Output  string `json:"output"`
	Time    int64  `json:"time"`
}

var (
	mu          sync.Mutex
	taskMap     = make(map[string][]Task)
	resultMap   = make(map[string][]Result)
	taskCounter = 0
)

func newInternalTaskID() string { // universal unique identifier for internal usage
	return uuid.New().String()
}

func newUITaskID() string { //for ui , human readable
	taskCounter += 1
	return fmt.Sprintf("T%d", taskCounter)
}

func AddTask(agentID, command string) Task {
	mu.Lock()
	defer mu.Unlock()

	task := Task{
		TaskID:  newInternalTaskID(),
		UIID:    newUITaskID(),
		Command: command,
	}

	taskMap[agentID] = append(taskMap[agentID], task)

	log.Println("entered the Addtask function. here is the current taskmap : ", taskMap)
	return task
}

func GetNextTask(agentID string) string {
	mu.Lock()
	defer mu.Unlock()

	if len(taskMap[agentID]) == 0 {
		return ""
	}
	log.Println("entered the GetNextTask funtion")

	next := taskMap[agentID][0]
	taskMap[agentID] = taskMap[agentID][1:]

	type BeaconTask struct {
		TaskID  string `json:"task_id"`
		Command string `json:"command"`
	}

	bt := BeaconTask{
		TaskID:  next.TaskID,
		Command: next.Command,
	}

	b, _ := json.Marshal(bt)

	log.Println("entered the GetNextTask and it got : ", string(b))

	return string(b)
}

func StoreResult(agentID, taskID, command, output string) {
	mu.Lock()
	defer mu.Unlock()

	uiID := ""

	for _, t := range taskMap[agentID] {
		if t.TaskID == taskID {
			uiID = t.UIID
			break
		}
	}

	rt := Result{
		TaskID:  taskID,
		UIID:    uiID,
		Command: command,
		Output:  output,
		Time:    time.Now().Unix(),
	}

	resultMap[agentID] = append(resultMap[agentID], rt)

}

func GetResults(agentID string) []Result {
	mu.Lock()
	defer mu.Unlock()
	return resultMap[agentID]
}
