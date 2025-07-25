"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeProps,
  Position,
  addEdge,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PanelRight,
  PlusCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";

// --- Node Types ---
const TaskNode = ({ data }: NodeProps) => {
  const getStatusIcon = () => {
    switch (data.status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "in-progress":
        return "border-blue-200 bg-blue-50";
      case "pending":
        return "border-orange-200 bg-orange-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  return (
    <div
      className={`border rounded-lg shadow-md p-4 min-w-[280px] ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm">
          {data.title || "Untitled Task"}
        </h4>
        {getStatusIcon()}
      </div>
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
        {data.description || "Click to add description..."}
      </p>
      {data.priority && (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            data.priority === "high"
              ? "bg-red-100 text-red-700"
              : data.priority === "medium"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {data.priority} priority
        </span>
      )}
      {data.dueDate && (
        <div className="text-xs text-gray-500 mt-1">
          Due: {new Date(data.dueDate).toLocaleDateString()}
        </div>
      )}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

const CategoryNode = ({ data }: NodeProps) => (
  <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4 min-w-[200px] text-center shadow-lg">
    <h3 className="font-bold text-purple-800 text-lg">{data.label}</h3>
    <div className="text-sm text-purple-600 mt-1">
      {data.taskCount || 0} tasks
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
  </div>
);

const nodeTypes = {
  taskNode: TaskNode,
  categoryNode: CategoryNode,
};

export default function TaskOrganizer() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    label: "",
  });

  const initialNodes: Node[] = [
    {
      id: "category-1",
      type: "categoryNode",
      position: { x: 200, y: 50 },
      data: { label: "Work Tasks", taskCount: 2 },
    },
    {
      id: "category-2",
      type: "categoryNode",
      position: { x: 500, y: 50 },
      data: { label: "Personal", taskCount: 1 },
    },
    {
      id: "task-1",
      type: "taskNode",
      position: { x: 100, y: 200 },
      data: {
        title: "Complete project proposal",
        description: "Write and submit the Q4 project proposal",
        status: "in-progress",
        priority: "high",
        dueDate: "2025-08-01",
      },
    },
    {
      id: "task-2",
      type: "taskNode",
      position: { x: 300, y: 200 },
      data: {
        title: "Team meeting prep",
        description: "Prepare agenda and materials for weekly team meeting",
        status: "pending",
        priority: "medium",
        dueDate: "2025-07-26",
      },
    },
    {
      id: "task-3",
      type: "taskNode",
      position: { x: 500, y: 200 },
      data: {
        title: "Grocery shopping",
        description: "Buy ingredients for weekend cooking",
        status: "pending",
        priority: "low",
        dueDate: "2025-07-27",
      },
    },
  ];

  const initialEdges: Edge[] = [
    { id: "e1-1", source: "category-1", target: "task-1", type: "smoothstep" },
    { id: "e1-2", source: "category-1", target: "task-2", type: "smoothstep" },
    { id: "e2-3", source: "category-2", target: "task-3", type: "smoothstep" },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNode(node);
    setEditForm({
      title: node.data.title || "",
      description: node.data.description || "",
      status: node.data.status || "pending",
      priority: node.data.priority || "medium",
      dueDate: node.data.dueDate || "",
      label: node.data.label || "",
    });
    setDrawerOpen(true);
  }, []);

  const updateSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                ...editForm,
              },
            }
          : node,
      ),
    );
    setDrawerOpen(false);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id,
      ),
    );
    setDrawerOpen(false);
  };

  const addNewTask = () => {
    const newId = `task-${Date.now()}`;
    const newTask: Node = {
      id: newId,
      type: "taskNode",
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 250 },
      data: {
        title: "New Task",
        description: "",
        status: "pending",
        priority: "medium",
        dueDate: "",
      },
    };
    setNodes((prev) => [...prev, newTask]);
  };

  const addNewCategory = () => {
    const newId = `category-${Date.now()}`;
    const newCategory: Node = {
      id: newId,
      type: "categoryNode",
      position: { x: Math.random() * 400 + 100, y: 50 },
      data: { label: "New Category", taskCount: 0 },
    };
    setNodes((prev) => [...prev, newCategory]);
  };

  const getTaskStats = () => {
    const tasks = nodes.filter((node) => node.type === "taskNode");
    const completed = tasks.filter(
      (task) => task.data.status === "completed",
    ).length;
    const inProgress = tasks.filter(
      (task) => task.data.status === "in-progress",
    ).length;
    const pending = tasks.filter(
      (task) => task.data.status === "pending",
    ).length;

    return { total: tasks.length, completed, inProgress, pending };
  };

  const stats = getTaskStats();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800"> Task Organizer</h2>
          <div className="flex gap-2">
            <Button
              onClick={addNewTask}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="mr-2 w-4 h-4" />
              Add Task
            </Button>
            <Button onClick={addNewCategory} variant="outline">
              <PlusCircle className="mr-2 w-4 h-4" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <span className="bg-white px-3 py-1 rounded-full border">
            Total: {stats.total}
          </span>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
            Completed: {stats.completed}
          </span>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            In Progress: {stats.inProgress}
          </span>
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
            Pending: {stats.pending}
          </span>
        </div>
      </div>

      {/* React Flow Area */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          defaultEdgeOptions={{ animated: true, type: "smoothstep" }}
        >
          <Background color="#f0f0f0" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Side Drawer for Node Editing */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="p-6 max-w-md ml-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Edit {selectedNode?.type === "taskNode" ? "Task" : "Category"}
            </h3>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedNode}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {selectedNode?.type === "taskNode" ? (
              <>
                <Input
                  placeholder="Task Title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Task description..."
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={4}
                />
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={editForm.priority}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dueDate: e.target.value })
                  }
                />
              </>
            ) : (
              <Input
                placeholder="Category Name"
                value={editForm.label}
                onChange={(e) =>
                  setEditForm({ ...editForm, label: e.target.value })
                }
              />
            )}

            <div className="flex gap-2">
              <Button onClick={updateSelectedNode} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
