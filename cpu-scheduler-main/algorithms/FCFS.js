function fcfs(processes) {
    // Sort by arrival time
    const sorted = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);
    const gantt_chart = [];
    const process_stats = [];

    let current_time = 0;
    const completion_time = new Array(sorted.length).fill(0);

    if (sorted.length === 0) {
        return { gantt_chart: [], process_stats: [] };
    }

    if (sorted[0].arrival_time > 0) {
        gantt_chart.push({
            process_id: -1,
            start_time: 0,
            end_time: sorted[0].arrival_time,
            ready_queue: [],
        });
        current_time = sorted[0].arrival_time;
    }

    for (let i = 0; i < sorted.length; i++) {
        const p = sorted[i];

        if (current_time < p.arrival_time) {
            gantt_chart.push({
                process_id: -1,
                start_time: current_time,
                end_time: p.arrival_time,
                ready_queue: [],
            });
            current_time = p.arrival_time;
        }

        const process_start_time = current_time;
        const process_end_time = process_start_time + p.burst_time;

        const arrival_points = [];
        const ready_queues = [];

        // Initial ready queue
        const current_ready_queue = [];
        for (let j = i + 1; j < sorted.length; j++) {
            if (sorted[j].arrival_time <= current_time) {
                current_ready_queue.push(sorted[j].p_id);
            }
        }
        arrival_points.push(process_start_time);
        ready_queues.push(current_ready_queue);

        for (let j = 0; j < sorted.length; j++) {
            const arrival = sorted[j].arrival_time;
            if (arrival > process_start_time && arrival < process_end_time) {
                arrival_points.push(arrival);
            }
        }

        arrival_points.sort((a, b) => a - b);

        // Remove duplicates
        const unique_arrival_points = [...new Set(arrival_points)];
        for (let j = 1; j < unique_arrival_points.length; j++) {
            const ready_queue = [];
            for (let k = i + 1; k < sorted.length; k++) {
                if (sorted[k].arrival_time <= unique_arrival_points[j]) {
                    ready_queue.push(sorted[k].p_id);
                }
            }
            ready_queues.push(ready_queue);
        }

        unique_arrival_points.push(process_end_time);

        for (let j = 0; j < unique_arrival_points.length - 1; j++) {
            gantt_chart.push({
                process_id: p.p_id,
                start_time: unique_arrival_points[j],
                end_time: unique_arrival_points[j + 1],
                ready_queue: ready_queues[j],
            });
        }

        current_time = process_end_time;
        completion_time[i] = process_end_time;
    }

    for (let i = 0; i < sorted.length; i++) {
        const p = sorted[i];
        const comp_time = completion_time[i];
        const turnaround_time = comp_time - p.arrival_time;
        const waiting_time = turnaround_time - p.burst_time;

        process_stats.push({
            process_id: p.p_id,
            arrival_time: p.arrival_time,
            burst_time: p.burst_time,
            priority: p.priority || 0,
            completion_time: comp_time,
            turnaround_time,
            waiting_time,
        });
    }

    return {
        gantt_chart,
        process_stats,
    };
}

module.exports = fcfs;
