"use client"

import { useState, useEffect } from "react"
import { Shield, Lock, Search, Info } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input, Spinner, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui"
import { api } from "@/lib/api-client"

interface Permission {
    id: string
    name: string
    code: string
    module: string
    description?: string
}

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const data = await api.permissions.list()
                // If data.grouped is available, use it, otherwise fallback
                setPermissions(data.grouped || {})
            } catch (error) {
                console.error("Failed to fetch permissions:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPermissions()
    }, [])

    const filteredPermissions = Object.entries(permissions).reduce((acc, [module, perms]) => {
        const filtered = perms.filter(
            (p) =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (filtered.length > 0) {
            acc[module] = filtered
        }
        return acc
    }, {} as Record<string, Permission[]>)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Permissions</h1>
                    <p className="text-slate-500">
                        View all available system permissions and their associated modules.
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search permissions..."
                        className="pl-9 w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(filteredPermissions).map(([module, perms]) => (
                    <Card key={module} className="overflow-hidden border-slate-200">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-orange-600" />
                                    {module}
                                </CardTitle>
                                <Badge variant="outline" className="bg-white">
                                    {perms.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[315px] overflow-y-auto scroll-smooth divide-y divide-slate-100">
                                {perms.map((perm) => (
                                    <div key={perm.id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-sm font-medium text-slate-900">{perm.name}</p>
                                                        {perm.description && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="right" className="max-w-[250px]">
                                                                        <p>{perm.description}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                    <code className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono block w-fit">
                                                        {perm.code}
                                                    </code>
                                                </div>
                                            </div>
                                            <Lock className="h-3 w-3 text-slate-300 mt-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
