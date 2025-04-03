import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertTask, insertTaskSchema, recurrenceOptions, categoryOptions, Task, TaskLink } from "@shared/schema";
import { addDays, format } from "date-fns";
import { CalendarDays, RefreshCw, CalendarIcon, Paperclip, FileText, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface TaskFormProps {
  onSubmit: (data: InsertTask) => void;
  defaultValues?: Partial<InsertTask> | Task;
  onCancel?: () => void;
}

export const TaskForm = ({ onSubmit, defaultValues, onCancel }: TaskFormProps) => {
  const [showCustomInterval, setShowCustomInterval] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const { toast } = useToast();

  // Process default values to handle both Task and Partial<InsertTask>
  const processedDefaults = useMemo(() => {
    // If defaultValues has an id property, it's likely a Task object
    if (defaultValues && 'id' in defaultValues) {
      console.log("Processing defaults from Task object:", defaultValues);
      const { id, createdAt, lastStarted, lastCompleted, ...rest } = defaultValues as Task;
      
      // Ensure links are properly handled
      const processedRest = {
        ...rest,
        // Make sure links is an array
        links: Array.isArray(rest.links) ? rest.links : []
      };
      
      console.log("Processed defaults:", processedRest);
      return processedRest;
    }
    return defaultValues;
  }, [defaultValues]);

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      priority: "medium",
      completed: false,
      recurrence: "none",
      reminderEnabled: false,
      status: "todo",
      category: "other",
      timeSpent: 0,
      xpEarned: 0,
      dueDate: new Date(),
      tags: [],
      links: [],
      notes: "",
      attachmentUrl: undefined,
      attachmentName: undefined,
      ...processedDefaults,
    },
  });

  const tags = form.watch("tags") || [];
  // Ensure links are always in the correct format (array of TaskLink objects)
  const rawLinks = form.watch("links") || [];
  
  // Create a type guard function to validate TaskLinks
  function isTaskLink(item: any): item is TaskLink {
    return typeof item === 'object' && item !== null &&
      'url' in item && typeof item.url === 'string' &&
      'title' in item && typeof item.title === 'string';
  }
  
  const links = Array.isArray(rawLinks) 
    ? rawLinks.filter(isTaskLink)
    : [];

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        form.setValue("tags", [...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && linkInput.trim()) {
      e.preventDefault();
      let url = linkInput.trim();

      try {
        // Add protocol if missing
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }

        // Validate URL format
        const urlObj = new URL(url);
        if (!urlObj.hostname) {
          throw new Error("Invalid hostname");
        }

        const newLink = {
          url,
          title: urlObj.hostname.replace(/^www\./i, '')
        };

        // Check for duplicate URLs
        if (!links.some(link => link.url === url)) {
          form.setValue("links", [...links, newLink]);
          setLinkInput("");
        } else {
          toast({
            title: "Duplicate link",
            description: "This link has already been added",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL",
          variant: "destructive",
        });
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const removeLink = (linkToRemove: string) => {
    form.setValue(
      "links",
      links.filter((link) => link.url !== linkToRemove)
    );
  };

  const handleRecurrenceChange = (value: string) => {
    form.setValue("recurrence", value as InsertTask["recurrence"]);
    setShowCustomInterval(value === "custom");
    if (value !== "custom") {
      form.setValue("recurrenceInterval", undefined);
    } else {
      // Set default interval value for custom recurrence
      form.setValue("recurrenceInterval", "1");
    }
  };

  const handleReminderToggle = (checked: boolean) => {
    form.setValue("reminderEnabled", checked);
    if (!checked) {
      form.setValue("reminderTime", undefined);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an image, PDF, or Word document",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      form.setValue("attachmentUrl", base64);
      form.setValue("attachmentName", file.name);
      toast({
        title: "File attached",
        description: "The file has been attached to the task",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to attach file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const attachmentUrl = form.watch("attachmentUrl");
  const attachmentName = form.watch("attachmentName");

  const handleSubmit = (data: InsertTask) => {
    console.log("TaskForm handleSubmit called with data:", data);
    console.log("Default values:", defaultValues);
    console.log("Task ID (if edit):", defaultValues && 'id' in defaultValues ? (defaultValues as Task).id : "new task");
    
    // Create a type guard function to validate TaskLinks that we'll use in the form submission
    function isTaskLink(item: any): item is TaskLink {
      return typeof item === 'object' && item !== null &&
        'url' in item && typeof item.url === 'string' &&
        'title' in item && typeof item.title === 'string';
    }
    
    // Process data carefully for submission
    const processedData = {
      ...data,
      // Make sure we have default values for required fields
      title: data.title || "",
      priority: data.priority || "medium",
      category: data.category || "other",
      status: data.status || "todo",
      completed: data.completed ?? false,
      
      // Make sure we handle date fields properly
      dueDate: data.dueDate || new Date(),
      reminderTime: data.reminderTime || undefined,
      
      // Nullable fields
      attachmentUrl: data.attachmentUrl || undefined,
      attachmentName: data.attachmentName || undefined,
      notes: data.notes || undefined,
      
      // Carefully process links to make sure they're valid
      links: Array.isArray(data.links) 
        ? data.links.filter(isTaskLink) 
        : [],
      
      // Make sure tags are an array
      tags: Array.isArray(data.tags) ? data.tags : []
    };
    
    console.log("TaskForm processed data to submit:", processedData);
    
    try {
      console.log("About to call onSubmit with processed data");
      onSubmit(processedData);
      console.log("TaskForm onSubmit completed");
      form.reset();
      onCancel?.();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      
      // Show error toast for user feedback
      toast({
        title: "Error updating task",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <span className="flex items-center gap-2">
                        {category.icon} {category.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="attachmentUrl"
          render={() => (
            <FormItem>
              <FormLabel>Attachment</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <Paperclip className="h-4 w-4" />
                      {attachmentUrl ? "Change Attachment" : "Add Attachment"}
                    </Button>
                  </div>

                  {attachmentUrl && (
                    <div className="border rounded-lg p-3 space-y-2" role="region" aria-label="Attachment preview">
                      {attachmentUrl.startsWith('data:image/') ? (
                        <div className="relative aspect-video">
                          <img
                            src={attachmentUrl}
                            alt={attachmentName || "Task attachment preview"}
                            className="rounded object-contain w-full h-full"
                            role="img"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" aria-hidden="true" />
                          <span>{attachmentName}</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          form.setValue("attachmentUrl", undefined);
                          form.setValue("attachmentName", undefined);
                        }}
                        aria-label="Remove attachment"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    placeholder="Type a tag and press Enter or comma"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="links"
          render={() => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="bg-muted px-3 py-2 text-sm border rounded-l-md border-r-0">
                      https://
                    </span>
                    <Input
                      className="rounded-l-none"
                      placeholder="example.com"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      onKeyDown={handleLinkKeyDown}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {links.map((link, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <LinkIcon className="h-3 w-3" />
                        {link.title}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeLink(link.url)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add notes about this task..."
                  className="resize-none"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a due date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recurrence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recurrence</FormLabel>
              <Select onValueChange={handleRecurrenceChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {recurrenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showCustomInterval && (
          <FormField
            control={form.control}
            name="recurrenceInterval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Interval (days)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter number of days..." 
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch("recurrence") !== "none" && (
          <div className="border rounded-md p-3 bg-purple-50 dark:bg-purple-950">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h4 className="font-medium text-sm">
                {form.watch("recurrence") === "daily" && "Repeats daily"}
                {form.watch("recurrence") === "weekly" && "Repeats weekly"}
                {form.watch("recurrence") === "monthly" && "Repeats monthly"}
                {form.watch("recurrence") === "custom" && `Repeats every ${form.watch("recurrenceInterval") ? form.watch("recurrenceInterval") : "1"} day(s)`}
              </h4>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Next occurrences based on due date:</p>
              <div className="grid grid-cols-1 gap-1">
                {[...Array(3)].map((_, i) => {
                  const dueDate = form.watch("dueDate");
                  if (!dueDate) return null;

                  let nextDate: Date;
                  const recurrence = form.watch("recurrence");
                  const recurrenceInterval = form.watch("recurrenceInterval");
                  const interval = recurrenceInterval && typeof recurrenceInterval === 'string' ?
                    parseInt(recurrenceInterval, 10) : 1;

                  switch (recurrence) {
                    case "daily":
                      nextDate = addDays(dueDate, i + 1);
                      break;
                    case "weekly":
                      nextDate = addDays(dueDate, (i + 1) * 7);
                      break;
                    case "monthly":
                      const newDate = new Date(dueDate);
                      newDate.setMonth(dueDate.getMonth() + i + 1);
                      nextDate = newDate;
                      break;
                    case "custom":
                      nextDate = addDays(dueDate, (i + 1) * interval);
                      break;
                    default:
                      nextDate = dueDate;
                  }

                  return (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      <span>{format(nextDate, "EEE, MMM d, yyyy")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="reminderEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Reminder</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={handleReminderToggle}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("reminderEnabled") && (
          <FormField
            control={form.control}
            name="reminderTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Reminder Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a reminder time</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-3 mt-8 sticky bottom-0 bg-background py-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            className="px-8 py-6 text-lg font-medium" 
            onClick={(e) => {
              console.log("Submit button clicked");
              console.log("Form state:", form.getValues());
              console.log("Form errors:", form.formState.errors);
              
              // Check if form is submitting with the right method
              if (form.formState.isSubmitting) {
                console.log("Form is currently submitting");
              }
              
              // Don't prevent default form submission
              // e.preventDefault(); - removing this if it exists
            }}
          >
            {defaultValues && 'id' in defaultValues ? 'Update Task' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaskForm;