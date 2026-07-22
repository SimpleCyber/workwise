import { Paperclip, Smile, XIcon } from "lucide-react";
import Image from "next/image";
import Quill, { type QuillOptions } from "quill";
import type { Delta, Op } from "quill/core";
import "quill/dist/quill.snow.css";
import {
  type MutableRefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { MdSend, MdGroup } from "react-icons/md";
import { PiTextAa } from "react-icons/pi";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EmojiPopover } from "./emoji-popover";
import { Hint } from "./hint";

import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { useGetUrl } from "@/features/upload/api/use-get-url";
import { useFeatureFlags } from "@/components/feature-flags";

import BlotFormatter from "quill-blot-formatter";

const Embed = Quill.import("blots/embed") as any;

class MentionBlot extends Embed {
  static create(data: { id: string; value: string }) {
    const node = super.create() as HTMLElement;
    node.innerText = `@${data.value}`;
    node.setAttribute("data-id", data.id);
    node.setAttribute("data-value", data.value);
    node.setAttribute("spellcheck", "false");
    node.className =
      "mention cursor-pointer hover:underline bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 px-1 py-0.5 rounded-sm font-medium";
    return node;
  }

  static value(node: HTMLElement) {
    return {
      id: node.getAttribute("data-id"),
      value: node.getAttribute("data-value"),
    };
  }
}

MentionBlot.blotName = "mention";
MentionBlot.tagName = "span";

Quill.register(MentionBlot, true);
Quill.register("modules/blotFormatter", BlotFormatter);

type EditorValue = {
  image: File | null;
  body: string;
};

interface EditorProps {
  onSubmit: ({ image, body }: EditorValue) => void;
  onCancel?: () => void;
  placeholder?: string;
  defaultValue?: Delta | Op[];
  disabled?: boolean;
  innerRef?: MutableRefObject<Quill | null>;
  variant?: "create" | "update";
  members?: Array<{
    _id: string;
    user: {
      name?: string;
      image?: string;
      email?: string;
    } | null;
  }>;
}

const Editor = ({
  onCancel,
  onSubmit,
  placeholder = "Write something...",
  defaultValue = [],
  disabled = false,
  innerRef,
  variant = "create",
  members = [],
}: EditorProps) => {
  const { isEnabled } = useFeatureFlags();
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { mutate: getUrl } = useGetUrl();

  const generateUploadUrlRef = useRef(generateUploadUrl);
  const getUrlRef = useRef(getUrl);

  useLayoutEffect(() => {
    generateUploadUrlRef.current = generateUploadUrl;
    getUrlRef.current = getUrl;
  }, [generateUploadUrl, getUrl]);

  // Mention State
  const [mentionState, setMentionState] = useState({
    isOpen: false,
    query: "",
    index: -1,
    bounds: { top: 0, left: 0, bottom: 0, right: 0 },
    selectedIndex: 0,
  });

  const mentionStateRef = useRef(mentionState);
  useEffect(() => {
    mentionStateRef.current = mentionState;
  }, [mentionState]);

  const filteredMembers = useMemo(() => {
    let result: any[] = [];
    const query = mentionState.query.toLowerCase();

    if ("everyone".includes(query) || "all".includes(query) || query === "") {
      result.push({
        isAll: true,
        user: { name: "Everyone", email: "Everyone in this space" },
      });
    }

    const matchedMembers =
      members?.filter(
        (m) =>
          m.user?.name?.toLowerCase().includes(query) ||
          m.user?.email?.toLowerCase().includes(query),
      ) || [];

    result = [...result, ...matchedMembers];
    return result.slice(0, 10);
  }, [members, mentionState.query]);

  const filteredMembersRef = useRef(filteredMembers);
  useEffect(() => {
    filteredMembersRef.current = filteredMembers;
  }, [filteredMembers]);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<Quill | null>(null);

  const submitRef = useRef(onSubmit);
  const placeholderRef = useRef(placeholder);
  const defaultValueRef = useRef(defaultValue);
  const disabledRef = useRef(disabled);

  useLayoutEffect(() => {
    submitRef.current = onSubmit;
    placeholderRef.current = placeholder;
    defaultValueRef.current = defaultValue;
    disabledRef.current = disabled;
  });

  const insertMentionRef = useRef<(member: any) => void>();
  insertMentionRef.current = (member: any) => {
    const quill = quillRef.current;
    if (!quill) return;

    const { index, query } = mentionStateRef.current;
    const name = member.isAll ? "Everyone" : member.user?.name || "Unknown";
    const id = member.isAll ? "all" : member._id;

    quill.deleteText(index, query.length + 1);
    quill.insertEmbed(index, "mention", { id, value: name }, "user");
    quill.insertText(index + 1, " ", "user");
    quill.setSelection(index + 2, 0);

    setMentionState((prev) => ({
      ...prev,
      isOpen: false,
      query: "",
      index: -1,
      selectedIndex: 0,
    }));
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const editorContainer = container.appendChild(
      container.ownerDocument.createElement("div"),
    );

    const options: QuillOptions = {
      modules: {
        blotFormatter: {
          overlay: {
            style: {
              border: "2px solid #2563eb",
              backgroundColor: "transparent",
            },
          },
        },
        toolbar: [
          ["bold", "italic", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
        ],
        keyboard: {
          bindings: {
            mentionUp: {
              key: "ArrowUp",
              handler: () => {
                if (mentionStateRef.current.isOpen) {
                  setMentionState((prev) => ({
                    ...prev,
                    selectedIndex: Math.max(0, prev.selectedIndex - 1),
                  }));
                  return false;
                }
                return true;
              },
            },
            mentionDown: {
              key: "ArrowDown",
              handler: () => {
                if (mentionStateRef.current.isOpen) {
                  setMentionState((prev) => ({
                    ...prev,
                    selectedIndex: Math.min(
                      filteredMembersRef.current.length - 1,
                      prev.selectedIndex + 1,
                    ),
                  }));
                  return false;
                }
                return true;
              },
            },
            mentionEscape: {
              key: "Escape",
              handler: () => {
                if (mentionStateRef.current.isOpen) {
                  setMentionState((prev) => ({ ...prev, isOpen: false }));
                  return false;
                }
                return true;
              },
            },
            enter: {
              key: "Enter",
              handler: () => {
                if (mentionStateRef.current.isOpen) {
                  const selected =
                    filteredMembersRef.current[
                      mentionStateRef.current.selectedIndex
                    ];
                  if (selected && insertMentionRef.current) {
                    insertMentionRef.current(selected);
                  }
                  return false;
                }

                const text = quill.getText();

                if (!imageElementRef.current || !submitRef.current) return true;

                const addedImage = imageElementRef.current.files?.[0] || null;

                const isEmpty =
                  !addedImage &&
                  text.replace(/<(.|\n)*?>/g, "").trim().length === 0;

                if (isEmpty) return true;

                const body = JSON.stringify(quill.getContents());

                submitRef.current({ body, image: addedImage });
                return false;
              },
            },
            shift_enter: {
              key: "Enter",
              shiftKey: true,
              handler: () => {
                quill.insertText(quill.getSelection()?.index || 0, "\n");
              },
            },
          },
        },
      },
      placeholder: placeholderRef.current,
      theme: "snow",
    };

    const quill = new Quill(editorContainer, options);

    // Hide toolbar by default
    const toolbarElement = container.querySelector(".ql-toolbar");
    if (toolbarElement) {
      toolbarElement.classList.add("hidden");
    }

    quillRef.current = quill;
    quillRef.current.focus();

    const handleImageFile = async (file: File) => {
      try {
        const postUrl = await generateUploadUrlRef.current(
          {},
          { throwError: true },
        );
        if (!postUrl) return;

        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) throw new Error("Upload failed");

        const { storageId } = await result.json();
        const imageUrl = await getUrlRef.current(
          { storageId },
          { throwError: true },
        );
        if (!imageUrl) return;

        const range = quill.getSelection(true);
        const index = range ? range.index : quill.getLength();

        quill.insertEmbed(index, "image", imageUrl, "user");

        setTimeout(() => {
          const img = container.querySelector(
            `img[src="${imageUrl}"]`,
          ) as HTMLImageElement;
          if (img) {
            img.width = 300;
          }

          if (quillRef.current) {
            const currentSelection = quillRef.current.getSelection();
            if (
              currentSelection &&
              currentSelection.index === index + 1 &&
              currentSelection.length === 0
            ) {
              quillRef.current.setSelection(index, 1);
            }
          }
        }, 50);
      } catch (error) {
        console.error("Failed to handle image", error);
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          e.stopPropagation();
          const file = items[i].getAsFile();
          if (file) handleImageFile(file);
          return;
        }
      }
    };

    const handleDrop = (e: DragEvent) => {
      const items = e.dataTransfer?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          e.stopPropagation();
          const file = items[i].getAsFile();
          if (file) handleImageFile(file);
          return;
        }
      }
    };

    quill.root.addEventListener("paste", handlePaste, true);
    quill.root.addEventListener("drop", handleDrop, true);

    if (innerRef) innerRef.current = quill;

    quill.setContents(defaultValueRef.current);
    setText(quill.getText());

    quill.on(Quill.events.TEXT_CHANGE, (delta, oldDelta, source) => {
      setText(quill.getText());

      if (source === "user") {
        const range = quill.getSelection();
        if (range) {
          const textBeforeCursor = quill.getText(0, range.index);
          const match = /(?:^|\s)@([A-Za-z0-9ÅÄÖåäö\u00C0-\u017F_.\-@]*)$/.exec(
            textBeforeCursor,
          );

          if (match && match[1].length < 30) {
            const query = match[1];
            const atIndex = range.index - query.length - 1;
            const bounds = quill.getBounds(atIndex);

            if (bounds) {
              setMentionState({
                isOpen: true,
                query,
                index: atIndex,
                bounds: {
                  top: bounds.top,
                  left: bounds.left,
                  bottom: bounds.bottom,
                  right: bounds.right,
                },
                selectedIndex: 0,
              });
            } else {
              setMentionState((prev) =>
                prev.isOpen ? { ...prev, isOpen: false } : prev,
              );
            }
          } else {
            setMentionState((prev) =>
              prev.isOpen ? { ...prev, isOpen: false } : prev,
            );
          }
        }
      } else {
        setMentionState((prev) =>
          prev.isOpen ? { ...prev, isOpen: false } : prev,
        );
      }
    });

    quill.on(Quill.events.SELECTION_CHANGE, (range) => {
      if (!range) {
        setTimeout(
          () =>
            setMentionState((prev) =>
              prev.isOpen ? { ...prev, isOpen: false } : prev,
            ),
          150,
        );
      }
    });

    return () => {
      if (container) container.innerHTML = "";

      quill.off(Quill.events.TEXT_CHANGE);
      quill.off(Quill.events.SELECTION_CHANGE);

      quill.root.removeEventListener("paste", handlePaste, true);
      quill.root.removeEventListener("drop", handleDrop, true);

      if (quillRef) quillRef.current = null;
      if (innerRef) innerRef.current = null;
    };
  }, [innerRef]);

  const toggleToolbar = () => {
    setIsToolbarVisible((current) => !current);

    const toolbarElement = containerRef.current?.querySelector(".ql-toolbar");

    if (toolbarElement) toolbarElement.classList.toggle("hidden");
  };

  const onEmojiSelect = (emoji: string) => {
    const quill = quillRef.current;

    if (!quill) return;

    quill.insertText(quill.getSelection()?.index || 0, emoji);
  };

  const isIOS = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent);

  const isEmpty = !image && text.replace(/<(.|\n)*?>/g, "").trim().length === 0;

  return (
    <div className="flex flex-col w-full ">
      <input
        type="file"
        accept="image/*"
        ref={imageElementRef}
        onChange={(e) => setImage(e.target.files![0])}
        className="hidden"
      />

      <div
        className={cn(
          "flex flex-col rounded-md border border-border bg-background transition focus-within:border-accent-foreground/20 focus-within:shadow-sm",
          disabled && "opacity-50",
        )}
      >
        <div
          ref={containerRef}
          className="h-full ql-container-wrapper relative [&_img]:rounded-md [&_img]:border"
        >
          {mentionState.isOpen && (
            <div
              className="absolute z-[99999] bg-background border border-border rounded-lg shadow-xl w-72 max-h-80 overflow-y-auto flex flex-col py-1"
              style={{
                top: (mentionState.bounds.top || 0) - 10,
                left: mentionState.bounds.left || 0,
                transform: "translateY(-100%)",
              }}
            >
              <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                People
              </div>
              {filteredMembers.map((member, i) => (
                <div
                  key={member.isAll ? "all" : member._id}
                  className={cn(
                    "flex items-center gap-x-3 px-3 py-2 cursor-pointer transition-colors",
                    i === mentionState.selectedIndex
                      ? "bg-muted"
                      : "hover:bg-muted/50",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (insertMentionRef.current) {
                      insertMentionRef.current(member);
                    }
                  }}
                  onMouseEnter={() =>
                    setMentionState((prev) => ({ ...prev, selectedIndex: i }))
                  }
                >
                  <div className="flex-shrink-0">
                    {member.isAll ? (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                        <MdGroup className="size-4" />
                      </div>
                    ) : member.user?.image ? (
                      <Image
                        src={member.user.image}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center text-xs font-bold">
                        {member.user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {member.isAll
                        ? "Everyone"
                        : member.user?.name || "Unknown"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {member.isAll
                        ? "Everyone in this space"
                        : member.user?.email || ""}
                    </span>
                  </div>
                </div>
              ))}
              {filteredMembers.length === 0 && (
                <div className="px-3 py-4 text-sm text-center text-muted-foreground">
                  No people found
                </div>
              )}
            </div>
          )}
        </div>

        {!!image && (
          <div className="p-2">
            <div className="group/image relative flex size-[62px] items-center justify-center">
              <Hint label="Remove image">
                <button
                  onClick={() => {
                    setImage(null);

                    imageElementRef.current!.value = "";
                  }}
                  className="absolute -right-2.5 -top-2.5 z-[4] hidden size-6 items-center justify-center rounded-full border-2 border-white bg-black/70 text-white hover:bg-black group-hover/image:flex"
                >
                  <XIcon className="size-3.5" />
                </button>
              </Hint>

              <Image
                src={URL.createObjectURL(image)}
                alt="Uploaded image"
                width={800}
                height={600}
                className="overflow-hidden rounded-xl border object-cover"
              />
            </div>
          </div>
        )}

        <div className="z-[5] flex px-2 pb-2 mt-auto">
          <Hint
            label={isToolbarVisible ? "Hide formatting" : "Show formatting"}
          >
            <Button
              disabled={disabled}
              size="iconSm"
              variant="ghost"
              onClick={toggleToolbar}
            >
              <PiTextAa className="size-4" />
            </Button>
          </Hint>

          {variant === "create" && isEnabled("chat_file_attachments") && (
            <Hint label="Image">
              <Button
                disabled={disabled}
                size="iconSm"
                variant="ghost"
                onClick={() => imageElementRef.current?.click()}
              >
                <Paperclip className="size-4" />
              </Button>
            </Hint>
          )}

          <EmojiPopover onEmojiSelect={onEmojiSelect}>
            <Button disabled={disabled} size="iconSm" variant="ghost">
              <Smile className="size-4" />
            </Button>
          </EmojiPopover>

          {variant === "update" && (
            <div className="ml-auto flex items-center gap-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={disabled}
              >
                Cancel
              </Button>

              <Button
                disabled={disabled || isEmpty}
                onClick={() => {
                  if (!quillRef.current) return;

                  onSubmit({
                    body: JSON.stringify(quillRef.current.getContents()),
                    image,
                  });
                }}
                size="sm"
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Save
              </Button>
            </div>
          )}

          {variant === "create" && (
            <Button
              title="Send Message"
              disabled={disabled || isEmpty}
              onClick={() => {
                if (!quillRef.current) return;

                onSubmit({
                  body: JSON.stringify(quillRef.current.getContents()),
                  image,
                });
              }}
              className={cn(
                "ml-auto",
                isEmpty
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : "bg-rose-600 text-white hover:bg-rose-700",
              )}
              size="iconSm"
            >
              <MdSend className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
