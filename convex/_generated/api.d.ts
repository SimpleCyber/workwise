/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as advancetree from "../advancetree.js";
import type * as attendance from "../attendance.js";
import type * as attendanceComments from "../attendanceComments.js";
import type * as auth from "../auth.js";
import type * as channels from "../channels.js";
import type * as conversations from "../conversations.js";
import type * as dataRoom from "../dataRoom.js";
import type * as http from "../http.js";
import type * as members from "../members.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as projects from "../projects.js";
import type * as reactions from "../reactions.js";
import type * as search from "../search.js";
import type * as todos from "../todos.js";
import type * as tree from "../tree.js";
import type * as upload from "../upload.js";
import type * as users from "../users.js";
import type * as workspaces from "../workspaces.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  advancetree: typeof advancetree;
  attendance: typeof attendance;
  attendanceComments: typeof attendanceComments;
  auth: typeof auth;
  channels: typeof channels;
  conversations: typeof conversations;
  dataRoom: typeof dataRoom;
  http: typeof http;
  members: typeof members;
  messages: typeof messages;
  notifications: typeof notifications;
  projects: typeof projects;
  reactions: typeof reactions;
  search: typeof search;
  todos: typeof todos;
  tree: typeof tree;
  upload: typeof upload;
  users: typeof users;
  workspaces: typeof workspaces;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
