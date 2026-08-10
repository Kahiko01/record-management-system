   "use client";

   import React, { useState } from 'react';
   import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
   import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
   import { CSS } from '@dnd-kit/utilities';
   import { GripVertical, CheckCircle2, Clock, XCircle, User } from 'lucide-react';

   // Define our columns
   const COLUMNS = [
     { id: 'pending', title: 'Pending Review', icon: Clock, color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' },
     { id: 'approved', title: 'Approved', icon: CheckCircle2, color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
     { id: 'rejected', title: 'Rejected', icon: XCircle, color: 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' },
   ];

   // Mock data for the Dean's queue
   const INITIAL_TASKS = [
     { id: '1', student: 'John Doe', program: 'Computer Science', status: 'pending' },
     { id: '2', student: 'Jane Smith', program: 'Business Admin', status: 'pending' },
     { id: '3', student: 'Mike Johnson', program: 'Engineering', status: 'approved' },
     { id: '4', student: 'Sarah Williams', program: 'Nursing', status: 'rejected' },
   ];

   // Draggable Card Component
   function TaskCard({ task }: { task: any }) {
     const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
     
     const style = {
       transform: CSS.Transform.toString(transform),
       transition,
     };

     return (
       <div 
         ref={setNodeRef} 
         style={style}
         className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
       >
         <div className="flex items-start justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
               {task.student.charAt(0)}
             </div>
             <div>
               <p className="text-sm font-bold text-slate-900 dark:text-white">{task.student}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400">{task.program}</p>
             </div>
           </div>
           <button {...attributes} {...listeners} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab">
             <GripVertical className="h-4 w-4" />
           </button>
         </div>
       </div>
     );
   }

   // Main Kanban Board
   export default function KanbanBoard() {
     const [tasks, setTasks] = useState(INITIAL_TASKS);
     
     const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

     const handleDragEnd = (event: DragEndEvent) => {
       const { active, over } = event;
       if (!over) return;

       const taskId = active.id.toString();
       const newStatus = over.id.toString();

       setTasks((prev) =>
         prev.map((task) =>
           task.id === taskId ? { ...task, status: newStatus } : task
         )
       );
       
       // In a real app, you would call an API here to save the change!
       console.log(`Moved task ${taskId} to ${newStatus}`);
     };

     return (
       <div className="h-full w-full">
         <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
             {COLUMNS.map((column) => {
               const columnTasks = tasks.filter((task) => task.status === column.id);
               const Icon = column.icon;
               
               return (
                 <div key={column.id} className={`flex flex-col rounded-2xl border-t-4 ${column.color} bg-slate-50/50 dark:bg-slate-900/50 p-4`}>
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                       <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                       <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{column.title}</h3>
                     </div>
                     <span className="text-xs font-bold px-2 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                       {columnTasks.length}
                     </span>
                   </div>
                   
                   <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                     <div className="flex-1 overflow-y-auto min-h-[200px]">
                       {columnTasks.map((task) => (
                         <TaskCard key={task.id} task={task} />
                       ))}
                       {columnTasks.length === 0 && (
                         <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 text-xs">
                           Drop tasks here
                         </div>
                       )}
                     </div>
                   </SortableContext>
                 </div>
               );
             })}
           </div>
         </DndContext>
       </div>
     );
   }
