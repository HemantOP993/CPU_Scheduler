class MLFQ {
  constructor(timeSlice = 2, numQueues = 3) {
    this.baseTimeSlice = timeSlice;
    this.numQueues = numQueues;
  }

  getTimeSliceForQueue(queueLevel) {
    if (queueLevel === this.numQueues - 1) return Number.MAX_SAFE_INTEGER;
    return this.baseTimeSlice * (1 << queueLevel);
  }

  schedule(processes) {
    let ganttChart = [];
    let processStats = [];

    const sortedProcesses = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);
    const n = sortedProcesses.length;

    const remainingBurstTime = Array(n).fill(0).map((_, i) => sortedProcesses[i].burst_time);
    const isCompleted = Array(n).fill(false);
    const queueLevel = Array(n).fill(0);
    const timeInCurrentSlice = Array(n).fill(0);

    let currentTime = 0;
    let completed = 0;
    let lastProcessId = -1;

    while (completed < n) {
      let selectedIndex = -1;
      let highestPriorityQueue = this.numQueues;

      for (let i = 0; i < n; i++) {
        if (!isCompleted[i] && sortedProcesses[i].arrival_time <= currentTime) {
          if (queueLevel[i] < highestPriorityQueue) {
            highestPriorityQueue = queueLevel[i];
            selectedIndex = i;
          }
        }
      }

      if (selectedIndex === -1) {
        if (lastProcessId !== -1) {
          ganttChart[ganttChart.length - 1].end_time = currentTime;
        }

        const queueStatus = {};
        for (let q = 0; q < this.numQueues; q++) {
          queueStatus[q] = [];
        }

        ganttChart.push({
          process_id: -1,
          start_time: currentTime,
          end_time: null,
          queue_level: -1,
          ready_queues: queueStatus
        });

        lastProcessId = -1;
        currentTime++;
        continue;
      }

      if (lastProcessId !== sortedProcesses[selectedIndex].p_id) {
        if (lastProcessId !== -1) {
          ganttChart[ganttChart.length - 1].end_time = currentTime;
        }

        const queueStatus = {};
        for (let q = 0; q < this.numQueues; q++) {
          queueStatus[q] = [];
        }

        for (let i = 0; i < n; i++) {
          if (!isCompleted[i] && sortedProcesses[i].arrival_time <= currentTime && i !== selectedIndex) {
            queueStatus[queueLevel[i]].push(sortedProcesses[i].p_id);
          }
        }

        ganttChart.push({
          process_id: sortedProcesses[selectedIndex].p_id,
          start_time: currentTime,
          end_time: null,
          queue_level: queueLevel[selectedIndex],
          ready_queues: queueStatus
        });

        lastProcessId = sortedProcesses[selectedIndex].p_id;
      }

      remainingBurstTime[selectedIndex]--;
      timeInCurrentSlice[selectedIndex]++;
      currentTime++;

      const currentTimeSlice = this.getTimeSliceForQueue(queueLevel[selectedIndex]);
      if (
        timeInCurrentSlice[selectedIndex] >= currentTimeSlice &&
        queueLevel[selectedIndex] < this.numQueues - 1
      ) {
        queueLevel[selectedIndex]++;
        timeInCurrentSlice[selectedIndex] = 0;

        ganttChart[ganttChart.length - 1].end_time = currentTime;
        lastProcessId = -1;
      }

      if (remainingBurstTime[selectedIndex] === 0) {
        isCompleted[selectedIndex] = true;
        completed++;
        timeInCurrentSlice[selectedIndex] = 0;

        const completionTime = currentTime;
        const turnaroundTime = completionTime - sortedProcesses[selectedIndex].arrival_time;
        const waitingTime = turnaroundTime - sortedProcesses[selectedIndex].burst_time;

        processStats.push({
          process_id: sortedProcesses[selectedIndex].p_id,
          arrival_time: sortedProcesses[selectedIndex].arrival_time,
          burst_time: sortedProcesses[selectedIndex].burst_time,
          priority: sortedProcesses[selectedIndex].priority,
          completion_time: completionTime,
          turnaround_time: turnaroundTime,
          waiting_time: waitingTime,
          final_queue_level: queueLevel[selectedIndex]
        });

        ganttChart[ganttChart.length - 1].end_time = currentTime;
        lastProcessId = -1;
      }

      // Check if any process arrives at this time and update the Gantt chart
      for (let i = 0; i < n; i++) {
        if (sortedProcesses[i].arrival_time === currentTime) {
          if (lastProcessId !== -1) {
            ganttChart[ganttChart.length - 1].end_time = currentTime;

            const runningIndex = sortedProcesses.findIndex(
              (p) => p.p_id === lastProcessId
            );

            if (runningIndex !== -1) {
              const queueStatus = {};
              for (let q = 0; q < this.numQueues; q++) {
                queueStatus[q] = [];
              }

              for (let j = 0; j < n; j++) {
                if (
                  !isCompleted[j] &&
                  sortedProcesses[j].arrival_time <= currentTime &&
                  sortedProcesses[j].p_id !== lastProcessId
                ) {
                  queueStatus[queueLevel[j]].push(sortedProcesses[j].p_id);
                }
              }

              ganttChart.push({
                process_id: lastProcessId,
                start_time: currentTime,
                end_time: null,
                queue_level: queueLevel[runningIndex],
                ready_queues: queueStatus
              });
            }
          }
          break;
        }
      }
    }

    if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].end_time === null) {
      ganttChart[ganttChart.length - 1].end_time = currentTime;
    }

    return {
      gantt_chart: ganttChart,
      process_stats: processStats
    };
  }
}

module.exports = MLFQ;
