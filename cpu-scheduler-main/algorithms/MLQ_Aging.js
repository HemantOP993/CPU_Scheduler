class MLQAging {
  constructor() {
    this.AGING_THRESHOLD = 50;
  }

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
      result.gantt_chart = [];
      result.process_stats = [];
      return result;
    }

    let queues = Array.from({ length: numQueues }, () => []);
    let timeQuanta = Array.from({ length: numQueues }, (_, i) => baseQuantum * (1 << i));

    let remainingBT = sorted.map(p => p.burst_time);
    let isCompleted = Array(n).fill(false);
    let completionTime = Array(n).fill(0);
    let queueAssignment = sorted.map(p => Math.min(p.priority, numQueues - 1));
    let waitingSince = sorted.map(p => p.arrival_time);
    let totalWait = Array(n).fill(0);

    let currentTime = 0;
    let completed = 0;
    let currentProcessIndex = -1;
    let needNewGanttEntry = true;

    while (completed < n) {
      let queueChanged = false;

      for (let i = 0; i < n; i++) {
        if (!isCompleted[i] && sorted[i].arrival_time === currentTime) {
          queues[queueAssignment[i]].push(i);
          queueChanged = true;
        }
      }

      // Aging promotion
      for (let q = 1; q < numQueues; q++) {
        const promote = [];
        for (let idx of queues[q]) {
          if (currentTime - waitingSince[idx] >= this.AGING_THRESHOLD) {
            promote.push(idx);
            queueChanged = true;
          }
        }

        for (let i of promote) {
          queues[q] = queues[q].filter(x => x !== i);
          queues[q - 1].push(i);
          queueAssignment[i] = q - 1;
          waitingSince[i] = currentTime;
        }
      }

      if (queueChanged && ganttChart.length) {
        ganttChart[ganttChart.length - 1].end_time = currentTime;
        needNewGanttEntry = true;
      }

      let activeQueue = queues.findIndex(q => q.length > 0);

      if (activeQueue === -1) {
        if (
          needNewGanttEntry ||
          !ganttChart.length ||
          ganttChart[ganttChart.length - 1].process_id !== -1
        ) {
          if (ganttChart.length) {
            ganttChart[ganttChart.length - 1].end_time = currentTime;
          }

          let queuesSnapshot = queues.map(q =>
            q.map(idx => sorted[idx].p_id)
          );

          ganttChart.push({
            process_id: -1,
            start_time: currentTime,
            queue_level: -1,
            queues: queuesSnapshot
          });

          needNewGanttEntry = false;
        }

        let nextArrival = Math.min(
          ...sorted
            .map((p, i) => (!isCompleted[i] && p.arrival_time > currentTime ? p.arrival_time : Infinity))
        );

        if (nextArrival === Infinity) break;
        currentTime = nextArrival;
        continue;
      }

      const pi = queues[activeQueue].shift();

      if (
        needNewGanttEntry ||
        currentProcessIndex !== pi ||
        !ganttChart.length ||
        ganttChart[ganttChart.length - 1].process_id !== sorted[pi].p_id ||
        ganttChart[ganttChart.length - 1].queue_level !== activeQueue
      ) {
        if (ganttChart.length) {
          ganttChart[ganttChart.length - 1].end_time = currentTime;
        }

        let queuesSnapshot = queues.map(q =>
          q.map(idx => sorted[idx].p_id)
        );

        ganttChart.push({
          process_id: sorted[pi].p_id,
          start_time: currentTime,
          queue_level: activeQueue,
          queues: queuesSnapshot
        });

        needNewGanttEntry = false;
      }

      currentProcessIndex = pi;

      currentTime++;
      remainingBT[pi]--;

      // Update wait times
      for (let i = 0; i < n; i++) {
        if (!isCompleted[i] && i !== pi && sorted[i].arrival_time < currentTime) {
          totalWait[i]++;
        }
      }

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
          completion_time: completionTime[pi],
          turnaround_time: tat,
          waiting_time: wt,
          final_queue: queueAssignment[pi]
        });

        needNewGanttEntry = true;
      } else {
        const timeSlice = timeQuanta[activeQueue];
        const runtime = sorted[pi].burst_time - remainingBT[pi];

        if (runtime % timeSlice === 0) {
          queues[activeQueue].push(pi);
          waitingSince[pi] = currentTime;
          needNewGanttEntry = true;
        } else {
          queues[activeQueue].unshift(pi);
        }
      }

      // Recheck for aging promotions again
      let promoted = false;
      for (let q = 1; q < numQueues; q++) {
        for (let it = 0; it < queues[q].length; ) {
          const i = queues[q][it];
          if (currentTime - waitingSince[i] >= this.AGING_THRESHOLD) {
            queues[q].splice(it, 1);
            queues[q - 1].push(i);
            queueAssignment[i] = q - 1;
            waitingSince[i] = currentTime;
            promoted = true;
          } else {
            it++;
          }
        }
      }

      if (promoted) needNewGanttEntry = true;
    }

    if (ganttChart.length && !("end_time" in ganttChart[ganttChart.length - 1])) {
      ganttChart[ganttChart.length - 1].end_time = currentTime;
    }

    result.gantt_chart = ganttChart;
    result.process_stats = processStats;
    return result;
  }
}

module.exports = MLQAging;
