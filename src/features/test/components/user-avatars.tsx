"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, X } from "lucide-react";

interface User {
  id: string;
  name: string;
  initials: string;
}

interface UserAvatarsProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
}

const avatarColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-teal-500",
  "bg-yellow-500",
  "bg-gray-500",
];

export function UserAvatars({ users, onUsersChange }: UserAvatarsProps) {
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState("");

  const addUser = () => {
    if (newUserName.trim()) {
      const initials = newUserName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const newUser = {
        id: Date.now().toString(),
        name: newUserName.trim(),
        initials: initials,
      };
      onUsersChange([...users, newUser]);
      setNewUserName("");
      setShowUserForm(false);
    }
  };

  const removeUser = (userId: string) => {
    onUsersChange(users.filter((user) => user.id !== userId));
  };

  const visibleUsers = users.slice(0, 3);
  const remainingUsers = users.slice(3);
  const hasMoreUsers = remainingUsers.length > 0;

  return (
    <div className="flex items-center gap-1">
      {visibleUsers.map((user, index) => (
        <DropdownMenu key={user.id}>
          <DropdownMenuTrigger asChild>
            <div
              className={`w-6 h-6 rounded-full ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:scale-110 transition-transform`}
              title={`${user.name} - Click to edit/remove`}
            >
              {user.initials}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-2">
            <div className="text-xs font-medium mb-2">{user.name}</div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeUser(user.id)}
              className="w-full text-xs h-6"
            >
              Remove User
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      {hasMoreUsers && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:bg-gray-500 transition-colors">
              +{remainingUsers.length}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-2 space-y-1">
            {remainingUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-2 p-1"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full ${avatarColors[(index + 3) % avatarColors.length]} flex items-center justify-center text-white text-xs`}
                  >
                    {user.initials}
                  </div>
                  <span className="text-xs">{user.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeUser(user.id)}
                  className="p-1 h-5 w-5 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Add User Button */}
      <DropdownMenu open={showUserForm} onOpenChange={setShowUserForm}>
        <DropdownMenuTrigger asChild>
          <div className="w-6 h-6 rounded-full bg-dashed border-2 border-gray-300 border-dashed flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
            <Plus className="w-3 h-3 text-gray-400" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-3">
          <div className="space-y-2">
            <Input
              placeholder="Enter user name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") addUser();
                if (e.key === "Escape") setShowUserForm(false);
              }}
              autoFocus
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={addUser} className="text-xs h-6">
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowUserForm(false)}
                className="text-xs h-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
