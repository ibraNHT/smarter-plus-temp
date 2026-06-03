import React from 'react';
import { Shimmer } from '../Loaders';

export const ChatSkeleton: React.FC = () => (
  <div className="agm-chat-shell flex overflow-hidden bg-white" aria-hidden="true" role="status">
    <span className="sr-only">Loading messages…</span>

    {/* Sidebar — chat list */}
    <aside className="hidden sm:flex flex-col w-72 border-r border-gray-100 bg-white flex-shrink-0">
      <div className="px-4 py-3 border-b border-gray-100">
        <Shimmer className="h-9 rounded-lg w-full" />
      </div>
      <div className="flex-1 overflow-hidden divide-y divide-gray-50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Shimmer className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Shimmer className="h-3.5 rounded w-3/4" />
              <Shimmer className="h-3 rounded w-1/2" />
            </div>
            <Shimmer className="h-4 w-8 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </aside>

    {/* Main chat area */}
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <Shimmer className="h-9 w-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Shimmer className="h-4 rounded w-32" />
          <Shimmer className="h-3 rounded w-20" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        {/* Incoming */}
        <div className="flex items-end gap-2 max-w-xs">
          <Shimmer className="h-7 w-7 rounded-full flex-shrink-0" />
          <Shimmer className="h-10 rounded-2xl rounded-bl-none flex-1" />
        </div>
        {/* Outgoing */}
        <div className="flex items-end gap-2 max-w-xs ml-auto flex-row-reverse">
          <Shimmer className="h-14 w-48 rounded-2xl rounded-br-none" />
        </div>
        {/* Incoming long */}
        <div className="flex items-end gap-2 max-w-sm">
          <Shimmer className="h-7 w-7 rounded-full flex-shrink-0" />
          <Shimmer className="h-16 rounded-2xl rounded-bl-none flex-1" />
        </div>
        {/* Outgoing short */}
        <div className="flex items-end gap-2 max-w-xs ml-auto flex-row-reverse">
          <Shimmer className="h-10 w-32 rounded-2xl rounded-br-none" />
        </div>
        {/* Incoming */}
        <div className="flex items-end gap-2 max-w-xs">
          <Shimmer className="h-7 w-7 rounded-full flex-shrink-0" />
          <Shimmer className="h-12 rounded-2xl rounded-bl-none flex-1" />
        </div>
        {/* Outgoing */}
        <div className="flex items-end gap-2 max-w-sm ml-auto flex-row-reverse">
          <Shimmer className="h-10 w-40 rounded-2xl rounded-br-none" />
        </div>
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-end gap-2">
        <Shimmer className="flex-1 h-10 rounded-xl" />
        <Shimmer className="h-10 w-10 rounded-xl flex-shrink-0" />
      </div>
    </div>
  </div>
);
