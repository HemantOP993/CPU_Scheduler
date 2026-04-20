function rrSchedule(processes, timeSlice) {
    processes.sort((a, b) => a.arrival_time - b.arrival_time);

    if (processes.length === 0) return {};

    const ganttChart = [];
    const processStats = [];

    const n = processes.length;
    let currentTime = 0;

    const remainingTime = processes.map(p => p.burst_time);
    const completed = Array(n).fill(false);
    const completionTime = Array(n).fill(0);
    let completedCount = 0;

    const readyQueue = [];

    if (processes[0].arrival_time > 0) {
        ganttChart.push({
            process_id: -1,
            start_time: 0,
            end_time: processes[0].arrival_time,
            ready_queue: []
        });
        currentTime = processes[0].arrival_time;
    }

    for (let i = 0; i < n; i++) {
        if (processes[i].arrival_time <= currentTime) {
            readyQueue.push(i);
        }
    }

    while (completedCount < n) {
        if (readyQueue.length === 0) {
            let nextArrival = Number.MAX_SAFE_INTEGER;
            for (let i = 0; i < n; i++) {
                if (!completed[i] && processes[i].arrival_time > currentTime) {
                    nextArrival = Math.min(nextArrival, processes[i].arrival_time);
                }
            }

            if (nextArrival !== Number.MAX_SAFE_INTEGER) {
                ganttChart.push({
                    process_id: -1,
                    start_time: currentTime,
                    end_time: nextArrival,
                    ready_queue: []
                });
                currentTime = nextArrival;
                for (let i = 0; i < n; i++) {
                    if (!completed[i] && processes[i].arrival_time <= currentTime) {
                        readyQueue.push(i);
                    }
                }
            } else {
                break;
            }
        } else {
            const idx = readyQueue.shift();
            const executeTime = Math.min(timeSlice, remainingTime[idx]);
            const startTime = currentTime;
            const endTime = currentTime + executeTime;

            const arrivalPoints = new Set([startTime, endTime]);
            for (let i = 0; i < n; i++) {
                if (!completed[i] && processes[i].arrival_time > startTime && processes[i].arrival_time < endTime) {
                    arrivalPoints.add(processes[i].arrival_time);
                }
            }

            const sortedArrivals = [...arrivalPoints].sort((a, b) => a - b);

            for (let i = 0; i < sortedArrivals.length - 1; i++) {
                const segmentStart = sortedArrivals[i];
                const segmentEnd = sortedArrivals[i + 1];

                const currentReadyQueue = readyQueue.map(index => processes[index].p_id);

                ganttChart.push({
                    process_id: processes[idx].p_id,
                    start_time: segmentStart,
                    end_time: segmentEnd,
                    ready_queue: currentReadyQueue
                });

                for (let j = 0; j < n; j++) {
                    if (!completed[j] && processes[j].arrival_time === segmentEnd) {
                        readyQueue.push(j);
                    }
                }
            }

            currentTime = endTime;
            remainingTime[idx] -= executeTime;

            if (remainingTime[idx] === 0) {
                completed[idx] = true;
                completionTime[idx] = currentTime;
                completedCount++;
            } else {
                readyQueue.push(idx);
            }
        }
    }

    for (let i = 0; i < n; i++) {
        const turnaround = completionTime[i] - processes[i].arrival_time;
        const waiting = turnaround - processes[i].burst_time;
        processStats.push({
            process_id: processes[i].p_id,
            arrival_time: processes[i].arrival_time,
            burst_time: processes[i].burst_time,
            priority: processes[i].priority,
            completion_time: completionTime[i],
            turnaround_time: turnaround,
            waiting_time: waiting
        });
    }

    return {
        gantt_chart: ganttChart,
        process_stats: processStats
    };
}

module.exports = rrSchedule;
