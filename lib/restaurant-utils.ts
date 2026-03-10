export interface WorkingHour {
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_day_off: boolean;
}

export function isRestaurantOpen(
    status: 'open' | 'closed' | 'paused' | string | undefined,
    workingHours: WorkingHour[] | null
): { isOpen: boolean; message: string; color: string } {
    // 1. Manual status override
    if (status === 'closed') {
        return { isOpen: false, message: 'Closed (Manual)', color: 'bg-destructive' };
    }
    if (status === 'paused') {
        return { isOpen: false, message: 'Paused (Manual)', color: 'bg-orange-500' };
    }

    // 2. Schedule check
    if (!workingHours || workingHours.length === 0) {
        // If no schedule, fallback to manual status or just "Open"
        return status === 'open'
            ? { isOpen: true, message: 'Open', color: 'bg-green-500' }
            : { isOpen: false, message: 'Closed', color: 'bg-destructive' };
    }

    const now = new Date();
    const todayIdx = now.getDay(); // 0 is Sunday, 1 is Monday...
    const todaySchedule = workingHours.find(h => h.day_of_week === todayIdx);

    if (!todaySchedule || todaySchedule.is_day_off) {
        return { isOpen: false, message: 'Day-off', color: 'bg-destructive' };
    }

    const [openH, openM] = todaySchedule.open_time.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close_time.split(':').map(Number);

    const openDate = new Date(now);
    openDate.setHours(openH, openM, 0, 0);

    const closeDate = new Date(now);
    closeDate.setHours(closeH, closeM, 0, 0);

    // Handle cases where close time is after midnight (e.g., 02:00)
    if (closeDate < openDate) {
        closeDate.setDate(closeDate.getDate() + 1);
    }

    const isOpen = now >= openDate && now < closeDate;

    if (isOpen) {
        return {
            isOpen: true,
            message: `Open until ${todaySchedule.close_time.slice(0, 5)}`,
            color: 'bg-green-500'
        };
    } else {
        // Determine if it's "not yet open" or "already closed"
        if (now < openDate) {
            return {
                isOpen: false,
                message: `Closed. Opens at ${todaySchedule.open_time.slice(0, 5)}`,
                color: 'bg-destructive'
            };
        } else {
            return {
                isOpen: false,
                message: 'Already closed',
                color: 'bg-destructive'
            };
        }
    }
}
