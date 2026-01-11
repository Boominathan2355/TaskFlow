import React, { useState, useEffect, useRef } from 'react';
import { activityAPI } from '../../services';
import Avatar from '../atoms/Avatar';
import { format } from 'date-fns';
import { useSocket } from '../../contexts/SocketContext';
import {
    MessageSquare,
    ArrowRightLeft,
    FileText,
    UserPlus,
    PlusCircle,
    Activity,
    Trash2,
    Settings
} from 'lucide-react';

const ActivityLog = ({ projectId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    const fetchActivity = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const { data } = await activityAPI.getProjectActivity(projectId);
            setLogs(data.logs);
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchActivity(true);
        }
    }, [projectId]);

    useEffect(() => {
        if (socket && projectId) {
            socket.on('new_activity', (log) => {
                if (log.project === projectId || log.project?._id === projectId) {
                    setLogs(prev => [log, ...prev]);
                }
            });

            return () => {
                socket.off('new_activity');
            };
        }
    }, [socket, projectId]);

    const getActionConfig = (action) => {
        switch (action) {
            case 'task_moved':
            case 'stage_changed':
                return {
                    icon: ArrowRightLeft,
                    color: 'text-info',
                    bg: 'bg-info/10',
                    border: 'border-info/20'
                };
            case 'comment_added':
                return {
                    icon: MessageSquare,
                    color: 'text-warning',
                    bg: 'bg-warning/10',
                    border: 'border-warning/20'
                };
            case 'task_created':
                return {
                    icon: FileText,
                    color: 'text-success',
                    bg: 'bg-success/10',
                    border: 'border-success/20'
                };
            case 'task_assigned':
                return {
                    icon: UserPlus,
                    color: 'text-info',
                    bg: 'bg-info/10',
                    border: 'border-info/20'
                };
            case 'task_deleted':
                return {
                    icon: Trash2,
                    color: 'text-destructive',
                    bg: 'bg-destructive/10',
                    border: 'border-destructive/20'
                };
            case 'project_created':
                return {
                    icon: Settings,
                    color: 'text-primary',
                    bg: 'bg-primary/10',
                    border: 'border-primary/20'
                };
            default:
                return {
                    icon: Activity,
                    color: 'text-slate-600',
                    bg: 'bg-slate-50 dark:bg-slate-900/20',
                    border: 'border-slate-100 dark:border-slate-800'
                };
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/30 dark:bg-transparent">
            <div className="p-6 pb-2">
                <h2 className="text-xl font-bold text-foreground">Activity Log</h2>
                <p className="text-sm text-muted-foreground mt-1">Recent activity in this project</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-xl border border-border/50"></div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                            <Activity className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground font-medium">No activity recorded yet</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">Activities will appear here as the team works</p>
                    </div>
                ) : (
                    logs.map((log) => {
                        const config = getActionConfig(log.action);
                        const ActionIcon = config.icon;

                        return (
                            <div
                                key={log._id}
                                className="group flex items-center px-4 py-3.5 bg-background border border-border/50 rounded-xl hover:border-primary/20 hover:shadow-sm transition-all duration-200"
                            >
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center mr-4`}>
                                    <ActionIcon className={`w-5 h-5 ${config.color}`} />
                                </div>

                                <div className="flex-shrink-0 mr-3">
                                    <Avatar
                                        src={log.user?.avatar}
                                        fallback={log.user?.name?.charAt(0)}
                                        alt={log.user?.name}
                                        size="sm"
                                        className="ring-2 ring-background border border-border/50"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                        <span className="font-semibold text-foreground mr-1">{log.user?.name}</span>
                                        <span className="text-muted-foreground">{log.description.replace(log.user?.name, '').trim()}</span>
                                    </p>
                                </div>

                                <div className="flex-shrink-0 ml-4 text-right">
                                    <p className="text-xs font-medium text-slate-400 whitespace-nowrap">
                                        {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ActivityLog;
