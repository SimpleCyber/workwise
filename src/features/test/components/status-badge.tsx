"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface StatusBadgeProps {
  status: string
  onChange: (status: string) => void
}

const statusColors = [
  { name: "in-progress", class: "bg-blue-100 text-blue-800" },
  { name: "blocked", class: "bg-red-100 text-red-800" },
  { name: "done", class: "bg-green-100 text-green-800" },
]

export function StatusBadge({ status, onChange }: StatusBadgeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempStatus, setTempStatus] = useState(status)

  const handleSave = () => {
    onChange(tempStatus)
    setIsEditing(false)
  }

  const currentStatusColor = statusColors.find((s) => s.name === status)?.class || statusColors[0].class

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={tempStatus}
          onChange={(e) => setTempStatus(e.target.value)}
          className="text-xs px-2 py-1 rounded border"
          onBlur={handleSave}
          autoFocus
        >
          {statusColors.map((statusOption) => (
            <option key={statusOption.name} value={statusOption.name}>
              {statusOption.name}
            </option>
          ))}
        </select>
        <Button size="sm" variant="ghost" onClick={handleSave} className="p-1 h-6 w-6">
          <Check className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <Badge
      variant="secondary"
      className={`text-xs cursor-pointer hover:opacity-80 ${currentStatusColor}`}
      onClick={() => setIsEditing(true)}
      title="Click to change status"
    >
      {status}
    </Badge>
  )
}
