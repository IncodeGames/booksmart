import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TimeEntry, Client, TimerState } from '../types';
import TimerModal from '../components/TimerModal';
import TimeEntryList from '../components/TimeEntryList';
import { Play, Clock } from 'lucide-react';
import Sidebar from './Sidebar';
import './styles/TimeTracking.css';
import './styles/base.css';

const TimeTrackingPage = () => {
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [timer, setTimer] = useState<TimerState>({
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        description: '',
    });

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

    // Fetch clients
    const fetchClients = async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching clients:', error);
        } else {
            setClients(data || []);
        }
    };

    useEffect(() => {
        fetchTimeEntries();
        fetchClients();
    }, []);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer.isRunning && timer.startTime) {
            interval = setInterval(() => {
                setTimer(prev => ({
                    ...prev,
                    elapsedTime: Math.floor((Date.now() - prev.startTime!.getTime()) / 1000)
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer.isRunning, timer.startTime]);

    const startTimer = () => {
        const now = new Date();
        setTimer({
            isRunning: true,
            startTime: now,
            elapsedTime: 0,
            description: '',
        });
        setIsModalOpen(true);
    };

    const logTime = async () => {
        if (!timer.startTime) return;

        const endTime = new Date();
        const durationSeconds = Math.floor((endTime.getTime() - timer.startTime.getTime()) / 1000);

        const { error } = await supabase
            .from('time_entries')
            .insert([
                {
                    client_id: timer.client?.id || null,
                    description: timer.description || null,
                    start_time: timer.startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    duration: durationSeconds,
                },
            ]);

        if (error) {
            console.error('Error logging time:', error);
        } else {
            // Reset timer and close modal
            setTimer({
                isRunning: false,
                startTime: null,
                elapsedTime: 0,
                description: '',
            });
            setIsModalOpen(false);
            fetchTimeEntries();
        }
    };

    const discardTimer = () => {
        setTimer({
            isRunning: false,
            startTime: null,
            elapsedTime: 0,
            description: '',
        });
        setIsModalOpen(false);
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                        onClick={startTimer}
                        disabled={timer.isRunning}
                    >
                        <Play size={20} />
                        Start Timer
                    </button>
                </div>

                <TimeEntryList
                    timeEntries={timeEntries}
                    onRefresh={fetchTimeEntries}
                />

                <TimerModal
                    isOpen={isModalOpen || timer.isRunning}
                    timer={timer}
                    clients={clients}
                    onClientSelect={(client) => setTimer(prev => ({ ...prev, client }))}
                    onDescriptionChange={(description) => setTimer(prev => ({ ...prev, description }))}
                    onLogTime={logTime}
                    onDiscard={discardTimer}
                    formatTime={formatTime}
                />
            </div>
        </div>
    );
};

export default TimeTrackingPage;