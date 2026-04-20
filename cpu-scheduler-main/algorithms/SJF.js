function SJF(processes) {
    // Deep copy and sort by arrival time
    let sorted = JSON.parse(JSON.stringify(processes)).sort((a, b) => a.arrival_time - b.arrival_time);
    let n = sorted.length;
    let current_time = 0;
    let completed = 0;
    let remaining_burst_time = sorted.map(p => p.burst_time);
    let is_completed = new Array(n).fill(false);

    let gantt_chart = [];
    let process_stats = [];

    let last_process_id = -1;

    while (completed < n) {
        let shortest_index = -1;
        let min_remaining_time = Infinity;

        for (let i = 0; i < n; i++) {
            if (sorted[i].arrival_time <= current_time && !is_completed[i] && remaining_burst_time[i] < min_remaining_time) {
                min_remaining_time = remaining_burst_time[i];
                shortest_index = i;
            }
        }

        if (shortest_index === -1) {
            if (last_process_id !== -1 && last_process_id !== -2) {
                if (gantt_chart.length > 0)
                    gantt_chart[gantt_chart.length - 1].end_time = current_time;
                gantt_chart.push({
                    process_id: -1,
                    start_time: current_time,
                    ready_queue: []
                });
                last_process_id = -2;
            }
            current_time++;
            continue;
        } else {
            if (last_process_id === -2 && gantt_chart.length > 0) {
                gantt_chart[gantt_chart.length - 1].end_time = current_time;
                last_process_id = -1;
            }
        }

        if (last_process_id !== sorted[shortest_index].p_id) {
            if (last_process_id >= 0 && gantt_chart.length > 0) {
                gantt_chart[gantt_chart.length - 1].end_time = current_time;
            }

            let ready_queue = [];
            for (let i = 0; i < n; i++) {
                if (!is_completed[i] && sorted[i].arrival_time <= current_time) {
                    ready_queue.push(sorted[i].p_id);
                }
            }

            gantt_chart.push({
                process_id: sorted[shortest_index].p_id,
                start_time: current_time,
                ready_queue
            });
        }

        last_process_id = sorted[shortest_index].p_id;

        // Execute for 1 unit
        remaining_burst_time[shortest_index]--;
        current_time++;

        // Check new arrival
        for (let i = 0; i < n; i++) {
            if (sorted[i].arrival_time === current_time && !is_completed[i]) {
                if (gantt_chart.length > 0)
                    gantt_chart[gantt_chart.length - 1].end_time = current_time;

                let ready_queue = [];
                for (let j = 0; j < n; j++) {
                    if (!is_completed[j] && sorted[j].arrival_time <= current_time) {
                        ready_queue.push(sorted[j].p_id);
                    }
                }

                gantt_chart.push({
                    process_id: sorted[shortest_index].p_id,
                    start_time: current_time,
                    ready_queue
                });
                break;
            }
        }

        // If process completes
        if (remaining_burst_time[shortest_index] === 0) {
            is_completed[shortest_index] = true;
            completed++;

            let completion_time = current_time;
            let turnaround_time = completion_time - sorted[shortest_index].arrival_time;
            let waiting_time = turnaround_time - sorted[shortest_index].burst_time;

            process_stats.push({
                process_id: sorted[shortest_index].p_id,
                arrival_time: sorted[shortest_index].arrival_time,
                burst_time: sorted[shortest_index].burst_time,
                priority: sorted[shortest_index].priority,
                completion_time,
                turnaround_time,
                waiting_time
            });
        }
    }

    if (gantt_chart.length > 0) {
        gantt_chart[gantt_chart.length - 1].end_time = current_time;
    }

    return {
        gantt_chart,
        process_stats
    };
}

module.exports = SJF;
