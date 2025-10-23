import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TimeEntry } from '../types';
import TimeEntryList from '../components/TimeEntryList';
import { Play, Clock } from 'lucide-react';
import Sidebar from './Sidebar';
import { useTimerStore } from '../stores/timerStore';
import './styles/TimeTracking.css';
import './styles/base.css';

const TimeTrackingPage = () => {
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const { isRunning, startTimer } = useTimerStore();

    // Fetch time entries
    const fetchTimeEntries = async () => {
        const { data, error } = await supabase
            .from('time_entries')
            .select(`
        *,
        client:clients(*)
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching time entries:', error);
        } else {
            setTimeEntries(data || []);
        }
    };

    useEffect(() => {
        fetchTimeEntries();
    }, []);

    // Handler to start timer
    const handleStartTimer = () => {
        startTimer();
    };

    return (
        <div className="time-tracking-page">
            <Sidebar />
            <div className="page-content">
                <div className="page-header">
                    <h1>
                        <Clock className="header-icon" />
                        Time Tracking
                    </h1>
                    <button
                        className="start-timer-btn"
                        onClick={handleStartTimer}
                        disabled={isRunning}
                    >
                        <Play size={20} />
                        Start Timer
                    </button>
                </div>

                <TimeEntryList
                    timeEntries={timeEntries}
                    onRefresh={fetchTimeEntries}
                />
            </div>
        </div>
    );
};

export default TimeTrackingPage;