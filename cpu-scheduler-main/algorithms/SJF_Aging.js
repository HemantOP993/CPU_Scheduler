function sjfAgingScheduler(processes, agingThreshold = 50) {
    const AGING_FACTOR = agingThreshold / 100.0;

    processes = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);

    const n = processes.length;
    const remainingBurst = processes.map(p => p.burst_time);
    const waitTime = new Array(n).fill(0);
    const isCompleted = new Array(n).fill(false);

    const ganttChart = [];
    const processStats = [];

    let currentTime = 0;
    let completed = 0;
    let lastProcessId = -1;

    while (completed < n) {
        let selectedIndex = -1;
        let minAdjustedTime = Infinity;

        for (let i = 0; i < n; i++) {
            if (processes[i].arrival_time <= currentTime && !isCompleted[i]) {
                let adjustedTime = remainingBurst[i] - (AGING_FACTOR * waitTime[i]);
                adjustedTime = Math.max(adjustedTime, 0.5);

                if (adjustedTime < minAdjustedTime) {
                    minAdjustedTime = adjustedTime;
                    selectedIndex = i;
                }
            }
        }

        if (selectedIndex === -1) {
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
        } else {
            if (lastProcessId === -2) {
                ganttChart[ganttChart.length - 1].end_time = currentTime;
                lastProcessId = -1;
            }
        }

        if (lastProcessId !== processes[selectedIndex].p_id) {
            if (lastProcessId >= 0) {
                ganttChart[ganttChart.length - 1].end_time = currentTime;
            }

            let readyQueue = [];
            for (let i = 0; i < n; i++) {
                if (!isCompleted[i] && processes[i].arrival_time <= currentTime && i !== selectedIndex) {
                    readyQueue.push(processes[i].p_id);
                }
            }

            ganttChart.push({
                process_id: processes[selectedIndex].p_id,
                start_time: currentTime,
                ready_queue: readyQueue
            });
        }

        lastProcessId = processes[selectedIndex].p_id;

        remainingBurst[selectedIndex]--;
        currentTime++;

        for (let i = 0; i < n; i++) {
            if (!isCompleted[i] && processes[i].arrival_time <= currentTime && i !== selectedIndex) {
                waitTime[i]++;
            }
        }

        // Check for new arrival
        const newArrival = processes.some((p, i) =>
            p.arrival_time === currentTime && !isCompleted[i]
        );

        if (newArrival) {
            ganttChart[ganttChart.length - 1].end_time = currentTime;

            let readyQueue = [];
            for (let j = 0; j < n; j++) {
                if (!isCompleted[j] && processes[j].arrival_time <= currentTime && j !== selectedIndex) {
                    readyQueue.push(processes[j].p_id);
                }
            }

            ganttChart.push({
                process_id: processes[selectedIndex].p_id,
                start_time: currentTime,
                ready_queue: readyQueue
            });
        }

        if (remainingBurst[selectedIndex] === 0) {
            isCompleted[selectedIndex] = true;
            completed++;

            const completionTime = currentTime;
            const turnaroundTime = completionTime - processes[selectedIndex].arrival_time;
            const waitingTime = turnaroundTime - processes[selectedIndex].burst_time;

            processStats.push({
                process_id: processes[selectedIndex].p_id,
                arrival_time: processes[selectedIndex].arrival_time,
                burst_time: processes[selectedIndex].burst_time,
                priority: processes[selectedIndex].priority,
                completion_time: completionTime,
                turnaround_time: turnaroundTime,
                waiting_time: waitingTime,
                aging_wait_time: waitTime[selectedIndex]
            });
        }
    }

    if (ganttChart.length > 0) {
        ganttChart[ganttChart.length - 1].end_time = currentTime;
    }

    return {
        gantt_chart: ganttChart,
        process_stats: processStats
    };
}
