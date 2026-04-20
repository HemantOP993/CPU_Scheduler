class Priority {
  schedule(processes) {
    const ganttChart = [];
    const processStats = [];

    const sorted = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);
    const n = sorted.length;
    const remainingBT = sorted.map(p => p.burst_time);
    const isCompleted = Array(n).fill(false);

    let currentTime = 0;
    let completed = 0;
    let lastProcessId = -1;

    while (completed < n) {
      let selected = -1;
      let highestPriority = Infinity;

      for (let i = 0; i < n; i++) {
        if (!isCompleted[i] && sorted[i].arrival_time <= currentTime) {
          if (
            sorted[i].priority < highestPriority ||
            (sorted[i].priority === highestPriority &&
              sorted[i].arrival_time < sorted[selected]?.arrival_time) ||
            (sorted[i].priority === highestPriority &&
              sorted[i].arrival_time === sorted[selected]?.arrival_time &&
              remainingBT[i] < remainingBT[selected])
          ) {
            highestPriority = sorted[i].priority;
            selected = i;
          }
        }
      }

      if (selected === -1) {
        if (lastProcessId !== -1 && lastProcessId !== -2) {
          ganttChart[ganttChart.length - 1].end_time = currentTime;
          ganttChart.push({
            process_id: -1,
            start_time: currentTime,
            ready_queue: []
          });
          lastProcessId = -2;
        }
        currentTime++;
        continue;
      } else if (lastProcessId === -2) {
        ganttChart[ganttChart.length - 1].end_time = currentTime;
        lastProcessId = -1;
      }

      if (lastProcessId !== sorted[selected].p_id) {
        if (lastProcessId >= 0) {
          ganttChart[ganttChart.length - 1].end_time = currentTime;
        }

        const readyQueue = [];
        for (let i = 0; i < n; i++) {
          if (!isCompleted[i] && sorted[i].arrival_time <= currentTime && i !== selected) {
            readyQueue.push(sorted[i].p_id);
          }
        }

        ganttChart.push({
          process_id: sorted[selected].p_id,
          start_time: currentTime,
          ready_queue: readyQueue
        });
      }

      lastProcessId = sorted[selected].p_id;

      remainingBT[selected]--;
      currentTime++;

      for (let i = 0; i < n; i++) {
        if (sorted[i].arrival_time === currentTime && !isCompleted[i]) {
          ganttChart[ganttChart.length - 1].end_time = currentTime;
          const readyQueue = [];
          for (let j = 0; j < n; j++) {
            if (!isCompleted[j] && sorted[j].arrival_time <= currentTime && j !== selected) {
              readyQueue.push(sorted[j].p_id);
            }
          }
          ganttChart.push({
            process_id: sorted[selected].p_id,
            start_time: currentTime,
            ready_queue: readyQueue
          });
          break;
        }
      }

      if (remainingBT[selected] === 0) {
        isCompleted[selected] = true;
        completed++;

        const completionTime = currentTime;
        const turnaroundTime = completionTime - sorted[selected].arrival_time;
        const waitingTime = turnaroundTime - sorted[selected].burst_time;

        processStats.push({
          process_id: sorted[selected].p_id,
          arrival_time: sorted[selected].arrival_time,
          burst_time: sorted[selected].burst_time,
          priority: sorted[selected].priority,
          completion_time: completionTime,
          turnaround_time: turnaroundTime,
          waiting_time: waitingTime
        });
      }
    }

    if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].end_time === undefined) {
      ganttChart[ganttChart.length - 1].end_time = currentTime;
    }

    return {
      gantt_chart: ganttChart,
      process_stats: processStats
    };
  }
}

module.exports = Priority;
