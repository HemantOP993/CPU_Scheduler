class MLQ {
  schedule(processes, numQueues, baseQuantum) {
    if (numQueues <= 0 || baseQuantum <= 0) {
      return {
        status: "error",
        message: "Invalid number of queues or base quantum"
      };
    }

    let result = {};
    let ganttChart = [];
    let processStats = [];

    const sorted = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);
    const n = sorted.length;
    if (n === 0) {
      return { gantt_chart: [], process_stats: [] };
    }

    const queues = Array.from({ length: numQueues }, () => []);
    const timeQuanta = Array.from({ length: numQueues }, (_, i) => baseQuantum * (1 << i));

    const remainingBT = sorted.map(p => p.burst_time);
    const isCompleted = Array(n).fill(false);
    const completionTime = Array(n).fill(0);
    const queueAssignment = sorted.map(p => Math.min(p.priority % numQueues, numQueues - 1));

    let currentTime = 0;
    let completed = 0;
    let currentProcessId = -1;
    let lastProcessId = -1;
    let timeInCurrentProcess = 0;

    // Handle initial idle time
    if (sorted[0].arrival_time > 0) {
      ganttChart.push({
        process_id: -1,
        start_time: 0,
        end_time: sorted[0].arrival_time,
        queues: [],
        queue_level: -1
      });
      currentTime = sorted[0].arrival_time;
    }

    while (completed < n) {
      for (let i = 0; i < n; i++) {
        if (
          !isCompleted[i] &&
          sorted[i].arrival_time <= currentTime &&
          !queues[queueAssignment[i]].includes(i)
        ) {
          queues[queueAssignment[i]].push(i);
        }
      }

      let activeQueue = queues.findIndex(q => q.length > 0);

      if (activeQueue === -1) {
        let nextArrival = Math.min(
          ...sorted
            .map((p, i) =>
              !isCompleted[i] && p.arrival_time > currentTime ? p.arrival_time : Infinity
            )
        );

        if (nextArrival === Infinity) break;

        if (lastProcessId !== -1) ganttChart[ganttChart.length - 1].end_time = currentTime;

        ganttChart.push({
          process_id: -1,
          start_time: currentTime,
          end_time: nextArrival,
          queues: [],
          queue_level: -1
        });

        currentTime = nextArrival;
        lastProcessId = -1;
        continue;
      }

      const pi = queues[activeQueue].shift();
      currentProcessId = sorted[pi].p_id;

      if (currentProcessId !== lastProcessId) {
        if (lastProcessId !== -1) ganttChart[ganttChart.length - 1].end_time = currentTime;

        const queuesSnapshot = queues.map(q =>
          q.map(idx => sorted[idx].p_id)
        );

        ganttChart.push({
          process_id: currentProcessId,
          start_time: currentTime,
          queues: queuesSnapshot,
          queue_level: activeQueue
        });

        timeInCurrentProcess = 0;
      }

      lastProcessId = currentProcessId;

      const quantum = timeQuanta[activeQueue];
      const execTime = Math.min(quantum, remainingBT[pi]);
      currentTime += execTime;
      remainingBT[pi] -= execTime;
      timeInCurrentProcess += execTime;

      if (remainingBT[pi] === 0) {
        isCompleted[pi] = true;
        completed++;
        completionTime[pi] = currentTime;

        const tat = currentTime - sorted[pi].arrival_time;
        const wt = tat - sorted[pi].burst_time;

        processStats.push({
          process_id: sorted[pi].p_id,
          arrival_time: sorted[pi].arrival_time,
          burst_time: sorted[pi].burst_time,
          priority: sorted[pi].priority,
          completion_time: currentTime,
          turnaround_time: tat,
          waiting_time: wt,
          queue: activeQueue
        });
      } else {
        queues[activeQueue].push(pi);
      }

      // New arrivals during execution
      let newArrival = false;
      for (let i = 0; i < n; i++) {
        if (
          !isCompleted[i] &&
          sorted[i].arrival_time > currentTime - execTime &&
          sorted[i].arrival_time <= currentTime &&
          !queues[queueAssignment[i]].includes(i)
        ) {
          queues[queueAssignment[i]].push(i);
          newArrival = true;
        }
      }

      if (newArrival) {
        let higherPriorityArrived = queues
          .slice(0, activeQueue)
          .some(q => q.length > 0);

        if (higherPriorityArrived) {
          ganttChart[ganttChart.length - 1].end_time = currentTime;
          lastProcessId = -1;
        }
      }
    }

    if (ganttChart.length && ganttChart[ganttChart.length - 1].end_time === undefined) {
      ganttChart[ganttChart.length - 1].end_time = currentTime;
    }

    result.gantt_chart = ganttChart;
    result.process_stats = processStats;
    return result;
  }
}

module.exports = MLQ;
