"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { aiTreeService } from "@/lib/ai-service";
import { useCreateAIGeneratedTree } from "../api/use-ai-tree-generation";
import { Id } from "../../../../convex/_generated/dataModel";

interface AITreeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function AITreeDialog({
  isOpen,
  onClose,
  workspaceId,
}: AITreeDialogProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const createAITree = useCreateAIGeneratedTree();

  const handleGenerate = async () => {
    if (!projectTitle.trim() || !projectDescription.trim()) {
      toast.error("Please provide both project title and description");
      return;
    }

    setIsGenerating(true);
    try {
      // Generate tree structure using AI
      const treeData =
        await aiTreeService.generateProjectTree(projectDescription);

      // Create the tree in the database
      await createAITree({
        workspaceId: workspaceId as Id<"workspaces">,
        rootTitle: projectTitle,
        rootDescription: projectDescription,
        treeData,
        rootPosition: { x: 400, y: 100 },
      });

      toast.success("AI-generated project tree created successfully!");
      onClose();
      setProjectTitle("");
      setProjectDescription("");
    } catch (error) {
      console.error("AI Tree Generation Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate project tree",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Generate Project Tree with AI
          </DialogTitle>
          <DialogDescription>
            Describe your project and let AI create a detailed hierarchical
            breakdown for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">Project Title</Label>
            <Input
              id="project-title"
              placeholder="e.g., E-commerce Mobile App"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Project Description</Label>
            <Textarea
              id="project-description"
              placeholder="Describe your project in detail. Include features, target audience, technology stack, and any specific requirements..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              disabled={isGenerating}
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">AI will create:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 3-7 main project areas with clear titles</li>
              <li>• Detailed descriptions for each node (2-3 sentences)</li>
              <li>• Child nodes breaking down complex areas</li>
              <li>• Hierarchical structure with proper relationships</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Tree
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
