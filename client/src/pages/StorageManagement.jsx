import React, { useState, useEffect } from 'react';
import {
    HardDrive,
    FileText,
    Image as ImageIcon,
    Film,
    File,
    Trash2,
    Search,
    Filter,
    Download,
    ExternalLink,
    AlertCircle,
    Loader2,
    Calendar,
    Database,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { storageAPI } from '../services';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';

const StorageManagement = () => {
    const [files, setFiles] = useState([]);
    const [stats, setStats] = useState({ totalFiles: 0, totalSize: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isDeleting, setIsDeleting] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const { data } = await storageAPI.getFiles();
            setFiles(data.files);
            setStats(data.stats);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch files:', err);
            setError('Failed to load storage data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (filename) => {
        if (!window.confirm('Are you sure you want to permanently delete this file? This action cannot be undone.')) {
            return;
        }

        try {
            setIsDeleting(filename);
            await storageAPI.deleteFile(filename);
            setFiles(files.filter(f => f.filename !== filename));
            // Update stats locally
            const deletedFile = files.find(f => f.filename === filename);
            if (deletedFile) {
                setStats(prev => ({
                    totalFiles: prev.totalFiles - 1,
                    totalSize: prev.totalSize - deletedFile.size
                }));
            }
        } catch (err) {
            console.error('Failed to delete file:', err);
            alert('Failed to delete file');
        } finally {
            setIsDeleting(null);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimetype) => {
        if (mimetype.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
        if (mimetype.startsWith('video/')) return <Film className="w-4 h-4 text-purple-500" />;
        if (mimetype.startsWith('text/') || mimetype.includes('pdf') || mimetype.includes('word'))
            return <FileText className="w-4 h-4 text-emerald-500" />;
        return <File className="w-4 h-4 text-slate-400" />;
    };

    const filteredFiles = files.filter(file => {
        const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' ||
            (filterType === 'image' && file.mimetype.startsWith('image/')) ||
            (filterType === 'document' && (file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.startsWith('text/'))) ||
            (filterType === 'other' && !file.mimetype.startsWith('image/') && !file.mimetype.includes('pdf') && !file.mimetype.includes('word') && !file.mimetype.startsWith('text/'));
        return matchesSearch && matchesType;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium animate-pulse">Scanning server storage...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Database className="w-8 h-8 text-primary" />
                        Storage Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor and manage all uploaded file assets across the platform.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Usage</span>
                        <span className="text-2xl font-black text-foreground">{formatSize(stats.totalSize)}</span>
                    </div>
                    <div className="h-10 w-px bg-border/60 mx-2" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">File Count</span>
                        <span className="text-2xl font-black text-foreground">{stats.totalFiles}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Images', count: files.filter(f => f.mimetype.startsWith('image/')).length, icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Documents', count: files.filter(f => f.mimetype.includes('pdf') || f.mimetype.includes('word') || f.mimetype.startsWith('text/')).length, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Remaining', count: files.filter(f => !f.mimetype.startsWith('image/') && !f.mimetype.includes('pdf') && !f.mimetype.includes('word') && !f.mimetype.startsWith('text/')).length, icon: File, color: 'text-slate-500', bg: 'bg-slate-500/10' }
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between">
                            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="text-2xl font-black">{stat.count}</span>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4 ml-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Tools & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-muted/30 p-4 rounded-2xl border border-border/40">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                    <Input
                        placeholder="Search filenames..."
                        className="pl-10 bg-background border-border/60 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="h-10 px-4 rounded-xl border border-border/60 bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="image">Images</option>
                        <option value="document">Documents</option>
                        <option value="other">Other</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={fetchFiles} className="h-10 w-10">
                        <Clock className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Files Table */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden border-border/60">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">File Details</th>
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Size</th>
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Type</th>
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px]">Uploaded At</th>
                                <th className="px-6 py-5 font-bold text-foreground/70 uppercase tracking-widest text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredFiles.map((file) => (
                                <tr key={file.filename} className="group hover:bg-muted/20 transition-all">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/40 group-hover:border-primary/20 transition-colors cursor-pointer"
                                                onClick={() => setSelectedFile(file)}
                                            >
                                                {file.mimetype.startsWith('image/') ? (
                                                    <img src={file.url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    getFileIcon(file.mimetype)
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <button
                                                    onClick={() => setSelectedFile(file)}
                                                    className="text-left font-bold text-foreground truncate max-w-[200px] leading-tight hover:text-primary transition-colors"
                                                    title={file.filename}
                                                >
                                                    {file.filename}
                                                </button>
                                                <span className="text-[10px] text-muted-foreground uppercase font-black opacity-60 mt-0.5">
                                                    ID: {file.filename.split('-')[1]?.substring(0, 8)}...
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-mono text-xs font-bold bg-muted/60 px-2 py-1 rounded-md">
                                            {formatSize(file.size)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge variant="secondary" className="bg-muted/50 text-[10px] border-none font-black tracking-tighter uppercase">
                                            {file.mimetype.split('/')[1]?.toUpperCase() || 'FILE'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4 opacity-50" />
                                            <span className="font-medium whitespace-nowrap">{format(new Date(file.createdAt), 'MMM d, p')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                                title="View/Open"
                                            >
                                                <ExternalLink className="w-4.5 h-4.5" />
                                            </a>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                disabled={isDeleting === file.filename}
                                                onClick={() => handleDelete(file.filename)}
                                                className="h-9 w-9 bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive hover:text-white transition-all shadow-none"
                                            >
                                                {isDeleting === file.filename ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredFiles.length === 0 && (
                        <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-muted/5">
                            <AlertCircle className="w-10 h-10 text-muted-foreground/30" />
                            <p className="text-muted-foreground font-medium">No files found matching your criteria</p>
                            <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterType('all'); }}>
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Storage Tips/Info */}
            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                <div className="flex gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-xl h-fit">
                        <HardDrive className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground">Storage Best Practices</h4>
                        <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                            To maintain optimal server performance, regularly audit large files and remove unused assets.
                            Users are restricted to 5MB per upload. Deleted files represent permanent removals from the disk storage
                            and cannot be recovered.
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Server Clean</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Audit Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* File Preview Modal */}
            {selectedFile && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedFile(null)}
                >
                    <div
                        className="bg-card w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md"
                        >
                            <AlertCircle className="w-6 h-6 rotate-45" />
                        </button>

                        <div className="flex flex-col md:flex-row h-full">
                            {/* Preview Area */}
                            <div className="flex-[2] bg-black/40 flex items-center justify-center p-4 min-h-[300px]">
                                {selectedFile.mimetype.startsWith('image/') ? (
                                    <img
                                        src={selectedFile.url}
                                        alt={selectedFile.filename}
                                        className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg"
                                    />
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-24 h-24 bg-muted/20 rounded-3xl flex items-center justify-center mx-auto border border-border/50">
                                            {React.cloneElement(getFileIcon(selectedFile.mimetype), { className: "w-12 h-12" })}
                                        </div>
                                        <p className="text-muted-foreground font-medium">No visual preview available for this file type</p>
                                    </div>
                                )}
                            </div>

                            {/* Info Sidebar */}
                            <div className="flex-1 p-8 bg-card flex flex-col justify-between border-l border-border/60">
                                <div className="space-y-6">
                                    <div>
                                        <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-none">
                                            {selectedFile.mimetype.toUpperCase()}
                                        </Badge>
                                        <h3 className="text-xl font-black text-foreground leading-tight break-all">
                                            {selectedFile.filename}
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-lg">
                                                <HardDrive className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">File Size</p>
                                                <p className="font-bold">{formatSize(selectedFile.size)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-lg">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Uploaded On</p>
                                                <p className="font-bold">{format(new Date(selectedFile.createdAt), 'MMMM d, yyyy')}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-lg">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Last Accessed</p>
                                                <p className="font-bold">{format(new Date(selectedFile.createdAt), 'p')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 space-y-3">
                                    <a
                                        href={selectedFile.url}
                                        download
                                        className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download File
                                    </a>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12"
                                        onClick={() => handleDelete(selectedFile.filename)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Asset
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorageManagement;
