'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    FolderPlus,
    Folder,
    MoreVertical,
    Loader2,
    Trash2,
    Grid3x3,
    List,
    ChevronDown,
    Briefcase,
    Heart,
    ShoppingBag,
    Palette,
    Lightbulb,
    Camera,
    Music,
    Book,
    Code,
    Leaf,
    File,
    MessageSquare,
    Edit2,
    Printer
} from 'lucide-react'
import { toast } from 'sonner'
import {
    createFolder,
    getFolders,
    deleteFolder,
    getFolderStats,
    getUserProfile,
    type CreateFolderInput as BaseFolderInput
} from '@/lib/actions/folders'

const FOLDER_COLORS = [
    { value: '#10b981', label: 'Green' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ef4444', label: 'Red' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#84cc16', label: 'Lime' },
]

const FOLDER_ICONS = [
    { value: 'Folder', icon: Folder, label: 'Folder' },
    { value: 'Briefcase', icon: Briefcase, label: 'Briefcase' },
    { value: 'Heart', icon: Heart, label: 'Heart' },
    { value: 'ShoppingBag', icon: ShoppingBag, label: 'Shopping' },
    { value: 'Palette', icon: Palette, label: 'Palette' },
    { value: 'Lightbulb', icon: Lightbulb, label: 'Idea' },
    { value: 'Camera', icon: Camera, label: 'Camera' },
    { value: 'Music', icon: Music, label: 'Music' },
    { value: 'Book', icon: Book, label: 'Book' },
    { value: 'Code', icon: Code, label: 'Code' },
    { value: 'Leaf', icon: Leaf, label: 'Nature' },
]

interface CreateFolderInput extends BaseFolderInput {
    color?: string
    icon?: string
}

interface Folder {
    id: string
    organizationId: string
    name: string
    description: string | null
    category: string
    createdBy: string
    createdAt: Date | null
    updatedAt: Date | null
    color?: string
    icon?: string
}

interface FolderWithStats extends Folder {
    stats?: {
        products: number
        comments: number
    }
    creatorName?: string
}

export default function FolderManager() {
    const router = useRouter()
    const { organization } = useOrganization()
    const { user } = useUser()

    const [folders, setFolders] = useState<FolderWithStats[]>([])
    const [filteredFolders, setFilteredFolders] = useState<FolderWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState('date')
    const [filterCategory, setFilterCategory] = useState('all')
    const [filterOwner, setFilterOwner] = useState('all')
    const [formData, setFormData] = useState<CreateFolderInput>({
        name: '',
        description: '',
        category: '',
        color: '#10b981',
        icon: 'Folder'
    })

    // Extract unique categories and owners from folders
    const categories = ['all', ...Array.from(new Set(folders.map(f => f.category)))]
    const owners = ['all', ...Array.from(new Set(folders.map(f => f.creatorName || f.createdBy)))]

    useEffect(() => {
        if (organization?.id) {
            fetchFolders()
        } else {
            setLoading(false)
        }
    }, [organization?.id])

    useEffect(() => {
        applyFilters()
    }, [folders, filterCategory, filterOwner, sortBy])

    const fetchFolders = async () => {
        if (!organization?.id) {
            setLoading(false)
            return
        }

        try {
            const result = await getFolders(organization.id)

            if (result.success && result.data) {
                // Fetch stats and user profiles for each folder
                const foldersWithData = await Promise.all(
                    result.data.map(async (folder) => {
                        const statsResult = await getFolderStats(folder.id)
                        const userResult = await getUserProfile(folder.createdBy)

                        return {
                            ...folder,
                            stats: statsResult.data,
                            creatorName: userResult.data?.fullName || 'Unknown User'
                        }
                    })
                )

                setFolders(foldersWithData)
            } else {
                toast.error('Error', {
                    description: result.error || 'Failed to load folders',
                })
            }
        } catch (error) {
            console.error('Error fetching folders:', error)
            toast.error('Error', {
                description: 'Failed to load folders',
            })
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = [...folders]

        if (filterCategory !== 'all') {
            filtered = filtered.filter(f => f.category === filterCategory)
        }

        if (filterOwner !== 'all') {
            filtered = filtered.filter(f => (f.creatorName || f.createdBy) === filterOwner)
        }

        if (sortBy === 'date') {
            filtered.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
        } else if (sortBy === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name))
        }

        setFilteredFolders(filtered)
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.category || !organization?.id || !user?.id) {
            toast.error('Validation Error', {
                description: 'Please fill in all required fields',
            })
            return
        }

        setSubmitting(true)

        try {
            const result = await createFolder(
                organization.id,
                user.id,
                user.emailAddresses[0]?.emailAddress || '',
                formData,
                user.fullName,
                user.imageUrl
            )

            if (result.success) {
                toast.success('Success', {
                    description: 'Folder created successfully'
                })

                setFormData({ name: '', description: '', category: '', color: '#10b981', icon: 'Folder' })
                setDialogOpen(false)
                await fetchFolders()
            } else {
                toast.error('Error', {
                    description: result.error || 'Failed to create folder',
                })
            }
        } catch (error) {
            console.error('Error creating folder:', error)
            toast.error('Error', {
                description: 'Failed to create folder',
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation()

        if (!organization?.id) return

        if (!confirm('Are you sure you want to delete this folder?')) return

        try {
            const result = await deleteFolder(folderId, organization.id)

            if (result.success) {
                toast.success('Success', {
                    description: 'Folder deleted successfully'
                })
                await fetchFolders()
            } else {
                toast.error('Error', {
                    description: result.error || 'Failed to delete folder',
                })
            }
        } catch (error) {
            console.error('Error deleting folder:', error)
            toast.error('Error', {
                description: 'Failed to delete folder',
            })
        }
    }

    const handleInputChange = (field: keyof CreateFolderInput, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleFolderClick = (folderId: string, folderName: string) => {
        router.push(`/dashboard/folder/${folderId}?name=${encodeURIComponent(folderName)}`)
    }

    const getIcon = (iconName?: string) => {
        const iconData = FOLDER_ICONS.find(i => i.value === iconName)
        return iconData ? iconData.icon : Folder
    }

    if (!organization) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">
                    Please select or create an organization to manage folders
                </p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
                    <p className="text-sm text-muted-foreground">
                        Organization: {organization.name}
                    </p>
                </div>

                <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                    <FolderPlus className="h-4 w-4" />
                    Add new
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                Owner <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {owners.map(owner => (
                                <DropdownMenuItem key={owner} onClick={() => setFilterOwner(owner)}>
                                    {owner === 'all' ? 'All Owners' : owner}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                Category <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {categories.map(cat => (
                                <DropdownMenuItem key={cat} onClick={() => setFilterCategory(cat)}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                Date modified <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSortBy('date')}>Most Recent</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('name')}>Name</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                Most relevant <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSortBy('date')}>Most Relevant</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('name')}>Recently Updated</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Folders Grid/List */}
            <div className={viewMode === 'grid' ? 'flex flex-wrap gap-4' : 'flex flex-col gap-2'}>
                {/* New Project Button */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <div
                            className={
                                viewMode === 'grid'
                                    ? 'h-48 w-56 cursor-pointer rounded-lg border-2 border-dashed hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground'
                                    : 'h-20 cursor-pointer rounded-lg border-2 border-dashed hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2 text-muted-foreground'
                            }
                        >
                            <FolderPlus className="h-6 w-6" />
                            <span className="text-sm font-medium">New project</span>
                        </div>
                    </DialogTrigger>
                </Dialog>

                {filteredFolders.map((folder) => {
                    const IconComponent = getIcon(folder.icon)
                    const folderColor = folder.color || '#10b981'
                    const productCount = folder.stats?.products || 0
                    const commentCount = folder.stats?.comments || 0

                    // Format updated time
                    const updatedTime = folder.updatedAt
                        ? new Date(folder.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'Recently'

                    return (
                        <div
                            key={folder.id}
                            onClick={() => handleFolderClick(folder.id, folder.name)}
                            className={
                                viewMode === 'grid'
                                    ? 'group relative h-48 w-56 cursor-pointer rounded-lg border bg-card hover:shadow-md transition-all flex flex-col p-4'
                                    : 'group relative h-20 cursor-pointer rounded-lg border bg-card hover:shadow-md transition-all flex items-center px-6 gap-4'
                            }
                        >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out transform scale-95 group-hover:scale-100">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-xl border border-transparent hover:border-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                                        >
                                            <MoreVertical className="h-4 w-4 text-neutral-500" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        align="end"
                                        className="rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm min-w-40"
                                    >
                                        <DropdownMenuItem
                                            onClick={(e) => handleEdit(folder.id, e)}
                                            className="flex items-center px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors  cursor-pointer"
                                        >
                                            <Edit2 className="h-1 w-1 mr-2 text-neutral-500" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => handlePrint(folder.id, e)}
                                            className="flex items-center px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors  cursor-pointer"
                                        >
                                            <Printer className="h-4 w-4 mr-2 text-neutral-500" />
                                            Print
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={(e) => handleDelete(folder.id, e)}
                                            className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors  cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>


                            {viewMode === 'grid' ? (
                                <>
                                    <div
                                        className="w-12 h-12 rounded-md flex items-center justify-center text-white"
                                        style={{ backgroundColor: folderColor }}
                                    >
                                        <IconComponent className="h-6 w-6" />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-semibold text-base mb-1 line-clamp-2">{folder.name}</h3>
                                            <p className="text-xs text-muted-foreground">Updated {updatedTime}</p>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                            <div className="flex items-center gap-1">
                                                <File className="h-3.5 w-3.5" />
                                                <span>{productCount}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                <span>{commentCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-4 flex-1">
                                    <div
                                        className="w-10 h-10 rounded-md flex items-center justify-center text-white flex-shrink-0"
                                        style={{ backgroundColor: folderColor }}
                                    >
                                        <IconComponent className="h-5 w-5" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm">{folder.name}</h3>
                                        <p className="text-xs text-muted-foreground">Updated {updatedTime}</p>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mr-6">
                                        <div className="flex items-center gap-1">
                                            <File className="h-3.5 w-3.5" />
                                            <span>{productCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            <span>{commentCount}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {filteredFolders.length === 0 && folders.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center w-full">
                        <p className="text-sm text-muted-foreground">
                            No folders match the current filters.
                        </p>
                    </div>
                )}

                {folders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center w-full">
                        <p className="text-sm text-muted-foreground">
                            Click the &apos;New project&apos; button to create your first folder.
                        </p>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>Create a new folder</DialogTitle>
                        <DialogDescription>Fill in the details below to create a new folder.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Folder Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Product 01"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category *</Label>
                            <Input
                                id="category"
                                placeholder="e.g. Healthcare, Skincare, Beauty..."
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Short description of a folder..."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {FOLDER_COLORS.map(color => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => handleInputChange('color', color.value)}
                                        className={`w-10 h-10 rounded-lg transition-all ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : ''
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Icon</Label>
                            <div className="flex gap-2 flex-wrap">
                                {FOLDER_ICONS.map(icon => {
                                    const Icon = icon.icon
                                    return (
                                        <button
                                            key={icon.value}
                                            type="button"
                                            onClick={() => handleInputChange('icon', icon.value)}
                                            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${formData.icon === icon.value
                                                ? 'border-emerald-500 bg-emerald-50 scale-110'
                                                : 'border-gray-200 hover:border-emerald-300'
                                                }`}
                                            title={icon.label}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}